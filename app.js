const CATS={Casa:30,Bollette:8,Macchina:10,Cibo:15,Vacanze:8,Regali:4,Telefono:3};
const COL={Casa:"#a8e8f6",Macchina:"#5ec5dc",Cibo:"#3aa0b8",Telefono:"#2f7f93",Bollette:"#7f9ba6",Vacanze:"#5b707a",Regali:"#3d4d55"};
const KEY="spese-dashboard-v1";
let S={salary:0,pct:{...CATS},items:[]};
try{const r=localStorage.getItem(KEY);if(r){const p=JSON.parse(r);S={...S,...p,pct:{...CATS,...(p.pct||{})}}}}catch(e){}
S.items.forEach(i=>{i.c={Spesa:"Cibo",Trasporti:"Macchina"}[i.c]||i.c});
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const eur=n=>new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n);
const eur2=n=>new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR"}).format(n);
const cap=t=>t?t.charAt(0).toLocaleUpperCase("it-IT")+t.slice(1):t;
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
S.items.forEach(i=>{if(typeof i.d==="string")i.d=cap(i.d)});S.rec.forEach(r=>{if(typeof r.d==="string")r.d=cap(r.d)});
const FQ={m:1,q:3,s:6,y:12},FQN={m:"Mensile",q:"Trimestrale",s:"Semestrale",y:"Annuale"},FQL={m:"mese",q:"trimestre",s:"semestre",y:"anno"};
function recStart(r){return r.start||(r.from+"-01")}
function recEnd(r){return r.end!==undefined?r.end:(r.to?r.to+"-31":"")}
function recDate(r,m){const st=recStart(r),sd=+st.slice(8,10),[y,o]=m.split("-").map(Number),[sy,so]=st.split("-").map(Number),df=(y*12+o)-(sy*12+so),step=FQ[r.f||"m"]||1;
  if(df<0||df%step)return"";const last=new Date(y,o,0).getDate(),dt=m+"-"+String(Math.min(sd,last)).padStart(2,"0"),en=recEnd(r);return en&&dt>en?"":dt}
function incOf(m){return S.rec.reduce((t,r)=>t+(r.t==="in"&&recDate(r,m)?r.a:0),0)}
function ensureRec(){
  const now=mk(new Date()),sel=$("month").value||now,hz=addM(sel>now?sel:now,12);let ch=false;
  S.rec.forEach(r=>{if(r.t==="in")return;for(let m=recStart(r).slice(0,7);m<=hz;m=addM(m,1)){
    const dt=recDate(r,m);if(!dt)continue;
    if((r.skip||[]).includes(m)||S.items.some(i=>i.rid===r.id&&i.m===m))continue;
    S.items.push({id:r.id+"_"+m,m,dt,d:r.d,a:r.a,c:r.c,s:r.start?"paid":"plan",rid:r.id});ch=true}});
  if(ch)save()}
const dFmt=new Intl.DateTimeFormat("it-IT",{day:"numeric",month:"short",year:"numeric"});
function recRow(r){const f=r.f||"m",fd=x=>dFmt.format(new Date(+x.slice(0,4),+x.slice(5,7)-1,+x.slice(8,10))),st=r.start?fd(r.start):ml(r.from),en=r.end!==undefined?r.end:r.to,ens=r.end!==undefined?(r.end?fd(r.end):""):(r.to?ml(r.to):"");
  return `<li class="row xr" data-recedit="${r.id}"><span>${esc(r.d)}</span><span class="amt">${eur2(r.a)}/${FQL[f]}</span><small>${r.t==="in"?"Entrata":esc(r.c)}${f!=="m"?" · "+FQN[f]:""}, dal ${st} ${en?"al "+ens:"senza scadenza"}</small></li>`}
function recRange(r){const fd=x=>dFmt.format(new Date(+x.slice(0,4),+x.slice(5,7)-1,+x.slice(8,10))),st=recStart(r),en=r.end!==undefined?r.end:(r.to?(()=>{const [y,o]=r.to.split("-").map(Number);return r.to+"-"+String(new Date(y,o,0).getDate()).padStart(2,"0")})():"");
  return "Dal "+fd(st)+(en?" al "+fd(en):" senza scadenza")}
function recRow2(r){const f=r.f||"m";
  return `<li class="row xr rr" data-recedit="${r.id}"><span class="rrn">${esc(r.d)}</span><span class="amt">${eur2(r.a)}/${FQL[f]}</span><span class="rrd">${recRange(r)}</span></li>`}
function renderRec(){
  const outs=S.rec.filter(r=>r.t!=="in");
  $("rec2").innerHTML=outs.length?ord().map(c=>{
    const g=outs.filter(r=>r.c===c).sort((a,b)=>{const x=recStart(a),y=recStart(b);return x<y?1:x>y?-1:(a.id>b.id?-1:a.id<b.id?1:0)});
    if(!g.length)return "";
    const k="r:"+c,open=!!cgOpen[k],t=g.reduce((x,r)=>x+r.a,0);
    return `<li class="cg"><button type="button" class="cgh cgn3" data-cg="${k}" aria-expanded="${open}" aria-label="${c}: ${g.length} spese ricorrenti"><i class="dot" style="background:${COL[c]}"></i><span class="cgn">${c} <span class="cnt">${g.length}</span></span><span class="cgc">${open?IC_UP:IC_DN}</span></button><ul class="cgl"${open?"":" hidden"}>${g.map(recRow2).join("")}</ul></li>`}).join(""):'<li class="empty">Nessuna spesa ricorrente.</li>';renderInc()}
function renderInc(){
  const ks=Object.keys(S.sals).sort(),last=ks[ks.length-1];
  $("rinc").innerHTML='<li class="row"><span>Stipendio netto</span><span class="amt">'+(ks.length?eur2(S.sals[last])+'/mese':'–')+'</span><span class="acts"><button class="mini ic" data-view="entrate" aria-label="Modifica gli stipendi" title="Modifica">'+IC_EDIT+'</button></span><small>'+(ks.length?'Ultimo importo inserito: '+mLong(last).toLowerCase():'Nessuno stipendio inserito: impostalo mese per mese')+'</small></li>'+S.rec.filter(r=>r.t==="in").map(recRow2).join("")}
const MOPT=Array.from({length:60},(_,i)=>{const d=new Date(2026,i,1),n=new Intl.DateTimeFormat("it-IT",{month:"long",year:"numeric"}).format(d);return `<option value="${mk(d)}">${n[0].toUpperCase()+n.slice(1)}</option>`}).join("");
const IC_DEL='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/><path d="M10 11v6M14 11v6"/></svg>';
const IC_EDIT='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>';
const IC_UP='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>';
const IC_DN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
function renderCnt(){const m=$("month").value;$("rcnt2").textContent=S.rec.filter(r=>r.t!=="in").length;}
function setExpOpen(o){$("f").hidden=!o;if(o){$("d").focus()}else{$("f").reset()}}
let modal=null;
function closeModal(){$("mod").hidden=true;modal=null;ne=null;am=null;$("mbody").innerHTML="";document.querySelector(".mbox").classList.remove("sheet")}
function openModal(kind,id){
  const r=kind==="edit-rec"?S.rec.find(x=>x.id===id):kind==="edit-exp"?S.items.find(i=>i.id==id):null,isRec=kind==="new-rec"||kind==="edit-rec";
  if(kind.startsWith("edit")&&!r)return;
  modal={kind,id};
  const cats=Object.keys(CATS).map(c=>`<option${r&&r.c===c?" selected":""}>${c}</option>`).join("");
  $("mt").textContent={"new-exp":"Nuova spesa del mese","new-rec":"Nuova spesa ricorrente","edit-rec":"Modifica spesa ricorrente","edit-exp":"Modifica spesa"}[kind];
  $("mbody").innerHTML=`<form id="mf" class="mf"><input data-f="d" class="full" placeholder="Descrizione (es. Affitto)" required value="${r?esc(r.d):""}" aria-label="Descrizione"><input data-f="a" type="number" min="0" step="0.01" inputmode="decimal" placeholder="Importo €" required value="${r?r.a:""}" aria-label="Importo"><select data-f="c" aria-label="Categoria">${cats}</select>`+(isRec?`<label>Dal mese<select data-f="from">${MOPT}</select></label><label>Fino al mese (facoltativo)<select data-f="to"><option value="">Senza scadenza</option>${MOPT}</select></label>`:"")+`<div class="err full" id="merr" role="alert"></div><div class="macts full"><button type="button" class="mini" data-mclose>Annulla</button>${kind==="edit-exp"?`<button type="button" class="mini danger" data-mreq="1">Elimina spesa</button>`:""}<button class="main" type="submit">${kind.startsWith("edit")?"Salva modifiche":kind==="new-rec"?"Aggiungi ricorrente":"Aggiungi spesa"}</button></div></form>`;
  if(isRec){const f=$("mf");f.querySelector('[data-f="from"]').value=r?r.from:mk(new Date());f.querySelector('[data-f="to"]').value=r?(r.to||""):""}
  $("mod").hidden=false;$("mbody").querySelector("input").focus()}
function openConfirm(kind,id){
  const rec=kind==="del-rec",x=rec?S.rec.find(r=>r.id===id):S.items.find(i=>i.id==id);
  if(!x)return;
  modal={kind,id};
  $("mt").textContent=rec?"Eliminare il movimento ricorrente?":"Eliminare la spesa?";
  $("mbody").innerHTML=`<p class="mtxt">Stai per eliminare <b>${esc(x.d)}</b> (${eur2(x.a)}${rec?" al mese":""}). ${rec?"Le spese dei mesi futuri generate da questo movimento verranno eliminate, quelle già registrate restano.":"L’operazione non si può annullare."}</p><div class="macts"><button type="button" class="mini" data-mclose>Annulla</button><button type="button" class="mini danger" data-mdel="1">Elimina</button></div>`;
  $("mod").hidden=false;$("mbody").querySelector("button").focus()}
document.addEventListener("submit",e=>{
  if(e.target.id!=="mf"||!modal)return;e.preventDefault();
  const q=k=>e.target.querySelector('[data-f="'+k+'"]'),v=k=>q(k).value;
  const a=parseFloat(v("a")),d=cap(v("d").trim());if(!d||!(a>=0))return;if(!(a<=1e7)){$("merr").textContent="Importo troppo alto: il massimo è 10.000.000 €";return}
  if(modal.kind==="new-exp"){S.items.push({id:Date.now(),m:$("month").value,d,a,c:v("c"),s:"paid"})}
  else if(modal.kind==="edit-exp"){const it=S.items.find(i=>i.id==modal.id);if(!it)return;Object.assign(it,{d,a,c:v("c")})}
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
let impData=null;
function openImport(){
  modal={kind:"import"};impData=null;
  $("mt").textContent="Importa backup";
  $("mbody").innerHTML=`<p class="mtxt">Scegli il file di backup (.json) salvato con “Esporta backup”. I dati attuali verranno sostituiti da quelli del backup.</p><input type="file" id="imf" accept=".json,application/json" hidden><button type="button" class="pickf" id="imp" data-pick="1"><b>Scegli file…</b><span id="imn">Nessun file selezionato</span></button><div class="err" id="merr" role="alert"></div><div class="macts"><button type="button" class="mini" data-mclose>Annulla</button><button type="button" class="main" id="imgo" data-imgo="1" disabled>Importa</button></div>`;
  $("imf").addEventListener("change",e=>{
    const f=e.target.files[0];impData=null;$("imgo").disabled=true;$("merr").textContent="";
    if(!f){$("imn").textContent="Nessun file selezionato";return}
    $("imn").textContent=f.name.length>40?f.name.slice(0,37)+"…":f.name;
    const bad=m=>{$("merr").textContent=m;e.target.value="";$("imn").textContent="Nessun file selezionato"};
    if(!/\.json$/i.test(f.name)){bad("Questo non è un file di backup: scegli un file .json creato con “Esporta backup”.");return}
    if(f.size>5*1024*1024){bad("Il file è troppo grande per essere un backup.");return}
    const r=new FileReader();
    r.onerror=()=>bad("Non riesco a leggere il file.");
    r.onload=()=>{let c=null;try{c=cleanImport(JSON.parse(String(r.result)))}catch(x){c=null}
      if(!c){bad("Il file non è un backup valido di questa app.");return}
      impData=c;$("imgo").disabled=false};
    r.readAsText(f)});
  $("mod").hidden=false}
function cleanImport(d){
  if(d&&d.data)d=d.data;
  if(!d||typeof d!=="object"||!Array.isArray(d.items))return null;
  const ok=/^\d{4}-\d{2}$/,cl=x=>String(x).replace(/[<>&"]/g,"");
  const items=d.items.filter(i=>i&&i.id!==undefined&&typeof i.d==="string"&&typeof i.c==="string"&&typeof i.a==="number"&&typeof i.m==="string"&&ok.test(i.m)).map(i=>({...i,d:cl(i.d),c:cl(i.c),s:i.s==="paid"?"paid":"plan",dt:/^\d{4}-\d{2}-\d{2}$/.test(i.dt)?i.dt:undefined}));
  const rec=(Array.isArray(d.rec)?d.rec:[]).filter(r=>r&&typeof r.id==="string"&&typeof r.d==="string"&&typeof r.c==="string"&&typeof r.a==="number"&&typeof r.from==="string"&&ok.test(r.from)&&(!r.to||ok.test(r.to))).map(r=>({...r,id:cl(r.id),d:cl(r.d),c:cl(r.c)}));
  const sals={};if(d.sals&&typeof d.sals==="object")Object.keys(d.sals).forEach(k=>{if(ok.test(k)&&typeof d.sals[k]==="number")sals[k]=d.sals[k]});
  const lim={};if(d.lim&&typeof d.lim==="object")Object.keys(d.lim).forEach(k=>{const L=d.lim[k];if(L&&["eur","pct","rest"].includes(L.t)&&typeof L.v==="number")lim[cl(k)]=L});
  return {salary:typeof d.salary==="number"?d.salary:0,pct:{...CATS},items,rec,sals,lim,name:typeof d.name==="string"?d.name.replace(/[<>&"]/g,"").slice(0,30):"",hide:d.hide===true,order:(Array.isArray(d.order)?d.order.map(cl):[]),col:{rec:!!(d.col&&d.col.rec),exp:!!(d.col&&d.col.exp)},recSeeded:true,recSeeded2:true,limV2:d.limV2===true}}
function doImport(){if(!impData)return;S=impData;save();location.reload()}
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
const IC_CLOCK=SVGO+'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',IC_OK=SVGO+'<path d="M5 12l5 5L20 7"/></svg>',IC_BK=SVGO+'<path d="M21 5H9l-6 7 6 7h12a1 1 0 001-1V6a1 1 0 00-1-1z"/><path d="M12 9l6 6M18 9l-6 6"/></svg>';
let ne=null;
function neVal(){return parseFloat((ne.amt||"0").replace(",","."))||0}
const WH=34,WMN=["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];
let wBusy=false,wTimer=0;
function wCol(k,p){return document.querySelector("#"+p+'w [data-w="'+k+'"]')}
function wFill(k,items,sel,p){const c=wCol(k,p);c.innerHTML=items.map(([v,t])=>`<div class="dwi" role="option" data-v="${v}" aria-selected="${v===sel}">${t}</div>`).join("");return c}
function wVal(k,p){const c=wCol(k,p),i=Math.min(c.children.length-1,Math.max(0,Math.round(c.scrollTop/WH)));return +c.children[i].dataset.v}
function wGo(k,v,smooth,p){const c=wCol(k,p),i=[...c.children].findIndex(x=>+x.dataset.v===v);if(i<0)return;c.scrollTo({top:i*WH,behavior:smooth?"smooth":"auto"});[...c.children].forEach((x,j)=>x.setAttribute("aria-selected",j===i))}
function wDays(y,m,d,p){const n=new Date(y,m,0).getDate();wFill("d",Array.from({length:n},(_,i)=>[i+1,String(i+1).padStart(2,"0")]),d,p);return Math.min(d,n)}
function wSet(ymd,p){const [y,m,d]=ymd.split("-").map(Number);wBusy=true;
  wFill("m",WMN.map((t,i)=>[i+1,t]),m,p);wFill("y",Array.from({length:10},(_,i)=>[2026+i,String(2026+i)]),y,p);const dd=wDays(y,m,d,p);
  wGo("d",dd,0,p);wGo("m",m,0,p);wGo("y",y,0,p);$(p+"d").value=y+"-"+String(m).padStart(2,"0")+"-"+String(dd).padStart(2,"0");setTimeout(()=>{wBusy=false;$(p+"d").dispatchEvent(new Event("input"))},80)}
function wRead(p){if(wBusy)return;let y=wVal("y",p),m=wVal("m",p),d=wVal("d",p);const n=new Date(y,m,0).getDate();
  if(wCol("d",p).children.length!==n){wBusy=true;d=Math.min(d,n);wDays(y,m,d,p);wGo("d",d,0,p);setTimeout(()=>{wBusy=false},80)}
  const v=y+"-"+String(m).padStart(2,"0")+"-"+String(Math.min(d,n)).padStart(2,"0");
  ["d","m","y"].forEach(k=>{const c=wCol(k,p),i=Math.round(c.scrollTop/WH);[...c.children].forEach((x,j)=>x.setAttribute("aria-selected",j===i))});
  if($(p+"d").value!==v){$(p+"d").value=v;$(p+"w").dataset.val=v;$(p+"d").dispatchEvent(new Event("input"));ndSum()}}
function wheelInit(p){const w=$(p+"w");if(!w||w.dataset.ok==="1"&&w.dataset.val===$(p+"d").value)return;
  if(!w.dataset.ok){w.dataset.ok="1";
    w.addEventListener("scroll",()=>{clearTimeout(wTimer);wTimer=setTimeout(()=>wRead(p),90)},true);
    w.addEventListener("click",e=>{const it=e.target.closest(".dwi");if(!it)return;const c=it.parentNode;c.scrollTo({top:[...c.children].indexOf(it)*WH,behavior:"smooth"})});
    w.addEventListener("keydown",e=>{const c=e.target.closest&&e.target.closest(".dwcol");if(!c||(e.key!=="ArrowUp"&&e.key!=="ArrowDown"))return;e.preventDefault();c.scrollBy({top:(e.key==="ArrowDown"?1:-1)*WH,behavior:"smooth"})})}
  let v=$(p+"d").value;
  if(!v){if(p==="nf"){const s0=$("ndd").value||NYMD(new Date()),[y,m,d]=s0.split("-").map(Number);v=Math.min(y+1,2035)+"-"+String(m).padStart(2,"0")+"-"+String(d).padStart(2,"0")}else v=NYMD(new Date())}
  w.dataset.val=v;wSet(v,p)}
function ndSum(){["nd","nf"].forEach(p=>{const el=$(p+"sum");if(!el)return;const v=$(p+"d").value;if(!v){el.textContent="Senza scadenza";return}const [y,m,d]=v.split("-").map(Number),t=WMN[m-1];el.textContent=d+" "+t[0].toUpperCase()+t.slice(1)+" "+y})}
function wOpen(p){const w=$(p+"w");if(!w||!w.hidden)return;$(p+"sum").hidden=true;w.hidden=false;delete w.dataset.val;wheelInit(p)}
document.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&(e.target.id==="ndsum"||e.target.id==="nfsum")){e.preventDefault();wClose(e.target.id==="ndsum"?"nf":"nd");wOpen(e.target.id.slice(0,2))}else if((e.key==="Enter"||e.key===" ")&&e.target.classList&&e.target.classList.contains("ncat")){e.preventDefault();e.target.click()}});
function ncClose(except){[["nchips","[data-ncedit]"],["nqchips","[data-nqedit]"]].forEach(([id,sel])=>{if(id===except)return;const n=$(id);if(n&&!n.hidden){n.hidden=true;const c=document.querySelector(".ncat"+sel);if(c)c.setAttribute("aria-expanded","false")}})}
function wClose(p){const w=$(p+"w");if(!w||w.hidden)return;w.hidden=true;$(p+"sum").hidden=false;ndSum()}
function neDate(){const t=new Date();if(ne.dm==="yest")t.setDate(t.getDate()-1);if(ne.dm==="pick")return $("ndd").value||NYMD(new Date());return NYMD(t)}
function neUpdate(){
  $("nval").textContent=ne.amt||"0,00";$("nval").classList.toggle("dim",!ne.amt);
  let ok=!!($("nd").value.trim()&&neVal()>0)&&!!$("ndd").value;
  if(ne.rec){const s0=$("ndd").value,e0=$("nfd").value,bad=!!e0&&e0<s0;$("nerr").textContent=bad?"La data di fine non può precedere quella di inizio":"";ok=ok&&!bad;
    document.querySelectorAll("[data-nt]").forEach(b=>b.classList.toggle("on",b.dataset.nt===ne.t));
    document.querySelectorAll("[data-nq]").forEach(b=>b.classList.toggle("on",b.dataset.nq===ne.f));
    $("ncw").hidden=ne.t==="in";$("nqn").textContent=FQN[ne.f];$("nal").textContent=ne.t==="in"?"Importo per accredito":"Importo per addebito";
    const cl=document.querySelector("[data-nfclear]");if(cl)cl.hidden=!$("nfd").value}
  $("nsave").disabled=!ok;
  document.querySelectorAll("[data-nc]").forEach(b=>b.classList.toggle("on",b.dataset.nc===ne.cat));
  ndSum();
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
  const d=cap($("nd").value.trim()),a=neVal();if(!d||!(a>0))return;
  if(ne.rec){const start=$("ndd").value,end=$("nfd").value;if(!start||(end&&end<start))return;
    const o={d,a,c:ne.t==="in"?"":ne.cat,t:ne.t,f:ne.f,start,end,from:start.slice(0,7),to:end?end.slice(0,7):""};
    if(ne.edit!==null){const r=S.rec.find(x=>x.id===ne.edit);if(r){Object.assign(r,o,{skip:[]});const now=mk(new Date());S.items=S.items.filter(i=>!(i.rid===r.id&&(i.s==="plan"||i.m>=now)))}}
    else S.rec.push(Object.assign({id:"r"+Date.now()},o));
    if(ne.t!=="in")S.lastCat=ne.cat;ensureRec();save();closeModal();render();return}
  const dt=neDate(),m=dt.slice(0,7);
  if(ne.edit!==null){const it=S.items.find(i=>i.id==ne.edit);if(it)Object.assign(it,{m,dt,d,a,c:ne.cat});S.lastCat=ne.cat;save();closeModal();render();return}
  S.items.push({id:Date.now(),m,dt,d,a,c:ne.cat,s:ne.st});
  S.lastCat=ne.cat;
  if(m!==$("month").value){$("month").value=m;syncSal();ensureRec()}
  save();closeModal();render()}
function dcard(p,lab,extra){return `<div class="ncat ndate"><span class="nci">${IC_CLOCK}</span><div class="nct"><small>${lab}</small><b class="ndsum" id="${p}sum" role="button" tabindex="0" aria-label="Modifica: ${lab}"></b><div class="dw" id="${p}w" role="group" aria-label="${lab}" hidden><div class="dwsel"></div><div class="dwcol" data-w="d" role="listbox" aria-label="Giorno" tabindex="0"></div><div class="dwcol" data-w="m" role="listbox" aria-label="Mese" tabindex="0"></div><div class="dwcol" data-w="y" role="listbox" aria-label="Anno" tabindex="0"></div></div></div>${extra||""}</div><input type="hidden" id="${p}d">`}
function openNewExp(rec,editId){
  const cur=mk(new Date()),vm=$("month").value;
  ne={amt:"",cat:(S.lastCat&&CATS[S.lastCat]!==undefined)?S.lastCat:ord()[0],sug:false,manual:false,st:"paid",dm:"pick",rec:!!rec,edit:null,t:"out",f:"m"};
  const has=editId!==undefined&&editId!==null,eIt=!rec&&has?S.items.find(i=>i.id==editId):null,eRc=rec&&has?S.rec.find(r=>r.id===editId):null,E=eIt||eRc;
  if(eIt){ne.edit=eIt.id;ne.amt=String(eIt.a).replace(".",",");ne.cat=CATS[eIt.c]!==undefined?eIt.c:ne.cat;ne.manual=true;ne.st=eIt.s||"paid"}
  if(eRc){ne.edit=eRc.id;ne.amt=String(eRc.a).replace(".",",");ne.t=eRc.t==="in"?"in":"out";ne.f=eRc.f||"m";if(CATS[eRc.c]!==undefined){ne.cat=eRc.c}ne.manual=true}
  modal={kind:"new-exp-sheet"};
  document.querySelector(".mbox").classList.add("sheet");
  const ttl=rec?(eRc?"Modifica movimento ricorrente":"Nuovo movimento ricorrente"):eIt?"Modifica spesa":"Nuova spesa";
  $("mt").textContent=ttl;document.querySelector(".mbox").setAttribute("aria-label",ttl);
  const btns=E?`<div class="neacts"><button type="button" class="nbt" data-mclose>Annulla</button><button type="button" class="nbt danger" data-nedel="1">Elimina ${rec?"movimento":"spesa"}</button><button type="button" class="nbt main" id="nsave" data-nsave="1" disabled>Salva modifiche</button></div>`:`<button type="button" class="nsave" id="nsave" data-nsave="1" disabled><span>${rec?"Salva movimento":"Salva spesa"}</span>${IC_OK}</button>`;
  const recTop=rec?`<div class="seg nseg" role="group" aria-label="Tipo di movimento"><button type="button" data-nt="in">Entrata</button><button type="button" data-nt="out">Uscita</button></div>`:"";
  const dates=rec?dcard("nd","Data inizio:")+dcard("nf","Data fine:",'<button type="button" class="ncx" data-nfclear="1" hidden>Senza scadenza</button>')+'<div class="err" id="nerr" role="alert"></div>'+`<div class="ncwrap"><div class="ncat" data-nqedit="1" role="button" tabindex="0" aria-haspopup="listbox" aria-expanded="false" aria-label="Cambia frequenza"><span class="nci">${IC_REP}</span><div class="nct"><small>Frequenza:</small><b id="nqn"></b></div><span class="ncc">${IC_DN}</span></div><div class="nchips" id="nqchips" role="listbox" hidden>${Object.keys(FQN).map(k=>`<button type="button" role="option" data-nq="${k}">${FQN[k]}</button>`).join("")}</div></div>`:dcard("nd","Scegli data:");
  $("mbody").innerHTML=`<div class="ns">${recTop}<label class="nf"><span>${rec?"Nome Movimento":"Spesa"}</span><input id="nd" class="ninp" placeholder="${rec?"Es. Affitto":"Es. Pizza"}" autocomplete="off" maxlength="60"></label>${dates}<div class="ncwrap" id="ncw"><div class="ncat" data-ncedit="1" role="button" tabindex="0" aria-haspopup="listbox" aria-expanded="false" aria-label="Cambia categoria"><span class="nci" id="nci"></span><div class="nct"><small id="ncl"></small><b id="ncn"></b></div><span class="ncc">${IC_DN}</span></div><div class="nchips" id="nchips" role="listbox" hidden>${ord().map(c=>`<button type="button" role="option" data-nc="${c}">${catIcon(c)}${c}</button>`).join("")}</div></div><div class="namt"><span id="nal">Importo</span><div class="nvv"><i>€</i><b id="nval"></b></div></div><div class="kpad">${["1","2","3","4","5","6","7","8","9",",","0","bk"].map(k=>`<button type="button" data-k="${k}"${k==="bk"?' aria-label="Cancella"':""}>${k==="bk"?IC_BK:k}</button>`).join("")}</div>${btns}</div>`;
  const dayEnd=m=>{const [y,o]=m.split("-").map(Number);return m+"-"+String(new Date(y,o,0).getDate()).padStart(2,"0")};
  if(eRc){$("ndd").value=recStart(eRc);$("nfd").value=eRc.end!==undefined?eRc.end:(eRc.to?dayEnd(eRc.to):"");$("nd").value=eRc.d}
  else{ $("ndd").value=eIt?(eIt.dt||(eIt.m+"-01")):(vm===cur?NYMD(new Date()):(vm<"2026-01"?"2026-01":vm)+"-01"); if(eIt)$("nd").value=eIt.d; if(rec)$("nfd").value=""}
  $("nd").addEventListener("input",neDesc);$("ndd").addEventListener("input",neUpdate);if(rec)$("nfd").addEventListener("input",neUpdate);
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
function openSalAmt(k){openAmount("Stipendio di "+mLong(k).toLowerCase(),"Stipendio netto",S.sals[k],1e6,v=>{if(v===null)delete S.sals[k];else S.sals[k]=v;save();render();renderSalEd()})}
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
  const keys=new Set(Object.keys(S.sals).concat(S.items.map(i=>i.m)));S.rec.forEach(r=>{if(r.t==="in")for(let k=recStart(r).slice(0,7);k<=m;k=addM(k,1))keys.add(k)});let bal=0;
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
function salOf(m){const v=salAt(m);return (v===null?0:v)+incOf(m)}
function salAt(k){const v=S.sals[k];return v===undefined?0:v}
function syncSal(){$("salary").value=salOf($("month").value)||""}
syncSal();
const MO12=Array.from({length:12},(_,i)=>{const n=new Intl.DateTimeFormat("it-IT",{month:"long"}).format(new Date(2026,i,1));return `<option value="${String(i+1).padStart(2,"0")}">${n[0].toUpperCase()+n.slice(1)}</option>`}).join("");
function renderSal(){setTimeout(lockHome,0);
  const Y=ST.y||+$("month").value.slice(0,4);
  const keys=Array.from({length:12},(_,i)=>Y+"-"+String(i+1).padStart(2,"0"));
  const ks=Object.keys(S.sals).sort(),fi=ks[0],la=ks[ks.length-1],vals=keys.map(k=>S.sals[k]!==undefined?S.sals[k]:(k>fi&&k<la?0:null)),ok=vals.filter(v=>v!==null);
  if(!ok.length){$("sline").innerHTML='<div class="empty">Nessuno stipendio inserito per questo anno: inseriscilo nella sezione Stipendio.</div>';return}
  const mx=Math.max(...ok),step=[500,1000,2000,2500,5000,10000,20000,25000,50000,100000,200000,250000,500000,1000000,2000000,5000000,10000000].find(q=>Math.floor(mx/q)+1<=8)||10000000,top=(Math.floor(mx/step)+1)*step,n=top/step,H=Math.max(150,n*28),B=20+H;
  const W=Math.max(260,Math.round($("sline").clientWidth||document.documentElement.clientWidth-84)),L=W<420?46:56,R=W<420?10:20,sp=(W-L-R)/11,fs=W<420?10:11,X=i=>L+i*sp,Yy=v=>B-v/top*H;
  const fm=x=>"€"+new Intl.NumberFormat("it-IT",{maximumFractionDigits:0}).format(x);
  const pts=vals.map((v,i)=>v===null?null:[X(i),Yy(v)]).filter(Boolean);
  const ln=pts.map(q=>q.join(",")).join(" ");
  let g="";for(let j=0;j<=n;j++){const y=B-j*H/n;g+=`<line x1="${L}" x2="${W-R}" y1="${y}" y2="${y}" stroke="rgba(255,255,255,.08)"/><text x="${L-6}" y="${y+4}" text-anchor="end" font-size="${fs}" fill="#9aa6ad">${fm(j*step)}</text>`}
  const mn=keys.map((k,i)=>`<text x="${X(i)}" y="${B+22}" text-anchor="middle" font-size="${sp<26?9.5:fs}" fill="#9aa6ad">${sp<19?MN.format(new Date(Y,i,1))[0].toUpperCase():MN.format(new Date(Y,i,1))}</text>`).join("");
  const dots=vals.map((v,i)=>{if(v===null)return"";const ent=S.sals[keys[i]]!==undefined;
    return `<circle cx="${X(i)}" cy="${Yy(v)}" r="${ent?5:4}" fill="${ent?"#7fd6e8":"#0b0e11"}" stroke="#7fd6e8" stroke-width="2"/>`+(ent?`<text x="${i===11?X(i)+5:X(i)}" y="${Yy(v)-(sp<34&&i%2?22:11)}" text-anchor="${i===11?"end":"middle"}" font-size="${sp<34?9.5:11}" font-weight="600" fill="#e8fbff">${sp<34?new Intl.NumberFormat("it-IT",{maximumFractionDigits:0}).format(v):fm(v)}</text>`:"")}).join("");
  $("sline").innerHTML=`<svg viewBox="0 0 ${W} ${B+32}" role="img" aria-label="Andamento dello stipendio nell’anno ${Y}"><defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fd6e8" stop-opacity=".3"/><stop offset="1" stop-color="#7fd6e8" stop-opacity="0"/></linearGradient></defs>${g}<polygon points="${pts[0][0]},${B} ${ln} ${pts[pts.length-1][0]},${B}" fill="url(#sg)"/><polyline points="${ln}" fill="none" stroke="#7fd6e8" stroke-width="2.5" stroke-linejoin="round"/>${dots}${mn}</svg>`;
}
function updPh(){}
function renderSalEd(){
  const Y=+$("month").value.slice(0,4);$("syr").innerHTML=Array.from({length:10},(_,i)=>`<option value="${2026+i}"${2026+i===Y?" selected":""}>${2026+i}</option>`).join("");
  const fa=n=>Number.isInteger(n)?eur(n):eur2(n);
  const n=Object.keys(S.sals).filter(k=>k.slice(0,4)===String(Y)&&S.sals[k]!==undefined).length;
  $("semini").innerHTML=`<small>Mesi inseriti</small><b>${n} / 12</b>`;
  $("sed").innerHTML='<div class="smg">'+Array.from({length:12},(_,i)=>{
    const k=Y+"-"+String(i+1).padStart(2,"0"),v=S.sals[k],t=new Intl.DateTimeFormat("it-IT",{month:"long"}).format(new Date(Y,i,1)),nm=t[0].toUpperCase()+t.slice(1);
    const cls=v!==undefined?"set":"empty",amt=v!==undefined?fa(v):"Tocca per inserire";
    return `<div class="smr"><div class="smm">${nm}</div><button type="button" class="smt ${cls}" data-sm="${k}" aria-label="Stipendio netto di ${nm.toLowerCase()} ${Y}: ${v!==undefined?amt:"non inserito"}. Tocca per modificare">${amt}</button></div>`}).join("")+"</div>";fitSal()}
function fitSal(){
  const g=document.querySelector(".smg"),card=g&&g.closest(".card"),nav=document.querySelector(".hdr nav");if(!g||!card||!nav||$("v-entrate").hidden)return;
  const gap=4,r=g.getBoundingClientRect(),c=card.getBoundingClientRect();
  const tt=card.querySelector(".eyebrow.t2");
  if(tt){tt.style.cssText="font-size:16px;letter-spacing:.04em;flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:clip";
    let fs=16;while(fs>11&&tt.scrollWidth>tt.clientWidth+0.5){fs-=.25;tt.style.fontSize=fs+"px"}document.documentElement.style.setProperty("--eyb",fs+"px")}
  g.style.setProperty("--gap",gap+"px");g.style.setProperty("--rh","40px");
  const other=card.getBoundingClientRect().height-g.getBoundingClientRect().height;
  const avail=nav.getBoundingClientRect().top-18-c.top-other;
  const rh=Math.max(26,Math.min(44,Math.floor((avail-11*gap)/12)));
  g.style.setProperty("--rh",rh+"px");setTimeout(lockHome,0)}
document.addEventListener("change",e=>{if(e.target.id==="syr"||e.target.id==="pyr"){const mm=$("month").value.slice(5,7);$("month").value=e.target.value+"-"+mm;syncSal();ensureRec();render();renderSalEd()}});
document.addEventListener("input",e=>{const k=e.target.dataset&&e.target.dataset.sm;if(!k)return;
  const v=parseFloat(e.target.value);if(isNaN(v))delete S.sals[k];else{const c=Math.min(Math.max(0,v),1e6);if(c!==v)e.target.value=c;S.sals[k]=c}save();updPh();render()});

const cgOpen={};
function fdt(i){return i.dt?i.dt.slice(8,10)+"/"+i.dt.slice(5,7)+"/"+i.dt.slice(0,4):i.m.slice(5,7)+"/"+i.m.slice(0,4)}
function openRecInfo(it){
  modal={kind:"rec-info"};
  $("mt").textContent="Spesa ricorrente";
  $("mbody").innerHTML=`<p class="mtxt"><b>${esc(it.d)}</b> è una spesa ricorrente: non si può modificare o eliminare da qui. Per gestirla vai nella sezione <b>Ricorrenti</b>.</p><div class="macts"><button type="button" class="mini" data-mclose>Chiudi</button><button type="button" class="main" data-view="ricorrenti" data-mclose>Vai a Ricorrenti</button></div>`;
  $("mod").hidden=false}
function expRow(i){return `<li class="row xr" data-rowedit="${i.id}"><span><b class="xdt">${fdt(i)}</b> ${esc(i.d)}${i.rid?' <i class="rtg">Spesa ricorrente</i>':""}</span><span class="amt">${eur2(i.a)}</span></li>`}
function renderGroups(its){
  if(!its.length)return '<li class="empty">Nessuna spesa in questo mese. Aggiungi la prima con NUOVA SPESA.</li>';
  const key=i=>i.dt||(i.m+"-01");
  return ord().map(c=>{
    const g=its.filter(i=>i.c===c).sort((a,b)=>key(a)<key(b)?1:key(a)>key(b)?-1:(a.id>b.id?-1:a.id<b.id?1:0));
    if(!g.length)return "";
    const open=!!cgOpen[c]||g.some(i=>i.id==editId),t=g.reduce((x,i)=>x+i.a,0);
    return `<li class="cg"><button type="button" class="cgh" data-cg="${c}" aria-expanded="${open}" aria-label="${c}: ${g.length} spese, totale ${eur2(t)}"><i class="dot" style="background:${COL[c]}"></i><span class="cgn">${c} <span class="cnt">${g.length}</span></span><span class="amt">${eur2(t)}</span><span class="cgc">${open?IC_UP:IC_DN}</span></button><ul class="cgl"${open?"":" hidden"}>${g.map(i=>i.id==editId?editRow(i):expRow(i)).join("")}</ul></li>`}).join("")}
function render(){
  const m=$("month").value, sal=salOf(m);
  const its=S.items.filter(i=>i.m===m);
  const paid=sum(m,i=>i.s==="paid"), plan=sum(m,i=>i.s==="plan"), tot=paid+plan, free=sal-tot;
  const pc=sal?Math.abs(free/sal*100):0;
  const e2=n=>"€"+new Intl.NumberFormat("it-IT",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
  const pf=n=>sal?(n/sal*100).toFixed(1).replace(".",",")+"% delle entrate":"Imposta lo stipendio in Entrate reali";
  
  
  $("pmo").innerHTML=Array.from({length:12},(_,i)=>cap(new Intl.DateTimeFormat("it-IT",{month:"long"}).format(new Date(2026,i,1)))).map((t,i)=>`<option value="${String(i+1).padStart(2,"0")}">${t}</option>`).join("");$("pmo").value=m.slice(5,7);$("pyr").innerHTML=Array.from({length:10},(_,i)=>`<option value="${2026+i}">${2026+i}</option>`).join("");$("pyr").value=m.slice(0,4);
  


  renderRec();renderCnt();renderTop();$("list").innerHTML=renderGroups(its);

  $("cats").innerHTML=ord().map((c,ix,arr)=>{
    const p=sum(m,i=>i.c===c&&i.s==="paid"),q=sum(m,i=>i.c===c&&i.s==="plan");
    const lim=limOf(c,sal),pc=sal?(lim/sal*100).toFixed(2).replace(".",",")+"% dello stipendio":"–",t=p+q,den=Math.max(lim,t,1),over=lim>0&&t>lim;
    return `<div class="cat"><div class="h"><span class="nm"><span class="mv"><button class="mini" data-mv="${c}" data-dir="-1" aria-label="Sposta ${c} su"${ix===0?" disabled":""}>▲</button><button class="mini" data-mv="${c}" data-dir="1" aria-label="Sposta ${c} giù"${ix===arr.length-1?" disabled":""}>▼</button></span>${c}</span><span class="${over?"over":""}">${eur(t)} / ${eur(lim)}</span></div><div class="t" style="background:${lim>0?"#1f9a5a":"var(--line)"}"><i style="width:${p/den*100}%;background:#e5484d"></i><i style="width:${q/den*100}%;background:#f4a09c"></i></div><div class="n"><span class="acts"><label class="bud">Budget €<input type="text" readonly inputmode="none" value="${S.lim[c].v}" data-lv="${c}" aria-label="Budget ${c} in euro"></label><b class="pc">${pc}</b></span><span>${over?"Oltre il limite di "+eur(t-lim):lim?"Restano "+eur(lim-t):""}</span></div></div>`}).join("");
}
function lockHome(){const r=document.documentElement;r.classList.remove("hl");if(view!=="home"&&view!=="entrate"&&view!=="statistiche")return;
  scrollTo(0,0);const last=$("v-"+view).lastElementChild,nav=document.querySelector(".hdr");if(!last||!nav)return;
  if(last.getBoundingClientRect().bottom<=nav.getBoundingClientRect().top-8)r.classList.add("hl")}
addEventListener("resize",()=>{lockHome();if(view==="statistiche")renderStats();if(view==="entrate")fitSal()});addEventListener("orientationchange",()=>setTimeout(lockHome,200));addEventListener("load",()=>setTimeout(()=>{lockHome();fitSal()},100));
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>lockHome());
function show(v){if(!$("v-"+v))return;view=v;document.documentElement.classList.toggle("nosb",v==="entrate"||v==="statistiche");setTimeout(lockHome,0);["home","entrate","ricorrenti","spese","budget","statistiche","impostazioni"].forEach(x=>$("v-"+x).hidden=x!==v);document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("on",b.dataset.view===(v==="entrate"||v==="spese"||v==="ricorrenti"?"home":v)));$("pill").hidden=v==="home"||v==="impostazioni"||v==="entrate";$("greet").hidden=v!=="home";$("mrow").style.display=v==="statistiche"||v==="impostazioni"?"none":"";if(v==="statistiche")renderStats();$("mrow").classList.toggle("sp",v==="spese"||v==="ricorrenti");(v==="ricorrenti"?$("rbar"):$("mrow")).appendChild($("pill"));if(v==="entrate")renderSalEd();if(v==="ricorrenti"){const e=$("v-entrate");e.hidden=false;e.style.visibility="hidden";renderSalEd();e.hidden=true;e.style.visibility=""}scrollTo(0,0)}
$("salary").addEventListener("input",e=>{const m=$("month").value,v=parseFloat(e.target.value);if(isNaN(v))delete S.sals[m];else S.sals[m]=Math.max(0,v);S.salary=isNaN(v)?0:Math.max(0,v);save();render()});
$("month").addEventListener("change",()=>{syncSal();ensureRec();render()});
$("f").addEventListener("submit",e=>{e.preventDefault();
  const a=parseFloat($("a").value);if(!(a>=0))return;
  S.items.push({id:Date.now(),m:$("month").value,d:cap($("d").value.trim()),a,c:$("c").value,s:$("s").value});
  save();$("d").value="";$("a").value="";render();setExpOpen(false)});

/* ---- Statistiche ---- */
const ST={mode:"m",mo:"",y:0};
$("stmo").innerHTML=MO12;
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
function renderCharts(keys,endKey){
  const m0=keys,tot=S.items.filter(i=>m0.includes(i.m)).reduce((t,i)=>t+i.a,0);
  const e2=n=>"€"+new Intl.NumberFormat("it-IT",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
  const [y,mo]=endKey.split("-").map(Number);
  const ms=Array.from({length:6},(_,k)=>new Date(y,mo-1-(5-k),1));
  const vals=ms.map(d=>sum(mk(d)));
  const mx=Math.max(...vals,1);
  $("bars").innerHTML=`<svg viewBox="0 0 300 130" role="img" aria-label="Spese negli ultimi 6 mesi">`+vals.map((v,i)=>{const h=v/mx*90;return `<rect x="${i*50+9}" y="${100-h}" width="32" height="${Math.max(h,1)}" rx="4" fill="${i===5?"#7fd6e8":"#3a8fa3"}"/><text x="${i*50+25}" y="118" text-anchor="middle" font-size="11" fill="#9aa6ad">${MN.format(ms[i])}</text>`}).join("")+`</svg>`;
  const ct=ord().map(c=>[c,S.items.filter(i=>m0.includes(i.m)&&i.c===c).reduce((t,i)=>t+i.a,0)]);
  let a=0;const seg=ct.filter(x=>x[1]>0).map(([c,v])=>{const s=a;a+=v/tot*100;return `${COL[c]} ${s}% ${a}%`});
  $("donut").style.background=tot?`conic-gradient(${seg.join(",")})`:"var(--line)";
  $("hole").innerHTML=`<b>€${new Intl.NumberFormat("it-IT",{maximumFractionDigits:0}).format(tot)}</b>totale`;
  $("lg").innerHTML=ct.filter(x=>x[1]>0).map(([c,v])=>`<li><i class="dot" style="background:${COL[c]}"></i><div><b>${c}</b><small>${e2(v)}</small></div><em>${(v/tot*100).toFixed(1).replace(".",",")}%</em></li>`).join("")||'<li class="ks">Nessuna spesa in questo periodo</li>'}
function renderStats(){setTimeout(lockHome,0);
  if(!ST.y){const n=new Date();ST.y=Math.max(2026,n.getFullYear());ST.mo=String(n.getMonth()+1).padStart(2,"0")}
  document.querySelectorAll("[data-stm]").forEach(b=>b.classList.toggle("on",b.dataset.stm===ST.mode));
  $("scard").style.display=ST.mode==="a"?"":"none";if(ST.mode==="a")renderSal();
  {const nw=new Date(),cur=nw.getFullYear()===ST.y?String(nw.getMonth()+1).padStart(2,"0"):"12";
   if(ST.mode==="m")renderCharts([ST.y+"-"+ST.mo],ST.y+"-"+ST.mo);
   else renderCharts(Array.from({length:12},(_,i)=>ST.y+"-"+String(i+1).padStart(2,"0")),ST.y+"-"+cur)}
  $("stmo").value=ST.mo;$("sty").value=String(ST.y);$("stmo").hidden=ST.mode!=="m";$("stmo").parentNode.classList.toggle("one",ST.mode!=="m");
  const mo=ST.mode==="m";$("sth").textContent=mo?"Riepilogo mese":"Riepilogo anno";$("stct").textContent=mo?"Saldo mensile":"Saldo annuale";
  const D=stData(),f2=n=>eur2(n);
  if(D.empty){$("stsum").innerHTML='<div class="empty">'+D.empty+'</div>';$("stchart").innerHTML="";$("stchip").hidden=true;return}
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
}
$("stmo").addEventListener("change",e=>{ST.mo=e.target.value;renderStats()});
$("sty").addEventListener("change",e=>{ST.y=+e.target.value;renderStats()});
document.addEventListener("click",e=>{
  if(modal&&modal.kind==="new-exp-sheet"){
    const sm=e.target.closest&&e.target.closest("#ndsum,#nfsum");
    if(sm){const p=sm.id.slice(0,2);wClose(p==="nd"?"nf":"nd");wOpen(p);ncClose()}
    else["nd","nf"].forEach(p=>{const w=$(p+"w");if(w&&!w.hidden&&!e.target.closest("#"+p+"w"))wClose(p)});
    const hit=e.target.closest&&e.target.closest(".ncat[data-ncedit],.ncat[data-nqedit]");
    if(hit){const id=hit.hasAttribute("data-ncedit")?"nchips":"nqchips",n=$(id);if(n){const o=n.hidden;wClose("nd");wClose("nf");ncClose(id);n.hidden=!o;hit.setAttribute("aria-expanded",o)}}
    else if(!e.target.closest(".nchips"))ncClose()}
  const t=e.target.closest?(e.target.closest("button,[data-view]")||e.target):e.target;
  if(!e.target.closest("button,input,select,a")){const rx=e.target.closest("li[data-recedit]");if(rx){openNewExp(true,rx.dataset.recedit);return}const xr=e.target.closest("li[data-rowedit]");if(xr){const it=S.items.find(i=>i.id==xr.dataset.rowedit);if(it&&it.rid)openRecInfo(it);else openNewExp(false,xr.dataset.rowedit);return}}
  if(t.dataset.view)show(t.dataset.view);
  if(t.dataset.stm){ST.mode=t.dataset.stm;renderStats()}
  if(t.dataset.tg2)setExpOpen($("f").hidden);
  if(t.dataset.nm&&ne){ne.dm=t.dataset.nm;if(ne.dm==="pick"&&!$("ndd").value)$("ndd").value=NYMD(new Date());neUpdate()}
  if(t.dataset.ns&&ne){ne.st=t.dataset.ns;neUpdate()}
  if(t.dataset.k&&ne)nePress(t.dataset.k);
  if(t.dataset.nt&&ne){ne.t=t.dataset.nt;neUpdate()}
  if(t.dataset.nq&&ne){ne.f=t.dataset.nq;ncClose();neUpdate()}
  if(t.dataset.nfclear&&ne){$("nfd").value="";const w=$("nfw");if(w){delete w.dataset.val;wClose("nf")}neUpdate()}
  if(t.dataset.nc&&ne){ne.cat=t.dataset.nc;ne.manual=true;ne.sug=false;ncClose();neUpdate()}
  if(t.dataset.nsave&&ne)neSave();
  if(t.dataset.sm!==undefined)openSalAmt(t.dataset.sm);
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
  if(t.dataset.pick&&$("imf"))$("imf").click();
  if(t.dataset.new)openNewExp(t.dataset.new==="rec");
  if(t.dataset.redit)openNewExp(true,t.dataset.redit);
  if(t.dataset.mclose!==undefined||t.id==="mod")closeModal();
  if(t.dataset.mdel&&modal){if(modal.kind==="del-rec"){S.rec=S.rec.filter(r=>r.id!==modal.id);const nw=mk(new Date());S.items=S.items.filter(i=>!(i.rid===modal.id&&(i.s==="plan"||i.m>nw)))}else{const it=S.items.find(i=>i.id==modal.id);if(it&&it.rid){const r=S.rec.find(x=>x.id===it.rid);if(r)(r.skip=r.skip||[]).push(it.m)}S.items=S.items.filter(i=>i.id!=modal.id)}save();closeModal();render()}
  if(t.dataset.yr){const [yy,mm]=$("month").value.split("-"),ny=+yy+parseInt(t.dataset.yr);if(ny>=2026){$("month").value=ny+"-"+mm;syncSal();ensureRec();render();renderSalEd()}}
  if(t.dataset.mv){const o=ord(),i=o.indexOf(t.dataset.mv),j=i+parseInt(t.dataset.dir);if(j>=0&&j<o.length){[o[i],o[j]]=[o[j],o[i]];S.order=o;save();render()}}
  if(t.dataset.cg){cgOpen[t.dataset.cg]=!cgOpen[t.dataset.cg];render();lockHome()}
  if(t.dataset.edit)openNewExp(false,t.dataset.edit);
  if(t.dataset.nedel&&ne&&ne.edit!==null)openConfirm(ne.rec?"del-rec":"del-exp",ne.edit);
  if(t.dataset.mreq&&modal&&modal.kind==="edit-exp"){openConfirm("del-exp",modal.id)}
  if(t.dataset.cancel){editId=null;render()}
  if(t.dataset.save){const li=t.closest("li"),it=S.items.find(i=>i.id==t.dataset.save);const v=k=>li.querySelector('[data-f="'+k+'"]').value;const a=parseFloat(v("a"));if(it&&v("d").trim()&&a>=0){it.d=cap(v("d").trim());it.a=a;it.c=v("c");editId=null;save();render()}}
  if(t.dataset.del)openConfirm("del-exp",t.dataset.del);
  if(t.dataset.rdel)openConfirm("del-rec",t.dataset.rdel);
});
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
