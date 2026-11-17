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
  $("rec").innerHTML=S.rec.length?S.rec.map(r=>`<li class="row"><span>${esc(r.d)}</span><span class="amt">${eur2(r.a)}/mese</span><span class="acts"><button class="mini ic" data-redit="${r.id}" aria-label="Modifica ${esc(r.d)}" title="Modifica">${IC_EDIT}</button><button class="mini ic del" data-rdel="${r.id}" aria-label="Elimina ${esc(r.d)}" title="Elimina">${IC_DEL}</button></span><small>${r.c}, dal ${ml(r.from)} ${r.to?"al "+ml(r.to):"senza scadenza"}</small></li>`).join(""):'<li class="empty">Nessuna spesa ricorrente.</li>'}
$("rc").innerHTML=$("c").innerHTML;
const MOPT=Array.from({length:60},(_,i)=>{const d=new Date(2026,i,1),n=new Intl.DateTimeFormat("it-IT",{month:"long",year:"numeric"}).format(d);return `<option value="${mk(d)}">${n[0].toUpperCase()+n.slice(1)}</option>`}).join("");
$("rm").innerHTML=MOPT;$("rt").innerHTML='<option value="">Senza scadenza</option>'+MOPT;$("rm").value=mk(new Date());
const chkR=()=>$("rt").setCustomValidity($("rt").value&&$("rt").value<$("rm").value?"Il mese finale deve essere uguale o successivo a quello iniziale":"");
$("rm").addEventListener("change",chkR);$("rt").addEventListener("change",chkR);
const IC_DEL='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/><path d="M10 11v6M14 11v6"/></svg>';
const IC_EDIT='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>';
const IC_UP='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>';
const IC_DN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
function applyCol(){
  [["rec","rec","le spese ricorrenti"],["exp","list","le spese del mese"]].forEach(([k,id,n])=>{
    const c=!!(S.col&&S.col[k]),b=document.querySelector('[data-col="'+k+'"]');
    $(id).hidden=c;b.innerHTML=c?IC_DN:IC_UP;b.setAttribute("aria-expanded",!c);
    b.setAttribute("aria-label",(c?"Espandi ":"Comprimi ")+n);b.title=c?"Espandi":"Comprimi"})}
function renderCnt(){const m=$("month").value;$("rcnt").textContent=S.rec.length;$("ecnt").textContent=S.items.filter(i=>i.m===m).length}
applyCol();
function setExpOpen(o){$("f").hidden=!o;const b=$("etg");b.textContent=o?"−":"+";b.setAttribute("aria-expanded",o);b.setAttribute("aria-label",o?"Chiudi senza aggiungere":"Aggiungi spesa");if(o){$("d").focus()}else{$("f").reset()}}
let modal=null;
function closeModal(){$("mod").hidden=true;modal=null;$("mbody").innerHTML=""}
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
  const items=d.items.filter(i=>i&&i.id!==undefined&&typeof i.d==="string"&&typeof i.c==="string"&&typeof i.a==="number"&&typeof i.m==="string"&&ok.test(i.m)).map(i=>({...i,d:cl(i.d),c:cl(i.c),s:i.s==="paid"?"paid":"plan"}));
  const rec=(Array.isArray(d.rec)?d.rec:[]).filter(r=>r&&typeof r.id==="string"&&typeof r.d==="string"&&typeof r.c==="string"&&typeof r.a==="number"&&typeof r.from==="string"&&ok.test(r.from)&&(!r.to||ok.test(r.to))).map(r=>({...r,id:cl(r.id),d:cl(r.d),c:cl(r.c)}));
  const sals={};if(d.sals&&typeof d.sals==="object")Object.keys(d.sals).forEach(k=>{if(ok.test(k)&&typeof d.sals[k]==="number")sals[k]=d.sals[k]});
  const lim={};if(d.lim&&typeof d.lim==="object")Object.keys(d.lim).forEach(k=>{const L=d.lim[k];if(L&&["eur","pct","rest"].includes(L.t)&&typeof L.v==="number")lim[cl(k)]=L});
  return {salary:typeof d.salary==="number"?d.salary:0,pct:{...CATS},items,rec,sals,lim,order:(Array.isArray(d.order)?d.order.map(cl):[]),col:{rec:!!(d.col&&d.col.rec),exp:!!(d.col&&d.col.exp)},recSeeded:true,recSeeded2:true,limV2:d.limV2===true}}
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
function setRecOpen(o){$("rf").hidden=!o;const b=$("rtg");b.textContent=o?"−":"+";b.setAttribute("aria-expanded",o);b.setAttribute("aria-label",o?"Chiudi senza aggiungere":"Aggiungi spesa ricorrente");if(o){$("rd").value="";$("ra").value="";$("rm").value=mk(new Date());$("rt").value="";chkR();$("rd").focus()}else{$("rf").reset();chkR()}}
$("rf").addEventListener("submit",e=>{e.preventDefault();const a=parseFloat($("ra").value);if(!(a>=0)||!$("rm").value)return;
  S.rec.push({id:"r"+Date.now(),d:$("rd").value.trim(),a,c:$("rc").value,from:$("rm").value,to:$("rt").value||""});
  save();$("rd").value="";$("ra").value="";ensureRec();render();setRecOpen(false)});
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
    return `<label class="sm"><span>${MN.format(new Date(Y,i,1))} ${Y}</span><input type="number" min="0" max="1000000" step="10" inputmode="decimal" data-sm="${k}" value="${S.sals[k]!==undefined?S.sals[k]:""}" aria-label="Stipendio netto di ${MN.format(new Date(Y,i,1))} ${Y}"></label>`}).join("");updPh()}
document.addEventListener("input",e=>{const k=e.target.dataset&&e.target.dataset.sm;if(!k)return;
  const v=parseFloat(e.target.value);if(isNaN(v))delete S.sals[k];else{const c=Math.min(Math.max(0,v),1e6);if(c!==v)e.target.value=c;S.sals[k]=c}save();updPh();render()});

function render(){
  const m=$("month").value, sal=salOf(m);
  const its=S.items.filter(i=>i.m===m);
  const paid=sum(m,i=>i.s==="paid"), plan=sum(m,i=>i.s==="plan"), tot=paid+plan, free=sal-tot;
  const pc=sal?Math.abs(free/sal*100):0;
  const e2=n=>"€"+new Intl.NumberFormat("it-IT",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
  const pf=n=>sal?(n/sal*100).toFixed(1).replace(".",",")+"% delle entrate":"Imposta lo stipendio in Entrate reali";
  $("k2").textContent=e2(sal);
  $("k3").textContent=e2(tot);$("k3s").textContent=pf(tot);
  $("k1").textContent=e2(free);$("k1").className="kv"+(free<0?" dn":"");
  $("k4").textContent=e2(plan);$("k4s").textContent=sal?pf(plan).replace("entrate","entrate, ancora da pagare"):"Spese non ancora pagate";
  $("pill").innerHTML=Array.from({length:12},(_,i)=>new Intl.DateTimeFormat("it-IT",{month:"long"}).format(new Date(2026,i,1)).toUpperCase()+" "+m.slice(0,4)).map((t,i)=>`<option value="${String(i+1).padStart(2,"0")}">${t}</option>`).join("");$("pill").value=m.slice(5,7);
  $("yr").textContent="Cruscotto personale "+new Date().getFullYear();
  $("upd").textContent="Aggiornato al "+new Intl.DateTimeFormat("it-IT",{day:"numeric",month:"short",year:"numeric"}).format(new Date());
  const ap=sal?Math.round(tot/sal*100):0;$("artpct").textContent=sal?ap+"%":"–";$("artarc").setAttribute("stroke-dasharray",Math.min(100,ap)*2.388+" 240");

  const [y,mo]=m.split("-").map(Number);
  const ms=Array.from({length:6},(_,k)=>new Date(y,mo-1-(5-k),1));
  const vals=ms.map(d=>sum(mk(d)));
  const mx=Math.max(...vals,1);
  $("bars").innerHTML=`<svg viewBox="0 0 300 130" role="img" aria-label="Spese negli ultimi 6 mesi">`+vals.map((v,i)=>{const h=v/mx*90;return `<rect x="${i*50+9}" y="${100-h}" width="32" height="${Math.max(h,1)}" rx="4" fill="${i===5?"#7fd6e8":"#3a8fa3"}"/><text x="${i*50+25}" y="118" text-anchor="middle" font-size="11" fill="#9aa6ad">${MN.format(ms[i])}</text>`}).join("")+`</svg>`;

  let acc=0;const pts=ms.map(d=>{const k=mk(d);if(S.items.some(i=>i.m===k))acc+=salOf(k)-sum(k);return acc});
  const lo=Math.min(...pts,0),hi=Math.max(...pts,1),rg=(hi-lo)||1;
  const xy=pts.map((p,i)=>[20+i*(560/5),100-(p-lo)/rg*80]);
  const ln=xy.map(p=>p.join(",")).join(" ");
  $("line").innerHTML=`<svg viewBox="0 0 600 130" role="img" aria-label="Risparmio accumulato"><defs><linearGradient id="gg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fd6e8" stop-opacity=".35"/><stop offset="1" stop-color="#7fd6e8" stop-opacity="0"/></linearGradient></defs><polygon points="${xy[0][0]},110 ${ln} ${xy[5][0]},110" fill="url(#gg)"/><polyline points="${ln}" fill="none" stroke="#7fd6e8" stroke-width="2.5" stroke-linejoin="round"/>`+xy.map((p,i)=>`<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="#7fd6e8"/><text x="${p[0]}" y="126" text-anchor="middle" font-size="11" fill="#9aa6ad">${MN.format(ms[i])}</text>`).join("")+`</svg><div class="sub">Ora: <b style="color:var(--ink)">${eur(pts[5])}</b> (stipendio meno spese, nei mesi con spese registrate)</div>`;

  const ct=ord().map(c=>[c,sum(m,i=>i.c===c)]);
  let a=0;const seg=ct.filter(x=>x[1]>0).map(([c,v])=>{const s=a;a+=v/tot*100;return `${COL[c]} ${s}% ${a}%`});
  $("donut").style.background=tot?`conic-gradient(${seg.join(",")})`:"var(--line)";
  $("hole").innerHTML=`<b>€${new Intl.NumberFormat("it-IT",{maximumFractionDigits:0}).format(tot)}</b>totale`;
  $("mchip").value=m.slice(5,7);
  $("lg").innerHTML=ct.filter(x=>x[1]>0).map(([c,v])=>`<li><i class="dot" style="background:${COL[c]}"></i><div><b>${c}</b><small>${e2(v)}</small></div><em>${(v/tot*100).toFixed(1).replace(".",",")}%</em></li>`).join("")||'<li class="ks">Nessuna spesa in questo mese</li>';

  renderRec();renderSal();renderCnt();$("list").innerHTML=its.length?its.slice().reverse().map(i=>i.id==editId?editRow(i):`<li class="row"><span>${esc(i.d)}</span><span class="amt">${eur2(i.a)}</span><span class="acts"><button class="mini ic" data-edit="${i.id}" aria-label="Modifica ${esc(i.d)}" title="Modifica">${IC_EDIT}</button><button class="mini ic del" data-del="${i.id}" aria-label="Elimina ${esc(i.d)}" title="Elimina">${IC_DEL}</button></span><small>${i.c} ${i.s==="plan"?'<span class="tag">preventivata</span> <button class="mini" data-pay="'+i.id+'">Segna come pagata</button>':'<span class="tag paid">pagata</span> <button class="mini" data-unpay="'+i.id+'">Segna come preventivata</button>'}</small></li>`).join(""):'<li class="empty">Nessuna spesa in questo mese. Aggiungi la prima qui sopra.</li>';

  $("cats").innerHTML=ord().map((c,ix,arr)=>{
    const p=sum(m,i=>i.c===c&&i.s==="paid"),q=sum(m,i=>i.c===c&&i.s==="plan");
    const lim=limOf(c,sal),pc=sal?(lim/sal*100).toFixed(2).replace(".",",")+"% dello stipendio":"–",t=p+q,den=Math.max(lim,t,1),over=lim>0&&t>lim;
    return `<div class="cat"><div class="h"><span class="nm"><span class="mv"><button class="mini" data-mv="${c}" data-dir="-1" aria-label="Sposta ${c} su"${ix===0?" disabled":""}>▲</button><button class="mini" data-mv="${c}" data-dir="1" aria-label="Sposta ${c} giù"${ix===arr.length-1?" disabled":""}>▼</button></span>${c}</span><span class="${over?"over":""}">${eur(t)} / ${eur(lim)}</span></div><div class="t" style="background:${lim>0?"#1f9a5a":"var(--line)"}"><i style="width:${p/den*100}%;background:#e5484d"></i><i style="width:${q/den*100}%;background:#f4a09c"></i></div><div class="n"><span class="acts"><label class="bud">Budget €<input type="number" min="0" step="any" value="${S.lim[c].v}" data-lv="${c}" aria-label="Budget ${c} in euro"></label><b class="pc">${pc}</b></span><span>${over?"Oltre il limite di "+eur(t-lim):lim?"Restano "+eur(lim-t):""}</span></div></div>`}).join("");
}
function show(v){view=v;["home","entrate","spese","budget"].forEach(x=>$("v-"+x).hidden=x!==v);document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("on",b.dataset.view===(v==="entrate"?"home":v)));$("pill").hidden=v==="entrate";if(v==="entrate")renderSalEd();scrollTo(0,0)}
$("salary").addEventListener("input",e=>{const m=$("month").value,v=parseFloat(e.target.value);if(isNaN(v))delete S.sals[m];else S.sals[m]=Math.max(0,v);S.salary=isNaN(v)?0:Math.max(0,v);save();render()});
$("month").addEventListener("change",()=>{syncSal();ensureRec();render()});
$("f").addEventListener("submit",e=>{e.preventDefault();
  const a=parseFloat($("a").value);if(!(a>=0))return;
  S.items.push({id:Date.now(),m:$("month").value,d:$("d").value.trim(),a,c:$("c").value,s:$("s").value});
  save();$("d").value="";$("a").value="";render();setExpOpen(false)});
document.addEventListener("click",e=>{
  const t=e.target.closest?(e.target.closest("button,[data-view]")||e.target):e.target;
  if(t.dataset.view)show(t.dataset.view);
  if(t.dataset.tg)setRecOpen($("rf").hidden);
  if(t.dataset.tg2)setExpOpen($("f").hidden);
  if(t.dataset.reload)location.reload();
  if(t.dataset.reset){if(t.dataset.sure){try{localStorage.removeItem(KEY)}catch(e){}location.reload()}else{t.dataset.sure="1";t.textContent="Conferma: cancella tutto"}}
  if(t.dataset.exp)openExport();
  if(t.dataset.imp)openImport();
  if(t.dataset.excopy){const ta=$("exa");ta.select();let ok=false;try{ok=document.execCommand("copy")}catch(e){}t.textContent=ok?"Copiato":"Copia a mano"}
  if(t.dataset.exdl){const b=new Blob([$("exa").value],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="spese-backup-"+mk(new Date())+".json";document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)}
  if(t.dataset.imgo)doImport();
  if(t.dataset.col){S.col=S.col||{};S.col[t.dataset.col]=!S.col[t.dataset.col];save();applyCol()}
  if(t.dataset.new)openModal(t.dataset.new==="rec"?"new-rec":"new-exp");
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
