/* Shiny Event, prototyp 2. Ren JavaScript, ingen server. Sparar i webbläsarens localStorage. */
var KEY = 'eventapp-proto2-v1';
var APPR = ['Utkast', 'På granskning', 'Godkänd', 'Ändringar önskas'];
var TONE = {'Klar':'ok','Bekräftad':'ok','Bekräftat':'ok','Signerat':'ok','Bokad':'ok','På plats':'ok','Låst':'ok','Fakturerad':'ok','Godkänd':'ok','I fas':'ok',
  'Pågår':'info','Skickat':'info','Packad':'info','Öppnat':'info',
  'Offert':'warn','Hold':'warn','Option':'warn','Tillfrågad':'warn','På granskning':'warn','Håll koll':'warn',
  'Nekad':'bad','Utgånget':'bad','Ändringar önskas':'bad','Ligger efter':'bad','Krock':'bad'};
var MODS = {
  oversikt:{name:'Översikt'},
  uppgifter:{name:'Uppgifter', one:'uppgift', fields:[['status','Status','status',['Att göra','Pågår','Klar']],['phase','Fas','select',PHASES],['owner','Ansvarig','select',['Daniel','Lasse','Kund']],['due','Deadline','date']]},
  schema:{name:'Huvudschema', one:'schemapunkt', fields:[['day','Dag','select',['Dagen före','Eventdagen']],['start','Start','time'],['end','Slut','time'],['who','Vem','text'],['plats','Plats','text'],['typ','Typ','select',['Rigg','Leverans','Program','Personal','Soundcheck','Servering','Riv']]]},
  korschema:{name:'Körschema', one:'punkt', fields:[['dur','Längd, min','number'],['typ','Typ','select',['Scen','Teknik','Paus','Logistik']],['plats','Plats','text'],['owner','Ansvarig','text'],['tech','Teknik','text']]},
  personal:{name:'Personal', one:'pass', fields:[['person','Person','person'],['role','Roll','text'],['call','Kalltid','time'],['start','Start','time'],['end','Slut','time'],['plats','Plats','text'],['status','Status','status',['Tillfrågad','Bekräftad','Nekad']],['arvode','Arvode','money'],['utskick','Utskick','select',['Inte skickat','Skickat','Öppnat','Bekräftat']]], cols:['call','start','end','plats','status','utskick','arvode']},
  leverantorer:{name:'Leverantörer', one:'leverantör', fields:[['kategori','Kategori','text'],['kontakt','Kontakt','text'],['tel','Telefon','text'],['status','Status','status',['Förfrågan','Offert','Bokad','Bekräftad']],['belopp','Belopp','money'],['frist','Nästa frist','date'],['last','Lasttid','text']]},
  underhallning:{name:'Underhållning', one:'akt', fields:[['status','Status','status',['Option','Hold','Bekräftad']],['gage','Gage','money'],['speltid','På scen','time'],['set','Setlängd, min','number'],['soundcheck','Soundcheck','time'],['inlast','Inlastning','time'],['rider','Teknikrider','text'],['loge','Loge och förtäring','text'],['kontakt','Kontakt','text']], cols:['status','speltid','set','soundcheck','inlast','gage']},
  lokal:{name:'Lokal'},
  ritningar:{name:'Ritningar', one:'ritning', fields:[['version','Version','text'],['status','Granskning','status',APPR]]},
  teknik:{name:'Teknik', one:'artikel', fields:[['antal','Antal','number'],['kategori','Kategori','select',['Ljud','Ljus','Bild','Scen','El']],['lev','Leverantör','text'],['strom','Ström','text'],['in','På plats','text'],['status','Status','status',['Beställd','Bekräftad','Packad','På plats']]]},
  fortaring:{name:'Förtäring', one:'servering', fields:[['tid','Tid','time'],['antal','Antal','number'],['garanti','Garanterat antal','number'],['satt','Servering','text'],['plats','Plats','text'],['status','Status','status',['Utkast','Offert','Bekräftad']]]},
  moodboard:{name:'Moodboard', one:'kort', fields:[['typ','Typ','select',['Bild','Färg','Anteckning']],['c1','Färgkod','text']]},
  budget:{name:'Budget', one:'post', fields:[['budget','Budget','money'],['utfall','Utfall','money'],['status','Status','status',['Preliminär','Låst','Fakturerad']]]},
  avtal:{name:'Avtal', one:'avtal', fields:[['motpart','Motpart','text'],['typ','Typ','select',['Kund','Lokal','Leverantör','Artist','Personal']],['status','Status','status',['Utkast','Skickat','Signerat','Utgånget']],['start','Start','date'],['slut','Slut','date'],['uppsagning','Villkor','text'],['pdf','Fil','text']], cols:['motpart','typ','status','slut','pdf']},
  gaster:{name:'Gäster'}
};
var EVENT_FIELDS = [['client','Kund','text'],['date','Datum','date'],['venue','Lokal','text'],['address','Adress','text'],['guests','Antal platser','number'],['offer','Offererat till kund','money'],['osa.ja','Tackat ja','number'],['osa.nej','Tackat nej','number'],['osaUrl','OSA-sidans adress','text'],['kost','Specialkost, en per rad (Namn: antal)','kv'],['risks','Att hålla koll på, en per rad','lines']];
var NY = {uppgifter:'Ny uppgift', schema:'Ny schemapunkt', korschema:'Ny punkt', personal:'Ny roll', leverantorer:'Ny leverantör', underhallning:'Ny akt', teknik:'Ny artikel', fortaring:'Ny servering', budget:'Ny post', avtal:'Nytt avtal', ritningar:'Ny ritning', moodboard:'Nytt kort'};
var TEMPLATES0 = JSON.stringify(TEMPLATES);
function val(it, k){ return k.indexOf('.') < 0 ? it[k] : k.split('.').reduce(function(o, p){ return o ? o[p] : undefined; }, it); }
function setVal(it, k, v){ if (k.indexOf('.') < 0){ it[k] = v; return; } var p = k.split('.'), o = it; for (var i = 0; i < p.length - 1; i++) o = o[p[i]] = o[p[i]] || {}; o[p[p.length - 1]] = v; }
function tplName(ev){ return (TEMPLATES[ev.tpl] || {name:'Borttagen mall'}).name; }
function ckTd(id){ return kund() ? '' : '<td class="ck"><input type="checkbox" class="cb" data-sel="' + id + '"' + (UI.sel[id] ? ' checked' : '') + ' aria-label="Markera raden"></td>'; }
function ckTh(ids){ return kund() ? '' : '<th class="ck"><input type="checkbox" class="cb" data-selall aria-label="Markera alla"' + (ids.length && ids.every(function(i){ return UI.sel[i]; }) ? ' checked' : '') + '></th>'; }
function bulkBar(ids, mode){
  var n = ids.filter(function(i){ return UI.sel[i]; }).length; if (!n || kund()) return '';
  return '<div class="bulk" role="status"><b>' + n + ' markerade</b>' +
    (mode === 'folk' ? '<button class="btn sm" data-act="bulkarkiv" data-v="1">Arkivera</button>' : mode === 'arkiv' ? '<button class="btn sm" data-act="bulkarkiv" data-v="0">Återställ</button>' : '') +
    '<button class="btn sm" data-act="bulkdel">Ta bort</button><div class="sp"></div><button class="btn quiet sm" data-act="bulkclear">Avmarkera</button></div>';
}
function addBtn(mod){ return kund() ? '' : '<button class="btn pri" data-act="addfirst" data-mod="' + mod + '">Lägg till ' + MODS[mod].one + '</button>'; }
var PERSON_FIELDS = [['role','Roll','text'],['tel','Telefon','text'],['mejl','Mejl','text'],['ort','Ort','text'],['cert','Certifikat','text'],['arvode','Arvode per pass','money'],['avtal','Avtal, fil','text'],['avtalslut','Avtal löper ut','date']];
var GROUPS = [['', ['oversikt']], ['Planering', ['uppgifter','schema','korschema']], ['Folk', ['personal','leverantorer','underhallning']], ['Plats', ['lokal','ritningar','teknik','fortaring']], ['Kreativt', ['moodboard']], ['Affär', ['budget','avtal','gaster']]];
var KUND_MODS = ['oversikt','uppgifter','korschema','ritningar','moodboard','gaster'];

var S, UI = {taskView:'lista', taskFilter:'alla', hideDone:false, shut:{}, who:'Alla', drawing:null, pinMode:false, vis:'intern', draft:'', live:null, pal:null, undo:null, week:0, tw:'Daniel', tplOpen:{}, focusNew:false, pf:{q:'', ev:'', role:'', arkiv:false}, sel:{}};
function load(){ try { S = JSON.parse(localStorage.getItem(KEY)); } catch(e){} if (!S || S.v !== 1) S = seed(); if (!S.time) S.time = seedTime(); if (!S.templates) S.templates = JSON.parse(TEMPLATES0); TEMPLATES = S.templates; }
function persist(){
  if (REMOTE){ try { localStorage.setItem('se-prefs', JSON.stringify({role:S.role, theme:S.theme})); } catch(e){} queueSync(); return; }
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){}
}
function save(){ histRecord(); persist(); }

/* ---------- Ångra och gör om ----------
   Varje sparning jämförs med läget innan. Skillnaden sparas som en lista över
   vilka dokument som ändrades, och hur de såg ut före och efter. Ångra lägger
   tillbaka just de dokumenten, inget annat. Det den andre har ändrat under
   tiden rörs alltså inte, om det inte är exakt samma sak. */
var HIST = {undo:[], redo:[], last:{}};
function canonMap(){ var dd = toDocs(S), o = {}; for (var k in dd) o[k] = canon(dd[k]); return o; }
function histMark(){ HIST.last = canonMap(); }
function docLabel(j){ var x = JSON.parse(j).data || {}; return x.title || x.name || x.note || ''; }
function histRecord(){
  var cur = canonMap(), patch = {}, n = 0, label = '', k;
  for (k in HIST.last) if (!(k in cur)){ patch[k] = [HIST.last[k], null]; n++; if (!label && k.indexOf('lokal|') !== 0) label = docLabel(HIST.last[k]); }
  for (k in cur) if (HIST.last[k] !== cur[k]){ patch[k] = [HIST.last[k] || null, cur[k]]; n++; if (!label) label = docLabel(cur[k]); }
  HIST.last = cur;
  if (!n) return;
  HIST.undo.push({patch:patch, label:label, n:n}); if (HIST.undo.length > 100) HIST.undo.shift();
  HIST.redo = [];
}
function histApply(from, to, idx){
  var e = from.pop();
  if (!e){ toast(idx ? 'Inget att göra om.' : 'Inget att ångra.'); return; }
  var local = toDocs(S), k;
  for (k in e.patch){ var j = e.patch[k][idx]; if (j) local[k] = JSON.parse(j); else delete local[k]; }
  var keep = {role:S.role, theme:S.theme, kundEv:S.kundEv};
  S = fromDocs(local); S.role = keep.role; S.theme = keep.theme; S.kundEv = keep.kundEv; TEMPLATES = S.templates;
  histMark(); to.push(e); persist(); render(true);
  toast((idx ? 'Gjorde om' : 'Ångrade') + (e.label ? ': ' + e.label : (e.n > 1 ? ' ' + e.n + ' ändringar' : ' senaste ändringen')) + '.', idx ? null : 'redo');
}
function undoApp(){ histApply(HIST.undo, HIST.redo, 0); }
function redoApp(){ histApply(HIST.redo, HIST.undo, 1); }
// Ett textfält man håller på att skriva i behåller webbläsarens egen ångra.
function editingText(el){ return !!(el && ((el.tagName === 'TEXTAREA') || (el.tagName === 'INPUT' && el.type !== 'checkbox')) && el.value !== el.defaultValue); }
function myName(){ return UI.me || 'Daniel'; }
function $(s){ return document.querySelector(s); }
function kund(){ return S.role === 'kund'; }
function me(){ return kund() ? 'Kund' : myName(); }
function getEv(id){ return S.events.filter(function(e){ return e.id === id; })[0]; }
function person(id){ return S.people.filter(function(p){ return p.id === id; })[0]; }
function pname(id){ var p = person(id); return p ? p.title : 'Ej tillsatt'; }
function route(){
  var p = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  if (p[0] === 'e') return {view:'event', ev:p[1], mod:p[2] || 'oversikt', item:p[3]};
  if (p[0] === 'dela') return {view:'dela', ev:p[1], person:p[2]};
  return {view:p[0] || 'hem', item:p[1]};
}
function href(ev, mod, id){ return '#/e/' + ev.id + '/' + mod + (id ? '/' + id : ''); }
function findItem(ev, id){
  if (id === 'lokal') return {it:ev.lokal, mod:'lokal'};
  if (id === 'event' || id === ev.id) return {it:ev, mod:'_event'};
  for (var m in ev.items){ var x = ev.items[m].filter(function(i){ return i.id === id; })[0]; if (x) return {it:x, mod:m}; }
  return null;
}
function ctx(){
  var r = route();
  if (r.view === 'event'){ var ev = getEv(r.ev); if (!ev) return null; var f = r.item ? findItem(ev, r.item) : null; return {ev:ev, mod:r.mod, it:f && f.it, imod:f && f.mod}; }
  if (r.view === 'personal' && r.item) return {it:person(r.item), imod:'_person'};
  return {};
}
function fieldsOf(mod){ return mod === '_person' ? PERSON_FIELDS : mod === '_event' ? EVENT_FIELDS : (MODS[mod] && MODS[mod].fields) || []; }
function openTasks(ev){ return ev.items.uppgifter.filter(function(t){ return t.status !== 'Klar'; }); }
function lateTasks(ev){ return openTasks(ev).filter(function(t){ return diff(t.due) < 0; }); }
function pct(ev){ var n = ev.items.uppgifter.length; return n ? Math.round(100 * (n - openTasks(ev).length) / n) : 0; }
function health(ev){ var n = lateTasks(ev).length; return n === 0 ? 'I fas' : n < 3 ? 'Håll koll' : 'Ligger efter'; }
function comments(it){ return (it.comments || []).filter(function(c){ return !kund() || c.vis === 'kund'; }); }
function conflicts(ev){
  var bad = {}, a = ev.items.personal.filter(function(s){ return s.status !== 'Nekad'; });
  a.forEach(function(x){ a.forEach(function(y){ if (x !== y && x.person === y.person && tmin(x.start) < tmin(y.end) && tmin(y.start) < tmin(x.end)) bad[x.id] = 1; }); });
  return bad;
}
function watch(a){ if (a.status !== 'Signerat') return ['warn', a.status === 'Utgånget' ? 'Utgånget' : 'Inte signerat']; var n = diff(a.slut); return n < 0 ? ['bad', 'Löpte ut ' + rel(a.slut)] : n <= 30 ? ['warn', 'Löper ut ' + rel(a.slut)] : null; }
function ago(ts){ var d = Math.floor((Date.now() - ts) / DAY); return d < 1 ? 'i dag' : d === 1 ? 'i går' : d + ' d sen'; }
function logIt(it, text){ (it.log = it.log || []).unshift({at:Date.now(), who:me(), text:text}); }

/* ---------- Byggstenar ---------- */
function st(v, tone){ return '<span class="st t-' + (tone || TONE[v] || 'n') + '"><i></i>' + esc(v) + '</span>'; }
function bar(p, cls){ return '<div class="bar ' + (cls || '') + '"><span style="width:' + p + '%"></span></div>'; }
function opts(list, v){ return list.map(function(o){ return '<option' + (o === v ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join(''); }
function cc(it){ var n = comments(it).length; return n ? '<span class="cc">' + n + ' komm.</span>' : ''; }
function input(it, f, cls){
  var k = f[0], v = val(it, k), a = ' data-f="' + k + '" data-id="' + it.id + '" aria-label="' + f[1] + '"';
  if (kund()) return '<span class="inl">' + show(it, f) + '</span>';
  switch (f[2]){
    case 'status': return '<select class="st t-' + (TONE[v] || 'n') + '"' + a + '>' + opts(f[3], v) + '</select>';
    case 'select': return '<select class="' + cls + '"' + a + '>' + opts(f[3], v) + '</select>';
    case 'person': return '<select class="' + cls + '"' + a + '>' + (person(v) ? '' : '<option value="">Ej tillsatt</option>') + S.people.filter(function(p){ return !p.arkiv || p.id === v; }).map(function(p){ return '<option value="' + p.id + '"' + (p.id === v ? ' selected' : '') + '>' + esc(p.title) + '</option>'; }).join('') + '</select>';
    case 'date': return '<input type="text" inputmode="numeric" placeholder="ÅÅ.MM.DD" maxlength="10" class="' + cls + '"' + a + ' value="' + fmt(v) + '">';
    case 'time': return '<input type="time" class="' + cls + '"' + a + ' value="' + esc(v) + '">';
    case 'number': case 'money': return '<input type="number" class="' + cls + '"' + a + ' value="' + esc(v) + '">';
    case 'lines': return '<textarea class="' + cls + '" rows="4"' + a + '>' + esc((v || []).join('\n')) + '</textarea>';
    case 'kv': return '<textarea class="' + cls + '" rows="5"' + a + '>' + esc(Object.keys(v || {}).map(function(x){ return x + ': ' + v[x]; }).join('\n')) + '</textarea>';
    default: return '<input type="text" class="' + cls + '"' + a + ' value="' + esc(v) + '">';
  }
}
function show(it, f){
  var v = val(it, f[0]);
  switch (f[2]){
    case 'status': return st(v);
    case 'person': return esc(pname(v));
    case 'date': return v ? '<span class="num' + (f[0] === 'due' && it.status !== 'Klar' && diff(v) < 0 ? ' late' : '') + '">' + fmt(v) + ' <span class="faint">' + rel(v) + '</span></span>' : '';
    case 'money': return '<span class="num">' + kr(v) + '</span>';
    default: return esc(v);
  }
}
function taskRow(ev, t, showEv){
  var late = t.status !== 'Klar' && diff(t.due) < 0, r = route();
  return '<div class="task' + (t.status === 'Klar' ? ' done' : '') + (r.item === t.id ? ' sel' : '') + '" data-go="' + href(ev, 'uppgifter', t.id) + '">' +
    '<input type="checkbox" class="cb" aria-label="Klar: ' + esc(t.title) + '" data-check="' + t.id + '" data-ev="' + ev.id + '"' + (t.status === 'Klar' ? ' checked' : '') + (kund() && t.owner !== 'Kund' ? ' disabled' : '') + '>' +
    '<div><span class="tt">' + esc(t.title) + '</span>' + (showEv ? '<span class="sub">' + esc(ev.name) + '</span>' : t.status === 'Pågår' ? '<span class="sub">Pågår</span>' : '') + '</div>' +
    cc(t) + '<span class="who' + (t.owner === 'Kund' ? ' k' : '') + '">' + esc(t.owner) + '</span>' +
    '<span class="due' + (late ? ' late' : '') + '">' + fmt(t.due) + ', ' + rel(t.due) + '</span></div>';
}
function empty(title, text, btn){ return '<div class="empty"><b>' + title + '</b>' + text + (btn && !kund() ? '<br>' + btn : '') + '</div>'; }
function page(h1, sub, right, body){ return '<div class="page"><div class="ph"><div><h1>' + h1 + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div><div class="tools" style="margin:0">' + (right || '') + '</div></div>' + body + '</div>'; }
function kundBanner(ev){ return kund() ? '<div class="banner"><span><b>Kundvy.</b> Så här ser ' + esc(ev.client) + ' eventet. Budget, personal, leverantörer, avtal och interna kommentarer visas inte.</span></div>' : ''; }

/* ---------- Ram: sidofält och toppfält ---------- */
function inbox(){
  var out = [];
  S.events.forEach(function(ev){
    for (var m in ev.items) ev.items[m].forEach(function(it){ (it.comments || []).forEach(function(c){ if (c.who !== myName()) out.push({at:c.at, kind:'Kommentar', text:c.who + ': ' + c.text, ev:ev, go:href(ev, m, it.id), on:it.title}); }); });
    (ev.lokal.comments || []).forEach(function(c){ if (c.who !== myName()) out.push({at:c.at, kind:'Kommentar', text:c.who + ': ' + c.text, ev:ev, go:href(ev, 'lokal', 'lokal'), on:'Lokal'}); });
    var bad = conflicts(ev);
    ev.items.personal.forEach(function(s){
      if (s.status === 'Nekad') out.push({at:Date.now() - DAY, kind:'Personal', tone:'bad', text:pname(s.person) + ' tackade nej till ' + s.role + '.', ev:ev, go:href(ev, 'personal', s.id), on:s.title});
      else if (bad[s.id]) out.push({at:Date.now() - DAY / 2, kind:'Krock', tone:'bad', text:pname(s.person) + ' är dubbelbokad ' + s.start + ' till ' + s.end + '.', ev:ev, go:href(ev, 'personal', s.id), on:s.title});
    });
    ev.items.avtal.forEach(function(a){ var w = watch(a); if (w) out.push({at:Date.now() - 2 * DAY, kind:'Avtal', tone:w[0], text:w[1] + ': ' + a.title + '.', ev:ev, go:href(ev, 'avtal', a.id), on:a.motpart}); });
    lateTasks(ev).forEach(function(t){ if (t.owner === myName()) out.push({at:fromIso(t.due).getTime(), kind:'Försenat', tone:'bad', text:t.title + ', skulle varit klart ' + fmt(t.due) + '.', ev:ev, go:href(ev, 'uppgifter', t.id), on:'Uppgift'}); });
  });
  return out.sort(function(a, b){ return b.at - a.at; });
}
function renderSide(){
  var r = route(), ev = r.view === 'event' && getEv(r.ev), h = '<a class="brand" href="#/"><img class="star l" src="assets/shp-star-pink.svg" alt=""><img class="star d" src="assets/shp-star-white.svg" alt="">Shiny Event</a><nav class="nav" aria-label="Huvudmeny">';
  function a(hash, name, on, badge){ return '<a href="' + hash + '"' + (on ? ' class="on" aria-current="page"' : '') + '><span>' + name + '</span>' + (badge ? '<span class="badge">' + badge + '</span>' : '') + '</a>'; }
  h += a('#/', 'Alla event', r.view === 'hem');
  if (!kund()) h += a('#/inkorg', 'Inkorg', r.view === 'inkorg', inbox().length) + a('#/personal', 'Personalregister', r.view === 'personal') + a('#/tid', 'Tidrapport', r.view === 'tid') + a('#/mallar', 'Mallar', r.view === 'mallar');
  if (ev){
    h += '<div class="evname">' + esc(ev.name) + '</div>';
    GROUPS.forEach(function(g){
      var mods = g[1].filter(function(m){ return !kund() || KUND_MODS.indexOf(m) >= 0; }); if (!mods.length) return;
      if (g[0]) h += '<div class="grp">' + g[0] + '</div>';
      mods.forEach(function(m){
        var n = m === 'uppgifter' ? openTasks(ev).filter(function(t){ return !kund() || t.owner === 'Kund'; }).length : ev.items[m] ? ev.items[m].length : 0;
        h += a(href(ev, m), MODS[m].name, r.mod === m, n || '');
      });
    });
  }
  h += '</nav><div class="mobonly"><span class="faint" style="font-size:12px">Visa som</span><div class="seg" role="group" aria-label="Visa som"><button data-role="byra" class="' + (kund() ? '' : 'on') + '">Byrå</button><button data-role="kund" class="' + (kund() ? 'on' : '') + '">Kund</button></div><button class="btn" data-act="theme">Byt till ' + (document.documentElement.dataset.theme === 'dark' ? 'ljust' : 'mörkt') + ' läge</button></div><div class="foot">' + (REMOTE ? 'Inloggad som ' + esc(myName()) + '.<br><button data-act="logout">Logga ut</button>' : 'Demoläge, sparas bara i den här webbläsaren.<br><button data-act="reset">Återställ demon</button>') + '</div>';
  $('#side').innerHTML = h;
}
var ICON = {
  ev:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>',
  inbox:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13l2.5-7h11L20 13v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M4 13h5a3 3 0 0 0 6 0h5"/></svg>',
  folk:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 5.5M17 14.5a5 5 0 0 1 3.5 4.5"/></svg>',
  tid:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>',
  mer:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
};
function renderTabbar(){
  var r = route(), onEv = r.view === 'hem' || r.view === 'event', n = kund() ? 0 : inbox().length;
  function a(hash, name, icon, on, badge){ return '<a href="' + hash + '"' + (on ? ' class="on" aria-current="page"' : '') + '>' + ICON[icon] + '<span>' + name + '</span>' + (badge ? '<span class="badge">' + badge + '</span>' : '') + '</a>'; }
  $('#tabbar').innerHTML = a('#/', 'Event', 'ev', onEv) + (kund() ? '' : a('#/inkorg', 'Inkorg', 'inbox', r.view === 'inkorg', n) + a('#/personal', 'Personal', 'folk', r.view === 'personal') + a('#/tid', 'Tid', 'tid', r.view === 'tid')) +
    '<button data-act="nav" aria-label="Öppna hela menyn">' + ICON.mer + '<span>Mer</span></button>';
}
function modStrip(ev, mod){
  var h = '';
  GROUPS.forEach(function(g){ g[1].forEach(function(m){ if (!kund() || KUND_MODS.indexOf(m) >= 0) h += '<a href="' + href(ev, m) + '"' + (m === mod ? ' class="on" aria-current="page"' : '') + '>' + MODS[m].name + '</a>'; }); });
  return '<nav class="modstrip" aria-label="Eventets delar">' + h + '</nav>';
}
function renderTop(){
  var r = route(), ev = r.view === 'event' && getEv(r.ev), names = {hem:'Alla event', inkorg:'Inkorg', personal:'Personalregister', mallar:'Mallar', tid:'Tidrapport'};
  var c = ev ? '<a href="#/">Event</a><span>/</span><a href="' + href(ev, 'oversikt') + '">' + esc(ev.name) + '</a><span>/</span><b>' + MODS[r.mod].name + '</b>' : '<b>' + (names[r.view] || '') + '</b>';
  $('#top').innerHTML = '<button class="btn quiet burger" data-act="nav" aria-label="Meny">Meny</button><nav class="crumbs" aria-label="Brödsmulor">' + c + '</nav><div class="sp"></div>' +
    '<span class="saved" id="savest" role="status">' + (REMOTE ? (SYNC.state || 'Sparat') : 'Sparas i webbläsaren') + '</span>' +
    '<button class="btn quiet ic" data-act="undo" aria-label="Ångra" title="Ångra (⌘Z)"' + (HIST.undo.length ? '' : ' disabled') + '><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7L4 12l5 5"/><path d="M4 12h10a6 6 0 0 1 0 12h-2" transform="translate(0 -5)"/></svg></button>' +
    '<button class="btn quiet ic redo" data-act="redo" aria-label="Gör om" title="Gör om (⇧⌘Z)"' + (HIST.redo.length ? '' : ' disabled') + '><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 7l5 5-5 5"/><path d="M20 12H10a6 6 0 0 0 0 12h2" transform="translate(0 -5)"/></svg></button>' +
    '<button class="btn search" data-act="pal" aria-label="Sök eller hoppa till"><em style="font-style:normal">Sök eller hoppa till</em><kbd>⌘K</kbd><span class="m">Sök</span></button>' +
    '<button class="btn quiet" data-act="theme" aria-label="Byt ljust och mörkt läge">' + (document.documentElement.dataset.theme === 'dark' ? 'Ljust' : 'Mörkt') + '</button>' +
    '<div class="seg" role="group" aria-label="Visa som"><button data-role="byra" class="' + (kund() ? '' : 'on') + '">Byrå</button><button data-role="kund" class="' + (kund() ? 'on' : '') + '">Kund</button></div>';
}

/* ---------- Globala vyer ---------- */
function viewHome(){
  var evs = S.events.slice().sort(function(a, b){ return a.date < b.date ? -1 : 1; }), all = [];
  if (kund()){ var k = getEv(S.kundEv) || evs[0]; evs = evs.filter(function(e){ return e.client === k.client; }); }
  evs.forEach(function(ev){ openTasks(ev).forEach(function(t){ if (kund() ? t.owner === 'Kund' : t.owner !== 'Kund') all.push([ev, t]); }); });
  all.sort(function(a, b){ return a[1].due < b[1].due ? -1 : 1; });
  var rows = evs.map(function(ev){
    var n = diff(ev.date), p = pct(ev);
    return '<a class="evrow" href="' + href(ev, 'oversikt') + '"><div class="d num">' + Math.abs(n) + '<small>' + (n >= 0 ? 'dagar kvar' : 'dagar sen') + '</small></div>' +
      '<div><b>' + esc(ev.name) + '</b><div class="muted">' + esc(ev.client) + '</div></div>' +
      '<div class="muted x">' + fmt(ev.date) + ', ' + esc(ev.venue) + '<br>' + ev.guests.toLocaleString('sv-SE') + ' gäster</div>' +
      '<div class="x">' + bar(p, 'wide') + '<span class="faint num" style="font-size:12px">' + p + ' % klart</span></div><div>' + st(health(ev)) + '</div></a>';
  }).join('');
  return page(kund() ? 'Era event' : 'Alla event', evs.length + ' pågående', kund() ? '' : '<button class="btn pri" data-act="new">Nytt event</button>',
    (kund() && evs[0] ? kundBanner(evs[0]) : '') + (evs.length ? '<div class="card">' + rows + '</div>' : empty('Inga event än', 'Skapa ert första event. Vill du bara prova kan du läsa in exempeldata och ta bort den sen.', '<button class="btn pri" data-act="new">Nytt event</button> <button class="btn" data-act="demo">Läs in exempeldata</button>') + '<div style="height:22px"></div>') +
    '<div class="card"><header><h2>' + (kund() ? 'Det här väntar på er' : 'Att göra nu, alla event') + '</h2><span class="faint">' + all.length + ' öppna</span></header>' +
    (all.slice(0, 8).map(function(x){ return taskRow(x[0], x[1], true); }).join('') || empty('Inget öppet', 'Allt är avbockat.')) + '</div>');
}
function viewInbox(){
  var list = inbox();
  return page('Inkorg', 'Kommentarer från andra, krockar, avtal att bevaka och egna förseningar.', '',
    '<div class="card">' + (list.map(function(n){
      return '<div class="task" style="grid-template-columns:90px 1fr auto" data-go="' + n.go + '">' + st(n.kind, n.tone || 'info') + '<div><span class="tt">' + esc(n.text) + '</span><span class="sub">' + esc(n.on) + '</span></div><span class="due">' + esc(n.ev.name) + '</span></div>';
    }).join('') || empty('Tomt', 'Inget väntar på dig.')) + '</div>');
}
function viewPeople(){
  var r = route(), F = UI.pf, q = F.q.trim().toLowerCase(), roles = [];
  S.people.forEach(function(p){ if (p.role && roles.indexOf(p.role) < 0) roles.push(p.role); }); roles.sort();
  var list = S.people.map(function(p){
    var evs = [], n = 0, krock = false;
    S.events.forEach(function(ev){
      var bad = conflicts(ev), mine = ev.items.personal.filter(function(s){ return s.person === p.id && s.status !== 'Nekad'; });
      if (!mine.length) return;
      n += mine.length; if (mine.some(function(s){ return bad[s.id]; })) krock = true;
      evs.push({ev:ev, n:mine.length, ok:mine.every(function(s){ return s.status === 'Bekräftad'; })});
    });
    return {p:p, evs:evs, n:n, krock:krock};
  }).filter(function(x){
    if (!!x.p.arkiv !== !!F.arkiv) return false;
    if (F.ev === '-' && x.evs.length) return false;
    if (F.ev && F.ev !== '-' && !x.evs.some(function(e){ return e.ev.id === F.ev; })) return false;
    if (F.role && x.p.role !== F.role) return false;
    if (q && (x.p.title + ' ' + x.p.role + ' ' + x.p.ort + ' ' + x.p.cert + ' ' + x.p.tel + ' ' + x.p.mejl + ' ' + x.evs.map(function(e){ return e.ev.name; }).join(' ')).toLowerCase().indexOf(q) < 0) return false;
    return true;
  });
  var nArk = S.people.filter(function(p){ return p.arkiv; }).length;
  var tools = '<div class="tools"><input id="pq" class="fi" style="width:220px" placeholder="Sök namn, roll, ort, certifikat" value="' + esc(F.q) + '" aria-label="Sök i personalregistret">' +
    '<select id="pfev" class="fi" aria-label="Filtrera på event"><option value="">Alla event</option>' + S.events.map(function(e){ return '<option value="' + e.id + '"' + (F.ev === e.id ? ' selected' : '') + '>' + esc(e.name) + '</option>'; }).join('') + '<option value="-"' + (F.ev === '-' ? ' selected' : '') + '>Inte anlitad just nu</option></select>' +
    '<select id="pfrole" class="fi" aria-label="Filtrera på roll"><option value="">Alla roller</option>' + roles.map(function(x){ return '<option' + (F.role === x ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select>' +
    (nArk || F.arkiv ? '<button class="chip' + (F.arkiv ? ' on' : '') + '" data-act="pfarkiv">Arkiverade ' + nArk + '</button>' : '') +
    (F.q || F.ev || F.role ? '<button class="btn quiet" data-act="pfclear">Rensa filter</button>' : '') + '<div class="sp"></div><span class="faint num">' + list.length + ' av ' + (F.arkiv ? nArk : S.people.length - nArk) + '</span></div>';
  var pids = list.map(function(x){ return x.p.id; });
  var rows = list.map(function(x){
    var p = x.p, w = p.avtal ? (p.avtalslut && diff(p.avtalslut) <= 30 ? st('Löper ut ' + rel(p.avtalslut), 'warn') : st('Signerat')) : st('Saknas', 'bad');
    var evs = x.evs.map(function(e){ return '<a class="tag evtag" href="' + href(e.ev, 'personal') + '" title="' + e.n + ' pass, ' + (e.ok ? 'bekräftad' : 'inte bekräftad än') + '">' + esc(e.ev.name) + (e.n > 1 ? ' (' + e.n + ')' : '') + (e.ok ? '' : ' ?') + '</a>'; }).join(' ') || '<span class="faint">Ingen</span>';
    return '<tr class="rowlink' + (r.item === p.id ? ' sel' : '') + '" data-go="#/personal/' + p.id + '">' + ckTd(p.id) + '<td class="t">' + esc(p.title) + '</td><td data-label="Roll">' + esc(p.role) + '</td><td class="wide" data-label="Anlitad för" style="white-space:normal;min-width:220px">' + evs + '</td><td class="r" data-label="Pass">' + x.n + (x.krock ? ' ' + st('Krock') : '') + '</td><td class="num" data-label="Telefon">' + (p.tel ? '<a href="tel:' + esc(p.tel.replace(/[^0-9+]/g, '')) + '">' + esc(p.tel) + '</a>' : '') + '</td><td data-label="Ort">' + esc(p.ort) + '</td><td data-label="Certifikat">' + esc(p.cert) + '</td><td data-label="Avtal">' + w + '</td></tr>';
  }).join('');
  return page('Personalregister', 'Gemensamt för alla event. Här ser du vilka event var och en är anlitad för. Ett frågetecken betyder att passet inte är bekräftat än.', '<button class="btn pri" data-act="addperson">Lägg till person</button>',
    tools + bulkBar(pids, F.arkiv ? 'arkiv' : 'folk') + (S.people.length ? (rows ? '<div class="tw"><table><thead><tr>' + ckTh(pids) + '<th>Namn</th><th>Roll</th><th>Anlitad för</th><th class="r">Pass</th><th>Telefon</th><th>Ort</th><th>Certifikat</th><th>Avtal</th></tr></thead><tbody>' + rows + '</tbody></table></div>' : empty(F.arkiv ? 'Inga arkiverade' : 'Ingen matchar filtret', F.arkiv ? 'Arkiverade personer hamnar här.' : 'Ändra eller rensa filtret.')) : empty('Inga personer än', 'Lägg till värdar, tekniker och andra ni brukar anlita.')));
}
function viewTemplates(){
  var keys = Object.keys(TEMPLATES);
  return page('Mallar', 'Välj mall när eventet skapas. Uppgifterna läggs in med ansvarig och deadline räknad bakåt från eventdagen. Ändringar här gäller nya event.', '<button class="btn pri" data-act="tplnew">Ny mall</button>',
    keys.map(function(k){
      var t = TEMPLATES[k], order = t.tasks.map(function(x, i){ return i; }).sort(function(a, b){ return t.tasks[b][2] - t.tasks[a][2]; });
      return '<div class="card"><header><input class="inl" style="font-weight:600;max-width:280px" data-tplf="' + k + '|name" value="' + esc(t.name) + '" aria-label="Mallens namn"><span class="faint">' + t.tasks.length + ' uppgifter</span></header><div style="padding:12px">' +
        '<div class="fields" style="margin-bottom:10px"><label>Storlek</label><input class="inl" data-tplf="' + k + '|size" value="' + esc(t.size) + '" aria-label="Storlek"><label>Beskrivning</label><input class="inl" data-tplf="' + k + '|desc" value="' + esc(t.desc) + '" aria-label="Beskrivning"></div>' +
        '<div class="tools">' + PHASES.map(function(p, i){ var n = t.tasks.filter(function(x){ return x[0] === i; }).length; return n ? '<span class="tag">' + p + ' ' + n + '</span>' : ''; }).join('') + '</div>' +
        '<details data-tplk="' + k + '"' + (UI.tplOpen[k] ? ' open' : '') + '><summary class="muted" style="cursor:pointer">Visa och ändra uppgifterna</summary><div style="margin-top:8px"><div class="tplrow faint" style="font-size:12px"><span>Uppgift</span><span>Fas</span><span>Ansvarig</span><span>Dagar före</span><span></span></div>' + order.map(function(i){
          var x = t.tasks[i], a = k + '|' + i + '|';
          return '<div class="tplrow"><input class="inl" data-tt="' + a + '1" value="' + esc(x[1]) + '" aria-label="Uppgift">' +
            '<select class="inl" data-tt="' + a + '0" aria-label="Fas">' + PHASES.map(function(p, pi){ return '<option value="' + pi + '"' + (pi === x[0] ? ' selected' : '') + '>' + p + '</option>'; }).join('') + '</select>' +
            '<select class="inl" data-tt="' + a + '3" aria-label="Ansvarig">' + ['D', 'L', 'K'].map(function(o){ return '<option value="' + o + '"' + (o === x[3] ? ' selected' : '') + '>' + OWN[o] + '</option>'; }).join('') + '</select>' +
            '<input type="number" class="inl num" data-tt="' + a + '2" value="' + x[2] + '" aria-label="Dagar före eventet" title="Minus betyder dagar efter eventet">' +
            '<button class="btn quiet sm" data-act="tpldeltask" data-k="' + k + '" data-i="' + i + '">Ta bort</button></div>';
        }).join('') + '<form class="addrow" data-addtpl="' + k + '"><input name="title" placeholder="Lägg till uppgift i mallen, tryck Enter" aria-label="Ny uppgift i mallen"></form></div></details>' +
        (keys.length > 1 ? '<div class="sect"><span></span><button class="btn quiet sm" data-act="tpldel" data-k="' + k + '">Ta bort mallen</button></div>' : '') + '</div></div>';
    }).join(''));
}

/* ---------- Tidrapport ---------- */
var AKT = ['Projektledning', 'Kundmöte', 'Produktion', 'På plats', 'Resa', 'Administration'];
function weekStart(off){ var wd = (T0.getDay() + 6) % 7; return addDays(T0, -wd + off * 7); }
function weekNo(d){ var t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())), n = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - n); return Math.ceil(((t - Date.UTC(t.getUTCFullYear(), 0, 1)) / DAY + 1) / 7); }
function hh(n){ return (Math.round(n * 100) / 100).toLocaleString('sv-SE'); }
function evName(id){ var e = getEv(id); return e ? e.name : 'Internt'; }
function viewTime(){
  var ws = weekStart(UI.week), days = [0,1,2,3,4,5,6].map(function(i){ return iso(addDays(ws, i)); });
  var inWeek = S.time.filter(function(t){ return days.indexOf(t.date) >= 0; });
  var list = inWeek.filter(function(t){ return UI.tw === 'Båda' || t.who === UI.tw; });
  function sum(a){ return a.reduce(function(s, t){ return s + (+t.h || 0); }, 0); }
  var tot = sum(list), deb = sum(list.filter(function(t){ return t.deb; }));
  function who(n){ return sum(inWeek.filter(function(t){ return t.who === n; })); }
  var stats = '<div class="stats"><div class="stat"><span>Timmar, vecka ' + weekNo(ws) + '</span><b>' + hh(tot) + '<small>h</small></b></div>' +
    '<div class="stat"><span>Debiterbart</span><b>' + hh(deb) + '<small>h, ' + (tot ? Math.round(100 * deb / tot) : 0) + ' %</small></b></div>' +
    '<div class="stat"><span>Daniel</span><b>' + hh(who('Daniel')) + '<small>h</small></b></div><div class="stat"><span>Lasse</span><b>' + hh(who('Lasse')) + '<small>h</small></b></div></div>';
  var tools = '<div class="tools"><div class="seg" role="group" aria-label="Vem">' + ['Daniel', 'Lasse', 'Båda'].map(function(n){ return '<button data-tw="' + n + '" class="' + (UI.tw === n ? 'on' : '') + '">' + n + '</button>'; }).join('') + '</div><div class="sp"></div>' +
    '<button class="btn" data-act="week" data-d="-1">Föregående</button><span class="num" style="min-width:150px;text-align:center"><b>Vecka ' + weekNo(ws) + '</b>, ' + fmt(days[0]) + ' till ' + fmt(days[6]) + '</span><button class="btn" data-act="week" data-d="1">Nästa</button>' +
    (UI.week ? '<button class="btn quiet" data-act="week" data-d="0">Denna vecka</button>' : '') + '</div>';
  var defDate = days.indexOf(iso(T0)) >= 0 ? iso(T0) : days[0], defWho = UI.tw === 'Båda' ? 'Daniel' : UI.tw;
  var form = '<form id="timeform" class="tform"><input class="fi num" type="text" inputmode="numeric" placeholder="ÅÅ.MM.DD" maxlength="10" style="width:96px" name="date" value="' + fmt(defDate) + '" aria-label="Datum" required>' +
    '<select class="fi" name="who" aria-label="Vem">' + opts(['Daniel', 'Lasse'], defWho) + '</select>' +
    '<select class="fi" name="ev" aria-label="Event">' + S.events.map(function(e){ return '<option value="' + e.id + '">' + esc(e.name) + '</option>'; }).join('') + '<option value="">Internt, ej debiterbart</option></select>' +
    '<select class="fi" name="akt" aria-label="Aktivitet">' + opts(AKT, AKT[0]) + '</select>' +
    '<input class="fi" type="number" name="h" min="0.25" max="24" step="0.25" placeholder="Timmar" aria-label="Timmar" required style="width:90px">' +
    '<input class="fi" type="text" name="note" placeholder="Anteckning, valfri" aria-label="Anteckning" style="flex:1;min-width:140px"><button class="btn pri">Lägg till</button></form>';
  var rows = days.map(function(ds){
    var dl = list.filter(function(t){ return t.date === ds; }); if (!dl.length) return '';
    return '<tr class="sum"><td colspan="6">' + fmtLong(ds) + '</td><td class="r">' + hh(sum(dl)) + ' h</td><td></td></tr>' + dl.map(function(t){
      return '<tr><td data-label="Datum"><input type="text" inputmode="numeric" placeholder="ÅÅ.MM.DD" maxlength="10" class="inl num" style="width:86px" data-tf="' + t.id + '|date" value="' + fmt(t.date) + '" aria-label="Datum"></td><td data-label="Vem"><select class="inl" data-tf="' + t.id + '|who" aria-label="Vem">' + opts(['Daniel', 'Lasse'], t.who) + '</select></td>' +
        '<td class="wide" data-label="Event"><select class="inl" data-tf="' + t.id + '|ev" aria-label="Event">' + S.events.map(function(e){ return '<option value="' + e.id + '"' + (e.id === t.ev ? ' selected' : '') + '>' + esc(e.name) + '</option>'; }).join('') + '<option value=""' + (t.ev ? '' : ' selected') + '>Internt</option></select></td>' +
        '<td data-label="Aktivitet"><select class="inl" data-tf="' + t.id + '|akt" aria-label="Aktivitet">' + opts(AKT, t.akt) + '</select></td><td class="wide" data-label="Anteckning"><input class="inl" style="min-width:160px" data-tf="' + t.id + '|note" value="' + esc(t.note) + '" placeholder="Anteckning" aria-label="Anteckning"></td>' +
        '<td data-label="Debiterbar"><input type="checkbox" class="cb" data-tdeb="' + t.id + '"' + (t.deb ? ' checked' : '') + ' aria-label="Debiterbar"></td>' +
        '<td class="r" data-label="Timmar"><input type="number" inputmode="decimal" class="inl num" style="width:72px;text-align:right" min="0" max="24" step="0.25" data-th="' + t.id + '" value="' + t.h + '" aria-label="Timmar"></td>' +
        '<td class="r"><button class="btn quiet sm" data-act="tdel" data-id="' + t.id + '">Ta bort</button></td></tr>';
    }).join('');
  }).join('');
  var table = rows ? '<div class="tw"><table><thead><tr><th>Datum</th><th>Vem</th><th>Event</th><th>Aktivitet</th><th>Anteckning</th><th>Deb.</th><th class="r">Timmar</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>' : empty('Inga timmar den här veckan', 'Lägg till första raden i formuläret ovan.');
  function perEv(a){
    var m = {}; a.forEach(function(t){ m[t.ev] = (m[t.ev] || 0) + (+t.h || 0); });
    var keys = Object.keys(m).sort(function(x, y){ return m[y] - m[x]; }), max = keys.length ? m[keys[0]] : 1;
    return keys.map(function(k){ return '<div style="display:flex;justify-content:space-between;margin:8px 0 4px"><span>' + esc(evName(k)) + '</span><span class="faint num">' + hh(m[k]) + ' h</span></div>' + bar(Math.round(100 * m[k] / max), 'wide'); }).join('') || '<p class="muted" style="margin:8px 0 0">Inget rapporterat.</p>';
  }
  var side = '<div class="card"><header><h2>Per event, veckan</h2><span class="faint">' + esc(UI.tw) + '</span></header><div style="padding:6px 12px 12px">' + perEv(list) + '</div></div>' +
    '<div class="card"><header><h2>Per event, totalt</h2><span class="faint">Daniel och Lasse</span></header><div style="padding:6px 12px 12px">' + perEv(S.time) + '</div></div>';
  return page('Tidrapport', 'Timmar per dag och event, för Daniel och Lasse.', '', stats + tools + '<div class="grid2"><div><div class="card" style="margin-bottom:12px">' + form + '</div>' + table + '</div><div>' + side + '</div></div>');
}

/* ---------- Eventvyer ---------- */
function vOversikt(ev){
  var n = diff(ev.date), p = pct(ev), late = lateTasks(ev), open = openTasks(ev).slice().sort(function(a, b){ return a.due < b.due ? -1 : 1; });
  var k = open.filter(function(t){ return t.owner === 'Kund'; }), b = open.filter(function(t){ return t.owner !== 'Kund'; });
  var appr = ev.items.ritningar.filter(function(d){ return d.status === 'På granskning'; }).map(function(d){ return [d.title + ' ' + d.version, href(ev, 'ritningar', d.id)]; });
  if (ev.moodStatus === 'På granskning') appr.push(['Moodboard', href(ev, 'moodboard')]);
  var cost = ev.items.budget.reduce(function(s, r){ return s + r.budget; }, 0), bad = conflicts(ev), sh = ev.items.personal;
  var conf = sh.filter(function(s){ return s.status === 'Bekräftad'; }).length;
  var apprHtml = appr.map(function(a){ return '<div class="task" style="grid-template-columns:1fr auto" data-go="' + a[1] + '"><span class="tt">' + esc(a[0]) + '</span>' + st('På granskning') + '</div>'; }).join('');
  var h = kundBanner(ev) + '<div class="stats">' +
    '<div class="stat"><span>' + (n >= 0 ? 'Dagar kvar' : 'Dagar sen') + '</span><b>' + Math.abs(n) + '</b></div>' +
    '<div class="stat"><span>Klart</span><b>' + p + '<small>%</small></b></div>' +
    '<div class="stat"><span>Försenat</span><b class="' + (late.length ? 'bad' : '') + '">' + late.length + '</b></div>' +
    '<div class="stat"><span>Tackat ja</span><b>' + ev.osa.ja + '<small>av ' + ev.guests + '</small></b></div>' +
    (kund() ? '' : '<div class="stat"><span>Personal bekräftad</span><b>' + conf + '<small>av ' + sh.length + '</small></b></div><div class="stat"><span>Marginal, prognos</span><b>' + (ev.offer ? Math.round(100 * (ev.offer - cost) / ev.offer) : 0) + '<small>%</small></b></div>') + '</div><div class="grid2"><div>';
  h += '<div class="card"><header><h2>' + (kund() ? 'Ni behöver göra' : 'Närmast på tur') + '</h2><a href="' + href(ev, 'uppgifter') + '">Alla uppgifter</a></header>' + ((kund() ? k : b).slice(0, 6).map(function(t){ return taskRow(ev, t); }).join('') || empty('Inget öppet', 'Bra läge.')) + '</div>';
  h += '<div class="card"><header><h2>' + (kund() ? 'Väntar på ert godkännande' : 'Väntar på kunden') + '</h2></header>' + ((kund() ? '' : k.slice(0, 4).map(function(t){ return taskRow(ev, t); }).join('')) + apprHtml || empty('Inget väntar', 'Allt är besvarat.')) + '</div>';
  h += '</div><div>';
  h += '<div class="card"><header><h2>Fas för fas</h2></header><div style="padding:6px 12px 12px">' + PHASES.map(function(ph){
    var ts = ev.items.uppgifter.filter(function(t){ return t.phase === ph; }); if (!ts.length) return '';
    var d = ts.filter(function(t){ return t.status === 'Klar'; }).length;
    return '<div style="display:flex;justify-content:space-between;margin:8px 0 4px"><span>' + ph + '</span><span class="faint num">' + d + ' av ' + ts.length + '</span></div>' + bar(Math.round(100 * d / ts.length), 'wide');
  }).join('') + '</div></div>';
  if (!kund()){
    var flags = [];
    Object.keys(bad).length && flags.push(['Personal: ' + Math.ceil(Object.keys(bad).length / 2) + ' krock i schemat', href(ev, 'personal')]);
    sh.filter(function(s){ return s.status === 'Nekad'; }).forEach(function(s){ flags.push(['Personal: ' + s.role + ' saknar ersättare', href(ev, 'personal', s.id)]); });
    ev.items.avtal.forEach(function(a){ var w = watch(a); if (w) flags.push(['Avtal: ' + a.title + ', ' + w[1].toLowerCase(), href(ev, 'avtal', a.id)]); });
    (ev.risks || []).forEach(function(x){ flags.push([x, '']); });
    h += '<div class="card"><header><h2>Att hålla koll på</h2><span class="faint">' + flags.length + '</span></header>' + (flags.map(function(f){ return '<div class="task" style="grid-template-columns:1fr' + (f[1] ? '' : ';cursor:default') + '"' + (f[1] ? ' data-go="' + f[1] + '"' : '') + '><span>' + esc(f[0]) + '</span></div>'; }).join('') || empty('Lugnt', 'Inga flaggor.')) + '</div>';
  }
  h += '<div class="card"><header><h2>Fakta</h2></header><div style="padding:8px 12px"><div class="fields" style="margin:0"><label>Datum</label><span>' + fmtLong(ev.date) + '</span><label>Lokal</label><span>' + esc(ev.venue) + '</span><label>Adress</label><span>' + esc(ev.address || 'Ej angiven') + '</span><label>Mall</label><span>' + tplName(ev) + '</span></div></div></div>';
  return page(esc(ev.name), esc(ev.client) + ', ' + fmtLong(ev.date), st(health(ev)) + (kund() ? '' : '<a class="btn" href="' + href(ev, 'oversikt', 'event') + '">Redigera event</a>'), h + '</div></div>');
}
function vUppgifter(ev){
  var f = kund() ? 'Kund' : UI.taskFilter;
  function keep(t){ if (UI.hideDone && t.status === 'Klar') return false; if (f === 'alla') return true; if (f === 'sena') return t.status !== 'Klar' && diff(t.due) < 0; return t.owner === f; }
  var list = ev.items.uppgifter.filter(keep).sort(function(a, b){ return a.due < b.due ? -1 : a.due > b.due ? 1 : 0; });
  var tools = '<div class="tools">';
  if (!kund()) tools += [['alla','Alla'],['Daniel','Daniel'],['Lasse','Lasse'],['Kund','Kund'],['sena','Försenade']].map(function(c){
    var n = c[0] === 'alla' ? openTasks(ev).length : c[0] === 'sena' ? lateTasks(ev).length : openTasks(ev).filter(function(t){ return t.owner === c[0]; }).length;
    return '<button class="chip' + (UI.taskFilter === c[0] ? ' on' : '') + '" data-filter="' + c[0] + '">' + c[1] + ' <span class="num">' + n + '</span></button>';
  }).join('');
  tools += '<label style="display:flex;gap:6px;align-items:center"><input type="checkbox" class="cb" id="hidedone"' + (UI.hideDone ? ' checked' : '') + '> Dölj klara</label><div class="sp"></div>' +
    '<div class="seg" role="group" aria-label="Vy"><button data-taskview="lista" class="' + (UI.taskView === 'lista' ? 'on' : '') + '">Lista</button><button data-taskview="tavla" class="' + (UI.taskView === 'tavla' ? 'on' : '') + '">Tavla</button></div></div>';
  var body;
  if (UI.taskView === 'tavla'){
    body = '<div class="board">' + ['Att göra','Pågår','Klar'].map(function(s){
      var ts = list.filter(function(t){ return t.status === s; });
      return '<div class="col"><h3><span>' + s + '</span><span class="num">' + ts.length + '</span></h3>' + ts.slice(0, 14).map(function(t){
        return '<div class="kcard" data-go="' + href(ev, 'uppgifter', t.id) + '" tabindex="0">' + esc(t.title) + '<div><span>' + esc(t.owner) + '</span><span class="' + (s !== 'Klar' && diff(t.due) < 0 ? 'late' : '') + '">' + fmt(t.due) + '</span></div></div>';
      }).join('') + (ts.length > 14 ? '<div class="faint" style="padding:4px 6px">och ' + (ts.length - 14) + ' till</div>' : '') + '</div>';
    }).join('') + '</div>';
  } else {
    body = PHASES.map(function(ph, i){
      var all = ev.items.uppgifter.filter(function(t){ return t.phase === ph; }), ts = list.filter(function(t){ return t.phase === ph; });
      if (!all.length || (!ts.length && f !== 'alla')) return '';
      var d = all.filter(function(t){ return t.status === 'Klar'; }).length;
      var shut = UI.shut[ev.id + i] != null ? UI.shut[ev.id + i] : (d === all.length && f === 'alla');
      return '<section class="phase' + (shut ? ' shut' : '') + '"><button data-phase="' + i + '" aria-expanded="' + !shut + '"><h2>' + ph + '</h2>' + bar(Math.round(100 * d / all.length)) + '<span class="faint num">' + d + ' av ' + all.length + '</span></button><div class="rows">' +
        ts.map(function(t){ return taskRow(ev, t); }).join('') +
        (kund() ? '' : '<form class="addrow" data-add="uppgifter" data-phase-name="' + ph + '"><input name="title" placeholder="Lägg till uppgift i ' + ph.toLowerCase() + ', tryck Enter" aria-label="Ny uppgift i ' + ph + '"></form>') + '</div></section>';
    }).join('') || empty('Inget att visa', 'Inga uppgifter matchar filtret.');
  }
  return page(kund() ? 'Att göra' : 'Uppgifter', openTasks(ev).length + ' öppna, ' + lateTasks(ev).length + ' försenade', addBtn('uppgifter'), kundBanner(ev) + tools + body);
}
function supplierName(ev){ var s = ev.items.leverantorer.filter(function(l){ return l.kategori === 'Förtäring'; })[0]; return s ? s.title : 'Förtäring'; }
function schemaRows(ev){
  var rows = ev.items.schema.map(function(s){ return {day:s.day, start:s.start, end:s.end, title:s.title, who:s.who, plats:s.plats, typ:s.typ, go:href(ev, 'schema', s.id)}; });
  ev.items.personal.forEach(function(p){ if (p.status !== 'Nekad') rows.push({day:'Eventdagen', start:p.call, end:p.end, title:p.role + ', pass ' + p.start + ' till ' + p.end, who:pname(p.person), plats:p.plats, typ:'Personal', go:href(ev, 'personal', p.id)}); });
  ev.items.underhallning.forEach(function(a){
    if (a.inlast) rows.push({day:'Eventdagen', start:a.inlast, end:'', title:'Inlastning', who:a.title, plats:'Lastkaj', typ:'Leverans', go:href(ev, 'underhallning', a.id)});
    if (a.soundcheck) rows.push({day:'Eventdagen', start:a.soundcheck, end:'', title:'Soundcheck', who:a.title, plats:'Scenen', typ:'Soundcheck', go:href(ev, 'underhallning', a.id)});
    if (a.speltid) rows.push({day:'Eventdagen', start:a.speltid, end:a.set ? mfmt(tmin(a.speltid) + (+a.set)) : '', title:'På scen', who:a.title, plats:'Scenen', typ:'Program', go:href(ev, 'underhallning', a.id)});
  });
  var cat = supplierName(ev);
  ev.items.fortaring.forEach(function(f){ rows.push({day:'Eventdagen', start:f.tid, end:'', title:f.title + ', ' + f.antal + ' portioner', who:cat, plats:f.plats, typ:'Servering', go:href(ev, 'fortaring', f.id)}); });
  return rows;
}
function vSchema(ev){
  var rows = schemaRows(ev), whos = ['Alla'].concat(rows.map(function(r){ return r.who; }).filter(function(w, i, a){ return w !== 'Alla' && a.indexOf(w) === i; }).sort());
  if (whos.indexOf(UI.who) < 0) UI.who = 'Alla';
  var list = rows.filter(function(r){ return UI.who === 'Alla' || r.who === UI.who || r.who === 'Alla'; });
  var p = S.people.filter(function(x){ return x.title === UI.who; })[0];
  var tools = '<div class="tools"><label for="who" class="muted">Visa för</label><select id="who" class="btn">' + opts(whos, UI.who) + '</select><span class="faint">' + list.length + ' punkter</span><div class="sp"></div>' +
    (UI.who !== 'Alla' ? (p ? '<a class="btn" href="#/dela/' + ev.id + '/' + p.id + '">Förhandsvisa ' + esc(p.title.split(' ')[0]) + 's länk</a>' : '<button class="btn" data-act="copylink">Kopiera länk till utdraget</button>') : '') +
    '<button class="btn" data-act="print">Skriv ut</button></div>';
  var body = ['Dagen före', 'Eventdagen'].map(function(day){
    var ds = list.filter(function(r){ return r.day === day; }).sort(function(a, b){ return tmin(a.start) - tmin(b.start); });
    if (!ds.length) return '';
    return '<div class="daylabel">' + day + ', ' + fmt(iso(addDays(fromIso(ev.date), day === 'Eventdagen' ? 0 : -1))) + '</div><div class="sched">' + ds.map(function(r){
      return '<div class="srow rowlink" data-go="' + r.go + '"><span class="mono">' + r.start + (r.end ? ' ' + r.end : '') + '</span><span>' + esc(r.title) + '</span><span class="muted x">' + esc(r.who) + '</span><span class="muted x">' + esc(r.plats) + '</span><span class="tag x">' + r.typ + '</span></div>';
    }).join('') + '</div>';
  }).join('') || empty('Inget schema än', 'Schemat fylls på från personal, förtäring, underhållning och egna punkter.');
  return page('Huvudschema', 'Ett schema för allt. Pass, soundcheck och serveringar hämtas automatiskt från sina moduler.', addBtn('schema'), tools + body +
    (kund() ? '' : '<form class="addrow" data-add="schema" style="border:1px solid var(--line);border-radius:var(--r);margin-top:12px"><input name="title" placeholder="Lägg till egen schemapunkt, tryck Enter" aria-label="Ny schemapunkt"></form>'));
}
function cueTimes(ev){ var t = tmin(ev.runStart); return ev.items.korschema.map(function(c){ var o = {c:c, start:t, end:t + (+c.dur || 0)}; t = o.end; return o; }); }
function vKorschema(ev){
  var cs = cueTimes(ev), L = UI.live, r = route();
  if (!cs.length) return page('Körschema', '', '', empty('Inget körschema än', 'Körschemat byggs veckorna före eventet, punkt för punkt med längd i minuter.', '<button class="btn pri" data-act="addcue">Lägg till första punkten</button>'));
  var live = '';
  if (L){
    var cur = cs.filter(function(x){ return L.t >= x.start && L.t < x.end; })[0], nxt = cs.filter(function(x){ return x.start > L.t; })[0];
    live = '<div class="live" role="status"><div><div class="faint">Klockan, demo</div><div class="clock">' + mfmt(L.t) + '</div></div>' +
      '<div class="now"><span class="faint">' + (cur ? 'Pågår nu, ' + (cur.end - L.t) + ' min kvar' : L.t < cs[0].start ? 'Startar om ' + (cs[0].start - L.t) + ' min' : 'Programmet är slut') + '</span><b>' + esc(cur ? cur.c.title : L.t < cs[0].start ? cs[0].c.title : 'Tack för i kväll') + '</b>' +
      (nxt ? '<span class="muted">Sedan ' + mfmt(nxt.start) + ': ' + esc(nxt.c.title) + '</span>' : '') + '</div>' +
      '<div class="tools" style="margin:0"><button class="btn" data-act="livepause">' + (L.paused ? 'Fortsätt' : 'Paus') + '</button><button class="btn" data-act="livenext">Nästa punkt</button><button class="btn" data-act="livestop">Avsluta</button></div></div>' +
      '<div class="banner"><span>Demo: en sekund är en minut. I riktiga appen går klockan i realtid och alla med länken ser samma läge.</span></div>';
  }
  var tools = '<div class="tools"><label class="muted" for="runstart">Start</label><input type="time" id="runstart" class="btn" value="' + ev.runStart + '"' + (kund() ? ' disabled' : '') + '><span class="faint">Slutar ' + mfmt(cs[cs.length - 1].end) + ', ' + cs.length + ' punkter</span><div class="sp"></div>' +
    (L ? '' : '<button class="btn pri" data-act="livestart">Starta live-läge</button>') + '<button class="btn" data-act="print">Skriv ut</button></div>';
  var rows = cs.map(function(x){
    var cls = L ? (L.t >= x.end ? ' past' : L.t >= x.start ? ' cur' : '') : '';
    return '<tr class="rowlink cue' + cls + (r.item === x.c.id ? ' sel' : '') + '" data-go="' + href(ev, 'korschema', x.c.id) + '"><td class="mono" data-label="Tid">' + mfmt(x.start) + '</td><td class="r" data-label="Längd">' + x.c.dur + ' min</td><td class="t">' + esc(x.c.title) + '</td><td data-label="Typ"><span class="tag">' + esc(x.c.typ) + '</span></td><td data-label="Plats">' + esc(x.c.plats) + '</td><td data-label="Ansvarig">' + esc(x.c.owner) + '</td><td class="muted wide" data-label="Teknik">' + esc(x.c.tech) + '</td><td>' + cc(x.c) + '</td></tr>';
  }).join('');
  return page('Körschema', 'Tiderna räknas ut från start och längd. Ändra en längd så flyttas allt efter.', addBtn('korschema'), kundBanner(ev) + live + tools +
    '<div class="tw"><table><thead><tr><th>Tid</th><th class="r">Längd</th><th>Punkt</th><th>Typ</th><th>Plats</th><th>Ansvarig</th><th>Teknik</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>' +
    (kund() ? '' : '<form class="addrow" data-add="korschema"><input name="title" placeholder="Lägg till punkt sist, tryck Enter" aria-label="Ny punkt"></form>') + '</div>');
}
function table(ev, mod, extra){
  var M = MODS[mod], r = route(), items = ev.items[mod], cols = M.fields.filter(function(f){ return !M.cols || M.cols.indexOf(f[0]) >= 0; });
  if (!items.length) return empty('Inga ' + M.name.toLowerCase() + ' än', 'Lägg till första raden, eller låt mallen fylla på.', '<button class="btn pri" data-act="addfirst" data-mod="' + mod + '">Lägg till ' + M.one + '</button>');
  var ids = items.map(function(i){ return i.id; });
  return bulkBar(ids) + '<div class="tw"><table><thead><tr>' + ckTh(ids) + '<th>' + (mod === 'personal' ? 'Pass' : 'Namn') + '</th>' + cols.map(function(f){ return '<th' + (f[2] === 'money' || f[2] === 'number' ? ' class="r"' : '') + '>' + f[1] + '</th>'; }).join('') + (extra ? '<th>' + extra[0] + '</th>' : '') + '<th></th></tr></thead><tbody>' +
    items.map(function(it){
      return '<tr class="rowlink' + (r.item === it.id ? ' sel' : '') + '" data-go="' + href(ev, mod, it.id) + '">' + ckTd(it.id) + '<td class="t">' + esc(it.title) + '</td>' + cols.map(function(f){
        return '<td' + (f[2] === 'money' || f[2] === 'number' ? ' class="r"' : '') + ' data-label="' + f[1] + '">' + (f[2] === 'status' ? input(it, f) : show(it, f)) + '</td>';
      }).join('') + (extra ? '<td data-label="' + extra[0] + '">' + extra[1](it) + '</td>' : '') + '<td>' + cc(it) + '</td></tr>';
    }).join('') + (mod === 'budget' ? sumRow(ev) : '') + '</tbody></table>' +
    (kund() ? '' : '<form class="addrow" data-add="' + mod + '"><input name="title" placeholder="Lägg till ' + M.one + ', tryck Enter" aria-label="Ny rad"></form>') + '</div>';
}
function sumRow(ev){ var b = 0, u = 0; ev.items.budget.forEach(function(r){ b += +r.budget; u += +r.utfall; }); return '<tr class="sum">' + (kund() ? '' : '<td class="ck"></td>') + '<td>Summa</td><td class="r" data-label="Budget">' + kr(b) + '</td><td class="r" data-label="Utfall">' + kr(u) + '</td><td></td><td></td><td></td></tr>'; }
function vPersonal(ev){
  var sh = ev.items.personal, bad = conflicts(ev), r = route(), ids = [];
  sh.forEach(function(s){ if (ids.indexOf(s.person) < 0) ids.push(s.person); });
  var conf = sh.filter(function(s){ return s.status === 'Bekräftad'; }).length, cost = sh.reduce(function(a, s){ return a + (s.status === 'Nekad' ? 0 : +s.arvode); }, 0);
  var h = '<div class="stats"><div class="stat"><span>Pass</span><b>' + sh.length + '</b></div><div class="stat"><span>Bekräftade</span><b>' + conf + '<small>av ' + sh.length + '</small></b></div>' +
    '<div class="stat"><span>Krockar</span><b class="' + (Object.keys(bad).length ? 'bad' : '') + '">' + Math.ceil(Object.keys(bad).length / 2) + '</b></div><div class="stat"><span>Arvoden</span><b>' + kr(cost).replace(' kr', '') + '<small>kr</small></b></div></div>';
  if (Object.keys(bad).length) h += '<div class="banner warn"><span><b>Krock i schemat.</b> ' + sh.filter(function(s){ return bad[s.id]; }).map(function(s){ return esc(s.title) + ' ' + s.start + ' till ' + s.end; }).join(' och ') + '.</span></div>';
  if (sh.length){
    h += '<div class="tl"><div class="in"><div class="tlrow hd"><div class="nm">Eventdagen</div><div class="lane">' + [6,8,10,12,14,16,18,20,22].map(function(x){ return '<span>' + String(x).padStart(2, '0') + '</span>'; }).join('') + '</div></div>' +
      ids.map(function(pid){
        return '<div class="tlrow"><div class="nm">' + esc(pname(pid)) + '</div><div class="lane">' + sh.filter(function(s){ return s.person === pid; }).map(function(s){
          var a = Math.max(tmin(s.start), 360), b = Math.min(tmin(s.end), 1440);
          return '<button class="shift t-' + (TONE[s.status] || 'n') + (bad[s.id] ? ' x' : '') + '" style="left:' + (a - 360) / 10.8 + '%;width:' + (b - a) / 10.8 + '%" data-go="' + href(ev, 'personal', s.id) + '" title="' + esc(s.role + ', ' + s.start + ' till ' + s.end + ', ' + s.status) + '">' + esc(s.role) + '</button>';
        }).join('') + '</div></div>';
      }).join('') + '</div></div>';
  }
  return page('Personal', 'Du och Lasse bokar. Varje person får en egen länk med kalltid och schema, utan inloggning.', addBtn('personal'), h + table(ev, 'personal', ['Koll', function(s){ return bad[s.id] ? st('Krock') : ''; }]));
}
function vGeneric(ev, mod){
  var top = '', sub = {leverantorer:'Allt per leverantör: kontakt, status, belopp och nästa frist.', underhallning:'Artister och talare: status, tider, rider och loge.', teknik:'Utrustningslista med leverantör, strömbehov och status.', fortaring:'Serveringar med tider och antal. Specialkost hämtas från gästlistan.', budget:'Budget mot utfall, post för post.', avtal:'Avtal och kontrakt som PDF, med bevakning av slutdatum.'}[mod];
  var extra = null, right = '';
  if (mod === 'budget'){
    var b = 0, u = 0, over = 0; ev.items.budget.forEach(function(r){ b += +r.budget; u += +r.utfall; over += Math.max(r.utfall - r.budget, 0); });
    var m = ev.offer - b - over;
    top = '<div class="stats"><div class="stat"><span>Offererat till kund</span><b>' + kr(ev.offer).replace(' kr', '') + '<small>kr</small></b></div><div class="stat"><span>Budgeterade kostnader</span><b>' + kr(b).replace(' kr', '') + '<small>kr</small></b></div><div class="stat"><span>Utfall hittills</span><b>' + kr(u).replace(' kr', '') + '<small>kr</small></b></div><div class="stat"><span>Marginal, prognos</span><b class="' + (m < 0 ? 'bad' : '') + '">' + (ev.offer ? Math.round(100 * m / ev.offer) : 0) + '<small>%</small></b></div></div>';
    extra = ['Kvar', function(r){ var d = r.budget - r.utfall; return '<span class="num' + (d < 0 ? ' late' : '') + '">' + kr(d) + '</span>'; }];
  }
  if (mod === 'avtal'){ extra = ['Bevakning', function(a){ var w = watch(a); return w ? st(w[1], w[0]) : ''; }]; right = '<button class="btn" data-act="upload">Ladda upp PDF</button>'; }
  if (mod === 'fortaring'){
    var k = Object.keys(ev.kost || {});
    top = '<div class="card"><header><h2>Specialkost från gästlistan</h2><span class="faint">' + ev.osa.ja + ' har tackat ja</span></header><div class="tools" style="padding:10px 12px;margin:0">' + (k.map(function(x){ return '<span class="tag">' + x + ' ' + ev.kost[x] + '</span>'; }).join('') || '<span class="muted">Inga svar än.</span>') + '</div></div>';
  }
  if (mod === 'teknik'){ var cats = {}; ev.items.teknik.forEach(function(t){ cats[t.kategori] = (cats[t.kategori] || 0) + (+t.antal || 0); }); top = '<div class="tools">' + Object.keys(cats).map(function(c){ return '<span class="tag">' + c + ' ' + cats[c] + ' st</span>'; }).join('') + '</div>'; }
  return page(MODS[mod].name, sub, (mod === 'budget' ? '<a class="btn" href="' + href(ev, 'budget', 'event') + '">Ändra offererat</a>' : '') + right + addBtn(mod), top + table(ev, mod, extra));
}
function commentsBlock(it){
  var cs = comments(it), h = '<div class="sect"><span>Kommentarer</span><span>' + cs.length + '</span></div>';
  h += cs.map(function(c){
    var txt = esc(c.text).replace(/@([A-Za-zÅÄÖåäö]+(?: [A-ZÅÄÖ][a-zåäö]+)?)/g, '<span class="at">@$1</span>');
    return '<div class="cm"><div class="hd"><b>' + esc(c.who) + '</b><span>' + ago(c.at) + '</span>' + (kund() ? '' : '<span class="vis ' + c.vis + '">' + (c.vis === 'kund' ? 'Synlig för kund' : 'Intern') + '</span>') + '</div><p>' + txt + '</p></div>';
  }).join('') || '<p class="faint" style="margin:0 0 8px">Inga kommentarer än.</p>';
  h += '<form class="composer" data-comment="' + it.id + '"><textarea name="text" placeholder="Skriv en kommentar. Nämn någon med @" aria-label="Ny kommentar" data-draft>' + esc(UI.draft) + '</textarea><div class="bar2">' +
    (kund() ? '<span class="faint">Byrån ser din kommentar</span>' : '<div class="seg" role="group" aria-label="Synlighet"><button type="button" data-vis="intern" class="' + (UI.vis === 'intern' ? 'on' : '') + '">Intern</button><button type="button" data-vis="kund" class="' + (UI.vis === 'kund' ? 'on' : '') + '">Synlig för kund</button></div>') +
    '<button class="btn pri sm">Skicka</button></div></form>';
  return h;
}
function vLokal(ev){
  var L = ev.lokal, secs = [];
  L.facts.forEach(function(f){ if (secs.indexOf(f[0]) < 0) secs.push(f[0]); });
  if (!L.facts.length) return page('Lokal', esc(ev.venue), '', empty('Inga lokalfakta än', 'Fyll i från lokalens faktablad: kapacitet, el, lastväg, tider och regler.', '<button class="btn pri" data-act="lokalmall">Lägg in standardfälten</button>'));
  var facts = '<div class="facts">' + secs.map(function(s){
    return '<section><h3><input class="inl" style="font-weight:600" data-factsec="' + esc(s) + '" value="' + esc(s) + '" aria-label="Sektionens namn"></h3>' + L.facts.map(function(f, i){
      return f[0] !== s ? '' : '<div class="fact"><input class="inl muted" data-factl="' + i + '" value="' + esc(f[1]) + '" aria-label="Fältnamn"><input class="inl" data-fact="' + i + '" value="' + esc(f[2]) + '" aria-label="' + esc(f[1]) + '"><button class="btn quiet sm" data-act="factdel" data-i="' + i + '" aria-label="Ta bort ' + esc(f[1]) + '">Ta bort</button></div>';
    }).join('') + '<form class="addrow" data-addfact="' + esc(s) + '"><input name="label" placeholder="Lägg till fält, tryck Enter" aria-label="Nytt fält i ' + esc(s) + '"></form></section>';
  }).join('') + '</div>';
  return page('Lokal', esc(ev.venue) + ', ' + esc(ev.address) + '. Klicka i ett fält för att ändra, både namn och värde.', '<button class="btn" data-act="factsec">Ny sektion</button><a class="btn" href="' + href(ev, 'lokal', 'lokal') + '">Kommentarer ' + comments(L).length + '</a>', facts);
}
function planSvg(kind){
  var s = '<rect x="20" y="20" width="760" height="480" fill="var(--bg)" stroke="currentColor" stroke-width="2"/>';
  if (kind === 'tom') return '<svg viewBox="0 0 800 520" role="img" aria-label="Tom ritning">' + s + '<text x="400" y="264" text-anchor="middle" font-size="14" fill="currentColor">Ingen ritning uppladdad än</text></svg>';
  function box(x, y, w, h, t){ return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="var(--bg3)" stroke="currentColor"/><text x="' + (x + w / 2) + '" y="' + (y + h / 2 + 4) + '" text-anchor="middle" font-size="12" fill="currentColor">' + t + '</text>'; }
  if (kind === 'sal'){
    s += box(280, 34, 240, 66, 'Scen 8 x 4 m') + '<line x1="290" y1="30" x2="510" y2="30" stroke="var(--accent)" stroke-width="4"/>' + box(350, 448, 100, 40, 'Teknik') + box(32, 190, 38, 150, 'Bar') + box(730, 190, 38, 150, 'Bar');
    for (var j = 0; j < 4; j++) for (var i = 0; i < 6; i++){ var x = 140 + i * 104, y = 158 + j * 70; s += '<circle cx="' + x + '" cy="' + y + '" r="24" fill="var(--bg3)" stroke="currentColor"/><text x="' + x + '" y="' + (y + 4) + '" text-anchor="middle" font-size="11" fill="currentColor">' + (j * 6 + i + 1) + '</text>'; }
    s += '<rect x="60" y="494" width="90" height="12" fill="var(--bg2)"/><text x="105" y="488" text-anchor="middle" font-size="12" fill="currentColor">Entré</text><rect x="774" y="90" width="12" height="60" fill="var(--bg2)"/><text x="762" y="124" text-anchor="end" font-size="11" fill="currentColor">Nödutgång</text><text x="400" y="14" text-anchor="middle" font-size="11" fill="currentColor">32 m</text>';
  } else {
    s += box(60, 320, 150, 40, 'Incheckning 1') + box(230, 320, 150, 40, 'Incheckning 2') + box(560, 60, 190, 120, 'Garderob') + box(560, 300, 190, 46, 'Välkomstbar') + '<rect x="330" y="14" width="140" height="12" fill="var(--bg2)"/><text x="400" y="48" text-anchor="middle" font-size="12" fill="currentColor">Till Stora salen</text><rect x="100" y="494" width="160" height="12" fill="var(--bg2)"/><text x="180" y="488" text-anchor="middle" font-size="12" fill="currentColor">Huvudentré</text>';
  }
  return '<svg viewBox="0 0 800 520" role="img" aria-label="Planritning">' + s + '</svg>';
}
function apprBar(status, target){
  if (!kund()) return '<select class="st t-' + (TONE[status] || 'n') + '" data-appr="' + target + '" aria-label="Granskning">' + opts(APPR, status) + '</select>';
  return st(status) + (status === 'På granskning' ? ' <button class="btn pri sm" data-act="appr" data-target="' + target + '" data-val="Godkänd">Godkänn</button> <button class="btn sm" data-act="appr" data-target="' + target + '" data-val="Ändringar önskas">Be om ändringar</button>' : '');
}
function vRitningar(ev){
  var ds = ev.items.ritningar; if (!ds.length) return page('Ritningar', '', '', empty('Inga ritningar än', 'Ladda upp planritningen som PDF eller bild och sätt nålar med kommentarer direkt på den.', '<button class="btn pri" data-act="upload">Ladda upp ritning</button>'));
  var r = route(), d = ds.filter(function(x){ return x.id === (r.item || UI.drawing); })[0] || ds[0]; UI.drawing = d.id;
  var pins = d.pins.filter(function(p){ return !kund() || p.vis === 'kund'; });
  var tabs = '<div class="tools">' + ds.map(function(x){ return '<a class="chip' + (x === d ? ' on' : '') + '" style="display:inline-flex;align-items:center" href="' + href(ev, 'ritningar', x.id) + '">' + esc(x.title) + ' ' + x.version + '</a>'; }).join('') + '<div class="sp"></div>' + apprBar(d.status, d.id) +
    '<button class="btn' + (UI.pinMode ? ' pri' : '') + '" data-act="pinmode">' + (UI.pinMode ? 'Klicka på ritningen' : 'Sätt nål') + '</button></div>';
  var canvas = '<div class="canvas' + (UI.pinMode ? ' add' : '') + '" id="canvas">' + planSvg(d.kind) + pins.map(function(p, i){ return '<button class="pin' + (p.done ? ' done' : '') + '" style="left:' + p.x + '%;top:' + p.y + '%" aria-label="Nål ' + (i + 1) + ': ' + esc(p.text) + '" title="' + esc(p.text) + '">' + (i + 1) + '</button>'; }).join('') + '</div>';
  var list = '<div class="card" style="margin:0"><header><h2>Nålar</h2><span class="faint">' + pins.filter(function(p){ return !p.done; }).length + ' öppna</span></header>' + (pins.map(function(p, i){
    return '<div class="pinitem' + (p.done ? ' done' : '') + '"><span class="n">' + (i + 1) + '</span><div>' + (p.edit ? '<input type="text" data-pintext="' + p.id + '" value="' + esc(p.text) + '" placeholder="Skriv kommentaren, tryck Enter" aria-label="Kommentar till nål">' : '<p data-act="pinedit" data-id="' + p.id + '" title="Klicka för att ändra" style="cursor:text">' + esc(p.text) + '</p>') +
      '<span class="faint" style="font-size:12px">' + esc(p.who) + (kund() ? '' : ', ' + (p.vis === 'kund' ? 'synlig för kund' : 'intern')) + '</span>' + (kund() && p.who !== 'Kund' ? '' : ' <button class="btn quiet sm" data-act="pindel" data-id="' + p.id + '">Ta bort</button>') + '</div><input type="checkbox" class="cb" data-pindone="' + p.id + '"' + (p.done ? ' checked' : '') + ' aria-label="Löst"></div>';
  }).join('') || '<div class="empty">Inga nålar. Välj Sätt nål och klicka på ritningen.</div>') + '</div>';
  return page('Ritningar', 'Kommentera direkt på ritningen. Varje nål är en tråd som kan bockas av.', '', kundBanner(ev) + tabs + (kund() ? '' : '<div class="tools"><label class="muted" for="dname">Namn</label><input id="dname" class="fi" data-f="title" data-id="' + d.id + '" value="' + esc(d.title) + '"><label class="muted" for="dver">Version</label><input id="dver" class="fi" style="width:70px" data-f="version" data-id="' + d.id + '" value="' + esc(d.version) + '"><button class="btn" data-act="upload">Ladda upp fil</button><div class="sp"></div><button class="btn quiet" data-act="deldraw">Ta bort ritningen</button><button class="btn pri" data-act="addfirst" data-mod="ritningar">Lägg till ritning</button></div>') + '<div class="plan">' + canvas + list + '</div><p class="faint">Ritningen är ett exempel ritat i prototypen. I riktiga appen laddar du upp PDF eller bild, med versioner.</p>');
}
function art(it){
  var a = it.c1 || '#333', b = it.c2 || '#999', s = '', h = 200;
  if (it.kind === 'ljus') s = '<circle cx="150" cy="70" r="110" fill="' + b + '" opacity=".18"/><circle cx="150" cy="70" r="62" fill="' + b + '" opacity=".4"/><circle cx="150" cy="70" r="20" fill="' + b + '"/><rect y="160" width="300" height="40" fill="#000" opacity=".3"/>';
  else if (it.kind === 'bord'){ h = 240; for (var i = 0; i < 6; i++) s += '<circle cx="' + (60 + (i % 3) * 90) + '" cy="' + (70 + Math.floor(i / 3) * 100) + '" r="34" fill="#fff" opacity=".85"/><circle cx="' + (60 + (i % 3) * 90) + '" cy="' + (70 + Math.floor(i / 3) * 100) + '" r="9" fill="' + b + '"/>'; }
  else if (it.kind === 'linjer'){ h = 260; for (var j = 0; j < 12; j++) s += '<rect x="' + (18 + j * 23) + '" y="' + (20 + (j % 4) * 14) + '" width="3" height="' + (150 + (j % 3) * 30) + '" fill="' + b + '" opacity="' + (.35 + (j % 4) * .2) + '"/>'; }
  else { h = 180; s = '<rect y="96" width="300" height="84" fill="' + b + '" opacity=".9"/><rect y="90" width="300" height="6" fill="#fff" opacity=".7"/><circle cx="220" cy="62" r="22" fill="' + b + '"/>'; }
  return '<svg viewBox="0 0 300 ' + h + '" role="img" aria-label="' + esc(it.title) + '"><rect width="300" height="' + h + '" fill="' + a + '"/>' + s + '</svg>';
}
function vMoodboard(ev){
  var cards = ev.items.moodboard;
  var tools = '<div class="tools"><span class="muted">Granskning</span>' + apprBar(ev.moodStatus, 'mood') + '<div class="sp"></div>' + (kund() ? '' : '<button class="btn" data-act="addnote">Ny anteckning</button><button class="btn" data-act="addcolor">Ny färg</button><button class="btn" data-act="upload">Ladda upp bild</button>') + '</div>';
  if (!cards.length) return page('Moodboard', '', '', tools + empty('Tom tavla', 'Samla bilder, färger och anteckningar som visar känslan. Dela med kunden för godkännande.'));
  var h = '<div class="mood">' + cards.map(function(c){
    var body = c.typ === 'Bild' ? art(c) + '<div class="cap"><span>' + esc(c.title) + '</span>' + cc(c) + '</div>' : c.typ === 'Färg' ? '<div class="sw" style="background:' + esc(c.c1) + '"></div><div class="cap"><span>' + esc(c.title) + '</span><span class="mono faint">' + esc(c.c1) + '</span></div>' : '<div class="cap">' + esc(c.title) + ' ' + cc(c) + '</div>';
    return '<div class="mc' + (c.typ === 'Anteckning' ? ' note' : '') + '" data-go="' + href(ev, 'moodboard', c.id) + '" tabindex="0">' + body + '</div>';
  }).join('') + '</div><p class="faint">Bilderna är platshållare ritade i prototypen. I riktiga appen laddar du upp egna bilder och länkar.</p>';
  return page('Moodboard', 'Känsla, färg och form på ett ställe. Klicka på ett kort för att kommentera.', '', kundBanner(ev) + tools + h);
}
function vGaster(ev){
  var o = ev.osa, wait = Math.max(ev.guests - o.ja - o.nej, 0), k = Object.keys(ev.kost || {});
  return page('Gäster', 'OSA-sidan byggs separat per event. Här syns siffrorna.', kund() ? '' : '<a class="btn" href="' + href(ev, 'gaster', 'event') + '">Uppdatera siffror</a>', kundBanner(ev) +
    '<div class="stats"><div class="stat"><span>Platser</span><b>' + ev.guests + '</b></div><div class="stat"><span>Tackat ja</span><b>' + o.ja + '</b></div><div class="stat"><span>Tackat nej</span><b>' + o.nej + '</b></div><div class="stat"><span>Inget svar</span><b>' + wait + '</b></div></div>' +
    '<div class="card"><header><h2>Beläggning</h2><span class="faint num">' + Math.round(100 * o.ja / ev.guests) + ' % av platserna</span></header><div style="padding:14px 12px">' + bar(Math.round(100 * o.ja / ev.guests), 'wide') + '</div></div>' +
    '<div class="card"><header><h2>Specialkost</h2></header><div class="tools" style="padding:10px 12px;margin:0">' + (k.map(function(x){ return '<span class="tag">' + x + ' ' + ev.kost[x] + '</span>'; }).join('') || '<span class="muted">Inga svar än.</span>') + '</div></div>' +
    '<div class="card"><header><h2>OSA-sida</h2></header><div style="padding:8px 12px"><div class="fields" style="margin:0"><label>Adress</label><span>' + esc(ev.osaUrl || 'Inte byggd än') + '</span><label>Status</label><span>' + (o.ja + o.nej ? st('Öppen', 'ok') : st('Inte publicerad')) + '</span></div></div></div>');
}
function viewShare(){
  var r = route(), ev = getEv(r.ev), p = person(r.person); if (!ev || !p) return viewHome();
  var sh = ev.items.personal.filter(function(s){ return s.person === p.id && s.status !== 'Nekad'; }).sort(function(a, b){ return tmin(a.start) - tmin(b.start); });
  var open = sh.filter(function(s){ return s.status !== 'Bekräftad'; }), mine = schemaRows(ev).filter(function(x){ return x.day === 'Eventdagen' && (x.who === 'Alla' || x.typ === 'Program' && x.who === 'Daniel'); });
  var ln = function(a, b){ return '<div class="ln"><span>' + a + '</span><span class="muted" style="text-align:right">' + b + '</span></div>'; };
  return '<div class="share"><div class="banner"><span><b>Förhandsvisning.</b> Det här är sidan ' + esc(p.title.split(' ')[0]) + ' får som länk. Ingen inloggning.</span><a href="' + href(ev, 'personal') + '"><u>Tillbaka</u></a></div><div class="phone">' +
    '<div class="hero"><div>' + esc(ev.name) + '</div><div>' + fmtLong(ev.date) + '</div><b>' + (sh[0] ? sh[0].call : '') + '</b><div>Din kalltid. Var på plats då, ombytt och klar.</div></div>' +
    '<div class="blk"><h3>Dina pass</h3>' + sh.map(function(s){ return ln('<b>' + esc(s.role) + '</b><br>' + esc(s.plats), s.start + ' till ' + s.end + '<br>' + s.status); }).join('') + '</div>' +
    '<div class="blk"><h3>Plats</h3>' + ln(esc(ev.venue), esc(ev.address)) + ln('Personalingång', 'Baksidan, via lastkajen') + '</div>' +
    '<div class="blk"><h3>Kontakt på plats</h3>' + ln('Daniel, projektledare', '070-000 00 01') + ln('Lasse, personal', '070-000 00 02') + '</div>' +
    '<div class="blk"><h3>Dagens hållpunkter</h3>' + mine.map(function(x){ return ln(esc(x.title), x.start); }).join('') + '</div>' +
    '<div class="blk"><h3>Bra att veta</h3>' + ln('Klädsel', 'Svart, hela skor') + ln('Mat', 'Personalmat 14:30') + '</div>' +
    '<div class="blk">' + (open.length ? '<button class="btn pri" style="width:100%;height:40px;justify-content:center" data-act="confirm" data-ev="' + ev.id + '" data-person="' + p.id + '">Bekräfta att jag kommer</button>' : st('Du har bekräftat. Tack.', 'ok')) + '</div></div>' +
    '<p class="faint" style="text-align:center">Länken visar aldrig arvode, avtal eller andras uppgifter.</p></div>';
}

/* ---------- Sidopanel ---------- */
function renderPanel(){
  var c = ctx(), el = $('#panel'), r = route();
  if (!c || !c.it || c.imod === 'ritningar' || (kund() && c.imod === '_event')){ document.body.classList.remove('has-panel'); el.hidden = true; el.innerHTML = ''; return; }
  var it = c.it, mod = c.imod, ev = c.ev, F = fieldsOf(mod), close = ev ? href(ev, r.mod) : '#/personal';
  var h = '<header><span>' + (mod === '_person' ? 'Personalregister' : mod === '_event' ? 'Eventinställningar' : MODS[mod].name) + '</span><a class="btn quiet sm" href="' + close + '" aria-label="Stäng panelen"><span class="d">Stäng</span><span class="m">‹ Tillbaka</span></a></header><div class="body">';
  h += mod === 'lokal' || mod === 'personal' || kund() ? '<h2 style="font-size:17px;margin-bottom:12px">' + esc(it.title) + '</h2>' : '<input class="ttl" data-f="' + (mod === '_event' ? 'name' : 'title') + '" data-id="' + it.id + '" value="' + esc(mod === '_event' ? it.name : it.title) + '" aria-label="Namn">';
  if (mod === '_event') h += '<p class="faint" style="margin:-6px 0 12px">Byter du datum flyttas inte uppgifternas deadlines automatiskt.</p>';
  if (F.length) h += '<div class="fields">' + F.map(function(f){ return '<label>' + f[1] + '</label>' + (f[2] === 'status' ? '<div>' + input(it, f) + '</div>' : input(it, f, 'inl')); }).join('') + '</div>';
  if (mod === 'korschema' && !kund()){ var x = cueTimes(ev).filter(function(q){ return q.c === it; })[0]; h += '<div class="tools"><span class="mono">' + mfmt(x.start) + ' till ' + mfmt(x.end) + '</span><div class="sp"></div><button class="btn sm" data-act="cueup">Flytta upp</button><button class="btn sm" data-act="cuedown">Flytta ned</button></div>'; }
  if (mod === 'personal'){ var bad = conflicts(ev); h += (bad[it.id] ? '<div class="banner warn"><span>Krockar med ett annat pass för samma person.</span></div>' : '') + '<div class="tools"><a class="btn sm" href="#/dela/' + ev.id + '/' + it.person + '">Förhandsvisa personens länk</a><button class="btn sm" data-act="send">Skicka kalltid</button></div>'; }
  if (mod === 'avtal') h += '<div class="tools"><button class="btn sm" data-act="upload">Byt PDF</button>' + (watch(it) ? st(watch(it)[1], watch(it)[0]) : '') + '</div>';
  if (mod === 'moodboard' && it.typ === 'Bild') h += '<div class="mc" style="cursor:default">' + art(it) + '</div>';
  if (mod === '_person'){
    var rows = '';
    S.events.forEach(function(e){ e.items.personal.forEach(function(s){ if (s.person === it.id) rows += '<div class="task" style="grid-template-columns:1fr auto;padding:4px 0" data-go="' + href(e, 'personal', s.id) + '"><div><span class="tt">' + esc(s.role) + '</span><span class="sub">' + esc(e.name) + ', ' + fmt(e.date) + '</span></div>' + st(s.status) + '</div>'; }); });
    h += '<div class="sect"><span>Pass</span></div>' + (rows || '<p class="faint">Inga pass.</p>');
  }
  h += commentsBlock(it);
  if (!kund() && it.log && it.log.length) h += '<div class="sect"><span>Historik</span></div>' + it.log.slice(0, 8).map(function(l){ return '<div class="logrow">' + esc(l.who) + ': ' + esc(l.text) + ', ' + ago(l.at) + '</div>'; }).join('');
  if (!kund() && mod !== 'lokal') h += '<div class="sect"><span></span><button class="btn quiet sm" data-act="del">' + (mod === '_event' ? 'Ta bort eventet' : mod === '_person' ? 'Ta bort personen' : 'Ta bort') + '</button></div>';
  el.innerHTML = h + '</div>'; el.hidden = false;
  document.body.classList.add('has-panel');
}

/* ---------- Render ---------- */
function render(keep){
  var r = route(), y = $('#main').scrollTop, ev = r.view === 'event' && getEv(r.ev);
  document.documentElement.dataset.theme = S.theme || (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  if (ev){ S.kundEv = ev.id; if (kund() && KUND_MODS.indexOf(r.mod) < 0) r.mod = 'oversikt'; if (!MODS[r.mod]) r.mod = 'oversikt'; }
  if (kund() && r.view !== 'event' && r.view !== 'dela') r.view = 'hem';
  if (UI.live && !(ev && r.mod === 'korschema')) stopLive();
  document.body.classList.toggle('bare', r.view === 'dela');
  document.body.classList.remove('nav-open');
  renderSide(); renderTop(); renderTabbar();
  var V = {uppgifter:vUppgifter, schema:vSchema, korschema:vKorschema, personal:vPersonal, lokal:vLokal, ritningar:vRitningar, moodboard:vMoodboard, gaster:vGaster, oversikt:vOversikt};
  var html = r.view === 'event' ? (ev ? (V[r.mod] ? V[r.mod](ev) : vGeneric(ev, r.mod)) : viewHome()) : r.view === 'dela' ? viewShare() : r.view === 'inkorg' ? viewInbox() : r.view === 'personal' ? viewPeople() : r.view === 'mallar' ? viewTemplates() : r.view === 'tid' ? viewTime() : viewHome();
  $('#main').innerHTML = (r.view === 'event' && ev ? modStrip(ev, r.mod) : '') + html;
  renderPanel();
  $('#main').scrollTop = keep ? y : 0;
  var strip = document.querySelector('.modstrip'), cur = strip && strip.querySelector('a.on'); if (cur) strip.scrollLeft = cur.offsetLeft - strip.clientWidth / 2 + cur.offsetWidth / 2;
}
var lastPath = '';
window.addEventListener('hashchange', function(){ var r = route(), path = r.view + '/' + (r.ev || '') + '/' + (r.mod || ''); UI.draft = ''; UI.pinMode = false; if (path !== lastPath) UI.sel = {}; render(path === lastPath); lastPath = path;
  if (UI.focusNew){ UI.focusNew = false; var fe = $('#panel .ttl') || $('#panel .fields input, #panel .fields select'); if (fe){ fe.focus(); fe.select && fe.select(); } } });

function toast(msg, undo){
  var el = $('#toast'); el.innerHTML = '<span>' + esc(msg) + '</span>' + (undo === 'redo' ? '<button data-act="redo">Gör om</button>' : undo ? '<button data-act="undo">Ångra</button>' : ''); el.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(function(){ el.hidden = true; }, undo ? 7000 : 2600);
}
function stopLive(){ if (UI.live){ clearInterval(UI.live.timer); UI.live = null; } }
function addItem(ev, mod, title, extra){
  var p0 = S.people.filter(function(p){ return !p.arkiv; })[0] || {id:'', arvode:0};
  var d = {uppgifter:{status:'Att göra', phase:PHASES[0], owner:'Daniel', due:ev.date}, schema:{day:'Eventdagen', start:'12:00', end:'13:00', who:'Daniel', plats:'', typ:'Program'}, korschema:{dur:10, typ:'Scen', plats:'Scenen', owner:'', tech:''},
    personal:{person:p0.id, role:title, call:'15:45', start:'16:00', end:'22:00', plats:'', status:'Tillfrågad', arvode:p0.arvode, utskick:'Inte skickat'}, leverantorer:{kategori:'', kontakt:'', tel:'', status:'Förfrågan', belopp:0, frist:ev.date, last:''},
    underhallning:{status:'Option', gage:0, speltid:'', set:0, soundcheck:'', inlast:'', rider:'', loge:'', kontakt:''}, teknik:{antal:1, kategori:'Ljud', lev:'', strom:'', 'in':'', status:'Beställd'}, fortaring:{tid:'18:00', antal:ev.guests, garanti:0, satt:'', plats:'', status:'Utkast'},
    budget:{budget:0, utfall:0, status:'Preliminär'}, ritningar:{version:'v1', kind:'tom', status:'Utkast', pins:[]}, avtal:{motpart:'', typ:'Leverantör', status:'Utkast', start:iso(T0), slut:ev.date, uppsagning:'', pdf:''}, moodboard:{typ:'Anteckning', c1:''}}[mod] || {};
  var it = Object.assign({id:uid('n'), title:title, comments:[], log:[], _p:nextPos(ev.items[mod])}, d, extra || {});
  if (mod === 'personal') it.title = pname(it.person) + ', ' + it.role;
  logIt(it, 'Skapad'); ev.items[mod].push(it); save(); return it;
}

/* ---------- Händelser ---------- */
document.addEventListener('click', function(e){
  var t = e.target, c = ctx() || {}, ev = c.ev, a;
  if (t.closest('.pal') && !t.closest('.palbox')){ closePal(); return; }
  if ((a = t.closest('[data-pal]'))){ runPal(+a.dataset.pal); return; }
  if (t.id === 'canvas' || (t.closest('#canvas') && !t.closest('.pin'))){
    if (UI.pinMode && ev){
      var box = $('#canvas').getBoundingClientRect(), d = findItem(ev, UI.drawing).it;
      d.pins.push({id:uid('p'), x:Math.round(1000 * (e.clientX - box.left) / box.width) / 10, y:Math.round(1000 * (e.clientY - box.top) / box.height) / 10, text:'', who:me(), vis:kund() ? 'kund' : UI.vis, done:false, edit:true});
      UI.pinMode = false; render(true); var inp = $('[data-pintext]'); inp && inp.focus();
    }
    return;
  }
  if ((a = t.closest('[data-role]'))){ S.role = a.dataset.role; save(); render(false); return; }
  if ((a = t.closest('[data-tw]'))){ UI.tw = a.dataset.tw; render(true); return; }
  if ((a = t.closest('[data-filter]'))){ UI.taskFilter = a.dataset.filter; render(true); return; }
  if ((a = t.closest('[data-taskview]'))){ UI.taskView = a.dataset.taskview; render(true); return; }
  if ((a = t.closest('[data-vis]'))){ UI.vis = a.dataset.vis; renderPanel(); return; }
  if ((a = t.closest('[data-phase]'))){ var k = ev.id + a.dataset.phase; UI.shut[k] = !a.parentNode.classList.contains('shut'); render(true); return; }
  if ((a = t.closest('[data-act]'))){ act(a.dataset.act, a, c); return; }
  var inter = t.closest('input,select,textarea,button,a,label,summary');
  if (inter && !inter.dataset.go) return;
  if ((a = t.closest('[data-go]'))) location.hash = a.dataset.go;
});
function act(name, el, c){
  var ev = c.ev, it = c.it, r = route();
  switch (name){
    case 'nav': document.body.classList.toggle('nav-open'); break;
    case 'theme': S.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; save(); render(true); break;
    case 'pal': openPal(); break;
    case 'print': window.print(); break;
    case 'logout': flushSync().then(function(){ return REMOTE.signOut(); }).then(function(){ location.hash = '#/'; location.reload(); }); break;
    case 'demo': var dm = seed(); dm.events.forEach(function(x){ if (!getEv(x.id)) S.events.push(x); }); dm.people.forEach(function(x){ if (!person(x.id)) S.people.push(x); }); if (!S.time.length) S.time = dm.time; save(); render(false); toast('Exempeldata inläst.'); break;
    case 'reset': if (REMOTE) break; if (confirm('Återställa demon till exempeldatan?')){ TEMPLATES = JSON.parse(TEMPLATES0); S = seed(); S.templates = TEMPLATES; save(); location.hash = '#/'; render(false); } break;
    case 'new': newDialog(); break;
    case 'close': $('#dlg').close(); break;
    case 'upload': toast('Uppladdning finns i riktiga appen. Här är det exempelfiler.'); break;
    case 'copylink': toast('Länk till utdraget kopierad (exempel).'); break;
    case 'send': it.utskick = 'Skickat'; logIt(it, 'Kalltid skickad via sms och mejl'); save(); render(true); toast('Kalltid skickad till ' + pname(it.person) + ' (exempel).'); break;
    case 'confirm': getEv(el.dataset.ev).items.personal.forEach(function(s){ if (s.person === el.dataset.person && s.status !== 'Nekad'){ s.status = 'Bekräftad'; s.utskick = 'Bekräftat'; logIt(s, 'Bekräftad via länk'); } }); save(); render(true); break;
    case 'pinmode': UI.pinMode = !UI.pinMode; render(true); break;
    case 'appr': setAppr(ev, el.dataset.target, el.dataset.val); break;
    case 'addnote': UI.focusNew = true; location.hash = href(ev, 'moodboard', addItem(ev, 'moodboard', 'Ny anteckning').id); break;
    case 'addcolor': UI.focusNew = true; location.hash = href(ev, 'moodboard', addItem(ev, 'moodboard', 'Ny färg', {typ:'Färg', c1:'#E60571'}).id); break;
    case 'addcue': UI.focusNew = true; location.hash = href(ev, 'korschema', addItem(ev, 'korschema', 'Ny punkt').id); break;
    case 'addfirst': UI.focusNew = true; location.hash = href(ev, el.dataset.mod, addItem(ev, el.dataset.mod, NY[el.dataset.mod]).id); break;
    case 'lokalmall': ev.lokal.facts = [['Grund','Adress',ev.address],['Grund','Tillträde',''],['Grund','Sluttid',''],['Kapacitet','Sittande',''],['Kapacitet','Stående',''],['Kapacitet','Takhöjd',''],['Teknik och el','El',''],['Teknik och el','Nät',''],['Logistik','Lastkaj',''],['Logistik','Parkering',''],['Regler','Ljudgräns',''],['Kontakt','Platsansvarig','']]; save(); render(true); break;
    case 'cueup': case 'cuedown': var list = ev.items.korschema, i = list.indexOf(it), j = i + (name === 'cueup' ? -1 : 1); if (j >= 0 && j < list.length){ ensurePos(list); var other = list[j], tmpP = it._p; it._p = other._p; other._p = tmpP; list.splice(i, 1); list.splice(j, 0, it); save(); render(true); } break;
    case 'del':
      if (c.imod === '_event' && !confirm('Ta bort hela eventet ' + it.name + '?')) break;
      var arr = c.imod === '_event' ? S.events : c.imod === '_person' ? S.people : ev.items[c.imod], idx = arr.indexOf(it);
      arr.splice(idx, 1); save(); location.hash = c.imod === '_event' ? '#/' : c.imod === '_person' ? '#/personal' : href(ev, r.mod);
      toast('”' + (it.title || it.name) + '” borttagen.', function(){ arr.splice(idx, 0, it); save(); render(true); }); break;
    case 'factdel': ev.lokal.facts.splice(+el.dataset.i, 1); save(); render(true); break;
    case 'factsec': ev.lokal.facts.push(['Ny sektion', 'Nytt fält', '']); save(); render(true); var ns = document.querySelector('[data-factsec="Ny sektion"]'); if (ns){ ns.focus(); ns.select(); } break;
    case 'addperson': var np = {id:uid('p'), title:'Ny person', role:'', tel:'', mejl:'', ort:'', cert:'', arvode:0, avtal:'', avtalslut:'', comments:[], log:[]}; S.people.push(np); save(); UI.focusNew = true; location.hash = '#/personal/' + np.id; break;
    case 'pinedit': findItem(ev, UI.drawing).it.pins.forEach(function(x){ if (x.id === el.dataset.id) x.edit = true; }); render(true); var pe = $('[data-pintext]'); if (pe){ pe.focus(); pe.select(); } break;
    case 'pindel': var dd = findItem(ev, UI.drawing).it; dd.pins = dd.pins.filter(function(x){ return x.id !== el.dataset.id; }); save(); render(true); break;
    case 'deldraw': var da = ev.items.ritningar, di = da.indexOf(findItem(ev, UI.drawing).it), dx = da[di]; if (!confirm('Ta bort ritningen ' + dx.title + '?')) break; da.splice(di, 1); UI.drawing = null; save(); location.hash = href(ev, 'ritningar'); render(true); break;
    case 'tplnew': var tk = uid('m'); TEMPLATES[tk] = {name:'Ny mall', size:'', desc:'', tasks:[]}; UI.tplOpen[tk] = true; save(); render(true); break;
    case 'tpldel': if (confirm('Ta bort mallen ' + TEMPLATES[el.dataset.k].name + '?')){ delete TEMPLATES[el.dataset.k]; save(); render(true); } break;
    case 'tpldeltask': TEMPLATES[el.dataset.k].tasks.splice(+el.dataset.i, 1); save(); render(true); break;
    case 'week': UI.week = +el.dataset.d ? UI.week + (+el.dataset.d) : 0; render(true); break;
    case 'tdel': var te = S.time.filter(function(x){ return x.id === el.dataset.id; })[0], ti = S.time.indexOf(te); S.time.splice(ti, 1); save(); render(true); toast(hh(te.h) + ' h borttagna.', function(){ S.time.splice(ti, 0, te); save(); render(true); }); break;
    case 'pfclear': UI.pf = {q:'', ev:'', role:'', arkiv:UI.pf.arkiv}; render(true); break;
    case 'pfarkiv': UI.pf.arkiv = !UI.pf.arkiv; UI.sel = {}; render(true); break;
    case 'bulkclear': UI.sel = {}; render(true); break;
    case 'bulkarkiv': var aids = Object.keys(UI.sel).filter(function(k){ return UI.sel[k]; }), av = el.dataset.v === '1'; S.people.forEach(function(p){ if (aids.indexOf(p.id) >= 0){ if (av) p.arkiv = true; else delete p.arkiv; } }); UI.sel = {}; save(); render(true); toast(aids.length + (av ? ' arkiverade.' : ' återställda.'), true); break;
    case 'bulkdel':
      var bids = Object.keys(UI.sel).filter(function(k){ return UI.sel[k]; }); if (!bids.length) break;
      if (!confirm('Ta bort ' + bids.length + ' markerade? Det går att ångra med Cmd+Z.')) break;
      if (r.view === 'personal') S.people = S.people.filter(function(p){ return bids.indexOf(p.id) < 0; });
      else if (ev && ev.items[r.mod]) ev.items[r.mod] = ev.items[r.mod].filter(function(x){ return bids.indexOf(x.id) < 0; });
      UI.sel = {}; save();
      if (r.item && bids.indexOf(r.item) >= 0) location.hash = r.view === 'personal' ? '#/personal' : href(ev, r.mod); else render(true);
      toast(bids.length + ' borttagna.', true); break;
    case 'undo': undoApp(); break;
    case 'redo': redoApp(); break;
    case 'livestart': UI.live = {t:tmin(ev.runStart) - 3, paused:false, timer:setInterval(function(){ var L = UI.live; if (!L) return; if (!L.paused){ L.t++; render(true); } }, 1000)}; render(true); break;
    case 'livepause': UI.live.paused = !UI.live.paused; render(true); break;
    case 'livenext': var nx = cueTimes(ev).filter(function(x){ return x.start > UI.live.t; })[0]; if (nx){ UI.live.t = nx.start; render(true); } break;
    case 'livestop': stopLive(); render(true); break;
  }
}
function setAppr(ev, target, val){
  if (target === 'mood') ev.moodStatus = val; else { var d = findItem(ev, target).it; d.status = val; logIt(d, 'Granskning: ' + val); }
  save(); render(true); toast('Granskning: ' + val + '.');
}
document.addEventListener('change', function(e){
  var t = e.target, c = ctx() || {}, ev = c.ev;
  if (t.dataset.th || t.dataset.tdeb){ var tr = S.time.filter(function(x){ return x.id === (t.dataset.th || t.dataset.tdeb); })[0]; if (t.dataset.th) tr.h = Math.max(0, +t.value || 0); else tr.deb = t.checked; save(); render(true); return; }
  if (t.dataset.sel){ UI.sel[t.dataset.sel] = t.checked; render(true); return; }
  if (t.hasAttribute('data-selall')){ Array.prototype.forEach.call(document.querySelectorAll('#main [data-sel]'), function(x){ UI.sel[x.dataset.sel] = t.checked; }); render(true); return; }
  if (t.dataset.check){ var te = getEv(t.dataset.ev), task = findItem(te, t.dataset.check).it; task.status = t.checked ? 'Klar' : 'Att göra'; logIt(task, 'Status: ' + task.status); save(); render(true); return; }
  if (t.dataset.f){
    var found = c.imod === '_person' ? {it:c.it, mod:'_person'} : ev && findItem(ev, t.dataset.id); if (!found) return;
    var it = found.it, k = t.dataset.f, f = fieldsOf(found.mod).filter(function(x){ return x[0] === k; })[0];
    var nv = t.type === 'number' ? +t.value : t.value;
    if (f && f[2] === 'date'){ nv = t.value.trim() ? parseDate(t.value) : ''; if (nv === null){ toast('Skriv datumet som ÅÅ.MM.DD, till exempel ' + fmt(iso(T0)) + '.'); render(true); return; } }
    if (f && f[2] === 'lines') nv = t.value.split('\n').map(function(x){ return x.trim(); }).filter(Boolean);
    if (f && f[2] === 'kv'){ nv = {}; t.value.split('\n').forEach(function(x){ var p = x.split(':'); if (p[0].trim()) nv[p[0].trim()] = +(p[1] || 0) || 0; }); }
    setVal(it, k, nv);
    if (found.mod === '_event' && k === 'venue') ev.lokal.title = nv;
    if (found.mod === 'personal'){ if (k === 'person' && person(it.person)) it.arvode = person(it.person).arvode; it.title = pname(it.person) + ', ' + it.role; }
    logIt(it, (f ? f[1].split(',')[0] : 'Namn') + (f && (f[2] === 'lines' || f[2] === 'kv') ? ' ändrad' : ': ' + (f && f[2] === 'person' ? pname(nv) : f && f[2] === 'date' ? fmt(nv) : nv))); save(); render(true); return;
  }
  if (t.dataset.factl){ ev.lokal.facts[+t.dataset.factl][1] = t.value; save(); return; }
  if (t.dataset.factsec != null && t.hasAttribute('data-factsec')){ var nyttNamn = t.value.trim() || t.dataset.factsec; ev.lokal.facts.forEach(function(x){ if (x[0] === t.dataset.factsec) x[0] = nyttNamn; }); save(); render(true); return; }
  if (t.dataset.tplf){ var tp = t.dataset.tplf.split('|'); TEMPLATES[tp[0]][tp[1]] = t.value; save(); return; }
  if (t.dataset.tt){ var q = t.dataset.tt.split('|'), row = TEMPLATES[q[0]].tasks[+q[1]]; row[+q[2]] = (q[2] === '0' || q[2] === '2') ? +t.value : t.value; save(); render(true); return; }
  if (t.dataset.tf){ var tq = t.dataset.tf.split('|'), tre = S.time.filter(function(x){ return x.id === tq[0]; })[0]; if (tq[1] === 'date'){ var pd = parseDate(t.value); if (!pd){ toast('Skriv datumet som ÅÅ.MM.DD.'); render(true); return; } tre.date = pd; } else tre[tq[1]] = t.value; S.time.sort(function(a, b){ return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; }); save(); render(true); return; }
  if (t.dataset.appr){ setAppr(ev, t.dataset.appr, t.value); return; }
  if (t.dataset.fact){ ev.lokal.facts[+t.dataset.fact][2] = t.value; logIt(ev.lokal, ev.lokal.facts[+t.dataset.fact][1] + ' ändrad'); save(); return; }
  if (t.dataset.pintext){ var d = findItem(ev, UI.drawing).it, p = d.pins.filter(function(x){ return x.id === t.dataset.pintext; })[0]; if (t.value.trim()){ p.text = t.value.trim(); delete p.edit; } else d.pins.splice(d.pins.indexOf(p), 1); save(); render(true); return; }
  if (t.dataset.pindone){ var d2 = findItem(ev, UI.drawing).it; d2.pins.filter(function(x){ return x.id === t.dataset.pindone; })[0].done = t.checked; save(); render(true); return; }
  if (t.id === 'pfev'){ UI.pf.ev = t.value; render(true); return; }
  if (t.id === 'pfrole'){ UI.pf.role = t.value; render(true); return; }
  if (t.id === 'hidedone'){ UI.hideDone = t.checked; render(true); return; }
  if (t.id === 'who'){ UI.who = t.value; render(true); return; }
  if (t.id === 'runstart'){ ev.runStart = t.value || '16:30'; save(); render(true); return; }
});
document.addEventListener('toggle', function(e){ if (e.target.dataset && e.target.dataset.tplk) UI.tplOpen[e.target.dataset.tplk] = e.target.open; }, true);
document.addEventListener('input', function(e){
  if (e.target.hasAttribute('data-draft')) UI.draft = e.target.value;
  if (e.target.id === 'pq'){ UI.pf.q = e.target.value; var caret = e.target.selectionStart; render(true); var pq = $('#pq'); if (pq){ pq.focus(); pq.setSelectionRange(caret, caret); } }
  if (e.target.id === 'palq'){ UI.pal.q = e.target.value; UI.pal.i = 0; drawPal(); }
});
document.addEventListener('submit', function(e){
  var f = e.target, c = ctx() || {}, ev = c.ev; e.preventDefault();
  if (f.dataset.add){
    var title = f.title.value.trim(); if (!title) return;
    var it = addItem(ev, f.dataset.add, title, f.dataset.phaseName ? {phase:f.dataset.phaseName} : null);
    if (f.dataset.add === 'uppgifter'){ render(true); var again = document.querySelector('[data-phase-name="' + f.dataset.phaseName + '"] input'); again && again.focus(); }
    else location.hash = href(ev, f.dataset.add, it.id);
  } else if (f.dataset.addfact != null && f.hasAttribute('data-addfact')){
    var lab = f.label.value.trim(); if (!lab) return;
    var sista = -1; ev.lokal.facts.forEach(function(x, i){ if (x[0] === f.dataset.addfact) sista = i; });
    ev.lokal.facts.splice(sista + 1, 0, [f.dataset.addfact, lab, '']); save(); render(true);
    var nf = document.querySelector('[data-fact="' + (sista + 1) + '"]'); nf && nf.focus();
  } else if (f.dataset.addtpl){
    var tt = f.title.value.trim(); if (!tt) return;
    TEMPLATES[f.dataset.addtpl].tasks.push([0, tt, 30, 'D']); save(); render(true);
  } else if (f.dataset.comment){
    var text = f.text.value.trim(); if (!text) return;
    (c.it.comments = c.it.comments || []).push({who:me(), text:text, at:Date.now(), vis:kund() ? 'kund' : UI.vis}); UI.draft = ''; save(); render(true);
  } else if (f.id === 'timeform'){
    var h = +String(f.h.value).replace(',', '.'); if (!(h > 0)) return;
    var td = parseDate(f.date.value); if (!td){ toast('Skriv datumet som ÅÅ.MM.DD.'); return; }
    S.time.push({id:uid('t'), who:f.who.value, date:td, ev:f.ev.value, akt:f.akt.value, h:h, deb:f.ev.value !== '', note:f.note.value.trim()});
    S.time.sort(function(a, b){ return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; }); save(); render(true); toast(hh(h) + ' h tillagda på ' + evName(f.ev.value) + '.');
  } else if (f.id === 'loginform'){
    var lb = f.querySelector('button'), lm = document.getElementById('loginmsg'); lb.disabled = true; lm.textContent = 'Loggar in';
    REMOTE.signIn(f.email.value, f.password.value).then(boot).catch(function(err){ lb.disabled = false; lm.textContent = err.message || 'Kunde inte logga in.'; });
  } else if (f.id === 'newform'){
    var nd = parseDate(f.date.value); if (!nd){ toast('Skriv datumet som ÅÅ.MM.DD.'); return; }
    var id = uid('e'), nev = newEvent(id, f.name.value.trim(), f.client.value.trim(), f.tpl.value, nd, f.venue.value.trim(), +f.guests.value || 100);
    S.events.push(nev); save(); $('#dlg').close(); location.hash = href(nev, 'uppgifter');
  }
});
document.addEventListener('keydown', function(e){
  var mod = (e.metaKey || e.ctrlKey) && !e.altKey, key = (e.key || '').toLowerCase();
  if (mod && (key === 'z' || key === 'y') && !UI.pal && !$('#dlg').open && S && S.events){
    if (editingText(e.target)) return;
    e.preventDefault(); if (key === 'y' || e.shiftKey) redoApp(); else undoApp(); return;
  }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'){ e.preventDefault(); UI.pal ? closePal() : openPal(); return; }
  if (UI.pal){
    var n = palList().length;
    if (e.key === 'ArrowDown'){ e.preventDefault(); UI.pal.i = (UI.pal.i + 1) % n; drawPal(); }
    else if (e.key === 'ArrowUp'){ e.preventDefault(); UI.pal.i = (UI.pal.i - 1 + n) % n; drawPal(); }
    else if (e.key === 'Enter'){ e.preventDefault(); runPal(UI.pal.i); }
    else if (e.key === 'Escape'){ closePal(); }
    return;
  }
  if (e.key === 'Enter' && e.target.matches && e.target.matches('.kcard,.mc')) location.hash = e.target.dataset.go;
  if (e.key === 'Escape' && !$('#panel').hidden && !$('#dlg').open){ var a = $('#panel header a'); if (a) location.hash = a.getAttribute('href'); }
});

/* ---------- Kommandopalett ---------- */
function palAll(){
  var r = route(), out = [['Alla event', 'Gå till', '#/']];
  if (!kund()) out.push(['Inkorg', 'Gå till', '#/inkorg'], ['Personalregister', 'Gå till', '#/personal'], ['Tidrapport', 'Gå till', '#/tid'], ['Mallar', 'Gå till', '#/mallar']);
  var ev = r.view === 'event' && getEv(r.ev);
  if (ev){
    Object.keys(MODS).forEach(function(m){ if (!kund() || KUND_MODS.indexOf(m) >= 0) out.push([MODS[m].name, ev.name, href(ev, m)]); });
    if (!kund()) for (var m in ev.items) ev.items[m].forEach(function(it){ out.push([it.title, MODS[m].name, href(ev, m, it.id)]); });
  }
  (kund() ? [] : S.events).forEach(function(e){ out.push([e.name, 'Event', href(e, 'oversikt')]); });
  if (!kund()) S.people.forEach(function(p){ out.push([p.title, 'Personal', '#/personal/' + p.id]); });
  out.push(['Ångra senaste ändringen', 'Åtgärd', '!undo'], ['Gör om', 'Åtgärd', '!redo'], ['Byt ljust och mörkt läge', 'Åtgärd', '!theme'], ['Växla mellan byrå och kundvy', 'Åtgärd', '!role']);
  if (!kund()) out.push(['Nytt event', 'Åtgärd', '!new']);
  return out;
}
function palList(){ var q = UI.pal.q.toLowerCase(); return palAll().filter(function(x){ return !q || (x[0] + ' ' + x[1]).toLowerCase().indexOf(q) >= 0; }).slice(0, 12); }
function openPal(){ UI.pal = {q:'', i:0}; $('#pal').hidden = false; $('#pal').innerHTML = '<div class="palbox" role="dialog" aria-label="Sök och kommandon"><input id="palq" placeholder="Sök event, moduler, uppgifter, personer" autocomplete="off"><ul id="pall"></ul></div>'; drawPal(); $('#palq').focus(); }
function drawPal(){ $('#pall').innerHTML = palList().map(function(x, i){ return '<li data-pal="' + i + '" class="' + (i === UI.pal.i ? 'on' : '') + '">' + esc(x[0]) + '<span>' + esc(x[1]) + '</span></li>'; }).join('') || '<li class="faint">Inga träffar</li>'; }
function closePal(){ UI.pal = null; $('#pal').hidden = true; }
function runPal(i){
  var x = palList()[i]; if (!x) return; closePal();
  if (x[2] === '!undo') undoApp(); else if (x[2] === '!redo') redoApp(); else if (x[2] === '!theme') act('theme', null, {}); else if (x[2] === '!role'){ S.role = kund() ? 'byra' : 'kund'; save(); render(false); } else if (x[2] === '!new') newDialog(); else location.hash = x[2];
}
function newDialog(){
  $('#dlg').innerHTML = '<form id="newform"><h2>Nytt event</h2><label><span>Namn</span><input name="name" required placeholder="Sommarfest 2027"></label><label><span>Kund</span><input name="client" required></label>' +
    '<div class="two"><label><span>Datum</span><input name="date" type="text" inputmode="numeric" placeholder="ÅÅ.MM.DD" maxlength="10" required value="' + fmt(iso(addDays(T0, 60))) + '"></label><label><span>Antal gäster</span><input name="guests" type="number" min="1" value="200" required></label></div>' +
    '<label><span>Lokal</span><input name="venue" placeholder="Kan fyllas i senare"></label><label><span>Mall</span><select name="tpl">' + Object.keys(TEMPLATES).map(function(k){ return '<option value="' + k + '">' + TEMPLATES[k].name + ', ' + TEMPLATES[k].tasks.length + ' uppgifter</option>'; }).join('') + '</select></label>' +
    '<div class="act"><button type="button" class="btn" data-act="close">Avbryt</button><button class="btn pri">Skapa event</button></div></form>';
  $('#dlg').showModal();
}

/* ---------- Start ---------- */
function typing(){ var a = document.activeElement; return !!(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.type !== 'checkbox' && a.closest('#main,#panel,#dlg')); }
function remoteRender(){ if (typing() || UI.pal){ UI.pendingRender = true; return; } UI.pendingRender = false; render(true); }
document.addEventListener('focusout', function(){ if (UI.pendingRender) setTimeout(function(){ if (UI.pendingRender && !typing()) remoteRender(); }, 60); });
window.addEventListener('beforeunload', function(e){ if (REMOTE && SYNC.pending){ flushSync(); e.preventDefault(); e.returnValue = ''; } });
function start(){ histMark(); HIST.undo = []; HIST.redo = []; var r = route(); lastPath = r.view + '/' + (r.ev || '') + '/' + (r.mod || ''); render(false); }
function showLogin(msg, loggedIn){
  S = {v:1, role:'byra', theme:'', events:[], people:[], time:[], templates:{}};
  document.documentElement.dataset.theme = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.body.classList.add('bare'); $('#panel').hidden = true;
  $('#main').innerHTML = '<form id="loginform" class="login"><img src="assets/shp-star-' + (document.documentElement.dataset.theme === 'dark' ? 'white' : 'pink') + '.svg" alt="" width="36" height="36"><h1>Shiny Event</h1>' +
    (loggedIn ? '<p id="loginmsg" role="alert">' + esc(msg) + '</p><button type="button" class="btn" data-act="logout">Logga ut</button>' :
    '<label><span>E-post</span><input name="email" type="email" autocomplete="username" required></label><label><span>Lösenord</span><input name="password" type="password" autocomplete="current-password" required></label>' +
    '<button class="btn pri">Logga in</button><p id="loginmsg" role="alert">' + esc(msg || '') + '</p><p class="faint">Samma konto som i CRM:et.</p>') + '</form>';
}
function startRemote(ses){
  UI.me = ses.name; if (ses.name === 'Daniel' || ses.name === 'Lasse') UI.tw = ses.name;
  return REMOTE.loadAll().then(function(rows){
    var map = {}; SNAP = {};
    rows.forEach(function(r){ var d = normDoc(r); map[d.kind + '|' + d.id] = d; SNAP[d.kind + '|' + d.id] = canon(d); });
    S = fromDocs(map);
    try { var pf = JSON.parse(localStorage.getItem('se-prefs')) || {}; S.role = pf.role || 'byra'; S.theme = pf.theme || ''; } catch(e){ S.role = 'byra'; S.theme = ''; }
    var first = !Object.keys(S.templates).length;
    if (first) S.templates = JSON.parse(TEMPLATES0);
    TEMPLATES = S.templates;
    REMOTE.subscribe(onRemote);
    document.body.classList.remove('bare');
    start();
    if (first) queueSync(50);
  });
}
function boot(){
  var fake = /[?&]fake=1/.test(location.search) && /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  if (!window.SE_CONFIG && !fake){ load(); start(); return Promise.resolve(); }
  $('#main').innerHTML = '<p class="muted" style="padding:40px">Laddar</p>';
  return (REMOTE ? Promise.resolve(REMOTE) : (fake ? fakeBackend() : supabaseBackend(window.SE_CONFIG))).then(function(b){
    REMOTE = b; return REMOTE.session();
  }).then(function(ses){
    if (!ses){ showLogin(); return; }
    if (ses.notStaff){ showLogin('Kontot ' + ses.email + ' har ingen behörighet här än.', true); return; }
    return startRemote(ses);
  }).catch(function(err){
    S = S || {v:1, role:'byra', events:[], people:[], time:[], templates:{}};
    document.body.classList.add('bare');
    $('#main').innerHTML = '<div class="login"><h1>Shiny Event</h1><p role="alert">Kunde inte ansluta till databasen.</p><p class="faint">' + esc(err && err.message || err) + '</p><button class="btn" onclick="location.reload()">Försök igen</button></div>';
  });
}
boot();
