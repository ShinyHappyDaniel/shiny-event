/* Exempeldata och hjälpare. Allt här är påhittat. */
var DAY = 864e5;
var T0 = (function(){ var d = new Date(); d.setHours(0,0,0,0); return d; })();
function iso(d){ return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); }
function fromIso(s){ var p = String(s).split('-').map(Number); return new Date(p[0], p[1]-1, p[2]); }
function addDays(d, n){ var x = new Date(d); x.setDate(x.getDate()+n); return x; }
function diff(s){ return Math.round((fromIso(s) - T0) / DAY); }
function fmt(s){ return s ? fromIso(s).toLocaleDateString('sv-SE', {day:'numeric', month:'short'}).replace('.', '') : ''; }
function fmtLong(s){ return fromIso(s).toLocaleDateString('sv-SE', {weekday:'long', day:'numeric', month:'long', year:'numeric'}); }
function rel(s){ var n = diff(s); if (n === 0) return 'i dag'; if (n === 1) return 'i morgon'; if (n === -1) return 'i går'; return n > 0 ? 'om ' + n + ' d' : Math.abs(n) + ' d sen'; }
function kr(n){ return Math.round(n || 0).toLocaleString('sv-SE') + ' kr'; }
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function tmin(t){ var p = String(t || '0:0').split(':'); return (+p[0]) * 60 + (+p[1]); }
function mfmt(m){ m = ((m % 1440) + 1440) % 1440; return String(Math.floor(m/60)).padStart(2,'0') + ':' + String(m % 60).padStart(2,'0'); }
function uid(p){ return p + Date.now().toString(36) + Math.random().toString(36).slice(2,5); }

var PHASES = ['Grund', 'Inbjudan och gäster', 'Produktion', 'Veckan före', 'Eventdagen', 'Efterarbete'];
var OWN = {D:'Daniel', L:'Lasse', K:'Kund'};
var BASE = [
  [0,'Brief och mål satta med kunden',90,'D'],[0,'Budgetram godkänd',84,'K'],[0,'Datum och lokal bokade',80,'L'],
  [0,'Projektgrupp och roller satta',78,'D'],[0,'Koncept och tema klart',70,'D'],[0,'Koncept godkänt',63,'K'],[0,'Tidsplan delad med kunden',60,'L'],
  [1,'Gästlista levererad',56,'K'],[1,'OSA-sida byggd och testad',49,'D'],[1,'Save the date skickad',45,'L'],[1,'Inbjudan skickad',35,'L'],
  [1,'Påminnelse till dem som inte svarat',21,'L'],[1,'OSA stänger, slutligt antal till catering',10,'L'],[1,'Allergier och specialkost sammanställda',9,'L'],[1,'Namnbrickor och gästlista till entrén',4,'L'],
  [2,'Catering: offert och meny',50,'L'],[2,'Teknik bokad: ljud, ljus och bild',45,'D'],[2,'Talare och moderator bekräftade',42,'K'],[2,'Foto och film bokat',30,'D'],
  [2,'Musik eller underhållning bokad',30,'L'],[2,'Grafik klar: skyltar, rollups, skärmbilder',28,'D'],[2,'Trycksaker skickade till tryck',18,'D'],[2,'Presentationer insamlade från talare',7,'K'],
  [3,'Körschema klart och delat',7,'D'],[3,'Genomgång med lokal och teknik',5,'L'],[3,'Personal och värdar briefade',3,'L'],[3,'Slutavstämning med kunden',3,'D'],
  [3,'Packlista och transporter',2,'L'],[3,'Praktisk info till gästerna',2,'L'],
  [4,'Riggning och teknikkoll',0,'D'],[4,'Genrep med talare',0,'D'],[4,'Entré och incheckning bemannad',0,'L'],[4,'Rivning och återlämning',0,'L'],
  [5,'Tackmejl till gästerna',-2,'L'],[5,'Bilder och film levererade',-7,'D'],[5,'Leverantörsfakturor avstämda mot budget',-14,'L'],
  [5,'Slutfaktura till kund',-14,'D'],[5,'Utvärdering med kunden',-21,'D'],[5,'Lärdomar införda i mallen',-21,'D']
];
var TEMPLATES = {
  kundevent: {name:'Kundevent', size:'100 till 300 gäster', desc:'Lansering, kickoff, premiär eller kundkväll. Grundmallen för de flesta event.', tasks: BASE},
  stort: {name:'Stort event', size:'300 till 1 000 gäster', desc:'Grundmallen plus tillstånd, säkerhet, logistik och incheckning för stora sällskap.', tasks: BASE.concat([
    [0,'Tillstånd och säkerhetsplan',70,'L'],[2,'Vakter och garderob bokade',40,'L'],[2,'Hotell och resor för talare',35,'L'],
    [2,'Scenografi och möblering',30,'D'],[2,'Transport för gäster',25,'L'],[3,'Incheckning med QR testad',5,'D'],[3,'Sjukvård och utrymning genomgånget',3,'L']
  ])},
  massa: {name:'Mässa', size:'Monter och bemanning', desc:'Monter, bemanning och leads i stället för gästlista och körschema.', tasks: [
    [0,'Mål och budskap för mässan',100,'D'],[0,'Monteryta bokad',95,'K'],[0,'Budgetram godkänd',90,'K'],[0,'Monterkoncept klart',75,'D'],[0,'Monterkoncept godkänt',68,'K'],
    [1,'Kunder och prospekt inbjudna till montern',30,'K'],[1,'Mötesbokning öppnad',28,'L'],[1,'Påminnelse till inbjudna',7,'L'],
    [2,'Monterbyggare upphandlad',60,'L'],[2,'El, internet och golv beställt hos mässan',45,'L'],[2,'Grafik till montern klar',35,'D'],[2,'Trycksaker och giveaways beställda',30,'D'],
    [2,'Skärminnehåll och film klart',21,'D'],[2,'Frakt bokad',14,'L'],
    [3,'Bemanningsschema klart',10,'K'],[3,'Monterpersonal briefad',4,'D'],[3,'System för leads testat',4,'L'],[3,'Packlista och utlastning',3,'L'],
    [4,'Monterbygge och teknikkoll',1,'L'],[4,'Daglig avstämning i montern',0,'D'],[4,'Rivning och returfrakt',-1,'L'],
    [5,'Leads överlämnade till kundens sälj',-3,'L'],[5,'Bilder och film levererade',-7,'D'],[5,'Slutfaktura till kund',-14,'D'],[5,'Utvärdering med kunden',-21,'D']
  ]}
};

function buildTasks(tpl, dateIso, late){
  var d = fromIso(dateIso);
  var list = TEMPLATES[tpl].tasks.map(function(t, i){
    return {id:'u' + i, title:t[1], status:'Att göra', phase:PHASES[t[0]], owner:OWN[t[3]], due:iso(addDays(d, -t[2])), comments:[], log:[]};
  });
  if (late != null){
    var past = list.filter(function(t){ return diff(t.due) < 0; }).sort(function(a,b){ return a.due < b.due ? -1 : 1; });
    past.forEach(function(t, i){ if (i < past.length - late) t.status = 'Klar'; });
    var next = list.filter(function(t){ return diff(t.due) >= 0; }).sort(function(a,b){ return a.due < b.due ? -1 : 1; });
    if (next[0]) next[0].status = 'Pågår';
    if (next[2]) next[2].status = 'Pågår';
  }
  return list;
}
function emptyItems(){ return {uppgifter:[], schema:[], korschema:[], personal:[], leverantorer:[], underhallning:[], teknik:[], fortaring:[], budget:[], avtal:[], ritningar:[], moodboard:[]}; }
function budgetRows(g, spent){
  var rows = [['Lokal', 180*g, 1], ['Catering', 620*g, .3], ['Teknik', 210*g, .55], ['Personal och värdar', 90*g, 0], ['Grafik och tryck', 70*g, 1.12], ['Foto och film', 45000, .5], ['Underhållning', 60000, 1]];
  return rows.map(function(r, i){ var b = Math.round(r[1]/1000)*1000; return {id:'b' + i, title:r[0], budget:b, utfall:Math.round(b * r[2] * spent / 1000) * 1000, status: spent > .5 ? 'Låst' : 'Preliminär', comments:[], log:[]}; });
}
function newEvent(id, name, client, tpl, date, venue, guests, late, spent){
  var ev = {id:id, name:name, client:client, tpl:tpl, date:date, venue:venue, address:'', guests:guests, osa:{ja:0, nej:0}, kost:{}, osaUrl:'', runStart:'16:30', moodStatus:'Utkast', items:emptyItems(),
    lokal:{id:'lokal', title:venue || 'Lokal', facts:[], comments:[], log:[]}};
  ev.items.uppgifter = buildTasks(tpl, date, late);
  ev.items.budget = budgetRows(guests, spent || 0);
  ev.offer = Math.round(ev.items.budget.reduce(function(s,r){ return s + r.budget; }, 0) * 1.22 / 1000) * 1000;
  return ev;
}

function seedTime(){
  var out = [], n = 0;
  function add(who, date, ev, akt, h, note){ out.push({id:'t' + (++n), who:who, date:date, ev:ev, akt:akt, h:h, deb:ev !== '', note:note || ''}); }
  for (var i = -11; i <= 0; i++){
    var day = addDays(T0, i), wd = day.getDay(), ds = iso(day), k = i + 11;
    if (wd === 0 || wd === 6) continue;
    add('Daniel', ds, 'e1', 'Produktion', 3, k % 2 ? 'Grafik och skärmbilder' : 'Körschema och teknik');
    if (k % 2) add('Daniel', ds, 'e2', 'Kundmöte', 1.5, 'Avstämning med kunden'); else add('Daniel', ds, 'e1', 'Projektledning', 2, '');
    if (k % 3 === 0) add('Daniel', ds, '', 'Administration', 1, 'Fakturering');
    add('Lasse', ds, 'e1', 'Projektledning', 4, k % 2 ? 'Personal och leverantörer' : 'Gästlista och utskick');
    add('Lasse', ds, k % 2 ? 'e3' : 'e2', 'Produktion', 2.5, '');
    if (k % 4 === 0) add('Lasse', ds, 'e1', 'Resa', 1, 'Platsbesök lokal');
  }
  return out;
}
function seed(){
  var n = 0;
  function I(o){ o.id = 'i' + (++n); o.comments = o.comments || []; o.log = []; return o; }
  function C(who, text, daysAgo, vis){ return {who:who, text:text, at:Date.now() - daysAgo * DAY - 3600e3, vis:vis || 'intern'}; }
  var people = [
    {id:'p1', title:'Maja Lind', role:'Värdinna', tel:'070-000 00 11', mejl:'maja@exempel.se', ort:'Stockholm', cert:'Första hjälpen', arvode:2400, avtal:'ramavtal-maja-lind.pdf', avtalslut:iso(addDays(T0, 22))},
    {id:'p2', title:'Omar Haddad', role:'Värd', tel:'070-000 00 12', mejl:'omar@exempel.se', ort:'Solna', cert:'', arvode:2400, avtal:'ramavtal-omar-haddad.pdf', avtalslut:iso(addDays(T0, 240))},
    {id:'p3', title:'Stina Berg', role:'Scentekniker', tel:'070-000 00 13', mejl:'stina@exempel.se', ort:'Nacka', cert:'Rigg, lift', arvode:5200, avtal:'uppdragsavtal-stina-berg.pdf', avtalslut:iso(addDays(T0, 16))},
    {id:'p4', title:'Jonas Ek', role:'Ljudtekniker', tel:'070-000 00 14', mejl:'jonas@exempel.se', ort:'Stockholm', cert:'', arvode:5600, avtal:'uppdragsavtal-jonas-ek.pdf', avtalslut:iso(addDays(T0, 16))},
    {id:'p5', title:'Elsa Nyström', role:'Värdinna', tel:'070-000 00 15', mejl:'elsa@exempel.se', ort:'Uppsala', cert:'', arvode:2400, avtal:'', avtalslut:''},
    {id:'p6', title:'Viktor Sand', role:'Rigg och bär', tel:'070-000 00 16', mejl:'viktor@exempel.se', ort:'Huddinge', cert:'Lift, B-körkort', arvode:3200, avtal:'ramavtal-viktor-sand.pdf', avtalslut:iso(addDays(T0, 400))},
    {id:'p7', title:'Noor Ali', role:'Garderob', tel:'070-000 00 17', mejl:'noor@exempel.se', ort:'Stockholm', cert:'', arvode:2200, avtal:'', avtalslut:''},
    {id:'p8', title:'Hanna Roos', role:'Fotograf', tel:'070-000 00 18', mejl:'hanna@exempel.se', ort:'Stockholm', cert:'', arvode:9500, avtal:'uppdragsavtal-hanna-roos.pdf', avtalslut:iso(addDays(T0, 16))}
  ];
  people.forEach(function(p){ p.comments = []; p.log = []; });

  var d1 = iso(addDays(T0, 16));
  var e1 = newEvent('e1', 'Framtidsdagen 2026', 'Nordlys Energi', 'stort', d1, 'Münchenbryggeriet', 450, 3, .7);
  e1.address = 'Torkel Knutssonsgatan 2, Stockholm';
  e1.osa = {ja:312, nej:41}; e1.kost = {Vegetariskt:38, Veganskt:14, Glutenfritt:11, Laktosfritt:9, Nötallergi:3};
  e1.osaUrl = 'framtidsdagen.exempel.se'; e1.moodStatus = 'På granskning';
  var t = e1.items.uppgifter;
  t.filter(function(x){ return x.title.indexOf('Trycksaker') === 0; })[0].comments = [C('Lasse', 'Tryckeriet behöver filerna senast torsdag för att hinna. @Daniel hinner du?', 1), C('Daniel', 'Skickar i morgon förmiddag.', 0)];
  t.filter(function(x){ return x.title.indexOf('Presentationer') === 0; })[0].comments = [C('Daniel', 'Två av fem har kommit in. Kan ni påminna Anna och Erik?', 2, 'kund'), C('Kund', 'Jag påminner dem i dag.', 1, 'kund')];

  var S = function(day, start, end, title, who, plats, typ){ return I({title:title, day:day, start:start, end:end, who:who, plats:plats, typ:typ}); };
  e1.items.schema = [
    S('Dagen före','14:00','18:00','Inlastning scen och teknik','Ljudbolaget','Lastkaj, Stora salen','Rigg'),
    S('Dagen före','15:00','17:00','Leverans möbler och scenografi','Möbelhyran','Lastkaj','Leverans'),
    S('Eventdagen','07:00','12:00','Rigg ljus, ljud, LED-vägg','Ljudbolaget','Stora salen','Rigg'),
    S('Eventdagen','11:00','12:00','Leverans blommor och dekor','Blomsterverkstan','Foajén','Leverans'),
    S('Eventdagen','13:00','14:30','Teknikkoll och genrep','Daniel','Scenen','Program'),
    S('Eventdagen','14:00','15:30','Catering lastar in och dukar','Smak och Fest','Kök, Stora salen','Leverans'),
    S('Eventdagen','16:30','23:00','Eventet pågår, se körschema','Alla','Hela lokalen','Program'),
    S('Eventdagen','23:00','01:00','Rivning och utlastning','Ljudbolaget','Stora salen','Riv')
  ];
  var Q = function(title, dur, typ, plats, owner, tech){ return I({title:title, dur:dur, typ:typ, plats:plats, owner:owner, tech:tech}); };
  e1.items.korschema = [
    Q('Dörrarna öppnar, mingel',45,'Logistik','Foajén','Lasse','Bakgrundsmusik, spellista A'),
    Q('Välkomna, moderator inleder',15,'Scen','Scenen','Moderator','Headset, introfilm 90 s'),
    Q('Huvudtalare: Energi 2040',40,'Scen','Scenen','Kund','Presentation, klickare, timer'),
    Q('Paus och scenbyte',10,'Paus','Stora salen','Stina Berg','Fyra stolar in, bord ut'),
    Q('Panelsamtal',35,'Scen','Scenen','Moderator','Fyra handmikrofoner'),
    Q('Prisutdelning',20,'Scen','Scenen','Kund','Vinjett, följespot'),
    Q('Middag serveras',90,'Logistik','Stora salen','Lasse','Ljusbyte, spellista B'),
    Q('Linecheck bakom ridå',15,'Teknik','Scenen','Jonas Ek','Tyst linecheck'),
    Q('Liveband: Studio Nord',45,'Scen','Scenen','Lasse','Full ljussättning'),
    Q('Mingel och bar, DJ',75,'Logistik','Stora salen','Lasse','DJ-bord scen vänster')
  ];
  e1.items.korschema[2].comments = [C('Kund', 'Vår vd vill ha en nedräkningsklocka synlig från scenen.', 3, 'kund'), C('Daniel', 'Fixat, den står på golvmonitorn. @Stina Berg lägg in den i riggen.', 2)];

  var P = function(pid, role, call, start, end, plats, status, utskick){ var p = people.filter(function(x){ return x.id === pid; })[0]; return I({title:p.title + ', ' + role, person:pid, role:role, call:call, start:start, end:end, plats:plats, status:status, arvode:p.arvode, utskick:utskick}); };
  e1.items.personal = [
    P('p6','Rigg','06:45','07:00','12:00','Stora salen','Bekräftad','Bekräftat'),
    P('p3','Scentekniker','07:45','08:00','23:30','Scenen','Bekräftad','Bekräftat'),
    P('p4','Ljudtekniker','07:45','08:00','23:30','Scenen','Bekräftad','Öppnat'),
    P('p8','Fotograf','14:45','15:00','22:00','Hela lokalen','Bekräftad','Bekräftat'),
    P('p1','Värdinna entré','15:15','15:30','21:00','Entrén','Bekräftad','Bekräftat'),
    P('p2','Värd entré','15:15','15:30','21:00','Entrén','Tillfrågad','Skickat'),
    P('p5','Värdinna mingel','15:45','16:00','23:00','Foajén','Bekräftad','Öppnat'),
    P('p7','Garderob','15:45','16:00','23:30','Garderoben','Nekad','Bekräftat'),
    P('p1','Garderob','19:45','20:00','23:30','Garderoben','Tillfrågad','Inte skickat'),
    P('p6','Rivning','22:15','22:30','23:59','Stora salen','Tillfrågad','Skickat')
  ];
  e1.items.personal[7].comments = [C('Lasse', 'Noor kan inte. Jag har lagt Maja på garderoben från 20, men det krockar med entrén.', 1)];

  var L = function(title, kategori, kontakt, tel, status, belopp, fristIn, last){ return I({title:title, kategori:kategori, kontakt:kontakt, tel:tel, status:status, belopp:belopp, frist:iso(addDays(T0, fristIn)), last:last}); };
  e1.items.leverantorer = [
    L('Münchenbryggeriet','Lokal','Bokningen','08-000 00 21','Bekräftad',81000,2,'Tillträde 07:00'),
    L('Smak och Fest','Förtäring','Karin Holm','070-000 00 22','Bokad',279000,6,'14:00 lastkaj'),
    L('Ljudbolaget','Teknik','Jonas Ek','070-000 00 14','Bekräftad',95000,11,'Dagen före 14:00'),
    L('Möbelhyran','Möbler och scenografi','Per Lund','070-000 00 23','Bokad',42000,9,'Dagen före 15:00'),
    L('Blomsterverkstan','Dekor','Ida Frost','070-000 00 24','Offert',18000,3,'11:00 foajén'),
    L('Tryckhuset','Trycksaker','Order','08-000 00 25','Offert',31000,1,'Bud till lokalen'),
    L('Trygg Vakt','Säkerhet','Sam Öberg','070-000 00 26','Förfrågan',24000,4,'15:30 på plats')
  ];
  var A = function(title, status, gage, speltid, set, soundcheck, inlast, rider, loge, kontakt){ return I({title:title, status:status, gage:gage, speltid:speltid, set:set, soundcheck:soundcheck, inlast:inlast, rider:rider, loge:loge, kontakt:kontakt}); };
  e1.items.underhallning = [
    A('Studio Nord (liveband)','Bekräftad',48000,'20:35',45,'14:30','13:30','rider-studio-nord-v2.pdf','Loge 2, varm mat för 6, vatten, handdukar','Mika Strand, 070-000 00 31'),
    A('DJ Lova','Hold',12000,'21:20',75,'15:30','15:00','Eget bord 2 m, två monitorer','Loge 1, delas','Lova själv, 070-000 00 32'),
    A('Moderator: Petra Wall','Bekräftad',25000,'17:15',0,'13:00','12:45','Headset, talarstol ej önskad','Loge 1','Agentur Talarna, 08-000 00 33')
  ];
  var K = function(title, antal, kategori, lev, strom, tin, status){ return I({title:title, antal:antal, kategori:kategori, lev:lev, strom:strom, 'in':tin, status:status}); };
  e1.items.teknik = [
    K('PA-system, line array',1,'Ljud','Ljudbolaget','32 A','07:00','Bekräftad'),
    K('Handmikrofon trådlös',6,'Ljud','Ljudbolaget','','07:00','Bekräftad'),
    K('Headset',3,'Ljud','Ljudbolaget','','07:00','Packad'),
    K('LED-vägg 6 x 3 m',1,'Bild','Ljudbolaget','2 x 16 A','07:00','Bekräftad'),
    K('Golvmonitor med nedräkning',2,'Bild','Ljudbolaget','10 A','07:00','Beställd'),
    K('Rörligt ljus',16,'Ljus','Ljudbolaget','32 A','07:00','Bekräftad'),
    K('Följespot',1,'Ljus','Ljudbolaget','10 A','07:00','Beställd'),
    K('Scenpodier 8 x 4 m',1,'Scen','Möbelhyran','','Dagen före','På plats')
  ];
  var M = function(title, tid, antal, garanti, satt, plats, status){ return I({title:title, tid:tid, antal:antal, garanti:garanti, satt:satt, plats:plats, status:status}); };
  e1.items.fortaring = [
    M('Välkomstdryck och snittar','16:30',330,300,'Brickor, tre stationer','Foajén','Bekräftad'),
    M('Middag, två rätter','19:00',330,300,'Tallriksservering','Stora salen','Bekräftad'),
    M('Kaffe och sött','20:15',330,300,'Buffébord','Stora salen','Offert'),
    M('Bar, vin och alkoholfritt','16:30',330,0,'Två barer','Stora salen','Bekräftad'),
    M('Personalmat','14:30',22,22,'Buffé','Personalrummet','Utkast')
  ];
  var V = function(title, motpart, typ, status, startIn, slutIn, upps, pdf){ return I({title:title, motpart:motpart, typ:typ, status:status, start:iso(addDays(T0, startIn)), slut:iso(addDays(T0, slutIn)), uppsagning:upps, pdf:pdf}); };
  e1.items.avtal = [
    V('Uppdragsavtal Framtidsdagen','Nordlys Energi','Kund','Signerat',-80,46,'30 dagar','uppdragsavtal-nordlys.pdf'),
    V('Hyresavtal lokal','Münchenbryggeriet','Lokal','Signerat',-75,46,'Ej avbokningsbar','hyresavtal-lokal.pdf'),
    V('Cateringavtal','Smak och Fest','Leverantör','Skickat',-12,46,'Antal låses 10 dagar före','cateringavtal.pdf'),
    V('Artistavtal Studio Nord','Studio Nord','Artist','Signerat',-30,46,'Avbokning 50 % inom 14 dagar','artistavtal-studio-nord.pdf'),
    V('Artistavtal DJ Lova','DJ Lova','Artist','Utkast',0,46,'','artistavtal-dj-lova-utkast.pdf'),
    V('Uppdragsavtal fotograf','Hanna Roos','Personal','Signerat',-20,46,'','uppdragsavtal-hanna-roos.pdf'),
    V('Ramavtal värdpersonal','Maja Lind','Personal','Signerat',-343,22,'Löper ut, förnya','ramavtal-maja-lind.pdf')
  ];
  e1.items.ritningar = [
    I({title:'Stora salen, möblering', version:'v3', kind:'sal', status:'På granskning', pins:[
      {id:'n1', x:50, y:16, text:'Scenen flyttad 1 m framåt för att få plats med LED-väggen.', who:'Daniel', vis:'kund', done:true},
      {id:'n2', x:93, y:33, text:'Baren står nära nödutgången. Kolla med lokalen.', who:'Lasse', vis:'intern', done:false},
      {id:'n3', x:24, y:44, text:'Kan vi ha ledningsgruppen vid bord 7 och 8, närmast scenen?', who:'Kund', vis:'kund', done:false}
    ]}),
    I({title:'Foajé och entré', version:'v1', kind:'foaje', status:'Utkast', pins:[
      {id:'n4', x:24, y:70, text:'Två incheckningsdiskar, en för förhandsanmälda.', who:'Lasse', vis:'intern', done:false}
    ]})
  ];
  var B = function(typ, title, a, b, kind){ return I({typ:typ, title:title, c1:a, c2:b, kind:kind}); };
  e1.items.moodboard = [
    B('Bild','Scen i varmt motljus','#1f2a44','#f2a65a','ljus'),
    B('Färg','Midnattsblå','#1f2a44'),
    B('Anteckning','Känslan: nordiskt ljus, lugn optimism. Inte tech-mässa.'),
    B('Bild','Runda bord, linne, låga blommor','#e9e2d6','#7c8f6a','bord'),
    B('Färg','Gryningsorange','#f2a65a'),
    B('Bild','Ljusinstallation i foajén','#0f1720','#9ad1d4','linjer'),
    B('Färg','Sandbeige','#e9e2d6'),
    B('Anteckning','Typografi på skyltar: stor, luftig, vit på mörkblå.'),
    B('Bild','Scenografi: horisontlinje','#2d3f63','#f6d6ad','scen'),
    B('Färg','Mossgrön','#7c8f6a')
  ];
  e1.items.moodboard[0].comments = [C('Kund', 'Precis den här känslan. Kan vi få samma ljus vid prisutdelningen?', 4, 'kund')];
  e1.lokal.facts = [
    ['Grund','Adress','Torkel Knutssonsgatan 2, Stockholm'],['Grund','Tillträde','07:00 eventdagen, lastning dagen före 14 till 18'],['Grund','Sluttid','01:00, tömt 02:00'],
    ['Kapacitet','Sittande middag','420'],['Kapacitet','Biosittning','700'],['Kapacitet','Stående mingel','900'],['Kapacitet','Yta','640 kvm, 32 x 20 m'],['Kapacitet','Takhöjd','6,2 m'],
    ['Teknik och el','El','2 x 63 A, 4 x 32 A, 8 x 16 A'],['Teknik och el','Riggpunkter','12 punkter, 250 kg per punkt'],['Teknik och el','Nät','Fiber 1 Gbit, eget wifi för produktion'],['Teknik och el','Husets teknik','Grundljus, ingen PA'],
    ['Logistik','Lastkaj','Baksidan, port 2,4 x 2,8 m, ramp'],['Logistik','Hiss','Varuhiss 2 000 kg'],['Logistik','Parkering','Två platser för produktion, övriga i garage'],['Logistik','Loger','Två loger med dusch'],
    ['Regler','Ljudgräns','100 dB, mätning vid mixerplats'],['Regler','Levande ljus','Endast i lykta'],['Regler','Leverantörer','Egen catering tillåten mot avgift'],['Regler','Rök och pyro','Kräver tillstånd 14 dagar före'],
    ['Kontakt','Platsansvarig','Lena Holm, 070-000 00 41'],['Kontakt','Vaktmästare','Kvällsjour 070-000 00 42'],['Kontakt','Akutmottagning','Södersjukhuset, 2 km']
  ];
  e1.lokal.comments = [C('Lasse', 'Rampen till lastkajen är brant. Möbelhyran behöver ta den mindre bilen.', 5)];
  e1.risks = ['Cateringen har inte fått slutligt antal.', 'Två talare har inte skickat presentation.', 'Garderoben saknar bekräftad personal.'];

  var e2 = newEvent('e2', 'Premiärkväll Vinterljus', 'Aurora Films', 'kundevent', iso(addDays(T0, 37)), 'Bio Skandia', 180, 1, .35);
  e2.osa = {ja:64, nej:9}; e2.osaUrl = 'vinterljus.exempel.se';
  var e3 = newEvent('e3', 'Lansering Ljus Lager', 'Kvarnen Bryggeri', 'kundevent', iso(addDays(T0, 72)), 'Kvarnen, Södermalm', 120, 0, .1);
  var e4 = newEvent('e4', 'Nordiska HR-mässan', 'Peoplewise', 'massa', iso(addDays(T0, 110)), 'Stockholmsmässan', 1000, 0, 0);
  return {v:1, role:'byra', theme:'', people:people, events:[e1, e2, e3, e4], time:seedTime()};
}
