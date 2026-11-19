const CATS={Casa:30,Bollette:8,Macchina:10,Cibo:15,Vacanze:8,Regali:4,Telefono:3};
const COL={Casa:"#a8e8f6",Macchina:"#5ec5dc",Cibo:"#3aa0b8",Telefono:"#2f7f93",Bollette:"#7f9ba6",Vacanze:"#5b707a",Regali:"#3d4d55"};
const KEY="spese-dashboard-v1";
let S={salary:0,pct:{...CATS},items:[]};
try{const r=localStorage.getItem(KEY);if(r){const p=JSON.parse(r);S={...S,...p,pct:{...CATS,...(p.pct||{})}}}}catch(e){}
S.items.forEach(i=>{i.c={Spesa:"Cibo",Trasporti:"Macchina"}[i.c]||i.c});
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const eur=n=>new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n);
const eur2=n=>new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR"}).format(n);
const esc=s=>s.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const $=id=>document.getElementById(id);
const mk=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");
const sum=(m,f)=>S.items.filter(i=>i.m===m&&(!f||f(i))).reduce((t,i)=>t+i.a,0);
const MN=new Intl.DateTimeFormat("it-IT",{month:"short"});
$("month").value=mk(new Date());
$("c").innerHTML=Object.keys(CATS).map(c=>`<option>${c}</option>`).join("");
$("salary").value=S.salary||"";
let view="home",editId=null;
function ord(){const k=Object.keys(CATS),o=(S.order||[]).filter(c=>k.includes(c));return o.concat(k.filter(c=>!o.includes(c)))}
const MODES=[["eur","€"],["pct","% stipendio"],["rest","% del resto"]];
if(!S.lim){S.lim={};save()}
Object.keys(CATS).forEach(c=>{if(!S.lim[c])S.lim[c]={t:"pct",v:0}});
function limOf(c,sal){const L=S.lim[c],base=x=>x.t==="eur"?x.v:x.t==="pct"?sal*x.v/100:0;
  if(L.t!=="rest")return base(L);
  const fixed=Object.keys(CATS).reduce((t,k)=>t+base(S.lim[k]),0);return Math.max(0,sal-fixed)*L.v/100}
if(!S.limV2){const nv={};Object.keys(CATS).forEach(c=>nv[c]=Math.round(limOf(c,S.salary||0)*100)/100);Object.keys(CATS).forEach(c=>S.lim[c]={t:"eur",v:nv[c]});S.limV2=true;save()}
function editRow(i){return `<li class="row ed"><input data-f="d" value="${esc(i.d)}" aria-label="Descrizione"><input data-f="a" type="number" min="0" step="0.01" value="${i.a}" aria-label="Importo"><select data-f="c" aria-label="Categoria">${Object.keys(CATS).map(c=>`<option${c===i.c?" selected":""}>${c}</option>`).join("")}</select><span class="acts"><button class="mini main" data-save="${i.id}">Salva</button><button class="mini" data-cancel="1">Annulla</button></span></li>`}
const addM=(m,n)=>{const [y,o]=m.split("-").map(Number);return mk(new Date(y,o-1+n,1))};
const ml=m=>{const [y,o]=m.split("-").map(Number);return new Intl.DateTimeFormat("it-IT",{month:"short",year:"numeric"}).format(new Date(y,o-1,1))};
if(!Array.isArray(S.rec))S.rec=[];
function ensureRec(){
  const now=mk(new Date()),sel=$("month").value||now,hz=addM(sel>now?sel:now,12);let ch=false;
  S.rec.forEach(r=>{for(let m=r.from;m<=hz&&(!r.to||m<=r.to);m=addM(m,1)){
    if((r.skip||[]).includes(m)||S.items.some(i=>i.rid===r.id&&i.m===m))continue;
    S.items.push({id:r.id+"_"+m,m,d:r.d,a:r.a,c:r.c,s:"plan",rid:r.id});ch=true}});
  if(ch)save()}
function renderRec(){
  const rhtml=S.rec.length?S.rec.map(r=>`<li class="row"><span>${esc(r.d)}</span><span class="amt">${eur2(r.a)}/mese</span><span class="acts"><button class="mini ic" data-redit="${r.id}" aria-label="Modifica ${esc(r.d)}" title="Modifica">${IC_EDIT}</button><button class="mini ic del" data-rdel="${r.id}" aria-label="Elimina ${esc(r.d)}" title="Elimina">${IC_DEL}</button></span><small>${r.c}, dal ${ml(r.from)} ${r.to?"al "+ml(r.to):"senza scadenza"}</small></li>`).join(""):'<li class="empty">Nessuna spesa ricorrente.</li>';
  $("rec2").innerHTML=rhtml;renderInc()}
function renderInc(){
  const ks=Object.keys(S.sals).sort(),last=ks[ks.length-1];
  $("rinc").innerHTML='<li class="row"><span>Stipendio netto</span><span class="amt">'+(ks.length?eur2(S.sals[last])+'/mese':'–')+'</span><span class="acts"><button class="mini ic" data-view="entrate" aria-label="Modifica gli stipendi" title="Modifica">'+IC_EDIT+'</button></span><small>'+(ks.length?'Ultimo importo inserito: '+mLong(last).toLowerCase():'Nessuno stipendio inserito: impostalo mese per mese')+'</small></li>'}
const MOPT=Array.from({length:60},(_,i)=>{const d=new Date(2026,i,1),n=new Intl.DateTimeFormat("it-IT",{month:"long",year:"numeric"}).format(d);return `<option value="${mk(d)}">${n[0].toUpperCase()+n.slice(1)}</option>`}).join("");
const IC_DEL='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/><path d="M10 11v6M14 11v6"/></svg>';
const IC_EDIT='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>';
const IC_UP='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>';
const IC_DN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
function applyCol(){
  [["exp","list","le spese del mese"]].forEach(([k,id,n])=>{
    const c=!!(S.col&&S.col[k]),b=document.querySelector('[data-col="'+k+'"]');
    $(id).hidden=c;b.innerHTML=c?IC_DN:IC_UP;b.setAttribute("aria-expanded",!c);
    b.setAttribute("aria-label",(c?"Espandi ":"Comprimi ")+n);b.title=c?"Espandi":"Comprimi"})}
function renderCnt(){const m=$("month").value;$("rcnt2").textContent=S.rec.length;$("ecnt").textContent=S.items.filter(i=>i.m===m).length}
applyCol();
function setExpOpen(o){$("f").hidden=!o;const b=$("etg");b.textContent=o?"−":"+";b.setAttribute("aria-expanded",o);b.setAttribute("aria-label",o?"Chiudi senza aggiungere":"Aggiungi spesa");if(o){$("d").focus()}else{$("f").reset()}}
let modal=null;
function closeModal(){$("mod").hidden=true;modal=null;ne=null;am=null;$("mbody").innerHTML="";document.querySelector(".mbox").classList.remove("sheet")}
function openModal(kind,id){
  const r=kind==="edit-rec"?S.rec.find(x=>x.id===id):kind==="edit-exp"?S.items.find(i=>i.id==id):null,isRec=kind==="new-rec"||kind==="edit-rec";
  if(kind.startsWith("edit")&&!r)return;
  modal={kind,id};
  const cats=Object.keys(CATS).map(c=>`<option${r&&r.c===c?" selected":""}>${c}</option>`).join("");
  $("mt").textContent={"new-exp":"Nuova spesa del mese","new-rec":"Nuova spesa ricorrente","edit-rec":"Modifica spesa ricorrente","edit-exp":"Modifica spesa"}[kind];
  $("mbody").innerHTML=`<form id="mf" class="mf"><input data-f="d" class="full" placeholder="Descrizione (es. Affitto)" required value="${r?esc(r.d):""}" aria-label="Descrizione"><input data-f="a" type="number" min="0" step="0.01" inputmode="decimal" placeholder="Importo €" required value="${r?r.a:""}" aria-label="Importo"><select data-f="c" aria-label="Categoria">${cats}</select>`+(isRec?`<label>Dal mese<select data-f="from">${MOPT}</select></label><label>Fino al mese (facoltativo)<select data-f="to"><option value="">Senza scadenza</option>${MOPT}</select></label>`:`<select data-f="s" class="full" aria-label="Stato"><option value="paid"${r&&r.s==="paid"?" selected":""}>Pagata</option><option value="plan"${r&&r.s==="plan"?" selected":""}>Preventivata</option></select>`)+`<div class="err full" id="merr" role="alert"></div><div class="macts full"><button type="button" class="mini" data-mclose>Annulla</button><button class="main" type="submit">${kind.startsWith("edit")?"Salva modifiche":kind==="new-rec"?"Aggiungi ricorrente":"Aggiungi spesa"}</button></div></form>`;
  if(isRec){const f=$("mf");f.querySelector('[data-f="from"]').value=r?r.from:mk(new Date());f.querySelector('[data-f="to"]').value=r?(r.to||""):""}
  $("mod").hidden=false;$("mbody").querySelector("input").focus()}
function openConfirm(kind,id){
  const rec=kind==="del-rec",x=rec?S.rec.find(r=>r.id===id):S.items.find(i=>i.id==id);
  if(!x)return;
  modal={kind,id};
  $("mt").textContent=rec?"Eliminare la spesa ricorrente?":"Eliminare la spesa?";
  $("mbody").innerHTML=`<p class="mtxt">Stai per eliminare <b>${esc(x.d)}</b> (${eur2(x.a)}${rec?" al mese":""}). ${rec?"Le rate preventivate non ancora pagate verranno eliminate, quelle già pagate restano.":"L’operazione non si può annullare."}</p><div class="macts"><button type="button" class="mini" data-mclose>Annulla</button><button type="button" class="mini danger" data-mdel="1">Elimina</button></div>`;
  $("mod").hidden=false;$("mbody").querySelector("button").focus()}
document.addEventListener("submit",e=>{
  if(e.target.id!=="mf"||!modal)return;e.preventDefault();
  const q=k=>e.target.querySelector('[data-f="'+k+'"]'),v=k=>q(k).value;
  const a=parseFloat(v("a")),d=v("d").trim();if(!d||!(a>=0))return;if(!(a<=1e7)){$("merr").textContent="Importo troppo alto: il massimo è 10.000.000 €";return}
  if(modal.kind==="new-exp"){S.items.push({id:Date.now(),m:$("month").value,d,a,c:v("c"),s:v("s")})}
  else if(modal.kind==="edit-exp"){const it=S.items.find(i=>i.id==modal.id);if(!it)return;Object.assign(it,{d,a,c:v("c"),s:v("s")})}
  else{const from=v("from"),to=v("to");
    if(to&&to<from){$("merr").textContent="Il mese finale deve essere uguale o successivo a quello iniziale";return}
    if(modal.kind==="new-rec"){S.rec.push({id:"r"+Date.now(),d,a,c:v("c"),from,to})}
    else{const r=S.rec.find(x=>x.id===modal.id);if(!r)return;Object.assign(r,{d,a,c:v("c"),from,to,skip:[]});S.items=S.items.filter(i=>!(i.rid===r.id&&i.s==="plan"))}
    ensureRec()}
  save();closeModal();render()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("mod").hidden)closeModal()});
document.addEventListener("keydown",e=>{const c=e.target.closest&&e.target.closest(".kc[data-view]");if(c&&(e.key==="Enter"||e.key===" ")){e.preventDefault();show(c.dataset.view)}});
function openExport(){
  modal={kind:"export"};
  $("mt").textContent="Esporta backup";
  $("mbody").innerHTML=`<p class="mtxt">Questo testo contiene tutte le tue spese, i tuoi stipendi e i tuoi budget. Conservalo in un posto sicuro: copialo (per esempio nelle note del telefono) oppure scaricalo come file.</p><textarea id="exa" class="mta" readonly></textarea><div class="macts"><button type="button" class="mini" data-mclose>Chiudi</button><button type="button" class="mini" data-excopy="1">Copia</button><button type="button" class="main" data-exdl="1">Scarica file</button></div>`;
  $("exa").value=JSON.stringify({app:"spese-dashboard",v:1,data:S},null,1);
  $("mod").hidden=false}
function openImport(){
  modal={kind:"import"};
  $("mt").textContent="Importa backup";
  $("mbody").innerHTML=`<p class="mtxt">Incolla il testo del backup oppure scegli il file. I dati attuali verranno sostituiti da quelli del backup.</p><textarea id="ima" class="mta" placeholder="Incolla qui il backup"></textarea><input type="file" id="imf" accept=".json,application/json" aria-label="Scegli il file di backup" style="margin-top:8px"><div class="err" id="merr" role="alert"></div><div class="macts"><button type="button" class="mini" data-mclose>Annulla</button><button type="button" class="main" data-imgo="1">Importa</button></div>`;
  $("imf").addEventListener("change",e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{$("ima").value=String(r.result)};r.readAsText(f)});
  $("mod").hidden=false;$("ima").focus()}
function cleanImport(d){
  if(d&&d.data)d=d.data;
  if(!d||typeof d!=="object"||!Array.isArray(d.items))return null;
  const ok=/^\d{4}-\d{2}$/,cl=x=>String(x).replace(/[<>&"]/g,"");
  const items=d.items.filter(i=>i&&i.id!==undefined&&typeof i.d==="string"&&typeof i.c==="string"&&typeof i.a==="number"&&typeof i.m==="string"&&ok.test(i.m)).map(i=>({...i,d:cl(i.d),c:cl(i.c),s:i.s==="paid"?"paid":"plan",dt:/^\d{4}-\d{2}-\d{2}$/.test(i.dt)?i.dt:undefined}));
  const rec=(Array.isArray(d.rec)?d.rec:[]).filter(r=>r&&typeof r.id==="string"&&typeof r.d==="string"&&typeof r.c==="string"&&typeof r.a==="number"&&typeof r.from==="string"&&ok.test(r.from)&&(!r.to||ok.test(r.to))).map(r=>({...r,id:cl(r.id),d:cl(r.d),c:cl(r.c)}));
  const sals={};if(d.sals&&typeof d.sals==="object")Object.keys(d.sals).forEach(k=>{if(ok.test(k)&&typeof d.sals[k]==="number")sals[k]=d.sals[k]});
  const lim={};if(d.lim&&typeof d.lim==="object")Object.keys(d.lim).forEach(k=>{const L=d.lim[k];if(L&&["eur","pct","rest"].includes(L.t)&&typeof L.v==="number")lim[cl(k)]=L});
  return {salary:typeof d.salary==="number"?d.salary:0,pct:{...CATS},items,rec,sals,lim,name:typeof d.name==="string"?d.name.replace(/[<>&"]/g,"").slice(0,30):"",hide:d.hide===true,order:(Array.isArray(d.order)?d.order.map(cl):[]),col:{rec:!!(d.col&&d.col.rec),exp:!!(d.col&&d.col.exp)},recSeeded:true,recSeeded2:true,limV2:d.limV2===true}}
function doImport(){
  let d;try{d=JSON.parse($("ima").value)}catch(e){$("merr").textContent="Il testo non è un backup valido.";return}
  const c=cleanImport(d);if(!c){$("merr").textContent="Il backup non contiene dati riconoscibili.";return}
  S=c;save();location.reload()}
function openFail(){
  if(modal&&modal.kind==="fail")return;
  modal={kind:"fail"};
  $("mt").textContent="Qualcosa non ha funzionato";
  $("mbody").innerHTML=`<p class="mtxt">L’app ha trovato un errore. I tuoi dati sono ancora salvati su questo dispositivo. Prova a ricaricare. Se l’errore si ripete, puoi esportare un backup oppure reimpostare l’app, cancellando tutti i dati.</p><div class="macts"><button type="button" class="mini" data-reload="1">Ricarica</button><button type="button" class="mini" data-exp="1">Esporta backup</button><button type="button" class="mini danger" data-reset="1">Reimposta</button></div>`;
  $("mod").hidden=false}
addEventListener("error",e=>{const m=(e&&e.message)||"";if(/ResizeObserver|Script error/i.test(m))return;openFail()});
const NPAD=n=>String(n).padStart(2,"0"),NYMD=d=>d.getFullYear()+"-"+NPAD(d.getMonth()+1)+"-"+NPAD(d.getDate());
function dl(d){const x=new Date(+d.slice(0,4),+d.slice(5,7)-1,+d.slice(8,10));return isNaN(x)?"":new Intl.DateTimeFormat("it-IT",{day:"numeric",month:"short"}).format(x)}
const KW={
 Cibo:["pizza","spesa","supermercato","ristorante","trattoria","pranzo","cena","colazione"," bar ","caffè","caffe","cornetto","panino","gelato","sushi","kebab","aperitivo","birra","vino","pane","panetteria","macelleria","pescheria","frutta","verdura","coop","conad","esselunga","carrefour","lidl","eurospin","mcdonald","burger","cibo","fast food","glovo","deliveroo","just eat","pasticceria","dolci"],
 Casa:["affitto","mutuo","condominio"," casa ","mobili","ikea","arredo","lavatrice","frigorifero","idraulico","elettricista","pulizie","ristruttur","leroy","brico","fastweb","internet","fibra","wifi"],
 Bollette:["bolletta","luce","gas ","acqua","rifiuti","tari","enel","a2a","hera","canone rai"],
 Macchina:["benzina","diesel","carburante","gasolio","metano","gpl","bollo","assicurazione","rca","meccanico","tagliando","gomme","pneumatici","revisione","parcheggio","pedaggio","autostrada","telepass","autolavaggio","macchina"," auto ","officina","ricarica auto"],
 Vacanze:["hotel","albergo","volo","aereo","viaggio","vacanza","airbnb","booking","b&b","resort","crociera","traghetto","escursione","biglietto","treno","ryanair","easyjet","campeggio"],
 Regali:["regalo","compleanno","fiori","natale","anniversario","laurea","matrimonio","bomboniera","regalare"],
 Telefono:["telefono","cellulare","smartphone","iphone","samsung","ricarica","sim ","vodafone"," tim ","iliad","telefonia","cover","caricabatterie","fastweb mobile"]};
function suggestCat(t){const x=" "+t.toLowerCase()+" ";let best=null,bl=0;Object.keys(KW).forEach(c=>{if(CATS[c]===undefined)return;KW[c].forEach(k=>{if(x.includes(k)&&k.length>bl){best=c;bl=k.length}})});return best}
const CI={
 Casa:'<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
 Bollette:'<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
 Macchina:'<path d="M5 17H3v-5l2-5h14l2 5v5h-2"/><circle cx="7.5" cy="17" r="1.8"/><circle cx="16.5" cy="17" r="1.8"/><path d="M3 12h18"/>',
 Cibo:'<path d="M6 3v6a2 2 0 004 0V3"/><path d="M8 11v10"/><path d="M17 21V3c-2.5 1.2-4 4-4 8h4"/>',
 Vacanze:'<path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
 Regali:'<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 010-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 010 5"/>',
 Telefono:'<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>'};
const SVGO='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
function catIcon(c){return SVGO+(CI[c]||'<path d="M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L3 13V3h10l7.6 7.6a2 2 0 010 2.8z"/><circle cx="7.5" cy="7.5" r="1"/>')+'</svg>'}
const IC_OK=SVGO+'<path d="M5 12l5 5L20 7"/></svg>',IC_BK=SVGO+'<path d="M21 5H9l-6 7 6 7h12a1 1 0 001-1V6a1 1 0 00-1-1z"/><path d="M12 9l6 6M18 9l-6 6"/></svg>';
let ne=null;
function neVal(){return parseFloat((ne.amt||"0").replace(",","."))||0}
function neDate(){const t=new Date();if(ne.dm==="yest")t.setDate(t.getDate()-1);if(ne.dm==="pick")return $("ndd").value||NYMD(new Date());return NYMD(t)}
function neUpdate(){
  $("nval").textContent=ne.amt||"0,00";$("nval").classList.toggle("dim",!ne.amt);
  let ok=!!($("nd").value.trim()&&neVal()>0);
  if(ne.rec){const f=$("nfrom").value,t=$("nto").value,bad=!!t&&t<f;$("nerr").textContent=bad?"Il mese finale deve essere uguale o successivo a quello iniziale":"";ok=ok&&!bad}
  else ok=ok&&(ne.dm!=="pick"||!!$("ndd").value);
  $("nsave").disabled=!ok;
  document.querySelectorAll("[data-nm]").forEach(b=>b.classList.toggle("on",b.dataset.nm===ne.dm));
  document.querySelectorAll("[data-ns]").forEach(b=>b.classList.toggle("on",b.dataset.ns===ne.st));
  document.querySelectorAll("[data-nc]").forEach(b=>b.classList.toggle("on",b.dataset.nc===ne.cat));
  if(!ne.rec)$("ndd").hidden=ne.dm!=="pick";
  $("nci").innerHTML=catIcon(ne.cat);$("ncn").textContent=ne.cat;$("ncl").textContent=ne.sug?"Categoria suggerita:":"Categoria:"}
function neDesc(){
  if(!ne.manual){const g=suggestCat($("nd").value);
    if(g){ne.cat=g;ne.sug=true}else{ne.cat=(S.lastCat&&CATS[S.lastCat]!==undefined)?S.lastCat:ord()[0];ne.sug=false}}
  neUpdate()}
function nePress(k){
  let a=ne.amt;
  if(k==="bk")a=a.slice(0,-1);
  else if(k===","){if(!a)a="0,";else if(!a.includes(","))a+=","}
  else if(a.includes(",")){if(a.split(",")[1].length<2)a+=k}
  else if(a==="0")a=k;
  else if(a.length<7)a+=k;
  ne.amt=a;neUpdate()}
function neSave(){
  const d=$("nd").value.trim(),a=neVal();if(!d||!(a>0))return;
  if(ne.rec){const from=$("nfrom").value,to=$("nto").value;if(to&&to<from)return;S.rec.push({id:"r"+Date.now(),d,a,c:ne.cat,from,to});S.lastCat=ne.cat;ensureRec();save();closeModal();render();return}
  const dt=neDate(),m=dt.slice(0,7);
  S.items.push({id:Date.now(),m,dt,d,a,c:ne.cat,s:ne.st});
  S.lastCat=ne.cat;
  if(m!==$("month").value){$("month").value=m;syncSal();ensureRec()}
  save();closeModal();render()}
function openNewExp(rec){
  const cur=mk(new Date()),vm=$("month").value;
  ne={amt:"",cat:(S.lastCat&&CATS[S.lastCat]!==undefined)?S.lastCat:ord()[0],sug:false,manual:false,st:"paid",dm:vm===cur?"today":"pick",rec:!!rec};
  modal={kind:"new-exp-sheet"};
  document.querySelector(".mbox").classList.add("sheet");
  $("mt").textContent=rec?"Nuova spesa ricorrente":"Nuova spesa";
  $("mbody").innerHTML=`<div class="ns"><label class="nf"><span>Spesa</span><input id="nd" class="ninp" placeholder="Es. Pizza" autocomplete="off" maxlength="60"></label>${rec?`<div class="nper"><label>Dal mese<select id="nfrom" class="ninp">${MOPT}</select></label><label>Fino al mese<select id="nto" class="ninp"><option value="">Senza scadenza</option>${MOPT}</select></label><div class="err" id="nerr" role="alert"></div></div>`:`<div class="seg" role="group" aria-label="Data della spesa"><button type="button" data-nm="today">Oggi</button><button type="button" data-nm="yest">Ieri</button><button type="button" data-nm="pick">Scegli data</button></div><input type="date" id="ndd" class="ninp" min="2026-01-01" max="2035-12-31" aria-label="Data della spesa" hidden><div class="seg" role="group" aria-label="Stato della spesa"><button type="button" data-ns="paid">Pagata</button><button type="button" data-ns="plan">Preventivata</button></div>`}<div class="ncat"><span class="nci" id="nci"></span><div class="nct"><small id="ncl"></small><b id="ncn"></b></div><button type="button" class="ned" data-ncedit="1" aria-label="Cambia categoria">${IC_EDIT}</button></div><div class="nchips" id="nchips" hidden>${ord().map(c=>`<button type="button" data-nc="${c}">${catIcon(c)}${c}</button>`).join("")}</div><div class="namt"><span>${rec?"Importo mensile":"Importo"}</span><div class="nvv"><i>€</i><b id="nval"></b></div></div><div class="kpad">${["1","2","3","4","5","6","7","8","9",",","0","bk"].map(k=>`<button type="button" data-k="${k}"${k==="bk"?' aria-label="Cancella"':""}>${k==="bk"?IC_BK:k}</button>`).join("")}</div><button type="button" class="nsave" id="nsave" data-nsave="1" disabled><span>Salva spesa</span>${IC_OK}</button></div>`;
  if(rec)$("nfrom").value=cur;else $("ndd").value=vm===cur?NYMD(new Date()):(vm<"2026-01"?"2026-01":vm)+"-01";
  $("nd").addEventListener("input",neDesc);if(rec){$("nfrom").addEventListener("change",neUpdate);$("nto").addEventListener("change",neUpdate)}else $("ndd").addEventListener("input",neUpdate);
  $("mod").hidden=false;neUpdate();
  if(!matchMedia("(pointer:coarse)").matches)$("nd").focus()}
document.addEventListener("keydown",e=>{
  if(!modal||modal.kind!=="new-exp-sheet"||!ne)return;
  const g=e.target;if(g&&(g.id==="nd"||g.id==="ndd"||g.tagName==="SELECT"))return;
  if(/^[0-9]$/.test(e.key)){nePress(e.key);e.preventDefault()}
  else if(e.key===","||e.key==="."){nePress(",");e.preventDefault()}
  else if(e.key==="Backspace"){nePress("bk");e.preventDefault()}});
let am=null;
function amtNext(a,k){
  if(k==="bk")return a.slice(0,-1);
  if(k===",")return !a?"0,":(a.includes(",")?a:a+",");
  if(a.includes(","))return a.split(",")[1].length<2?a+k:a;
  if(a==="0")return k;
  return a.length<7?a+k:a}
function amUpdate(){$("amval").textContent=am.amt||"0,00";$("amval").classList.toggle("dim",!am.amt)}
function amPress(k){am.amt=amtNext(am.amt,k);amUpdate()}
function openAmount(title,label,val,max,cb){
  modal={kind:"amount-sheet"};
  am={amt:(val===undefined||val===null||val==="")?"":String(val).replace(".",","),max,cb};
  document.querySelector(".mbox").classList.add("sheet");
  $("mt").textContent=title;
  $("mbody").innerHTML=`<div class="ns"><div class="namt"><span>${label}</span><div class="nvv"><i>€</i><b id="amval"></b></div></div><div class="kpad">${["1","2","3","4","5","6","7","8","9",",","0","bk"].map(k=>`<button type="button" data-ak="${k}"${k==="bk"?' aria-label="Cancella"':""}>${k==="bk"?IC_BK:k}</button>`).join("")}</div><button type="button" class="nsave" data-amok="1"><span>Conferma</span>${IC_OK}</button></div>`;
  $("mod").hidden=false;amUpdate()}
function amDone(){const v=am.amt?Math.min(parseFloat(am.amt.replace(",",".")),am.max):null,cb=am.cb;closeModal();cb(isNaN(v)?null:v)}
function mLong(k){const n=new Intl.DateTimeFormat("it-IT",{month:"long",year:"numeric"}).format(new Date(+k.slice(0,4),+k.slice(5,7)-1,1));return n[0].toUpperCase()+n.slice(1)}
function openSalAmt(k){openAmount("Stipendio di "+mLong(k).toLowerCase(),"Stipendio netto",S.sals[k],1e6,v=>{if(v===null)delete S.sals[k];else S.sals[k]=v;save();updPh();render();const el=document.querySelector('[data-sm="'+k+'"]');if(el)el.value=v===null?"":v})}
function openBudAmt(c){const cur=Math.round(limOf(c,salOf($("month").value))*100)/100;openAmount("Budget "+c,"Budget mensile",cur||undefined,1e6,v=>{S.lim[c]={t:"eur",v:v===null?0:v};save();render()})}
document.addEventListener("keydown",e=>{
  if(!modal||modal.kind!=="amount-sheet"||!am)return;
  if(/^[0-9]$/.test(e.key)){amPress(e.key);e.preventDefault()}
  else if(e.key===","||e.key==="."){amPress(",");e.preventDefault()}
  else if(e.key==="Backspace"){amPress("bk");e.preventDefault()}
  else if(e.key==="Enter"&&e.target.tagName!=="BUTTON"){amDone();e.preventDefault()}});
const IC_BELL=SVGO+'<path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/></svg>';
const IC_EYE=SVGO+'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const IC_EYEOFF=SVGO+'<path d="M3 3l18 18"/><path d="M10.6 5.1A9.7 9.7 0 0112 5c6.4 0 10 7 10 7a17 17 0 01-3.2 4.1M6.6 6.6A17 17 0 002 12s3.6 7 10 7a9.6 9.6 0 004.4-1.1"/><path d="M9.9 9.9a3 3 0 004.2 4.2"/></svg>';
const IC_WALLET=SVGO+'<path d="M3 7a2 2 0 012-2h13v4"/><path d="M3 7v11a2 2 0 002 2h15a1 1 0 001-1v-8a1 1 0 00-1-1H5a2 2 0 01-2-2"/><circle cx="16.5" cy="14.5" r="1"/></svg>';
const IC_SPARK=SVGO+'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></svg>';
const IC_WARN=SVGO+'<path d="M12 3l10 18H2z"/><path d="M12 10v5"/><path d="M12 18h.01"/></svg>';
const IC_ARDN=SVGO+'<path d="M12 4v14"/><path d="M6 12l6 6 6-6"/></svg>',IC_ARUP=SVGO+'<path d="M12 20V6"/><path d="M6 12l6-6 6 6"/></svg>',IC_REP=SVGO+'<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 013-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 01-3 3H3"/></svg>',IC_CHEV=SVGO+'<path d="M9 6l6 6-6 6"/></svg>';
$("rmin").innerHTML=IC_ARDN;$("rmout").innerHTML=IC_ARUP;$("rmrec").innerHTML=IC_REP;$("rmch").innerHTML=IC_CHEV;
$("tpbell").insertAdjacentHTML("afterbegin",IC_BELL);$("tpic").innerHTML=IC_WALLET;$("tphs").innerHTML=IC_SPARK;
function buildNotes(){
  const m=$("month").value,now=mk(new Date()),sal=salOf(m),out=[];
  if(S.sals[m]===undefined&&m<=now)out.push({t:"warn",x:"Non hai ancora inserito lo stipendio di "+mLong(m).toLowerCase()+"."});
  const pn=S.items.filter(i=>i.m===m&&i.s==="plan").length;
  if(pn)out.push({t:"info",x:"Hai "+pn+(pn===1?" spesa preventivata":" spese preventivate")+" ancora da pagare ("+eur2(sum(m,i=>i.s==="plan"))+")."});
  Object.keys(CATS).forEach(c=>{const lim=limOf(c,sal),t=sum(m,i=>i.c===c);
    if(lim>0){if(t>lim)out.push({t:"bad",x:"Hai superato il budget "+c+" di "+eur2(t-lim)+"."});else if(t>=lim*.9)out.push({t:"warn",x:c+": hai usato il "+Math.round(t/lim*100)+"% del budget."})}});
  if(sal>0&&sum(m)>sal)out.push({t:"bad",x:"Le uscite del mese superano lo stipendio."});
  return out}
function renderTop(){
  const m=$("month").value,sal=salOf(m),tot=sum(m),free=sal-tot;
  const keys=new Set(Object.keys(S.sals).concat(S.items.map(i=>i.m)));let bal=0;
  keys.forEach(k=>{if(k<=m)bal+=salOf(k)-sum(k,i=>i.s==="paid")});
  $("tpgh").innerHTML=S.name?'Ciao, <button type="button" class="nmb" data-name="1">'+esc(S.name)+'</button>':'Ciao <button type="button" class="nmb ghost" data-name="1">aggiungi il tuo nome</button>';
  $("tpbal").textContent=S.hide?"•••• €":eur2(bal);
  $("tpeye").innerHTML=S.hide?IC_EYEOFF:IC_EYE;$("tpeye").setAttribute("aria-label",S.hide?"Mostra il saldo":"Nascondi il saldo");
  const pct=sal>0?Math.round(tot/sal*100):null;
  $("tpbd").textContent=pct===null?"–":pct+"% usato";
  $("tpav").textContent=eur2(free);$("tpav").classList.toggle("dn",free<0);
  $("tplim").textContent=sal>0?eur2(sal):"–";
  const f=$("tpfill");f.style.width=Math.min(100,pct||0)+"%";f.classList.toggle("over",pct!==null&&pct>100);
  const st=$("tpst"),bad=sal>0&&tot>sal;
  st.classList.toggle("bad",bad);
  st.innerHTML=(bad?IC_WARN:IC_OK)+"<span>"+(sal<=0?"Imposta lo stipendio del mese in Entrate reali":bad?"Hai superato il limite mensile di "+eur2(tot-sal):"Sei dentro il limite mensile")+"</span>";
  const n=buildNotes().length,bd=$("tpbdg");bd.textContent=n;bd.hidden=!n}
function openName(){
  modal={kind:"name"};
  $("mt").textContent="Come ti chiami?";
  $("mbody").innerHTML=`<p class="mtxt">Il nome resta salvato solo su questo dispositivo.</p><input id="nmi" class="ninp" maxlength="30" autocomplete="off" placeholder="Il tuo nome" value="${esc(S.name||"")}" style="margin-top:10px"><div class="macts"><button type="button" class="mini" data-mclose>Annulla</button><button type="button" class="main" data-namesave="1">Salva</button></div>`;
  $("nmi").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();nameSave()}});
  $("mod").hidden=false;if(!matchMedia("(pointer:coarse)").matches){$("nmi").focus();$("nmi").select()}}
function nameSave(){S.name=$("nmi").value.replace(/[<>&"]/g,"").trim().slice(0,30);save();closeModal();render()}
function openNotes(){
  modal={kind:"notes"};
  const n=buildNotes();
  $("mt").textContent="Notifiche";
  $("mbody").innerHTML=n.length?'<ul class="nl">'+n.map(o=>'<li class="'+o.t+'"><i></i><span>'+esc(o.x)+'</span></li>').join("")+'</ul><p class="mtxt" style="font-size:12px;color:var(--mute)">Avvisi calcolati sui dati del mese visualizzato. Restano solo nell’app.</p><div class="macts"><button type="button" class="mini" data-mclose>Chiudi</button></div>':'<p class="mtxt">Nessuna notifica per questo mese: è tutto in ordine.</p><div class="macts"><button type="button" class="mini" data-mclose>Chiudi</button></div>';
  $("mod").hidden=false}
ensureRec();

if(!S.sals){S.sals={};if(S.salary>0)S.sals[mk(new Date())]=S.salary;save()}
function salOf(m){const v=salAt(m);return v===null?0:v}
function salAt(k){const v=S.sals[k];return v===undefined?0:v}
function syncSal(){$("salary").value=salOf($("month").value)||""}
syncSal();
$("mchip").innerHTML=Array.from({length:12},(_,i)=>{const n=new Intl.DateTimeFormat("it-IT",{month:"long"}).format(new Date(2026,i,1));return `<option value="${String(i+1).padStart(2,"0")}">${n[0].toUpperCase()+n.slice(1)}</option>`}).join("");
function renderSal(){
  const Y=+$("month").value.slice(0,4);$("yrchip").textContent=Y;
  const pv=document.querySelector('[data-yr="-1"]');if(pv)pv.disabled=Y<=2026;
  const keys=Array.from({length:12},(_,i)=>Y+"-"+String(i+1).padStart(2,"0"));
  const ks=Object.keys(S.sals).sort(),fi=ks[0],la=ks[ks.length-1],vals=keys.map(k=>S.sals[k]!==undefined?S.sals[k]:(k>fi&&k<la?0:null)),ok=vals.filter(v=>v!==null);
  if(!ok.length){$("sline").innerHTML='<div class="empty">Nessuno stipendio inserito per questo anno: usa i campi qui sotto.</div>';$("snote").textContent="";return}
  const mx=Math.max(...ok),step=[500,1000,2000,2500,5000,10000,20000,25000,50000,100000,200000,250000,500000,1000000,2000000,5000000,10000000].find(q=>Math.floor(mx/q)+1<=8)||10000000,top=(Math.floor(mx/step)+1)*step,n=top/step,H=Math.max(150,n*28),B=20+H;
  const X=i=>56+i*(560/11),Yy=v=>B-v/top*H;
  const fm=x=>"€"+new Intl.NumberFormat("it-IT",{maximumFractionDigits:0}).format(x);
  const pts=vals.map((v,i)=>v===null?null:[X(i),Yy(v)]).filter(Boolean);
  const ln=pts.map(q=>q.join(",")).join(" ");
  let g="";for(let j=0;j<=n;j++){const y=B-j*H/n;g+=`<line x1="56" x2="620" y1="${y}" y2="${y}" stroke="rgba(255,255,255,.08)"/><text x="48" y="${y+4}" text-anchor="end" font-size="11" fill="#9aa6ad">${fm(j*step)}</text>`}
  const mn=keys.map((k,i)=>`<text x="${X(i)}" y="${B+22}" text-anchor="middle" font-size="11" fill="#9aa6ad">${MN.format(new Date(Y,i,1))}</text>`).join("");
  const dots=vals.map((v,i)=>{if(v===null)return"";const ent=S.sals[keys[i]]!==undefined;
    return `<circle cx="${X(i)}" cy="${Yy(v)}" r="${ent?5:4}" fill="${ent?"#7fd6e8":"#0b0e11"}" stroke="#7fd6e8" stroke-width="2"/>`+(ent?`<text x="${X(i)}" y="${Yy(v)-11}" text-anchor="middle" font-size="11" font-weight="600" fill="#e8fbff">${fm(v)}</text>`:"")}).join("");
  $("sline").innerHTML=`<svg viewBox="0 0 640 ${B+32}" role="img" aria-label="Andamento dello stipendio nell’anno ${Y}"><defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fd6e8" stop-opacity=".3"/><stop offset="1" stop-color="#7fd6e8" stop-opacity="0"/></linearGradient></defs>${g}<polygon points="${pts[0][0]},${B} ${ln} ${pts[pts.length-1][0]},${B}" fill="url(#sg)"/><polyline points="${ln}" fill="none" stroke="#7fd6e8" stroke-width="2.5" stroke-linejoin="round"/>${dots}${mn}</svg>`;
  $("snote").textContent="Punto pieno: stipendio inserito per quel mese. Punto vuoto: mese senza importo tra due stipendi inseriti (0 € di default). I mesi dopo l’ultimo stipendio inserito restano vuoti."}
function updPh(){const ks=Object.keys(S.sals).sort(),fi=ks[0],la=ks[ks.length-1];document.querySelectorAll("[data-sm]").forEach(el=>{const k=el.dataset.sm;el.placeholder=S.sals[k]===undefined&&!(k>fi&&k<la)?"–":"€"+salAt(k)})}
function renderSalEd(){
  const Y=+$("month").value.slice(0,4);
  $("sed").innerHTML=Array.from({length:12},(_,i)=>{const k=Y+"-"+String(i+1).padStart(2,"0");
    return `<label class="sm"><span>${MN.format(new Date(Y,i,1))} ${Y}</span><input type="text" readonly inputmode="none" data-sm="${k}" value="${S.sals[k]!==undefined?S.sals[k]:""}" aria-label="Stipendio netto di ${MN.format(new Date(Y,i,1))} ${Y}"></label>`}).join("");updPh()}
document.addEventListener("input",e=>{const k=e.target.dataset&&e.target.dataset.sm;if(!k)return;
  const v=parseFloat(e.target.value);if(isNaN(v))delete S.sals[k];else{const c=Math.min(Math.max(0,v),1e6);if(c!==v)e.target.value=c;S.sals[k]=c}save();updPh();render()});

function render(){
  const m=$("month").value, sal=salOf(m);
  const its=S.items.filter(i=>i.m===m);
  const paid=sum(m,i=>i.s==="paid"), plan=sum(m,i=>i.s==="plan"), tot=paid+plan, free=sal-tot;
  const pc=sal?Math.abs(free/sal*100):0;
  const e2=n=>"€"+new Intl.NumberFormat("it-IT",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
  const pf=n=>sal?(n/sal*100).toFixed(1).replace(".",",")+"% delle entrate":"Imposta lo stipendio in Entrate reali";
  
  
  $("pill").innerHTML=Array.from({length:12},(_,i)=>new Intl.DateTimeFormat("it-IT",{month:"long"}).format(new Date(2026,i,1)).toUpperCase()+" "+m.slice(0,4)).map((t,i)=>`<option value="${String(i+1).padStart(2,"0")}">${t}</option>`).join("");$("pill").value=m.slice(5,7);
  

  const [y,mo]=m.split("-").map(Number);
  const ms=Array.from({length:6},(_,k)=>new Date(y,mo-1-(5-k),1));
  const vals=ms.map(d=>sum(mk(d)));
  const mx=Math.max(...vals,1);
  $("bars").innerHTML=`<svg viewBox="0 0 300 130" role="img" aria-label="Spese negli ultimi 6 mesi">`+vals.map((v,i)=>{const h=v/mx*90;return `<rect x="${i*50+9}" y="${100-h}" width="32" height="${Math.max(h,1)}" rx="4" fill="${i===5?"#7fd6e8":"#3a8fa3"}"/><text x="${i*50+25}" y="118" text-anchor="middle" font-size="11" fill="#9aa6ad">${MN.format(ms[i])}</text>`}).join("")+`</svg>`;


  const ct=ord().map(c=>[c,sum(m,i=>i.c===c)]);
  let a=0;const seg=ct.filter(x=>x[1]>0).map(([c,v])=>{const s=a;a+=v/tot*100;return `${COL[c]} ${s}% ${a}%`});
  $("donut").style.background=tot?`conic-gradient(${seg.join(",")})`:"var(--line)";
  $("hole").innerHTML=`<b>€${new Intl.NumberFormat("it-IT",{maximumFractionDigits:0}).format(tot)}</b>totale`;
  $("mchip").value=m.slice(5,7);
  $("lg").innerHTML=ct.filter(x=>x[1]>0).map(([c,v])=>`<li><i class="dot" style="background:${COL[c]}"></i><div><b>${c}</b><small>${e2(v)}</small></div><em>${(v/tot*100).toFixed(1).replace(".",",")}%</em></li>`).join("")||'<li class="ks">Nessuna spesa in questo mese</li>';

  renderRec();renderSal();renderCnt();renderTop();$("list").innerHTML=its.length?its.slice().reverse().map(i=>i.id==editId?editRow(i):`<li class="row"><span>${esc(i.d)}</span><span class="amt">${eur2(i.a)}</span><span class="acts"><button class="mini ic" data-edit="${i.id}" aria-label="Modifica ${esc(i.d)}" title="Modifica">${IC_EDIT}</button><button class="mini ic del" data-del="${i.id}" aria-label="Elimina ${esc(i.d)}" title="Elimina">${IC_DEL}</button></span><small>${i.c}${i.dt?", "+dl(i.dt):""} ${i.s==="plan"?'<span class="tag">preventivata</span> <button class="mini" data-pay="'+i.id+'">Segna come pagata</button>':'<span class="tag paid">pagata</span> <button class="mini" data-unpay="'+i.id+'">Segna come preventivata</button>'}</small></li>`).join(""):'<li class="empty">Nessuna spesa in questo mese. Aggiungi la prima qui sopra.</li>';

  $("cats").innerHTML=ord().map((c,ix,arr)=>{
    const p=sum(m,i=>i.c===c&&i.s==="paid"),q=sum(m,i=>i.c===c&&i.s==="plan");
    const lim=limOf(c,sal),pc=sal?(lim/sal*100).toFixed(2).replace(".",",")+"% dello stipendio":"–",t=p+q,den=Math.max(lim,t,1),over=lim>0&&t>lim;
    return `<div class="cat"><div class="h"><span class="nm"><span class="mv"><button class="mini" data-mv="${c}" data-dir="-1" aria-label="Sposta ${c} su"${ix===0?" disabled":""}>▲</button><button class="mini" data-mv="${c}" data-dir="1" aria-label="Sposta ${c} giù"${ix===arr.length-1?" disabled":""}>▼</button></span>${c}</span><span class="${over?"over":""}">${eur(t)} / ${eur(lim)}</span></div><div class="t" style="background:${lim>0?"#1f9a5a":"var(--line)"}"><i style="width:${p/den*100}%;background:#e5484d"></i><i style="width:${q/den*100}%;background:#f4a09c"></i></div><div class="n"><span class="acts"><label class="bud">Budget €<input type="text" readonly inputmode="none" value="${S.lim[c].v}" data-lv="${c}" aria-label="Budget ${c} in euro"></label><b class="pc">${pc}</b></span><span>${over?"Oltre il limite di "+eur(t-lim):lim?"Restano "+eur(lim-t):""}</span></div></div>`}).join("");
}
function show(v){if(!$("v-"+v))return;view=v;["home","entrate","ricorrenti","spese","budget","statistiche"].forEach(x=>$("v-"+x).hidden=x!==v);document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("on",b.dataset.view===(v==="entrate"||v==="spese"||v==="ricorrenti"?"home":v)));$("pill").hidden=v==="home"||v==="entrate"||v==="ricorrenti";document.querySelector(".foot").style.display=v==="statistiche"?"none":"";$("greet").hidden=v!=="home";$("mrow").style.display=v==="statistiche"?"none":"";if(v==="statistiche")renderStats();$("mrow").classList.toggle("sp",v==="spese");if(v==="entrate")renderSalEd();scrollTo(0,0)}
$("salary").addEventListener("input",e=>{const m=$("month").value,v=parseFloat(e.target.value);if(isNaN(v))delete S.sals[m];else S.sals[m]=Math.max(0,v);S.salary=isNaN(v)?0:Math.max(0,v);save();render()});
$("month").addEventListener("change",()=>{syncSal();ensureRec();render()});
$("f").addEventListener("submit",e=>{e.preventDefault();
  const a=parseFloat($("a").value);if(!(a>=0))return;
  S.items.push({id:Date.now(),m:$("month").value,d:$("d").value.trim(),a,c:$("c").value,s:$("s").value});
  save();$("d").value="";$("a").value="";render();setExpOpen(false)});

/* ---- Statistiche ---- */
const ST={mode:"m",mo:"",y:0};
$("stmo").innerHTML=$("mchip").innerHTML;
$("sty").innerHTML=Array.from({length:10},(_,i)=>`<option value="${2026+i}">${2026+i}</option>`).join("");
function stData(){
  const MX=1e9,cap=v=>Math.max(-MX,Math.min(MX,v));
  if(ST.mode==="m"){
    const m=ST.y+"-"+ST.mo,its=S.items.filter(i=>i.m===m),sal=salOf(m),spe=its.reduce((t,i)=>t+i.a,0),days=new Date(ST.y,+ST.mo,0).getDate();
    if(!sal&&!its.length)return{empty:"Nessun dato per questo mese: inserisci lo stipendio e le spese.",slots:days};
    const dd=new Array(days+1).fill(0);its.forEach(i=>{let d=i.dt&&i.dt.slice(0,7)===m?+i.dt.slice(8):1;d=Math.min(days,Math.max(1,d));dd[d]+=i.a});
    let b=sal;const vals=[];for(let d=1;d<=days;d++){b-=dd[d];vals.push(cap(b))}
    return{sal,spe,vals,slots:days,labels:[1,8,15,22,29].filter(d=>d<=days).map(d=>[d-1,String(d)])};
  }
  const keys=Array.from({length:12},(_,i)=>ST.y+"-"+String(i+1).padStart(2,"0"));
  let sal=0,spe=0,last=-1;const mv=keys.map((k,i)=>{const a=salOf(k),e=sum(k);sal+=a;spe+=e;if(S.sals[k]!==undefined||e>0)last=i;return a-e});
  if(last<0)return{empty:"Nessun dato per questo anno: inserisci stipendi e spese.",slots:12};
  let b=0;const vals=[];for(let i=0;i<=last;i++){b+=mv[i];vals.push(cap(b))}
  return{sal,spe,vals,slots:12,labels:keys.map((k,i)=>[i,MN.format(new Date(ST.y,i,1))])};
}
function renderStats(){
  if(!ST.y){const n=new Date();ST.y=Math.max(2026,n.getFullYear());ST.mo=String(n.getMonth()+1).padStart(2,"0")}
  document.querySelectorAll("[data-stm]").forEach(b=>b.classList.toggle("on",b.dataset.stm===ST.mode));
  $("stmo").value=ST.mo;$("sty").value=String(ST.y);$("stmo").hidden=ST.mode!=="m";$("stmo").parentNode.classList.toggle("one",ST.mode!=="m");
  const mo=ST.mode==="m";$("sth").textContent=mo?"Riepilogo mese":"Riepilogo anno";
  const D=stData(),f2=n=>eur2(n);
  if(D.empty){$("stsum").innerHTML='<div class="empty">'+D.empty+'</div>';$("stchart").innerHTML="";$("stchip").hidden=true;$("stnote").textContent="";return}
  const net=D.sal-D.spe,tt=D.sal+D.spe,gp=tt>0?D.sal/tt*100:50;
  $("stsum").innerHTML='<div class="stc"><div><span class="stl g"><i></i>Saldo</span><b>'+f2(D.sal)+'</b></div><div class="r"><span class="stl o"><i></i>Spese</span><b>'+f2(D.spe)+'</b></div></div>'
   +'<div class="stbar"><i class="g" style="width:'+gp.toFixed(2)+'%"></i><i class="o" style="width:'+(100-gp).toFixed(2)+'%"></i></div>'
   +'<div class="stn"><span>Netto</span><b class="'+(net<0?"neg":"pos")+'">'+f2(net)+'</b></div>';
  const v=D.vals,lo=Math.min(0,...v),hi=Math.max(0,...v);
  const q=[50,100,200,250,500,1000,2000,2500,5000,10000,20000,25000,50000,100000,250000,500000,1000000,5000000,10000000,100000000,1000000000].find(x=>Math.ceil(hi/x)-Math.floor(lo/x)<=6)||1000000000;
  const bot=Math.floor(lo/q)*q;let top=Math.ceil(hi/q)*q;if(top<=bot)top=bot+q;const n=Math.round((top-bot)/q),H=170,B=20+H;
  const Yy=x=>B-(x-bot)/(top-bot)*H,X=i=>D.slots>1?72+i*(552/(D.slots-1)):348;
  const fm=x=>new Intl.NumberFormat("it-IT",{maximumFractionDigits:0}).format(x)+" €";
  let g="";for(let j=0;j<=n;j++){const val=bot+j*q,y=Yy(val);g+=`<line x1="72" x2="624" y1="${y}" y2="${y}" stroke="rgba(255,255,255,${val===0&&bot<0?.28:.08})"/><text x="64" y="${y+4}" text-anchor="end" font-size="11" fill="#9aa6ad">${fm(val)}</text>`}
  const xl=D.labels.map(([i,t])=>`<text x="${X(i)}" y="${B+22}" text-anchor="middle" font-size="11" fill="#9aa6ad">${t}</text>`).join("");
  const pts=v.map((x,i)=>[X(i),Yy(x)]),ln=pts.map(a=>a.join(",")).join(" "),lp=pts[pts.length-1];
  const dots=(mo?[pts.length-1]:v.map((_,i)=>i)).map(i=>`<circle cx="${pts[i][0]}" cy="${pts[i][1]}" r="4" fill="#7fd6e8" stroke="#0b0e11" stroke-width="2"/>`).join("");
  $("stchart").innerHTML=`<svg viewBox="0 0 640 ${B+32}" role="img" aria-label="Andamento del saldo"><defs><linearGradient id="stg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fd6e8" stop-opacity=".3"/><stop offset="1" stop-color="#7fd6e8" stop-opacity="0"/></linearGradient></defs>${g}<polygon points="${pts[0][0]},${B} ${ln} ${lp[0]},${B}" fill="url(#stg)"/><polyline points="${ln}" fill="none" stroke="#7fd6e8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>${dots}${xl}</svg>`;
  $("stchip").hidden=false;$("stchip").textContent=f2(v[v.length-1]);
  $("stnote").textContent=mo?"Saldo giorno per giorno: parte dallo stipendio del mese e scende a ogni spesa. Le spese senza data contano dal giorno 1.":"Saldo accumulato mese dopo mese (stipendi meno spese). Il grafico si ferma all’ultimo mese con dati."}
$("stmo").addEventListener("change",e=>{ST.mo=e.target.value;renderStats()});
$("sty").addEventListener("change",e=>{ST.y=+e.target.value;renderStats()});
document.addEventListener("click",e=>{
  const t=e.target.closest?(e.target.closest("button,[data-view]")||e.target):e.target;
  if(t.dataset.view)show(t.dataset.view);
  if(t.dataset.stm){ST.mode=t.dataset.stm;renderStats()}
  if(t.dataset.tg2)setExpOpen($("f").hidden);
  if(t.dataset.nm&&ne){ne.dm=t.dataset.nm;if(ne.dm==="pick"&&!$("ndd").value)$("ndd").value=NYMD(new Date());neUpdate()}
  if(t.dataset.ns&&ne){ne.st=t.dataset.ns;neUpdate()}
  if(t.dataset.k&&ne)nePress(t.dataset.k);
  if(t.dataset.ncedit)$("nchips").hidden=!$("nchips").hidden;
  if(t.dataset.nc&&ne){ne.cat=t.dataset.nc;ne.manual=true;ne.sug=false;$("nchips").hidden=true;neUpdate()}
  if(t.dataset.nsave&&ne)neSave();
  if(t.dataset.sm!==undefined&&t.tagName==="INPUT")openSalAmt(t.dataset.sm);
  if(t.dataset.lv!==undefined&&t.tagName==="INPUT")openBudAmt(t.dataset.lv);
  if(t.dataset.ak&&am)amPress(t.dataset.ak);
  if(t.dataset.amok&&am)amDone();
  if(t.dataset.eye){S.hide=!S.hide;save();renderTop()}
  if(t.dataset.name)openName();
  if(t.dataset.namesave)nameSave();
  if(t.dataset.bell)openNotes();
  if(t.dataset.reload)location.reload();
  if(t.dataset.reset){if(t.dataset.sure){try{localStorage.removeItem(KEY)}catch(e){}location.reload()}else{t.dataset.sure="1";t.textContent="Conferma: cancella tutto"}}
  if(t.dataset.exp)openExport();
  if(t.dataset.imp)openImport();
  if(t.dataset.excopy){const ta=$("exa");ta.select();let ok=false;try{ok=document.execCommand("copy")}catch(e){}t.textContent=ok?"Copiato":"Copia a mano"}
  if(t.dataset.exdl){const b=new Blob([$("exa").value],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="spese-backup-"+mk(new Date())+".json";document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)}
  if(t.dataset.imgo)doImport();
  if(t.dataset.col){S.col=S.col||{};S.col[t.dataset.col]=!S.col[t.dataset.col];save();applyCol()}
  if(t.dataset.new)openNewExp(t.dataset.new==="rec");
  if(t.dataset.redit)openModal("edit-rec",t.dataset.redit);
  if(t.dataset.mclose!==undefined||t.id==="mod")closeModal();
  if(t.dataset.mdel&&modal){if(modal.kind==="del-rec"){S.rec=S.rec.filter(r=>r.id!==modal.id);S.items=S.items.filter(i=>!(i.rid===modal.id&&i.s==="plan"))}else{const it=S.items.find(i=>i.id==modal.id);if(it&&it.rid){const r=S.rec.find(x=>x.id===it.rid);if(r)(r.skip=r.skip||[]).push(it.m)}S.items=S.items.filter(i=>i.id!=modal.id)}save();closeModal();render()}
  if(t.dataset.yr){const [yy,mm]=$("month").value.split("-"),ny=+yy+parseInt(t.dataset.yr);if(ny>=2026){$("month").value=ny+"-"+mm;syncSal();ensureRec();render();renderSalEd()}}
  if(t.dataset.mv){const o=ord(),i=o.indexOf(t.dataset.mv),j=i+parseInt(t.dataset.dir);if(j>=0&&j<o.length){[o[i],o[j]]=[o[j],o[i]];S.order=o;save();render()}}
  if(t.dataset.edit)openModal("edit-exp",t.dataset.edit);
  if(t.dataset.cancel){editId=null;render()}
  if(t.dataset.save){const li=t.closest("li"),it=S.items.find(i=>i.id==t.dataset.save);const v=k=>li.querySelector('[data-f="'+k+'"]').value;const a=parseFloat(v("a"));if(it&&v("d").trim()&&a>=0){it.d=v("d").trim();it.a=a;it.c=v("c");editId=null;save();render()}}
  if(t.dataset.del)openConfirm("del-exp",t.dataset.del);
  if(t.dataset.rdel)openConfirm("del-rec",t.dataset.rdel);
  if(t.dataset.pay){const i=S.items.find(i=>i.id==t.dataset.pay);if(i){i.s="paid";save();render()}}
  if(t.dataset.unpay){const i=S.items.find(i=>i.id==t.dataset.unpay);if(i){i.s="plan";save();render()}}});
document.addEventListener("change",e=>{
  const d=e.target.dataset||{};if(d.mo){const yy=$("month").value.slice(0,4);$("month").value=yy+"-"+e.target.value;syncSal();ensureRec();render();return}
  if(d.lm){S.lim[d.lm].t=e.target.value;save();render()}
  if(d.lv){S.lim[d.lv]={t:"eur",v:Math.max(0,parseFloat(e.target.value)||0)};save();render()}});
try{render()}catch(e){openFail()}
(function(){
  const tr=$("sb"),th=$("sbt"),de=document.documentElement;
  function upd(){const vh=innerHeight,dh=de.scrollHeight;
    if(dh<=vh+2){tr.hidden=true;return}
    tr.hidden=false;
    const T=tr.clientHeight,h=Math.min(80,Math.max(28,T*vh/dh)),max=T-h;
    th.style.height=h+"px";th.style.transform="translateY("+(max*scrollY/(dh-vh))+"px)"}
  addEventListener("scroll",upd,{passive:true});addEventListener("resize",upd);
  if(window.ResizeObserver)new ResizeObserver(upd).observe(document.body);
  let sy=0,ss=0;
  th.addEventListener("pointerdown",e=>{th.setPointerCapture(e.pointerId);sy=e.clientY;ss=scrollY;e.preventDefault()});
  th.addEventListener("pointermove",e=>{if(!th.hasPointerCapture(e.pointerId))return;
    const max=tr.clientHeight-th.offsetHeight;scrollTo(0,ss+(e.clientY-sy)*(de.scrollHeight-innerHeight)/max)});
  tr.addEventListener("pointerdown",e=>{if(e.target===th)return;
    const r=tr.getBoundingClientRect(),f=(e.clientY-r.top-th.offsetHeight/2)/(r.height-th.offsetHeight);
    scrollTo(0,Math.max(0,Math.min(1,f))*(de.scrollHeight-innerHeight))});
  upd();
})();

if("serviceWorker" in navigator)addEventListener("load",()=>{navigator.serviceWorker.register("sw.js").catch(()=>{})});
if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{});
