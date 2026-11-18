/* Shiny Event · gemensam lagring.
   Tre lägen:
   - demo:     ingen config. Allt sparas i webbläsaren (localStorage).
   - supabase: config.js pekar ut projektet. Inloggning krävs, allt sparas i tabellen se_docs.
   - fake:     bara på localhost med ?fake=1. Låtsasserver i webbläsaren, för tester.
   Varje sak (event, uppgift, pass, avtal ...) är ett eget dokument. Bara det som ändrats skickas. */
var REMOTE = null;
var SNAP = {};
var SYNC = {timer:null, busy:false, again:false, pending:false, state:''};
var SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';

function canon(v){
  if (v === null || v === undefined || typeof v !== 'object') return JSON.stringify(v === undefined ? null : v);
  if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  return '{' + Object.keys(v).sort().filter(function(k){ return v[k] !== undefined; }).map(function(k){ return JSON.stringify(k) + ':' + canon(v[k]); }).join(',') + '}';
}
function normDoc(d){ return {kind:d.kind, id:d.id, event_id:d.event_id || null, module:d.module || null, pos:+d.pos || 0, data:d.data || {}}; }
function nextPos(list){ var m = 0; list.forEach(function(x){ if (x && +x._p > m) m = +x._p; }); return m + 1; }
function ensurePos(list){ list.forEach(function(x){ if (x._p == null) x._p = nextPos(list); }); }

/* Appens läge -> dokument */
function toDocs(S){
  var out = {};
  function put(kind, id, ev, mod, pos, data){ out[kind + '|' + id] = {kind:kind, id:id, event_id:ev || null, module:mod || null, pos:+pos || 0, data:data}; }
  ensurePos(S.events); ensurePos(S.people);
  S.events.forEach(function(ev){
    var e = {}; for (var k in ev) if (k !== 'items' && k !== 'lokal') e[k] = ev[k];
    put('event', ev.id, ev.id, null, ev._p, e);
    put('lokal', ev.id, ev.id, null, 0, ev.lokal);
    for (var m in ev.items){ ensurePos(ev.items[m]); ev.items[m].forEach(function(it){ put('item', ev.id + '/' + it.id, ev.id, m, it._p, it); }); }
  });
  S.people.forEach(function(p){ put('person', p.id, null, null, p._p, p); });
  S.time.forEach(function(t){ put('time', t.id, null, null, 0, t); });
  Object.keys(S.templates || {}).forEach(function(k, i){ put('template', k, null, null, i, S.templates[k]); });
  return out;
}
/* Dokument -> appens läge */
function fromDocs(map){
  var docs = Object.keys(map).map(function(k){ return map[k]; }).sort(function(a, b){ return a.pos - b.pos; });
  var evs = {}, out = {v:1, events:[], people:[], time:[], templates:{}};
  docs.forEach(function(d){
    if (d.kind !== 'event') return;
    var ev = d.data; ev.id = d.id; ev.items = emptyItems(); ev.osa = ev.osa || {ja:0, nej:0};
    ev.lokal = {id:'lokal', title:ev.venue || 'Lokal', facts:[], comments:[], log:[]};
    evs[d.id] = ev; out.events.push(ev);
  });
  docs.forEach(function(d){
    var ev = evs[d.event_id];
    if (d.kind === 'lokal' && evs[d.id]) evs[d.id].lokal = d.data;
    else if (d.kind === 'item' && ev) (ev.items[d.module] = ev.items[d.module] || []).push(d.data);
    else if (d.kind === 'person') out.people.push(d.data);
    else if (d.kind === 'time') out.time.push(d.data);
    else if (d.kind === 'template') out.templates[d.id] = d.data;
  });
  out.time.sort(function(a, b){ return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
  return out;
}

function setSaveState(text){ SYNC.state = text; var el = document.getElementById('savest'); if (el) el.textContent = text; }
function queueSync(delay){ SYNC.pending = true; setSaveState('Sparar'); clearTimeout(SYNC.timer); SYNC.timer = setTimeout(flushSync, delay || 500); }
function flushSync(){
  if (!REMOTE) return Promise.resolve();
  if (SYNC.busy){ SYNC.again = true; return Promise.resolve(); }
  SYNC.busy = true;
  var cur = toDocs(S), next = {}, ups = [], dels = [], k;
  for (k in cur){ next[k] = canon(cur[k]); if (SNAP[k] !== next[k]) ups.push(JSON.parse(next[k])); }
  for (k in SNAP) if (!(k in cur)) dels.push(k);
  var work = Promise.resolve();
  if (ups.length) work = work.then(function(){ return REMOTE.upsert(ups); });
  if (dels.length) work = work.then(function(){ return REMOTE.remove(dels.map(function(x){ var i = x.indexOf('|'); return {kind:x.slice(0, i), id:x.slice(i + 1)}; })); });
  return work.then(function(){
    ups.forEach(function(d){ var key = d.kind + '|' + d.id; SNAP[key] = next[key]; });
    dels.forEach(function(x){ delete SNAP[x]; });
    SYNC.busy = false; SYNC.pending = false; setSaveState('Sparat');
    if (SYNC.again){ SYNC.again = false; queueSync(100); }
  }).catch(function(err){
    SYNC.busy = false; SYNC.again = false;
    setSaveState('Kunde inte spara, försöker igen');
    if (window.console) console.warn('Synk misslyckades', err);
    clearTimeout(SYNC.timer); SYNC.timer = setTimeout(flushSync, 4000);
  });
}
/* En ändring från någon annan. Det jag själv har ändrat men inte hunnit spara vinner över inkommande. */
function onRemote(ch){
  var key = ch.del ? ch.kind + '|' + ch.id : ch.doc.kind + '|' + ch.doc.id;
  var local = toDocs(S), mine = key in local ? canon(local[key]) : undefined, dirty;
  if (ch.del){
    if (!(key in SNAP)) return;
    dirty = mine !== undefined && mine !== SNAP[key];
    delete SNAP[key];
    if (!dirty) delete local[key];
  } else {
    var doc = normDoc(ch.doc), j = canon(doc);
    if (SNAP[key] === j) return;
    dirty = mine !== undefined ? (key in SNAP ? mine !== SNAP[key] : true) : (key in SNAP);
    SNAP[key] = j;
    if (!dirty) local[key] = doc;
  }
  var prefs = {role:S.role, theme:S.theme, kundEv:S.kundEv};
  S = fromDocs(local); S.role = prefs.role; S.theme = prefs.theme; S.kundEv = prefs.kundEv;
  TEMPLATES = S.templates;
  if (dirty || SYNC.pending) queueSync();
  remoteRender();
}

/* ---------- Supabase ---------- */
function loadScript(src){ return new Promise(function(ok, fail){ var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function(){ fail(new Error('Kunde inte ladda ' + src)); }; document.head.appendChild(s); }); }
function supabaseBackend(cfg){
  return loadScript(SUPABASE_JS).then(function(){
    var sb = window.supabase.createClient(cfg.url, cfg.key);
    function check(r){ if (r.error) throw r.error; return r.data; }
    return {
      session: function(){
        return sb.auth.getSession().then(function(r){
          var u = r.data && r.data.session && r.data.session.user; if (!u) return null;
          return sb.from('profiles').select('name').eq('id', u.id).maybeSingle().then(function(p){
            if (p.error) throw p.error;
            if (!p.data) return {notStaff:true, email:u.email};
            var n = String(p.data.name || u.email).split(/[ @.]/)[0];
            return {id:u.id, email:u.email, name:n.charAt(0).toUpperCase() + n.slice(1)};
          });
        });
      },
      signIn: function(email, pw){ return sb.auth.signInWithPassword({email:email.trim(), password:pw}).then(function(r){ if (r.error) throw new Error(/invalid/i.test(r.error.message) ? 'Fel e-post eller lösenord.' : r.error.message); }); },
      signOut: function(){ return sb.auth.signOut(); },
      loadAll: function(){
        var all = [], size = 1000;
        function page(from){
          return sb.from('se_docs').select('kind,id,event_id,module,pos,data').order('kind').order('id').range(from, from + size - 1).then(function(r){
            var rows = check(r); all = all.concat(rows); return rows.length === size ? page(from + size) : all;
          });
        }
        return page(0);
      },
      upsert: function(docs){
        var chain = Promise.resolve();
        for (var i = 0; i < docs.length; i += 200) (function(part){ chain = chain.then(function(){ return sb.from('se_docs').upsert(part, {onConflict:'kind,id'}).then(check); }); })(docs.slice(i, i + 200));
        return chain;
      },
      remove: function(keys){
        var by = {}; keys.forEach(function(k){ (by[k.kind] = by[k.kind] || []).push(k.id); });
        var chain = Promise.resolve();
        Object.keys(by).forEach(function(kind){ for (var i = 0; i < by[kind].length; i += 100) (function(ids){ chain = chain.then(function(){ return sb.from('se_docs').delete().eq('kind', kind).in('id', ids).then(check); }); })(by[kind].slice(i, i + 100)); });
        return chain;
      },
      subscribe: function(cb){
        sb.channel('se_docs').on('postgres_changes', {event:'*', schema:'public', table:'se_docs'}, function(p){
          if (p.eventType === 'DELETE') cb({del:true, kind:p.old.kind, id:p.old.id}); else cb({doc:p.new});
        }).subscribe();
      }
    };
  });
}

/* ---------- Låtsasserver för tester (bara localhost) ---------- */
function fakeBackend(){
  var KEY = 'se-fake-db', bc = new BroadcastChannel('se-fake'), cbs = [];
  function db(){ try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch(e){ return {}; } }
  bc.onmessage = function(e){ cbs.forEach(function(cb){ cb(e.data); }); };
  return Promise.resolve({
    session: function(){ var n = sessionStorage.getItem('se-fake-user'); return Promise.resolve(n ? (n === 'Kund' ? {notStaff:true, email:'kund@kund.example'} : {id:n, name:n, email:n.toLowerCase() + '@byra.example'}) : null); },
    signIn: function(email, pw){ if (pw === 'fel') return Promise.reject(new Error('Fel e-post eller lösenord.')); var n = email.split('@')[0]; sessionStorage.setItem('se-fake-user', n.charAt(0).toUpperCase() + n.slice(1)); return Promise.resolve(); },
    signOut: function(){ sessionStorage.removeItem('se-fake-user'); return Promise.resolve(); },
    loadAll: function(){ var o = db(); return Promise.resolve(Object.keys(o).map(function(k){ return o[k]; })); },
    upsert: function(docs){ if (localStorage.getItem('se-fake-fail')) return Promise.reject(new Error('nätverksfel')); var o = db(); docs.forEach(function(d){ o[d.kind + '|' + d.id] = d; }); localStorage.setItem(KEY, JSON.stringify(o)); docs.forEach(function(d){ bc.postMessage({doc:d}); }); return Promise.resolve(); },
    remove: function(keys){ var o = db(); keys.forEach(function(k){ delete o[k.kind + '|' + k.id]; }); localStorage.setItem(KEY, JSON.stringify(o)); keys.forEach(function(k){ bc.postMessage({del:true, kind:k.kind, id:k.id}); }); return Promise.resolve(); },
    subscribe: function(cb){ cbs.push(cb); }
  });
}
