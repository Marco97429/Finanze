const CATS={Casa:30,Bollette:8,Macchina:10,Cibo:15,Vacanze:8,Regali:4,Telefono:3};
/* Notifiche e Face ID (tutto locale) */
const LSG=k=>{try{return localStorage.getItem(k)}catch(e){return null}},LSS=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
let NOTI=LSG("spese-noti-v1")==="1",AUTH=LSG("spese-auth-v1")||"",LKT=0,LKB=false;
const b64u=b=>{let s="";new Uint8Array(b).forEach(c=>s+=String.fromCharCode(c));return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")};
const unb64u=s=>{s=s.replace(/-/g,"+").replace(/_/g,"/");while(s.length%4)s+="=";const r=atob(s),u=new Uint8Array(r.length);for(let i=0;i<r.length;i++)u[i]=r.charCodeAt(i);return u};
let _tt=0;function toast(m){let t=document.getElementById("toast");if(!t){t=document.createElement("div");t.id="toast";t.setAttribute("role","status");document.body.appendChild(t)}t.textContent=m;t.classList.add("on");clearTimeout(_tt);_tt=setTimeout(()=>t.classList.remove("on"),4200)}
const notiOk=()=>"Notification" in window&&"serviceWorker" in navigator;
function syncNoti(){const on=NOTI&&notiOk()&&Notification.permission==="granted";const t=document.getElementById("ntg");if(t)t.setAttribute("aria-checked",on?"true":"false");const v=document.querySelector('[data-set="Notifications"] .sv');if(v)v.textContent=on?"On":"Off"}
function syncAuth(){const t=document.getElementById("atg");if(t)t.setAttribute("aria-checked",AUTH?"true":"false")}
async function showNoti(title,body,tag){const reg=await navigator.serviceWorker.ready;await reg.showNotification(title,{body,tag,icon:"icons/icon-192.png",badge:"icons/icon-192.png"})}
function dueLines(){
  const now=new Date(),pd=n=>String(n).padStart(2,"0"),td=now.getFullYear()+"-"+pd(now.getMonth()+1)+"-"+pd(now.getDate());
  const mo=document.getElementById("month"),old=mo.value;let L=[];
  try{mo.value=mk(now);L=buildNotes().map(n=>n.x)}catch(e){}finally{mo.value=old}
  const due=S.sch.filter(x=>x.t==="out"&&x.dt<=td);
  if(due.length)L.push("Hai "+due.length+(due.length===1?" spesa programmata":" spese programmate")+" in scadenza ("+eur2(due.reduce((t,x)=>t+x.a,0))+").");
  return L}
async function dailyNoti(){
  if(!NOTI||!notiOk()||Notification.permission!=="granted")return;
  const n=new Date(),d=n.getFullYear()+"-"+n.getMonth()+"-"+n.getDate();if(LSG("spese-noti-last")===d)return;
  const L=dueLines();if(!L.length)return;LSS("spese-noti-last",d);
  try{await showNoti("Le mie spese",L.slice(0,3).join("\n"),"spese-giorno")}catch(e){}}
function noteToggle(t){
  if(t.getAttribute("aria-checked")!=="true"){NOTI=false;LSS("spese-noti-v1","0");syncNoti();return}
  if(!notiOk()){t.setAttribute("aria-checked","false");toast("Per ricevere le notifiche aggiungi prima l’app alla schermata Home (iOS 16.4 o successivo).");return}
  const ok=p=>{if(p==="granted"){NOTI=true;LSS("spese-noti-v1","1");syncNoti();showNoti("Le mie spese","Notifiche attivate.","spese-on").catch(()=>{})}else{NOTI=false;LSS("spese-noti-v1","0");syncNoti();toast("Notifiche non consentite: abilitale dalle impostazioni del telefono.")}};
  try{const r=Notification.requestPermission(ok);if(r&&r.then)r.then(ok)}catch(e){syncNoti();toast("Notifiche non disponibili su questo dispositivo.")}}
const hasWA=()=>!!(window.PublicKeyCredential&&navigator.credentials&&navigator.credentials.create&&window.isSecureContext);
async function waRegister(){
  const c=await navigator.credentials.create({publicKey:{challenge:crypto.getRandomValues(new Uint8Array(32)),rp:{name:"Le mie spese",id:location.hostname},user:{id:crypto.getRandomValues(new Uint8Array(16)),name:"utente",displayName:"Utente"},pubKeyCredParams:[{type:"public-key",alg:-7},{type:"public-key",alg:-257}],authenticatorSelection:{authenticatorAttachment:"platform",userVerification:"required",residentKey:"discouraged"},timeout:60000,attestation:"none"}});
  return b64u(c.rawId)}
async function waVerify(id){
  await navigator.credentials.get({publicKey:{challenge:crypto.getRandomValues(new Uint8Array(32)),rpId:location.hostname,allowCredentials:[{type:"public-key",id:unb64u(id),transports:["internal"]}],userVerification:"required",timeout:60000}});return true}
function authToggle(t){
  const wantOn=t.getAttribute("aria-checked")==="true";
  if(wantOn){
    if(!hasWA()){t.setAttribute("aria-checked","false");toast("Face ID non è disponibile su questo dispositivo.");return}
    waRegister().then(id=>{AUTH=id;LSS("spese-auth-v1",id);syncAuth();toast("Blocco con Face ID attivato.")}).catch(()=>{AUTH="";syncAuth();toast("Attivazione di Face ID annullata.")})
  }else if(AUTH){
    t.setAttribute("aria-checked","true");
    waVerify(AUTH).then(()=>{AUTH="";LSS("spese-auth-v1","");syncAuth();toast("Blocco con Face ID disattivato.")}).catch(()=>{syncAuth();toast("Verifica non riuscita: il blocco resta attivo.")})}}
function lockShow(){const l=document.getElementById("lock");if(l)l.hidden=false}
function lockHide(){const l=document.getElementById("lock");if(l)l.hidden=true}
async function tryUnlock(){
  if(!AUTH){lockHide();return}
  if(LKB)return;LKB=true;
  try{await waVerify(AUTH);lockHide();LKT=0}catch(e){lockShow()}finally{LKB=false}}
function lockInit(){
  const b=document.getElementById("lkb");if(b)b.addEventListener("click",tryUnlock);
  if(AUTH){lockShow();tryUnlock()}else lockHide();
  document.addEventListener("visibilitychange",()=>{
    if(document.hidden){if(AUTH){lockShow();LKT=LKT||Date.now()}}
    else{
      if(AUTH){if(LKT&&Date.now()-LKT<30000){lockHide();LKT=0}else tryUnlock()}
      dailyNoti()}})}

/* Number Entry demo */
let NEM=(()=>{try{return localStorage.getItem("spese-nem-v1")==="1"?"1":"2"}catch(e){return"2"}})(),NA="",NC=0;
const NK_CHK='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3.5" fill="#fff"/><path d="M8.2 12.4l2.6 2.6 5-5.4" fill="none" stroke="#1a1b1f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',NK_BK='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5.5-7z" fill="#fff"/><path d="M11.5 9.5l4 4M15.5 9.5l-4 4" stroke="#1a1b1f" stroke-width="1.8" stroke-linecap="round"/></svg>';
function nemRender(){const t1=NEM==="1";
  document.querySelectorAll("[data-nem]").forEach(b=>b.classList.toggle("on",b.dataset.nem===NEM));
  $("nth").textContent=t1?'"Virgola automatica"':'"Virgola manuale"';
  $("ntd").textContent=t1?"Se non hai voglia di inserire la virgola, ci penso io.":"Se i tuoi importi sono di solito numeri interi, questa opzione è raccomandata per te. In caso di importi con decimali, dovrai inserire la virgola per specificarli.";
  $("nda").innerHTML='<span class="ncur">'+SYM+'</span>'+(t1?(NC/100).toFixed(2):(NA||"0")).replace(".",",");
  $("ndb").hidden=true;
  const kc=$("nkp"),cf=$("nkc");kc.className="kpad";cf.hidden=false;
  let g="";for(let n=1;n<=9;n++)g+='<button type="button" data-nk="'+n+'">'+n+'</button>';
  g+=(t1?'<span></span>':'<button type="button" data-nk="dot">,</button>')+'<button type="button" data-nk="0">0</button><button type="button" data-nk="bk" aria-label="Cancella">'+IC_BK+'</button>';
  kc.innerHTML=g;cf.innerHTML="<span>Conferma</span>"+IC_OK;
  const v=document.querySelector('[data-set="Number Entry"] .sv');if(v)v.textContent="Tipo "+NEM}
function setNem(m){NEM=m;NA="";NC=0;try{localStorage.setItem("spese-nem-v1",m)}catch(e){}nemRender()}
function nkPress(k){
  if(k==="ok"){NA="";NC=0}
  else if(NEM==="1"){if(k==="bk")NC=Math.floor(NC/10);else if(/^\d$/.test(k)&&String(NC).length<9)NC=NC*10+(+k)}
  else{if(k==="bk")NA=NA.slice(0,-1);else if(k==="dot"){if(NA.indexOf(".")<0&&NA.length<9)NA=(NA||"0")+"."}else if(/^\d$/.test(k)&&NA.length<9){if(!(NA==="0"&&k==="0")){NA=(NA==="0"?"":NA)+k}}}
  nemRender()}

/* Currency: elenco, selezione e aggiornamento tassi */
let curBusy=false;
function curName(c){try{const n=new Intl.DisplayNames("it",{type:"currency"}).of(c);return n&&n!==c?n.charAt(0).toLocaleUpperCase("it")+n.slice(1):c}catch(e){return c}}
function curSync(){const v=$("curv");if(v)v.textContent=CUR;MODES[0][1]=SYM}
function curList(){const l=$("culist");if(!l)return;
  const ks=Object.keys(RT).filter(k=>RT[k]>0&&k!=="EUR").sort();ks.unshift("EUR");
  l.innerHTML=ks.map(k=>`<button type="button" class="sr ao${k===CUR?" sel":""}" data-cur="${k}"><b class="cc">${k}</b><span class="cn">${esc(curName(k))}${k==="EUR"?" (Default)":""}</span><svg class="ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`).join("");
  const d=new Date(RDATE+"T12:00:00");
  $("cun").textContent="Gli importi restano salvati in euro: la conversione è solo di visualizzazione. Tassi di cambio del "+(isNaN(d)?RDATE:new Intl.DateTimeFormat("it-IT",{day:"numeric",month:"long",year:"numeric"}).format(d))+". Con la connessione i tassi si aggiornano da soli e compaiono altre valute; viene richiesto solo l\u2019elenco pubblico dei tassi, nessun tuo dato viene inviato."}
function curPick(c){if(!(RT[c]>0))return;CUR=c;try{localStorage.setItem(CURK,c)}catch(e){}curBuild();curSync();curList();nemRender();reAll();
  const it=document.querySelector('#culist .sel');if(it&&it.scrollIntoView)it.scrollIntoView({block:"nearest"})}
function curApply(j){/* j: {date, eur:{usd:..}} */
  if(!j||typeof j.date!=="string"||!j.eur||!(j.eur.usd>0.2&&j.eur.usd<5))return false;
  let ok=new Set(["EUR"]);try{Intl.supportedValuesOf("currency").forEach(c=>ok.add(c))}catch(e){Object.keys(BASE_R).forEach(c=>ok.add(c))}
  const r={};Object.keys(j.eur).forEach(k=>{const K=k.toUpperCase(),v=j.eur[k];if(K!=="EUR"&&ok.has(K)&&typeof v==="number"&&isFinite(v)&&v>0)r[K]=v});
  if(Object.keys(r).length<10)return false;r.EUR=1;
  RT={...BASE_R,...r};RDATE=j.date;try{localStorage.setItem(RATEK,JSON.stringify({d:j.date,r}));localStorage.setItem(RATET,String(Date.now()))}catch(e){}
  return true}
async function curRefresh(minAge){
  if(curBusy)return;let last=0;try{last=+localStorage.getItem(RATET)||0}catch(e){}
  if(Date.now()-last<minAge)return;curBusy=true;
  const urls=["https://latest.currency-api.pages.dev/v1/currencies/eur.json","https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json"];
  try{for(const u of urls){try{const ac=new AbortController(),to=setTimeout(()=>ac.abort(),9000);
      const r=await fetch(u,{method:"GET",cache:"no-store",credentials:"omit",referrerPolicy:"no-referrer",signal:ac.signal});clearTimeout(to);
      if(!r.ok)continue;if(curApply(await r.json())){const keep=CUR;curBuild();curSync();if($("v-currency")&&!$("v-currency").hidden)curList();if(keep!=="EUR")reAll();return}}catch(e){}}}
  finally{curBusy=false}}
function curOpen(){curList();curRefresh(36e5);const it=document.querySelector('#culist .sel');if(it&&it.scrollIntoView)it.scrollIntoView({block:"center"})}
function curInit(){curSync();if(CUR!=="EUR")curRefresh(864e5)}

const SUBV=["appearance","appicon","notif","numentry","currency"];

const COL_L={Casa:"#0e9db6",Macchina:"#4f8df7",Cibo:"#f2a33a",Telefono:"#8a6df0",Bollette:"#e86f7c",Vacanze:"#2fb98a",Regali:"#9aa5bd"},COL_D={Casa:"#a8e8f6",Macchina:"#5ec5dc",Cibo:"#3aa0b8",Telefono:"#2f7f93",Bollette:"#7f9ba6",Vacanze:"#5b707a",Regali:"#3d4d55"};
const COL={...COL_L};
const TH_L={mute:"#6c7792",grid:"rgba(40,60,110,.1)",gridZ:"rgba(40,60,110,.35)",acc:"#0e9db6",dotIn:"#fff",lbl:"#1b2333",bar:"#a7dbe7",dotS:"#fff"},TH_D={mute:"#9aa6ad",grid:"rgba(255,255,255,.08)",gridZ:"rgba(255,255,255,.28)",acc:"#7fd6e8",dotIn:"#0b0e11",lbl:"#e8fbff",bar:"#3a8fa3",dotS:"#0b0e11"};
let TC=TH_L,DK=false;
const IC_MOON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/></svg>',IC_SUN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
function applyTheme(dk,re){DK=!!dk;const l=document.getElementById("thL");if(l)l.disabled=DK;
  Object.keys(COL).forEach(k=>{COL[k]=(DK?COL_D:COL_L)[k]});TC=DK?TH_D:TH_L;
  document.documentElement.classList.toggle("dk",DK);
  const m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",DK?"#07090c":"#f2f5fb");
  const b=document.getElementById("tptheme");if(b){b.innerHTML=DK?IC_SUN:IC_MOON;b.setAttribute("aria-label",DK?"Passa al tema chiaro":"Attiva Dark mode");b.setAttribute("aria-pressed",DK?"true":"false")}
  if(re)["render","renderRec","renderInc","renderCal","renderSal","renderSalEd","renderStats"].forEach(f=>{try{if(typeof window[f]==="function")window[f]()}catch(e){}})}
function themePref(){try{const v=localStorage.getItem("spese-theme-v1");return v==="dark"?"dark":"light"}catch(e){return"light"}}
function syncAppr(){const p=themePref();document.querySelectorAll("[data-tp]").forEach(r=>r.classList.toggle("sel",r.dataset.tp===p));const v=document.querySelector('[data-set="Appearance"] .sv');if(v)v.textContent=p==="dark"?"Scuro":"Chiaro"}
function setPref(p,re){try{localStorage.setItem("spese-theme-v1",p)}catch(e){}applyTheme(p==="dark",re);syncAppr()}
const KEY="spese-dashboard-v1";
let S={salary:0,pct:{...CATS},items:[]};
try{const r=localStorage.getItem(KEY);if(r){const p=JSON.parse(r);S={...S,...p,pct:{...CATS,...(p.pct||{})}}}}catch(e){}
S.items.forEach(i=>{i.c={Spesa:"Cibo",Trasporti:"Macchina"}[i.c]||i.c});
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
let DEC=(()=>{try{return localStorage.getItem("spese-dec-v1")!=="0"}catch(e){return true}})();
/* Valuta: gli importi restano salvati in EUR, la conversione è solo di visualizzazione */
const CURK="spese-cur-v1",RATEK="spese-rates-v1",RATET="spese-rates-t",BASE_D="2026-11-23",BASE_R={EUR:1,USD:1.0939,JPY:174.01,CZK:24.455,DKK:7.4746,GBP:0.83673,HUF:372.28,PLN:4.4588,RON:5.3483,SEK:11.2375,CHF:0.9186,ISK:137.2,NOK:10.7285,TRY:55.3405,AUD:1.6532,BRL:6.5611,CAD:1.5711,CNY:7.2905,HKD:8.5772,IDR:19932.94,ILS:3.6643,INR:101.6395,KRW:1475.51,MXN:21.0528,MYR:4.5101,NZD:2.0079,PHP:69.851,SGD:1.4124,THB:37.242,ZAR:19.1513};
let CUR="EUR",RT={...BASE_R},RDATE=BASE_D,R=1,SYM="\u20ac",NFC2,NFC0,NFN2,NFN0,NFS;
try{CUR=localStorage.getItem(CURK)||"EUR";const c=JSON.parse(localStorage.getItem(RATEK)||"null");if(c&&c.r&&typeof c.d==="string"&&c.d>=BASE_D){RT={...BASE_R,...c.r};RDATE=c.d}}catch(e){}
function curBuild(){if(!(RT[CUR]>0))CUR="EUR";R=RT[CUR];
  try{NFC2=new Intl.NumberFormat("it-IT",{style:"currency",currency:CUR,currencyDisplay:"narrowSymbol"});NFC0=new Intl.NumberFormat("it-IT",{style:"currency",currency:CUR,currencyDisplay:"narrowSymbol",maximumFractionDigits:0});
    SYM=new Intl.NumberFormat("it-IT",{style:"currency",currency:CUR,currencyDisplay:"narrowSymbol"}).formatToParts(0).find(x=>x.type==="currency").value}
  catch(e){CUR="EUR";R=1;NFC2=new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR"});NFC0=new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR",maximumFractionDigits:0});SYM="\u20ac"}
  NFN2=new Intl.NumberFormat("it-IT",{minimumFractionDigits:2,maximumFractionDigits:2});NFN0=new Intl.NumberFormat("it-IT",{maximumFractionDigits:0})}
curBuild();
const eur=n=>NFC0.format(n*R);
const eur2=n=>(DEC?NFC2:NFC0).format(n*R);
const symP=()=>SYM+(SYM.length>1?"\u00a0":"");
const fE2=n=>symP()+(DEC?NFN2:NFN0).format(n*R);
const fN0=n=>NFN0.format(n*R);
const cvd=n=>Math.round(n*R*100)/100;
const inv=(x,o)=>{if(!(x>=0))return x;if(o!==undefined&&o!==null&&cvd(o)===x)return o;return Math.round(x/R*10000)/10000};
function reAll(){["render","renderRec","renderInc","renderCal","renderSal","renderSalEd","renderStats"].forEach(f=>{try{if(typeof window[f]==="function")window[f]()}catch(e){}})}
function setDec(v){DEC=!!v;try{localStorage.setItem("spese-dec-v1",DEC?"1":"0")}catch(e){}reAll()}
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
function editRow(i){return `<li class="row ed"><input data-f="d" value="${esc(i.d)}" aria-label="Descrizione"><input data-f="a" type="number" min="0" step="0.01" value="${cvd(i.a)}" aria-label="Importo"><select data-f="c" aria-label="Categoria">${Object.keys(CATS).map(c=>`<option${c===i.c?" selected":""}>${c}</option>`).join("")}</select><span class="acts"><button class="mini main" data-save="${i.id}">Salva</button><button class="mini" data-cancel="1">Annulla</button></span></li>`}
const addM=(m,n)=>{const [y,o]=m.split("-").map(Number);return mk(new Date(y,o-1+n,1))};
const ml=m=>{const [y,o]=m.split("-").map(Number);return new Intl.DateTimeFormat("it-IT",{month:"short",year:"numeric"}).format(new Date(y,o-1,1))};
if(!Array.isArray(S.rec))S.rec=[];
if(!Array.isArray(S.sch))S.sch=[];
S.items.forEach(i=>{if(typeof i.d==="string")i.d=cap(i.d)});S.rec.forEach(r=>{if(typeof r.d==="string")r.d=cap(r.d)});
const FQ={m:1,q:3,s:6,y:12},FQN={m:"Mensile",q:"Trimestrale",s:"Semestrale",y:"Annuale"},FQL={m:"mese",q:"trimestre",s:"semestre",y:"anno"};
function recStart(r){return r.start||(r.from+"-01")}
function recEnd(r){return r.end!==undefined?r.end:(r.to?r.to+"-31":"")}
function recDate(r,m){const st=recStart(r),sd=+st.slice(8,10),[y,o]=m.split("-").map(Number),[sy,so]=st.split("-").map(Number),df=(y*12+o)-(sy*12+so),step=FQ[r.f||"m"]||1;
  if(df<0||df%step)return"";const last=new Date(y,o,0).getDate(),dt=m+"-"+String(Math.min(sd,last)).padStart(2,"0"),en=recEnd(r);return en&&dt>en?"":dt}
const CAL={sel:""};
function calEvents(m){const ev={},[y,o]=m.split("-").map(Number),nd=new Date(y,o,0).getDate(),add=(d,e)=>{(ev[d]=ev[d]||[]).push(e)};
  const sal=salAt(m);if(sal>0)add(1,{src:"sal",t:"in",d:"Stipendio",a:sal,tag:"Stipendio"});
  S.items.filter(i=>i.m===m).forEach(i=>add(+(i.dt||m+"-01").slice(8,10),{src:"item",id:i.id,t:"out",d:i.d,a:i.a,c:i.c,tag:i.rid?"Spesa ricorrente":"Spesa registrata"}));
  S.rec.filter(r=>r.t==="in").forEach(r=>{const dt=recDate(r,m);if(dt)add(+dt.slice(8,10),{src:"rin",id:r.id,t:"in",d:r.d,a:r.a,tag:"Entrata ricorrente"})});
  S.sch.filter(x=>x.dt.slice(0,7)===m).forEach(x=>add(+x.dt.slice(8,10),{src:"sch",id:x.id,t:x.t,d:x.d,a:x.a,c:x.c,tag:"Programmata"}));
  return{ev,nd,y,o}}
function renderCal(){
  const m=$("month").value;ensureRec();const{ev,nd,y,o}=calEvents(m),today=NYMD(new Date());
  if(!CAL.sel||CAL.sel.slice(0,7)!==m)CAL.sel=today.slice(0,7)===m?today:m+"-01";
  const first=(new Date(y,o-1,1).getDay()+6)%7,sd=+CAL.sel.slice(8,10);
  let bal=0,tin=0,tout=0,min=Infinity,minD=1,neg=0;const end={};
  for(let d=1;d<=nd;d++){(ev[d]||[]).forEach(e=>{if(e.t==="in"){bal+=e.a;tin+=e.a}else{bal-=e.a;tout+=e.a}});end[d]=bal;if(bal<min){min=bal;minD=d}if(bal<-0.004&&!neg)neg=d}
  let g="";for(let i=0;i<first;i++)g+='<span></span>';
  for(let d=1;d<=nd;d++){const dt=m+"-"+String(d).padStart(2,"0"),L=ev[d]||[],k=new Set(L.map(e=>(e.src==="sch"?"s":"")+(e.t==="in"?"i":"o")));
    const dots=["o","i","so","si"].filter(x=>k.has(x==="so"?"so":x==="si"?"si":x)).map(x=>`<i class="cdt ${x}"></i>`).join("");
    g+=`<button type="button" class="cd${dt===CAL.sel?" sel":""}${dt===today?" td":""}${end[d]<-0.004?" neg":""}" data-cd="${dt}" aria-pressed="${dt===CAL.sel}" aria-label="${d} ${WMN[o-1]}${L.length?", "+L.length+" voci":""}"><span class="cn">${d}</span><span class="cdots">${dots}</span></button>`}
  $("cgrid").innerHTML=g;
  const long=new Intl.DateTimeFormat("it-IT",{weekday:"long",day:"numeric",month:"long"}).format(new Date(y,o-1,sd)),list=ev[sd]||[];
  const row=e=>`<li class="row xr rr" data-cev="${e.src}" data-id="${e.id!==undefined?e.id:""}"><span class="rrn">${esc(e.d)}</span><span class="amt ${e.t==="in"?"cin":""}">${e.t==="in"?"+":"−"}${eur2(e.a)}</span><span class="rrd">${e.tag}${e.c?" · "+esc(e.c):""}</span>${e.src==="sch"&&e.t==="out"?`<button type="button" class="mini cpay" data-cpay="${e.id}">Segna come pagata</button>`:""}</li>`;
  $("cday").innerHTML=`<div class="dh" style="align-items:center;margin-bottom:6px"><h2 class="sth2" style="margin:0">${cap(long)}</h2><button type="button" class="new" data-cadd="1">AGGIUNGI</button></div><div class="cbal">Saldo previsto a fine giornata <b class="${end[sd]<-0.004?"cng":""}">${eur2(end[sd])}</b></div><ul class="cl">${list.length?list.map(row).join(""):'<li class="empty">Nessuna voce in questo giorno.</li>'}</ul>`;
  $("cfc").innerHTML=`<h2 class="sth2">Previsione del mese</h2><div class="cfg"><div><small>Entrate previste</small><b class="cin">${eur2(tin)}</b></div><div><small>Uscite previste</small><b>${eur2(tout)}</b></div><div class="wide"><small>Saldo previsto a fine mese</small><b class="${bal<-0.004?"cng":"cin"}">${eur2(bal)}</b></div></div><p class="cnote">${tin===0&&tout===0?"Nessuna previsione per questo mese: aggiungi voci dal calendario.":neg?`Attenzione: dal giorno ${neg} il saldo previsto va sotto zero.`:`Saldo più basso del mese: ${eur2(min)} il giorno ${minD}.`}</p><p class="cnote">Calcolato sul mese, partendo dallo stipendio. Le voci programmate non contano nelle Spese finché non le segni come pagate.</p>`}
function incOf(m){return S.rec.reduce((t,r)=>t+(r.t==="in"&&recDate(r,m)?r.a:0),0)}
function ensureRec(){
  const now=mk(new Date()),sel=$("month").value||now,hz=addM(sel>now?sel:now,12);let ch=false;
  {const ids=new Set(S.rec.map(r=>r.id)),n0=S.items.length;S.items=S.items.filter(i=>!(i.rid&&!ids.has(i.rid)&&i.m>=now));S.items.forEach(i=>{if(i.rid&&!ids.has(i.rid)){delete i.rid;ch=true}});if(S.items.length!==n0)ch=true}
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
  const ins=S.rec.filter(r=>r.t==="in");
  $("rinc").innerHTML=ins.length?ins.map(recRow2).join(""):'<li class="empty">Nessuna entrata ricorrente.</li>'}
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
  $("mbody").innerHTML=`<form id="mf" class="mf"><input data-f="d" class="full" placeholder="Descrizione (es. Affitto)" required value="${r?esc(r.d):""}" aria-label="Descrizione"><input data-f="a" type="number" min="0" step="0.01" inputmode="decimal" placeholder="Importo ${SYM}" required value="${r?cvd(r.a):""}" aria-label="Importo"><select data-f="c" aria-label="Categoria">${cats}</select>`+(isRec?`<label>Dal mese<select data-f="from">${MOPT}</select></label><label>Fino al mese (facoltativo)<select data-f="to"><option value="">Senza scadenza</option>${MOPT}</select></label>`:"")+`<div class="err full" id="merr" role="alert"></div><div class="macts full"><button type="button" class="mini" data-mclose>Annulla</button>${kind==="edit-exp"?`<button type="button" class="mini danger" data-mreq="1">Elimina spesa</button>`:""}<button class="main" type="submit">${kind.startsWith("edit")?"Salva modifiche":kind==="new-rec"?"Aggiungi ricorrente":"Aggiungi spesa"}</button></div></form>`;
  if(isRec){const f=$("mf");f.querySelector('[data-f="from"]').value=r?r.from:mk(new Date());f.querySelector('[data-f="to"]').value=r?(r.to||""):""}
  $("mod").hidden=false;$("mbody").querySelector("input").focus()}
function openConfirm(kind,id){
  const rec=kind==="del-rec",sc=kind==="del-sch",x=rec?S.rec.find(r=>r.id===id):sc?S.sch.find(i=>i.id===id):S.items.find(i=>i.id==id);
  if(!x)return;
  modal={kind,id};
  $("mt").textContent=rec?"Eliminare il movimento ricorrente?":sc?"Eliminare la voce programmata?":"Eliminare la spesa?";
  $("mbody").innerHTML=`<p class="mtxt">Stai per eliminare <b>${esc(x.d)}</b> (${eur2(x.a)}${rec?" al mese":""}). ${rec?"Le spese generate da questo movimento dal mese corrente in avanti verranno eliminate; quelle dei mesi passati restano come spese normali.":"L’operazione non si può annullare."}</p><div class="macts"><button type="button" class="mini" data-mclose>Annulla</button><button type="button" class="mini danger" data-mdel="1">Elimina</button></div>`;
  $("mod").hidden=false;$("mbody").querySelector("button").focus()}
document.addEventListener("submit",e=>{
  if(e.target.id!=="mf"||!modal)return;e.preventDefault();
  const q=k=>e.target.querySelector('[data-f="'+k+'"]'),v=k=>q(k).value;
  const a=inv(parseFloat(v("a")),modal.kind==="edit-exp"?(S.items.find(i=>i.id==modal.id)||{}).a:undefined),d=cap(v("d").trim());if(!d||!(a>=0))return;if(!(a<=1e7)){$("merr").textContent="Importo troppo alto: il massimo è "+eur(1e7);return}
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
  if(ne.sch){document.querySelectorAll("[data-nt]").forEach(b=>b.classList.toggle("on",b.dataset.nt===ne.t));$("ncw").hidden=ne.t==="in";$("nal").textContent=ne.t==="in"?"Importo previsto in entrata":"Importo previsto in uscita"}
  $("nsave").disabled=!ok;
  document.querySelectorAll("[data-nc]").forEach(b=>b.classList.toggle("on",b.dataset.nc===ne.cat));
  ndSum();
  $("nci").innerHTML=catIcon(ne.cat);$("ncn").textContent=ne.cat;$("ncl").textContent=ne.sug?"Categoria suggerita:":"Categoria:"}
function neDesc(){
  if(!ne.manual){const g=suggestCat($("nd").value);
    if(g){ne.cat=g;ne.sug=true}else{ne.cat=(S.lastCat&&CATS[S.lastCat]!==undefined)?S.lastCat:ord()[0];ne.sug=false}}
  neUpdate()}
function nePress(k){ne.amt=amtNext(ne.amt,k);neUpdate()}
function neSave(){
  const d=cap($("nd").value.trim()),a=inv(neVal(),ne.oa);if(!d||!(a>0))return;
  if(ne.sch){const dt=$("ndd").value;if(!dt)return;const o={d,a,c:ne.t==="in"?"":ne.cat,t:ne.t,dt};
    if(ne.edit!==null){const x=S.sch.find(z=>z.id===ne.edit);if(x)Object.assign(x,o)}else S.sch.push(Object.assign({id:"s"+Date.now()},o));
    if(ne.t!=="in")S.lastCat=ne.cat;const m=dt.slice(0,7);if(m!==$("month").value){$("month").value=m;syncSal();ensureRec()}CAL.sel=dt;save();closeModal();render();return}
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
function openNewExp(rec,editId,opt){
  const sch=!!(opt&&opt.sch);
  const cur=mk(new Date()),vm=$("month").value;
  ne={amt:"",cat:(S.lastCat&&CATS[S.lastCat]!==undefined)?S.lastCat:ord()[0],sug:false,manual:false,st:"paid",dm:"pick",rec:!!rec,sch,edit:null,t:"out",f:"m"};
  const has=editId!==undefined&&editId!==null,eIt=!rec&&!sch&&has?S.items.find(i=>i.id==editId):null,eRc=rec&&has?S.rec.find(r=>r.id===editId):null,eSc=sch&&has?S.sch.find(x=>x.id===editId):null,E=eIt||eRc||eSc;
  if(eIt){ne.edit=eIt.id;ne.oa=eIt.a;ne.amt=String(cvd(eIt.a)).replace(".",",");ne.cat=CATS[eIt.c]!==undefined?eIt.c:ne.cat;ne.manual=true;ne.st=eIt.s||"paid"}
  if(eRc){ne.edit=eRc.id;ne.oa=eRc.a;ne.amt=String(cvd(eRc.a)).replace(".",",");ne.t=eRc.t==="in"?"in":"out";ne.f=eRc.f||"m";if(CATS[eRc.c]!==undefined){ne.cat=eRc.c}ne.manual=true}
  if(eSc){ne.edit=eSc.id;ne.oa=eSc.a;ne.amt=String(cvd(eSc.a)).replace(".",",");ne.t=eSc.t==="in"?"in":"out";if(CATS[eSc.c]!==undefined)ne.cat=eSc.c;ne.manual=true}
  modal={kind:"new-exp-sheet"};
  document.querySelector(".mbox").classList.add("sheet");
  const ttl=sch?(eSc?"Modifica voce programmata":"Nuova voce programmata"):rec?(eRc?"Modifica movimento ricorrente":"Nuovo movimento ricorrente"):eIt?"Modifica spesa":"Nuova spesa";
  $("mt").textContent=ttl;document.querySelector(".mbox").setAttribute("aria-label",ttl);
  const btns=E?`<div class="neacts"><button type="button" class="nbt" data-mclose>Annulla</button><button type="button" class="nbt danger" data-nedel="1">Elimina ${rec?"movimento":sch?"voce":"spesa"}</button><button type="button" class="nbt main" id="nsave" data-nsave="1" disabled>Salva modifiche</button></div>`:`<button type="button" class="nsave" id="nsave" data-nsave="1" disabled><span>${rec?"Salva movimento":sch?"Salva voce":"Salva spesa"}</span>${IC_OK}</button>`;
  const recTop=(rec||sch)?`<div class="seg nseg" role="group" aria-label="Tipo di movimento"><button type="button" data-nt="in">Entrata</button><button type="button" data-nt="out">Uscita</button></div>`:"";
  const dates=rec?dcard("nd","Data inizio:")+dcard("nf","Data fine:",'<button type="button" class="ncx" data-nfclear="1" hidden>Senza scadenza</button>')+'<div class="err" id="nerr" role="alert"></div>'+`<div class="ncwrap"><div class="ncat" data-nqedit="1" role="button" tabindex="0" aria-haspopup="listbox" aria-expanded="false" aria-label="Cambia frequenza"><span class="nci">${IC_REP}</span><div class="nct"><small>Frequenza:</small><b id="nqn"></b></div><span class="ncc">${IC_DN}</span></div><div class="nchips" id="nqchips" role="listbox" hidden>${Object.keys(FQN).map(k=>`<button type="button" role="option" data-nq="${k}">${FQN[k]}</button>`).join("")}</div></div>`:dcard("nd","Scegli data:");
  $("mbody").innerHTML=`<div class="ns">${recTop}<label class="nf"><span>${rec?"Nome Movimento":sch?"Nome voce":"Spesa"}</span><input id="nd" class="ninp" placeholder="${rec?"Es. Affitto":sch?"Es. Dentista":"Es. Pizza"}" autocomplete="off" maxlength="60"></label>${dates}<div class="ncwrap" id="ncw"><div class="ncat" data-ncedit="1" role="button" tabindex="0" aria-haspopup="listbox" aria-expanded="false" aria-label="Cambia categoria"><span class="nci" id="nci"></span><div class="nct"><small id="ncl"></small><b id="ncn"></b></div><span class="ncc">${IC_DN}</span></div><div class="nchips" id="nchips" role="listbox" hidden>${ord().map(c=>`<button type="button" role="option" data-nc="${c}">${catIcon(c)}${c}</button>`).join("")}</div></div><div class="namt"><span id="nal">Importo</span><div class="nvv"><i>${SYM}</i><b id="nval"></b></div></div><div class="kpad">${["1","2","3","4","5","6","7","8","9",NEM==="1"?"":",","0","bk"].map(k=>k===""?"<span></span>":`<button type="button" data-k="${k}"${k==="bk"?' aria-label="Cancella"':""}>${k==="bk"?IC_BK:k}</button>`).join("")}</div>${btns}</div>`;
  const dayEnd=m=>{const [y,o]=m.split("-").map(Number);return m+"-"+String(new Date(y,o,0).getDate()).padStart(2,"0")};
  if(eRc){$("ndd").value=recStart(eRc);$("nfd").value=eRc.end!==undefined?eRc.end:(eRc.to?dayEnd(eRc.to):"");$("nd").value=eRc.d}
  else if(eSc){$("ndd").value=eSc.dt;$("nd").value=eSc.d}
  else{ $("ndd").value=eIt?(eIt.dt||(eIt.m+"-01")):(sch&&opt.date?opt.date:vm===cur?NYMD(new Date()):(vm<"2026-01"?"2026-01":vm)+"-01"); if(eIt)$("nd").value=eIt.d; if(rec)$("nfd").value=""}
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
  if(NEM==="1"){if(k===",")return a;let c=Math.round(parseFloat((a||"0").replace(",","."))*100)||0;
    if(k==="bk")c=Math.floor(c/10);else if(String(c).length<9)c=c*10+(+k);
    return c?(c/100).toFixed(2).replace(".",","):""}
  if(k==="bk")return a.slice(0,-1);
  if(k===",")return !a?"0,":(a.includes(",")?a:a+",");
  if(a.includes(","))return a.split(",")[1].length<2?a+k:a;
  if(a==="0")return k;
  return a.length<7?a+k:a}
function amUpdate(){$("amval").textContent=am.amt||"0,00";$("amval").classList.toggle("dim",!am.amt)}
function amPress(k){am.amt=amtNext(am.amt,k);amUpdate()}
function openAmount(title,label,val,max,cb){
  modal={kind:"amount-sheet"};
  am={amt:(val===undefined||val===null||val==="")?"":String(cvd(val)).replace(".",","),max:cvd(max),o:val,cb};
  document.querySelector(".mbox").classList.add("sheet");
  $("mt").textContent=title;
  $("mbody").innerHTML=`<div class="ns"><div class="namt"><span>${label}</span><div class="nvv"><i>${SYM}</i><b id="amval"></b></div></div><div class="kpad">${["1","2","3","4","5","6","7","8","9",NEM==="1"?"":",","0","bk"].map(k=>k===""?"<span></span>":`<button type="button" data-ak="${k}"${k==="bk"?' aria-label="Cancella"':""}>${k==="bk"?IC_BK:k}</button>`).join("")}</div><button type="button" class="nsave" data-amok="1"><span>Conferma</span>${IC_OK}</button></div>`;
  $("mod").hidden=false;amUpdate()}
function amDone(){const am0=am,v=am.amt?Math.min(parseFloat(am.amt.replace(",",".")),am.max):null,cb=am.cb;closeModal();cb(isNaN(v)?null:inv(v,am0.o))}
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
$("tpbell").insertAdjacentHTML("afterbegin",IC_BELL);{const p=themePref();applyTheme(p==="dark",false);syncAppr();nemRender();curInit();$("dtg").setAttribute("aria-checked",DEC?"true":"false");syncNoti();syncAuth();lockInit();setTimeout(dailyNoti,1500)}$("tpic").innerHTML=IC_WALLET;$("tphs").innerHTML=IC_SPARK;
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
  $("tpbal").textContent=S.hide?"•••• "+SYM:eur2(bal);
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
  const fm=x=>symP()+fN0(x);
  const pts=vals.map((v,i)=>v===null?null:[X(i),Yy(v)]).filter(Boolean);
  const ln=pts.map(q=>q.join(",")).join(" ");
  let g="";for(let j=0;j<=n;j++){const y=B-j*H/n;g+=`<line x1="${L}" x2="${W-R}" y1="${y}" y2="${y}" stroke="${TC.grid}"/><text x="${L-6}" y="${y+4}" text-anchor="end" font-size="${fs}" fill="${TC.mute}">${fm(j*step)}</text>`}
  const mn=keys.map((k,i)=>`<text x="${X(i)}" y="${B+22}" text-anchor="middle" font-size="${sp<26?9.5:fs}" fill="${TC.mute}">${sp<19?MN.format(new Date(Y,i,1))[0].toUpperCase():MN.format(new Date(Y,i,1))}</text>`).join("");
  const dots=vals.map((v,i)=>{if(v===null)return"";const ent=S.sals[keys[i]]!==undefined;
    return `<circle cx="${X(i)}" cy="${Yy(v)}" r="${ent?5:4}" fill="${ent?TC.acc:TC.dotIn}" stroke="${TC.acc}" stroke-width="2"/>`+(ent?`<text x="${i===11?X(i)+5:X(i)}" y="${Yy(v)-(sp<34&&i%2?22:11)}" text-anchor="${i===11?"end":"middle"}" font-size="${sp<34?9.5:11}" font-weight="600" fill="${TC.lbl}">${sp<34?new Intl.NumberFormat("it-IT",{maximumFractionDigits:0}).format(v):fm(v)}</text>`:"")}).join("");
  $("sline").innerHTML=`<svg viewBox="0 0 ${W} ${B+32}" role="img" aria-label="Andamento dello stipendio nell’anno ${Y}"><defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${TC.acc}" stop-opacity=".3"/><stop offset="1" stop-color="${TC.acc}" stop-opacity="0"/></linearGradient></defs>${g}<polygon points="${pts[0][0]},${B} ${ln} ${pts[pts.length-1][0]},${B}" fill="url(#sg)"/><polyline points="${ln}" fill="none" stroke="${TC.acc}" stroke-width="2.5" stroke-linejoin="round"/>${dots}${mn}</svg>`;
}
function updPh(){}
function renderSalEd(){
  const Y=+$("month").value.slice(0,4);$("syr").innerHTML=Array.from({length:10},(_,i)=>`<option value="${2026+i}"${2026+i===Y?" selected":""}>${2026+i}</option>`).join("");
  const fa=n=>Number.isInteger(cvd(n))?eur(n):eur2(n);
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
function expRow(i){return `<li class="row xr" data-rowedit="${i.id}"><span class="xl"><b class="xdt">${fdt(i)}</b><span class="xn">${esc(i.d)}</span>${i.rid?'<i class="rtg">Spesa ricorrente</i>':""}</span><span class="amt">${eur2(i.a)}</span></li>`}
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
  const e2=fE2;
  const pf=n=>sal?(n/sal*100).toFixed(1).replace(".",",")+"% delle entrate":"Imposta lo stipendio in Entrate reali";
  
  
  $("pmo").innerHTML=Array.from({length:12},(_,i)=>cap(new Intl.DateTimeFormat("it-IT",{month:"long"}).format(new Date(2026,i,1)))).map((t,i)=>`<option value="${String(i+1).padStart(2,"0")}">${t}</option>`).join("");$("pmo").value=m.slice(5,7);$("pyr").innerHTML=Array.from({length:10},(_,i)=>`<option value="${2026+i}">${2026+i}</option>`).join("");$("pyr").value=m.slice(0,4);
  


  renderRec();if(view==="calendario")renderCal();renderCnt();renderTop();$("list").innerHTML=renderGroups(its);

  $("cats").innerHTML=ord().map((c,ix,arr)=>{
    const p=sum(m,i=>i.c===c&&i.s==="paid"),q=sum(m,i=>i.c===c&&i.s==="plan");
    const lim=limOf(c,sal),pc=sal?(lim/sal*100).toFixed(2).replace(".",",")+"% dello stipendio":"–",t=p+q,den=Math.max(lim,t,1),over=lim>0&&t>lim;
    return `<div class="cat"><div class="h"><span class="nm"><span class="mv"><button class="mini" data-mv="${c}" data-dir="-1" aria-label="Sposta ${c} su"${ix===0?" disabled":""}>▲</button><button class="mini" data-mv="${c}" data-dir="1" aria-label="Sposta ${c} giù"${ix===arr.length-1?" disabled":""}>▼</button></span>${c}</span><span class="${over?"over":""}">${eur(t)} / ${eur(lim)}</span></div><div class="t" style="background:${lim>0?"#1f9a5a":"var(--line)"}"><i style="width:${p/den*100}%;background:#e5484d"></i><i style="width:${q/den*100}%;background:#f4a09c"></i></div><div class="n"><span class="acts"><label class="bud">Budget ${SYM}<input type="text" readonly inputmode="none" value="${cvd(S.lim[c].v)}" data-lv="${c}" aria-label="Budget ${c} in ${CUR}"></label><b class="pc">${pc}</b></span><span>${over?"Oltre il limite di "+eur(t-lim):lim?"Restano "+eur(lim-t):""}</span></div></div>`}).join("");
}
function lockHome(){const r=document.documentElement;r.classList.remove("hl");if(view!=="home"&&view!=="entrate"&&view!=="statistiche")return;
  scrollTo(0,0);const last=$("v-"+view).lastElementChild,nav=document.querySelector(".hdr");if(!last||!nav)return;
  if(last.getBoundingClientRect().bottom<=nav.getBoundingClientRect().top-8)r.classList.add("hl")}
addEventListener("resize",()=>{lockHome();if(view==="statistiche")renderStats();if(view==="entrate")fitSal()});addEventListener("orientationchange",()=>setTimeout(lockHome,200));addEventListener("load",()=>setTimeout(()=>{lockHome();fitSal()},100));
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>lockHome());

function show(v){if(!$("v-"+v))return;view=v;document.documentElement.classList.toggle("nosb",v==="entrate"||v==="statistiche");setTimeout(lockHome,0);["home","entrate","ricorrenti","calendario","spese","budget","statistiche","impostazioni","appearance","appicon","notif","numentry","currency"].forEach(x=>$("v-"+x).hidden=x!==v);document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("on",b.dataset.view===(v==="entrate"||v==="spese"||v==="ricorrenti"?"home":SUBV.includes(v)?"impostazioni":v)));$("pill").hidden=v==="home"||v==="impostazioni"||SUBV.includes(v)||v==="entrate";$("greet").hidden=v!=="home";$("mrow").style.display=v==="statistiche"||v==="impostazioni"||SUBV.includes(v)?"none":"";if(v==="statistiche")renderStats();if(v==="currency")curOpen();$("mrow").classList.toggle("sp",v==="spese"||v==="ricorrenti");(v==="ricorrenti"?$("rbar"):v==="calendario"?$("cbar"):$("mrow")).appendChild($("pill"));if(v==="entrate")renderSalEd();if(v==="ricorrenti"){const e=$("v-entrate");e.hidden=false;e.style.visibility="hidden";renderSalEd();e.hidden=true;e.style.visibility=""}if(v==="calendario")renderCal();scrollTo(0,0)}
$("salary").addEventListener("input",e=>{const m=$("month").value,v=parseFloat(e.target.value);if(isNaN(v))delete S.sals[m];else S.sals[m]=Math.max(0,v);S.salary=isNaN(v)?0:Math.max(0,v);save();render()});
$("month").addEventListener("change",()=>{syncSal();ensureRec();render()});
$("f").addEventListener("submit",e=>{e.preventDefault();
  const a=inv(parseFloat($("a").value));if(!(a>=0))return;
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
  const e2=fE2;
  const [y,mo]=endKey.split("-").map(Number);
  const ms=Array.from({length:6},(_,k)=>new Date(y,mo-1-(5-k),1));
  const vals=ms.map(d=>sum(mk(d)));
  const mx=Math.max(...vals,1);
  $("bars").innerHTML=`<svg viewBox="0 0 300 130" role="img" aria-label="Spese negli ultimi 6 mesi">`+vals.map((v,i)=>{const h=v/mx*90;return `<rect x="${i*50+9}" y="${100-h}" width="32" height="${Math.max(h,1)}" rx="4" fill="${i===5?TC.acc:TC.bar}"/><text x="${i*50+25}" y="118" text-anchor="middle" font-size="11" fill="${TC.mute}">${MN.format(ms[i])}</text>`}).join("")+`</svg>`;
  const ct=ord().map(c=>[c,S.items.filter(i=>m0.includes(i.m)&&i.c===c).reduce((t,i)=>t+i.a,0)]);
  let a=0;const seg=ct.filter(x=>x[1]>0).map(([c,v])=>{const s=a;a+=v/tot*100;return `${COL[c]} ${s}% ${a}%`});
  $("donut").style.background=tot?`conic-gradient(${seg.join(",")})`:"var(--line)";
  $("hole").innerHTML=`<b>${symP()}${fN0(tot)}</b>totale`;
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
  const fm=x=>fN0(x)+"\u00a0"+SYM;
  let g="";for(let j=0;j<=n;j++){const val=bot+j*q,y=Yy(val);g+=`<line x1="72" x2="624" y1="${y}" y2="${y}" stroke="${val===0&&bot<0?TC.gridZ:TC.grid}"/><text x="64" y="${y+4}" text-anchor="end" font-size="11" fill="${TC.mute}">${fm(val)}</text>`}
  const xl=D.labels.map(([i,t])=>`<text x="${X(i)}" y="${B+22}" text-anchor="middle" font-size="11" fill="${TC.mute}">${t}</text>`).join("");
  const pts=v.map((x,i)=>[X(i),Yy(x)]),ln=pts.map(a=>a.join(",")).join(" "),lp=pts[pts.length-1];
  const dots=(mo?[pts.length-1]:v.map((_,i)=>i)).map(i=>`<circle cx="${pts[i][0]}" cy="${pts[i][1]}" r="4" fill="${TC.acc}" stroke="${TC.dotS}" stroke-width="2"/>`).join("");
  $("stchart").innerHTML=`<svg viewBox="0 0 640 ${B+32}" role="img" aria-label="Andamento del saldo"><defs><linearGradient id="stg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${TC.acc}" stop-opacity=".3"/><stop offset="1" stop-color="${TC.acc}" stop-opacity="0"/></linearGradient></defs>${g}<polygon points="${pts[0][0]},${B} ${ln} ${lp[0]},${B}" fill="url(#stg)"/><polyline points="${ln}" fill="none" stroke="${TC.acc}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>${dots}${xl}</svg>`;
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
  if(!e.target.closest("button,input,select,a")){const cr=e.target.closest("li[data-cev]");if(cr){const id=cr.dataset.id,sr=cr.dataset.cev;if(sr==="item"){const it=S.items.find(i=>i.id==id);if(it&&it.rid)openRecInfo(it);else openNewExp(false,id)}else if(sr==="rin")openNewExp(true,id);else if(sr==="sch")openNewExp(false,id,{sch:true});else if(sr==="sal")show("entrate");return}const rx=e.target.closest("li[data-recedit]");if(rx){openNewExp(true,rx.dataset.recedit);return}const xr=e.target.closest("li[data-rowedit]");if(xr){const it=S.items.find(i=>i.id==xr.dataset.rowedit);if(it&&it.rid)openRecInfo(it);else openNewExp(false,xr.dataset.rowedit);return}}
  if(t.dataset.view)show(t.dataset.view);
  if(t.dataset.stm){ST.mode=t.dataset.stm;renderStats()}
  if(t.dataset.tg2)setExpOpen($("f").hidden);
  if(t.dataset.nm&&ne){ne.dm=t.dataset.nm;if(ne.dm==="pick"&&!$("ndd").value)$("ndd").value=NYMD(new Date());neUpdate()}
  if(t.dataset.ns&&ne){ne.st=t.dataset.ns;neUpdate()}
  if(t.dataset.k&&ne)nePress(t.dataset.k);
  if(t.dataset.cd){CAL.sel=t.dataset.cd;renderCal()}
  if(t.dataset.cadd)openNewExp(false,null,{sch:true,date:CAL.sel});
  if(t.dataset.cpay){const x=S.sch.find(z=>z.id===t.dataset.cpay);if(x){S.items.push({id:Date.now(),m:x.dt.slice(0,7),dt:x.dt,d:x.d,a:x.a,c:CATS[x.c]!==undefined?x.c:ord()[0],s:"paid"});S.sch=S.sch.filter(z=>z.id!==x.id);save();render()}}
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
  if(t.classList&&t.classList.contains("tg")){t.setAttribute("aria-checked",t.getAttribute("aria-checked")==="true"?"false":"true");if(t.id==="dtg")setDec(t.getAttribute("aria-checked")==="true");if(t.id==="ntg")noteToggle(t);if(t.id==="atg")authToggle(t);return}
  {const SM={"Appearance":"appearance","App Icon":"appicon","Notifications":"notif","Number Entry":"numentry","Currency":"currency"};if(t.dataset.set&&SM[t.dataset.set]){show(SM[t.dataset.set]);return}}
  if(t.dataset.nem){setNem(t.dataset.nem);return}
  if(t.dataset.nk){nkPress(t.dataset.nk);return}
  if(t.dataset.back==="set"){show("impostazioni");return}
  if(t.dataset.tp){setPref(t.dataset.tp,true);return}
  if(t.dataset.cur){curPick(t.dataset.cur);return}
  if(t.dataset.themeToggle){setPref(DK?"light":"dark",true);return}
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
  if(t.dataset.mdel&&modal){if(modal.kind==="del-sch"){S.sch=S.sch.filter(x=>x.id!==modal.id)}else if(modal.kind==="del-rec"){S.rec=S.rec.filter(r=>r.id!==modal.id);const nw=mk(new Date());S.items=S.items.filter(i=>!(i.rid===modal.id&&i.m>=nw));S.items.forEach(i=>{if(i.rid===modal.id)delete i.rid})}else{const it=S.items.find(i=>i.id==modal.id);if(it&&it.rid){const r=S.rec.find(x=>x.id===it.rid);if(r)(r.skip=r.skip||[]).push(it.m)}S.items=S.items.filter(i=>i.id!=modal.id)}save();closeModal();render()}
  if(t.dataset.yr){const [yy,mm]=$("month").value.split("-"),ny=+yy+parseInt(t.dataset.yr);if(ny>=2026){$("month").value=ny+"-"+mm;syncSal();ensureRec();render();renderSalEd()}}
  if(t.dataset.mv){const o=ord(),i=o.indexOf(t.dataset.mv),j=i+parseInt(t.dataset.dir);if(j>=0&&j<o.length){[o[i],o[j]]=[o[j],o[i]];S.order=o;save();render()}}
  if(t.dataset.cg){cgOpen[t.dataset.cg]=!cgOpen[t.dataset.cg];render();lockHome()}
  if(t.dataset.edit)openNewExp(false,t.dataset.edit);
  if(t.dataset.nedel&&ne&&ne.edit!==null)openConfirm(ne.rec?"del-rec":ne.sch?"del-sch":"del-exp",ne.edit);
  if(t.dataset.mreq&&modal&&modal.kind==="edit-exp"){openConfirm("del-exp",modal.id)}
  if(t.dataset.cancel){editId=null;render()}
  if(t.dataset.save){const li=t.closest("li"),it=S.items.find(i=>i.id==t.dataset.save);const v=k=>li.querySelector('[data-f="'+k+'"]').value;const a=inv(parseFloat(v("a")),it&&it.a);if(it&&v("d").trim()&&a>=0){it.d=cap(v("d").trim());it.a=a;it.c=v("c");editId=null;save();render()}}
  if(t.dataset.del)openConfirm("del-exp",t.dataset.del);
  if(t.dataset.rdel)openConfirm("del-rec",t.dataset.rdel);
});
document.addEventListener("change",e=>{
  const d=e.target.dataset||{};if(d.mo){const yy=$("month").value.slice(0,4);$("month").value=yy+"-"+e.target.value;syncSal();ensureRec();render();return}
  if(d.lm){S.lim[d.lm].t=e.target.value;save();render()}
  if(d.lv){S.lim[d.lv]={t:"eur",v:Math.max(0,inv(parseFloat(e.target.value)||0))};save();render()}});
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
