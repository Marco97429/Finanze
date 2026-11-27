const CATS={Casa:30,Bollette:8,Macchina:10,Cibo:15,Vacanze:8,Regali:4,Telefono:3},BUILTIN=Object.keys(CATS);
/* Notifiche e Face ID (tutto locale) */
const LSG=k=>{try{return localStorage.getItem(k)}catch(e){return null}},LSS=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
let NOTI=LSG("spese-noti-v1")==="1",AUTH=LSG("spese-auth-v1")||"",LKT=0,LKB=false;
const b64u=b=>{let s="";new Uint8Array(b).forEach(c=>s+=String.fromCharCode(c));return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")};
const unb64u=s=>{s=s.replace(/-/g,"+").replace(/_/g,"/");while(s.length%4)s+="=";const r=atob(s),u=new Uint8Array(r.length);for(let i=0;i<r.length;i++)u[i]=r.charCodeAt(i);return u};
let _tt=0;function toast(m,ok){let t=document.getElementById("toast");if(!t){t=document.createElement("div");t.id="toast";t.setAttribute("role","status");document.body.appendChild(t)}t.textContent=m;t.classList.toggle("ok",!!ok);t.classList.add("on");clearTimeout(_tt);_tt=setTimeout(()=>t.classList.remove("on"),4200)}
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

/* Categorie */
const CSUGX=[["Trasporti","\u{1F686}","#2f7f9a"],["Affitto","\u{1F3E1}","#a0587c"],["Abbonamenti","\u{1F504}","#b25cf0"],["Spesa","\u{1F6D2}","#5b6cf0"],["Famiglia","\u{1F46A}","#efb340"],["Abbigliamento","\u{1F454}","#e8749a"],["Salute","\u{1F691}","#e0414e"],["Animali","\u{1F415}","#4db6ef"],["Sneakers","\u{1F45F}","#6a1ff0"]];
const CSUGI=[["Stipendio","\u{1F4B0}","#2fb98a"],["Paghetta","\u{1F911}","#efc66d"],["Lavoro part-time","\u{1F4BC}","#5b9be0"],["Investimenti","\u{1F4C8}","#3aa592"],["Regali","\u{1F381}","#cf5a72"],["Mance","\u{1FA99}","#8f90ee"]];
const CPAL=["#bfe0fb","#f6d0cf","#e3d3dc","#ecd5f7","#d3d5f7","#f7e3bf","#f9d3e0","#f8efc8","#f6cdd3","#d0ecf8","#d9cdf6","#e8625a","#5b9be0","#2f7f9a","#a9c8f5","#b8794a","#8f90ee","#5da596","#efc66d","#6f8f6a","#eba07a","#1d3a6b","#3aa592","#cf5a72"];
const EMOJI=[["\u{1F354}","cibo hamburger panino fast food"],["\u{1F355}","pizza cibo"],["\u{1F35D}","pasta spaghetti cibo"],["\u{1F363}","sushi giapponese"],["\u{1F32E}","taco messicano"],["\u{1F957}","insalata verdura"],["\u{1F34E}","mela frutta"],["\u{1F36A}","biscotto dolci"],["\u{1F370}","torta dolci dessert"],["\u{1F366}","gelato dolci"],["\u2615","caff\u00e8 bar colazione"],["\u{1F37A}","birra bar pub"],["\u{1F377}","vino aperitivo"],["\u{1F6D2}","carrello spesa supermercato"],["\u{1F3E0}","casa affitto mutuo"],["\u{1F3E1}","casa giardino"],["\u{1F6CB}\uFE0F","divano arredamento mobili"],["\u{1F6BF}","doccia bagno acqua"],["\u{1F4A1}","luce bollette energia utenze"],["\u{1F525}","gas riscaldamento fuoco"],["\u{1F4A7}","acqua goccia bollette"],["\u{1F4F6}","internet wifi"],["\u{1F4F1}","telefono cellulare"],["\u{1F4BB}","computer pc lavoro"],["\u{1F3AE}","videogiochi gioco console"],["\u{1F3A7}","musica cuffie"],["\u{1F4FA}","tv televisione streaming"],["\u{1F3AC}","cinema film"],["\u{1F39F}\uFE0F","biglietti eventi concerto"],["\u{1F4DA}","libri studio scuola istruzione"],["\u{1F393}","universit\u00e0 laurea corso"],["\u270F\uFE0F","cancelleria scuola"],["\u{1F697}","auto macchina"],["\u26FD","benzina carburante"],["\u{1F699}","suv auto"],["\u{1F6E0}\uFE0F","officina meccanico riparazioni"],["\u{1F17F}\uFE0F","parcheggio"],["\u{1F68C}","autobus trasporti"],["\u{1F686}","treno trasporti"],["\u{1F6B2}","bici bicicletta"],["\u{1F6F5}","scooter moto"],["\u2708\uFE0F","aereo viaggio volo vacanze"],["\u{1F3D6}\uFE0F","spiaggia mare vacanze"],["\u{1F3D5}\uFE0F","campeggio montagna vacanze"],["\u{1F3E8}","hotel albergo vacanze"],["\u{1F9F3}","valigia viaggio"],["\u{1F5FA}\uFE0F","mappa viaggio"],["\u{1F48A}","farmaci medicina salute"],["\u{1F691}","ambulanza salute sanit\u00e0"],["\u{1FA7A}","medico visita salute"],["\u{1F9B7}","dentista denti"],["\u{1F453}","occhiali ottico"],["\u{1F4AA}","palestra sport fitness"],["\u26BD","calcio sport"],["\u{1F3C0}","basket sport"],["\u{1F3BE}","tennis sport"],["\u{1F3CA}","piscina nuoto sport"],["\u{1F9D8}","yoga benessere"],["\u{1F487}","parrucchiere capelli bellezza"],["\u{1F485}","estetista unghie bellezza"],["\u{1F457}","vestiti abbigliamento moda"],["\u{1F454}","camicia abbigliamento"],["\u{1F45F}","scarpe sneakers"],["\u{1F45C}","borsa accessori"],["\u231A","orologio accessori"],["\u{1F48D}","anello gioielli"],["\u{1F381}","regalo regali"],["\u{1F382}","compleanno festa"],["\u{1F389}","festa party"],["\u2764\uFE0F","cuore amore"],["\u{1F476}","bambino neonato figli"],["\u{1F46A}","famiglia"],["\u{1F9F8}","giocattoli peluche bambini"],["\u{1F415}","cane animali pets"],["\u{1F408}","gatto animali pets"],["\u{1F41F}","pesce animali acquario"],["\u{1F33F}","piante giardino natura"],["\u{1F4B0}","soldi stipendio denaro"],["\u{1F4B6}","euro banconote soldi"],["\u{1F4B3}","carta di credito pagamenti"],["\u{1F3E6}","banca conto"],["\u{1F4C8}","investimenti borsa crescita"],["\u{1FA99}","moneta mance"],["\u{1F911}","paghetta soldi"],["\u{1F4BC}","lavoro ufficio valigetta"],["\u{1F9FE}","ricevuta scontrino tasse"],["\u{1F4C4}","documenti tasse"],["\u{1F512}","sicurezza assicurazione"],["\u{1F6E1}\uFE0F","assicurazione protezione"],["\u{1F504}","abbonamenti ricorrenti rinnovo"],["\u{1F4E6}","pacco spedizione acquisti"],["\u{1F6CD}\uFE0F","shopping acquisti"],["\u{1F9F9}","pulizie casa"],["\u{1F9FA}","lavanderia bucato"],["\u{1F527}","riparazioni attrezzi"],["\u{1F528}","bricolage lavori"],["\u{1F3A8}","arte hobby"],["\u{1F3B8}","chitarra musica hobby"],["\u{1F4F7}","fotografia fotocamera"],["\u{1F6AC}","sigarette fumo"],["\u{1F3B2}","giochi svago"],["\u{1F3AF}","obiettivo risparmio"],["\u{1F437}","salvadanaio risparmio"],["\u{1F64F}","donazioni beneficenza"],["\u2B50","preferiti speciale"],["\u{1F3F7}\uFE0F","etichetta altro varie"]];
const EMJ={"people": "😀 grinning face|😁 grinning face with smiling eyes|😂 face with tears of joy|😃 smiling face with open mouth|😄 smiling face with open mouth and smiling eyes|😅 smiling face with open mouth and cold sweat|😆 smiling face with open mouth and tightly-closed eyes|😇 smiling face with halo|😈 smiling face with horns|😉 winking face|😊 smiling face with smiling eyes|😋 face savouring delicious food|😌 relieved face|😍 smiling face with heart-shaped eyes|😎 smiling face with sunglasses|😏 smirking face|😐 neutral face|😑 expressionless face|😒 unamused face|😓 face with cold sweat|😔 pensive face|😕 confused face|😖 confounded face|😗 kissing face|😘 face throwing a kiss|😙 kissing face with smiling eyes|😚 kissing face with closed eyes|😛 face with stuck-out tongue|😜 face with stuck-out tongue and winking eye|😝 face with stuck-out tongue and tightly-closed eyes|😞 disappointed face|😟 worried face|😠 angry face|😡 pouting face|😢 crying face|😣 persevering face|😤 face with look of triumph|😥 disappointed but relieved face|😦 frowning face with open mouth|😧 anguished face|😨 fearful face|😩 weary face|😪 sleepy face|😫 tired face|😬 grimacing face|😭 loudly crying face|😮 face with open mouth|😯 hushed face|😰 face with open mouth and cold sweat|😱 face screaming in fear|😲 astonished face|😳 flushed face|😴 sleeping face|😵 dizzy face|😶 face without mouth|😷 face with medical mask|😸 grinning cat face with smiling eyes|😹 cat face with tears of joy|😺 smiling cat face with open mouth|😻 smiling cat face with heart-shaped eyes|😼 cat face with wry smile|😽 kissing cat face with closed eyes|😾 pouting cat face|😿 crying cat face|🙀 weary cat face|🙁 slightly frowning face|🙂 slightly smiling face|🙃 upside-down face|🙄 face with rolling eyes|🙅 face with no good gesture|🙆 face with ok gesture|🙇 person bowing deeply|🙈 see-no-evil monkey|🙉 hear-no-evil monkey|🙊 speak-no-evil monkey|🙋 happy person raising one hand|🙌 person raising both hands in celebration|🙍 person frowning|🙎 person with pouting face|🙏 person with folded hands|🤐 zipper-mouth face|🤑 money-mouth face|🤒 face with thermometer|🤓 nerd face|🤔 thinking face|🤕 face with head-bandage|🤖 robot face|🤗 hugging face|🤘 sign of the horns|🤙 call me hand|🤚 raised back of hand|🤛 left-facing fist|🤜 right-facing fist|🤝 handshake|🤞 hand with index and middle fingers crossed|🤟 i love you hand sign|🤠 face with cowboy hat|🤡 clown face|🤢 nauseated face|🤣 rolling on the floor laughing|🤤 drooling face|🤥 lying face|🤦 face palm|🤧 sneezing face|🤨 face with one eyebrow raised|🤩 grinning face with star eyes|🤪 grinning face with one large and one small eye|🤫 face with finger covering closed lips|🤬 serious face with symbols covering mouth|🤭 smiling face with smiling eyes and hand covering mouth|🤮 face with open mouth vomiting|🤯 shocked face with exploding head|🥰 smiling face with smiling eyes and three hearts|🥱 yawning face|🥲 smiling face with tear|🥳 face with party horn and party hat|🥴 face with uneven eyes and wavy mouth|🥵 overheated face|🥶 freezing face|🥷 ninja|🥸 disguised face|🥹 face holding back tears|🥺 face with pleading eyes|🫠 melting face|🫡 saluting face|🫢 face with open eyes and hand over mouth|🫣 face with peeking eye|🫤 face with diagonal mouth|🫥 dotted line face|🫦 biting lip|🫧 bubbles|👹 japanese ogre|👺 japanese goblin|👻 ghost|👼 baby angel|👽 extraterrestrial alien|👾 alien monster|👿 imp|💀 skull|👀 eyes|👁️ eye|👂 ear|👃 nose|👄 mouth|👅 tongue|👆 white up pointing backhand index|👇 white down pointing backhand index|👈 white left pointing backhand index|👉 white right pointing backhand index|👊 fisted hand sign|👋 waving hand sign|👌 ok hand sign|👍 thumbs up sign|👎 thumbs down sign|👏 clapping hands sign|👐 open hands sign|👦 boy|👧 girl|👨 man|👩 woman|👪 family|👫 man and woman holding hands|👬 two men holding hands|👭 two women holding hands|👮 police officer|👯 woman with bunny ears|👰 bride with veil|👱 person with blond hair|👲 man with gua pi mao|👳 man with turban|👴 older man|👵 older woman|👶 baby|👷 construction worker|👸 princess|💁 information desk person|💂 guardsman|💃 dancer|💄 lipstick|💅 nail polish|💆 face massage|💇 haircut|💩 pile of poo|💪 flexed biceps|💫 dizzy symbol|💬 speech balloon|💭 thought balloon|🗣️ speaking head in silhouette|🤌 pinched fingers|🤍 white heart|🤎 brown heart|🤏 pinching hand|🦴 bone|🦵 leg|🦶 foot|🦷 tooth|🦸 superhero|🦹 supervillain|🦺 safety vest|🦻 ear with hearing aid|🦼 motorized wheelchair|🦽 manual wheelchair|🦾 mechanical arm|🦿 mechanical leg|🧐 face with monocle|🧑 adult|🧒 child|🧓 older adult|🧔 bearded person|🧕 person with headscarf|🧖 person in steamy room|🧗 person climbing|🧘 person in lotus position|🧙 mage|🧚 fairy|🧛 vampire|🧜 merperson|🧝 elf|🧞 genie|🧟 zombie|🧠 brain|☝️ white up pointing index|✊ raised fist|✋ raised hand|✌️ victory hand|✍️ writing hand", "animals": "🐀 rat|🐁 mouse|🐂 ox|🐃 water buffalo|🐄 cow|🐅 tiger|🐆 leopard|🐇 rabbit|🐈 cat|🐉 dragon|🐊 crocodile|🐋 whale|🐌 snail|🐍 snake|🐎 horse|🐏 ram|🐐 goat|🐑 sheep|🐒 monkey|🐓 rooster|🐔 chicken|🐕 dog|🐖 pig|🐗 boar|🐘 elephant|🐙 octopus|🐚 spiral shell|🐛 bug|🐜 ant|🐝 honeybee|🐞 lady beetle|🐟 fish|🐠 tropical fish|🐡 blowfish|🐢 turtle|🐣 hatching chick|🐤 baby chick|🐥 front-facing baby chick|🐦 bird|🐧 penguin|🐨 koala|🐩 poodle|🐪 dromedary camel|🐫 bactrian camel|🐬 dolphin|🐭 mouse face|🐮 cow face|🐯 tiger face|🐰 rabbit face|🐱 cat face|🐲 dragon face|🐳 spouting whale|🐴 horse face|🐵 monkey face|🐶 dog face|🐷 pig face|🐸 frog face|🐹 hamster face|🐺 wolf face|🐻 bear face|🐼 panda face|🐽 pig nose|🐾 paw prints|🐿️ chipmunk|🦀 crab|🦁 lion face|🦂 scorpion|🦃 turkey|🦄 unicorn face|🦅 eagle|🦆 duck|🦇 bat|🦈 shark|🦉 owl|🦊 fox face|🦋 butterfly|🦌 deer|🦍 gorilla|🦎 lizard|🦏 rhinoceros|🦐 shrimp|🦑 squid|🦒 giraffe face|🦓 zebra face|🦔 hedgehog|🦕 sauropod|🦖 t-rex|🦗 cricket|🦘 kangaroo|🦙 llama|🦚 peacock|🦛 hippopotamus|🦜 parrot|🦝 raccoon|🦞 lobster|🦟 mosquito|🦠 microbe|🦡 badger|🦢 swan|🦣 mammoth|🦤 dodo|🦥 sloth|🦦 otter|🦧 orangutan|🦨 skunk|🦩 flamingo|🦪 oyster|🦫 beaver|🦬 bison|🦭 seal|🦮 guide dog|🪰 fly|🪱 worm|🪲 beetle|🪳 cockroach|🪴 potted plant|🪵 wood|🪶 feather|🪷 lotus|🪸 coral|🪹 empty nest|🪺 nest with eggs|🕷️ spider|🕸️ spider web|🕊️ dove of peace|🌀 cyclone|🌁 foggy|🌂 closed umbrella|🌃 night with stars|🌄 sunrise over mountains|🌅 sunrise|🌆 cityscape at dusk|🌇 sunset over buildings|🌈 rainbow|🌊 water wave|🌋 volcano|🌌 milky way|🌍 earth globe europe-africa|🌎 earth globe americas|🌏 earth globe asia-australia|🌐 globe with meridians|🌑 new moon symbol|🌒 waxing crescent moon symbol|🌓 first quarter moon symbol|🌔 waxing gibbous moon symbol|🌕 full moon symbol|🌖 waning gibbous moon symbol|🌗 last quarter moon symbol|🌘 waning crescent moon symbol|🌙 crescent moon|🌚 new moon with face|🌛 first quarter moon with face|🌜 last quarter moon with face|🌝 full moon with face|🌞 sun with face|🌟 glowing star|🌱 seedling|🌲 evergreen tree|🌳 deciduous tree|🌴 palm tree|🌵 cactus|🌷 tulip|🌸 cherry blossom|🌹 rose|🌺 hibiscus|🌻 sunflower|🌼 blossom|🍀 four leaf clover|🍁 maple leaf|🍂 fallen leaf|🍃 leaf fluttering in wind|🍄 mushroom|💐 bouquet|💥 collision symbol|💦 splashing sweat symbol|💧 droplet|🔥 fire|☀️ black sun with rays|☁️ cloud|☂️ umbrella|☃️ snowman|☄️ comet|⛄ snowman without snow|⛅ sun behind cloud|❄️ snowflake|⭐ white medium star", "food": "🌭 hot dog|🌮 taco|🌯 burrito|🌶️ hot pepper|🌽 ear of maize|🌾 ear of rice|🍅 tomato|🍆 aubergine|🍇 grapes|🍈 melon|🍉 watermelon|🍊 tangerine|🍋 lemon|🍌 banana|🍍 pineapple|🍎 red apple|🍏 green apple|🍐 pear|🍑 peach|🍒 cherries|🍓 strawberry|🍔 hamburger|🍕 slice of pizza|🍖 meat on bone|🍗 poultry leg|🍘 rice cracker|🍙 rice ball|🍚 cooked rice|🍛 curry and rice|🍜 steaming bowl|🍝 spaghetti|🍞 bread|🍟 french fries|🍠 roasted sweet potato|🍡 dango|🍢 oden|🍣 sushi|🍤 fried shrimp|🍥 fish cake with swirl design|🍦 soft ice cream|🍧 shaved ice|🍨 ice cream|🍩 doughnut|🍪 cookie|🍫 chocolate bar|🍬 candy|🍭 lollipop|🍮 custard|🍯 honey pot|🍰 shortcake|🍱 bento box|🍲 pot of food|🍳 cooking|🍴 fork and knife|🍵 teacup without handle|🍶 sake bottle and cup|🍷 wine glass|🍸 cocktail glass|🍹 tropical drink|🍺 beer mug|🍻 clinking beer mugs|🍼 baby bottle|🍽️ fork and knife with plate|🍾 bottle with popping cork|🍿 popcorn|🥐 croissant|🥑 avocado|🥒 cucumber|🥓 bacon|🥔 potato|🥕 carrot|🥖 baguette bread|🥗 green salad|🥘 shallow pan of food|🥙 stuffed flatbread|🥚 egg|🥛 glass of milk|🥜 peanuts|🥝 kiwifruit|🥞 pancakes|🥟 dumpling|🥠 fortune cookie|🥡 takeout box|🥢 chopsticks|🥣 bowl with spoon|🥤 cup with straw|🥥 coconut|🥦 broccoli|🥧 pie|🥨 pretzel|🥩 cut of meat|🥪 sandwich|🥫 canned food|🥬 leafy green|🥭 mango|🥮 moon cake|🥯 bagel|🧀 cheese wedge|🧁 cupcake|🧂 salt shaker|🧃 beverage box|🧄 garlic|🧅 onion|🧆 falafel|🧇 waffle|🧈 butter|🧉 mate drink|🧊 ice cube|🧋 bubble tea|🫐 blueberries|🫑 bell pepper|🫒 olive|🫓 flatbread|🫔 tamale|🫕 fondue|🫖 teapot|🫗 pouring liquid|🫘 beans|🫙 jar|☕ hot beverage", "activities": "🀄 mahjong tile red dragon|🃏 playing card black joker|🎃 jack-o-lantern|🎄 christmas tree|🎅 father christmas|🎆 fireworks|🎇 firework sparkler|🎈 balloon|🎉 party popper|🎊 confetti ball|🎋 tanabata tree|🎌 crossed flags|🎍 pine decoration|🎎 japanese dolls|🎏 carp streamer|🎐 wind chime|🎑 moon viewing ceremony|🎒 school satchel|🎓 graduation cap|🎖️ military medal|🎗️ reminder ribbon|🎙️ studio microphone|🎚️ level slider|🎛️ control knobs|🎞️ film frames|🎟️ admission tickets|🎠 carousel horse|🎡 ferris wheel|🎢 roller coaster|🎣 fishing pole and fish|🎤 microphone|🎥 movie camera|🎦 cinema|🎧 headphone|🎨 artist palette|🎩 top hat|🎪 circus tent|🎫 ticket|🎬 clapper board|🎭 performing arts|🎮 video game|🎯 direct hit|🎰 slot machine|🎱 billiards|🎲 game die|🎳 bowling|🎴 flower playing cards|🎵 musical note|🎶 multiple musical notes|🎷 saxophone|🎸 guitar|🎹 musical keyboard|🎺 trumpet|🎻 violin|🎼 musical score|🎽 running shirt with sash|🎾 tennis racquet and ball|🎿 ski and ski boot|🏀 basketball and hoop|🏁 chequered flag|🏂 snowboarder|🏃 runner|🏄 surfer|🏅 sports medal|🏆 trophy|🏇 horse racing|🏈 american football|🏉 rugby football|🏊 swimmer|🏋️ weight lifter|🏌️ golfer|🏍️ racing motorcycle|🏎️ racing car|🏏 cricket bat and ball|🏐 volleyball|🏑 field hockey stick and ball|🏒 ice hockey stick and puck|🏓 table tennis paddle and ball|🏸 badminton racquet and shuttlecock|🏹 bow and arrow|🛷 sled|🛹 skateboard|🛼 roller skate|🤺 fencer|🤼 wrestlers|🤽 water polo|🤾 handball|🤿 diving mask|🥀 wilted flower|🥁 drum with drumsticks|🥂 clinking glasses|🥃 tumbler glass|🥄 spoon|🥅 goal net|🥇 first place medal|🥈 second place medal|🥉 third place medal|🥊 boxing glove|🥋 martial arts uniform|🥌 curling stone|🥍 lacrosse stick and ball|🥎 softball|🥏 flying disc|🧩 jigsaw puzzle piece|🧿 nazar amulet|🪀 yo-yo|🪁 kite|🪂 parachute|🪃 boomerang|🪄 magic wand|🪅 pinata|🪆 nesting dolls|⚽ soccer ball|⚾ baseball|⛳ flag in hole|⛴️ ferry", "travel": "🏔️ snow capped mountain|🏕️ camping|🏖️ beach with umbrella|🏗️ building construction|🏘️ house buildings|🏙️ cityscape|🏚️ derelict house building|🏛️ classical building|🏜️ desert|🏝️ desert island|🏞️ national park|🏟️ stadium|🏠 house building|🏡 house with garden|🏢 office building|🏣 japanese post office|🏤 european post office|🏥 hospital|🏦 bank|🏧 automated teller machine|🏨 hotel|🏩 love hotel|🏪 convenience store|🏫 school|🏬 department store|🏭 factory|🏮 izakaya lantern|🏯 japanese castle|🏰 european castle|🏳️ waving white flag|🏴 waving black flag|🏵️ rosette|🏷️ label|🕐 clock face one oclock|🕑 clock face two oclock|🕒 clock face three oclock|🕓 clock face four oclock|🕔 clock face five oclock|🕕 clock face six oclock|🕖 clock face seven oclock|🕗 clock face eight oclock|🕘 clock face nine oclock|🕙 clock face ten oclock|🕚 clock face eleven oclock|🕛 clock face twelve oclock|🕜 clock face one-thirty|🕝 clock face two-thirty|🕞 clock face three-thirty|🕟 clock face four-thirty|🕠 clock face five-thirty|🕡 clock face six-thirty|🕢 clock face seven-thirty|🕣 clock face eight-thirty|🕤 clock face nine-thirty|🕥 clock face ten-thirty|🕦 clock face eleven-thirty|🕧 clock face twelve-thirty|🗺️ world map|🗻 mount fuji|🗼 tokyo tower|🗽 statue of liberty|🗾 silhouette of japan|🗿 moyai|🚀 rocket|🚁 helicopter|🚂 steam locomotive|🚃 railway car|🚄 high-speed train|🚅 high-speed train with bullet nose|🚆 train|🚇 metro|🚈 light rail|🚉 station|🚊 tram|🚋 tram car|🚌 bus|🚍 oncoming bus|🚎 trolleybus|🚏 bus stop|🚐 minibus|🚑 ambulance|🚒 fire engine|🚓 police car|🚔 oncoming police car|🚕 taxi|🚖 oncoming taxi|🚗 automobile|🚘 oncoming automobile|🚙 recreational vehicle|🚚 delivery truck|🚛 articulated lorry|🚜 tractor|🚝 monorail|🚞 mountain railway|🚟 suspension railway|🚠 mountain cableway|🚡 aerial tramway|🚢 ship|🚣 rowboat|🚤 speedboat|🚥 horizontal traffic light|🚦 vertical traffic light|🚧 construction sign|🚨 police cars revolving light|🚩 triangular flag on post|🚪 door|🚫 no entry sign|🚬 smoking symbol|🚭 no smoking symbol|🚮 put litter in its place symbol|🚯 do not litter symbol|🚰 potable water symbol|🚱 non-potable water symbol|🚲 bicycle|🚳 no bicycles|🚴 bicyclist|🚵 mountain bicyclist|🚶 pedestrian|🚷 no pedestrians|🚸 children crossing|🚹 mens symbol|🚺 womens symbol|🚻 restroom|🚼 baby symbol|🚽 toilet|🚾 water closet|🚿 shower|🛀 bath|🛁 bathtub|🛂 passport control|🛃 customs|🛄 baggage claim|🛅 left luggage|🛎️ bellhop bell|🛏️ bed|🛐 place of worship|🛑 octagonal sign|🛒 shopping trolley|🛠️ hammer and wrench|🛡️ shield|🛢️ oil drum|🛣️ motorway|🛤️ railway track|🛥️ motor boat|🛩️ small airplane|🛫 airplane departure|🛬 airplane arriving|🛰️ satellite|🛳️ passenger ship|🛴 scooter|🛵 motor scooter|🛶 canoe|🛸 flying saucer|🛺 auto rickshaw|🛻 pickup truck|🧭 compass|⌚ watch|⌛ hourglass|⏰ alarm clock|⏱️ stopwatch|⏲️ timer clock|⏳ hourglass with flowing sand|⚓ anchor|⚡ high voltage sign|⛰️ mountain|⛱️ umbrella on ground|⛲ fountain|⛵ sailboat|⛷️ skier|⛸️ ice skate|⛹️ person with ball|⛺ tent|⛽ fuel pump|✈️ airplane", "objects": "👑 crown|👒 womans hat|👓 eyeglasses|👔 necktie|👕 t-shirt|👖 jeans|👗 dress|👘 kimono|👙 bikini|👚 womans clothes|👛 purse|👜 handbag|👝 pouch|👞 mans shoe|👟 athletic shoe|👠 high-heeled shoe|👡 womans sandal|👢 womans boots|👣 footprints|👤 bust in silhouette|👥 busts in silhouette|💈 barber pole|💉 syringe|💊 pill|💋 kiss mark|💌 love letter|💍 ring|💎 gem stone|💏 kiss|💡 electric light bulb|💢 anger symbol|💣 bomb|💤 sleeping symbol|💰 money bag|💱 currency exchange|💲 heavy dollar sign|💳 credit card|💴 banknote with yen sign|💵 banknote with dollar sign|💶 banknote with euro sign|💷 banknote with pound sign|💸 money with wings|💹 chart with upwards trend and yen sign|💺 seat|💻 personal computer|💼 briefcase|💽 minidisc|💾 floppy disk|💿 optical disc|📀 dvd|📁 file folder|📂 open file folder|📃 page with curl|📄 page facing up|📅 calendar|📆 tear-off calendar|📇 card index|📈 chart with upwards trend|📉 chart with downwards trend|📊 bar chart|📋 clipboard|📌 pushpin|📍 round pushpin|📎 paperclip|📏 straight ruler|📐 triangular ruler|📑 bookmark tabs|📒 ledger|📓 notebook|📔 notebook with decorative cover|📕 closed book|📖 open book|📗 green book|📘 blue book|📙 orange book|📚 books|📛 name badge|📜 scroll|📝 memo|📞 telephone receiver|📟 pager|📠 fax machine|📡 satellite antenna|📢 public address loudspeaker|📣 cheering megaphone|📤 outbox tray|📥 inbox tray|📦 package|📧 e-mail symbol|📨 incoming envelope|📩 envelope with downwards arrow above|📪 closed mailbox with lowered flag|📫 closed mailbox with raised flag|📬 open mailbox with raised flag|📭 open mailbox with lowered flag|📮 postbox|📯 postal horn|📰 newspaper|📱 mobile phone|📲 mobile phone with rightwards arrow at left|📳 vibration mode|📴 mobile phone off|📵 no mobile phones|📶 antenna with bars|📷 camera|📸 camera with flash|📹 video camera|📺 television|📻 radio|📼 videocassette|📽️ film projector|📿 prayer beads|🔋 battery|🔌 electric plug|🔍 left-pointing magnifying glass|🔎 right-pointing magnifying glass|🔏 lock with ink pen|🔐 closed lock with key|🔑 key|🔒 lock|🔓 open lock|🔔 bell|🔕 bell with cancellation stroke|🔖 bookmark|🔗 link symbol|🔘 radio button|🔙 back with leftwards arrow above|🔚 end with leftwards arrow above|🔛 on with exclamation mark with left right arrow above|🔜 soon with rightwards arrow above|🔝 top with upwards arrow above|🔞 no one under eighteen symbol|🔟 keycap ten|🔠 input symbol for latin capital letters|🔡 input symbol for latin small letters|🔢 input symbol for numbers|🔣 input symbol for symbols|🔤 input symbol for latin letters|🔦 electric torch|🔧 wrench|🔨 hammer|🔩 nut and bolt|🔪 hocho|🔫 pistol|🔬 microscope|🔭 telescope|🔮 crystal ball|🔯 six pointed star with middle dot|🕯️ candle|🕰️ mantelpiece clock|🕳️ hole|🕴️ man in business suit levitating|🕵️ sleuth or spy|🕶️ dark sunglasses|🕹️ joystick|🕺 man dancing|🖇️ linked paperclips|🖊️ lower left ballpoint pen|🖋️ lower left fountain pen|🖌️ lower left paintbrush|🖍️ lower left crayon|🖐️ raised hand with fingers splayed|🖕 reversed hand with middle finger extended|🖖 raised hand with part between middle and ring fingers|🖤 black heart|🖥️ desktop computer|🖨️ printer|🖱️ three button mouse|🖲️ trackball|🖼️ frame with picture|🗂️ card index dividers|🗃️ card file box|🗄️ file cabinet|🗑️ wastebasket|🗒️ spiral note pad|🗓️ spiral calendar pad|🗜️ compression|🗝️ old key|🗞️ rolled-up newspaper|🗡️ dagger knife|🗨️ left speech bubble|🗯️ right anger bubble|🗳️ ballot box with ballot|🥽 goggles|🥾 hiking boot|🥿 flat shoe|🦯 probing cane|🧢 billed cap|🧣 scarf|🧤 gloves|🧥 coat|🧦 socks|🧧 red gift envelope|🧨 firecracker|🧪 test tube|🧫 petri dish|🧬 dna double helix|🧮 abacus|🧯 fire extinguisher|🧰 toolbox|🧱 brick|🧲 magnet|🧳 luggage|🧴 lotion bottle|🧵 spool of thread|🧶 ball of yarn|🧷 safety pin|🧸 teddy bear|🧹 broom|🧺 basket|🧻 roll of paper|🧼 bar of soap|🧽 sponge|🧾 receipt|🩰 ballet shoes|🩱 one-piece swimsuit|🩲 briefs|🩳 shorts|🩴 thong sandal|🩸 drop of blood|🩹 adhesive bandage|🩺 stethoscope|🩻 x-ray|🩼 crutch|🪐 ringed planet|🪑 chair|🪒 razor|🪓 axe|🪔 diya lamp|🪕 banjo|🪖 military helmet|🪗 accordion|🪘 long drum|🪙 coin|🪚 carpentry saw|🪛 screwdriver|🪜 ladder|🪝 hook|🪞 mirror|🪟 window|🪠 plunger|🪡 sewing needle|🪢 knot|🪣 bucket|🪤 mouse trap|🪥 toothbrush|🪦 headstone|🪧 placard|🪨 rock|🪩 mirror ball|🪪 identification card|🪫 low battery|🪬 hamsa|⌨️ keyboard|☎️ black telephone|⚒️ hammer and pick|⚔️ crossed swords|⚕️ staff of aesculapius|⚖️ scales|⚗️ alembic|⚙️ gear|⚛️ atom symbol|⚜️ fleur-de-lis|⚠️ warning sign|⚰️ coffin|⚱️ funeral urn|⛈️ thunder cloud and rain|⛎ ophiuchus|⛏️ pick|⛑️ helmet with white cross|⛓️ chains|⛔ no entry|⛩️ shinto shrine|⛪ church|✂️ black scissors|✉️ envelope|✏️ pencil|✒️ black nib|❤️ heavy black heart", "symbols": "‼️ double exclamation mark|⁉️ exclamation question mark|ℹ️ information source|↔️ left right arrow|↕️ up down arrow|↖️ north west arrow|↗️ north east arrow|↘️ south east arrow|↙️ south west arrow|↩️ leftwards arrow with hook|↪️ rightwards arrow with hook|⏏️ eject symbol|⏩ black right-pointing double triangle|⏪ black left-pointing double triangle|⏫ black up-pointing double triangle|⏬ black down-pointing double triangle|⏭️ black right-pointing double triangle with vertical bar|⏮️ black left-pointing double triangle with vertical bar|⏯️ black right-pointing triangle with double vertical bar|⏸️ double vertical bar|⏹️ black square for stop|⏺️ black circle for record|Ⓜ️ circled latin capital letter m|▪️ black small square|▫️ white small square|▶️ black right-pointing triangle|◀️ black left-pointing triangle|◻️ white medium square|◼️ black medium square|◽ white medium small square|◾ black medium small square|☑️ ballot box with check|☔ umbrella with rain drops|☘️ shamrock|☠️ skull and crossbones|☢️ radioactive sign|☣️ biohazard sign|☦️ orthodox cross|☪️ star and crescent|☮️ peace symbol|☯️ yin yang|☸️ wheel of dharma|☹️ white frowning face|☺️ white smiling face|♀️ female sign|♂️ male sign|♈ aries|♉ taurus|♊ gemini|♋ cancer|♌ leo|♍ virgo|♎ libra|♏ scorpius|♐ sagittarius|♑ capricorn|♒ aquarius|♓ pisces|♟️ black chess pawn|♠️ black spade suit|♣️ black club suit|♥️ black heart suit|♦️ black diamond suit|♨️ hot springs|♻️ black universal recycling symbol|♾️ permanent paper sign|♿ wheelchair symbol|⚧️ male with stroke and male and female sign|⚪ medium white circle|⚫ medium black circle|✅ white heavy check mark|✔️ heavy check mark|✖️ heavy multiplication x|✝️ latin cross|✡️ star of david|✨ sparkles|✳️ eight spoked asterisk|✴️ eight pointed black star|❇️ sparkle|❌ cross mark|❎ negative squared cross mark|❓ black question mark ornament|❔ white question mark ornament|❕ white exclamation mark ornament|❗ heavy exclamation mark symbol|❣️ heavy heart exclamation mark ornament|➕ heavy plus sign|➖ heavy minus sign|➗ heavy division sign|➡️ black rightwards arrow|➰ curly loop|➿ double curly loop|⤴️ arrow pointing rightwards then curving upwards|⤵️ arrow pointing rightwards then curving downwards|⬅️ leftwards black arrow|⬆️ upwards black arrow|⬇️ downwards black arrow|⬛ black large square|⬜ white large square|⭕ heavy large circle|〰️ wavy dash|〽️ part alternation mark|㊗️ circled ideograph congratulation|㊙️ circled ideograph secret|🅰️ negative squared latin capital letter a|🅱️ negative squared latin capital letter b|🅾️ negative squared latin capital letter o|🅿️ negative squared latin capital letter p|🆎 negative squared ab|🆑 squared cl|🆒 squared cool|🆓 squared free|🆔 squared id|🆕 squared new|🆖 squared ng|🆗 squared ok|🆘 squared sos|🆙 squared up with exclamation mark|🆚 squared vs|🈁 squared katakana koko|🈂️ squared katakana sa|🈚 squared cjk unified ideograph-7121|🈯 squared cjk unified ideograph-6307|🈲 squared cjk unified ideograph-7981|🈳 squared cjk unified ideograph-7a7a|🈴 squared cjk unified ideograph-5408|🈵 squared cjk unified ideograph-6e80|🈶 squared cjk unified ideograph-6709|🈷️ squared cjk unified ideograph-6708|🈸 squared cjk unified ideograph-7533|🈹 squared cjk unified ideograph-5272|🈺 squared cjk unified ideograph-55b6|🉐 circled ideograph advantage|🉑 circled ideograph accept|🌉 bridge at night|🌠 shooting star|🌡️ thermometer|🌤️ white sun with small cloud|🌥️ white sun behind cloud|🌦️ white sun behind cloud with rain|🌧️ cloud with rain|🌨️ cloud with snow|🌩️ cloud with lightning|🌪️ cloud with tornado|🌫️ fog|🌬️ wind blowing face|🌰 chestnut|🌿 herb|🎀 ribbon|🎁 wrapped present|🎂 birthday cake|🏺 amphora|💑 couple with heart|💒 wedding|💓 beating heart|💔 broken heart|💕 two hearts|💖 sparkling heart|💗 growing heart|💘 heart with arrow|💙 blue heart|💚 green heart|💛 yellow heart|💜 purple heart|💝 heart with ribbon|💞 revolving hearts|💟 heart decoration|💠 diamond shape with a dot inside|💨 dash symbol|💮 white flower|💯 hundred points symbol|🔀 twisted rightwards arrows|🔁 clockwise rightwards and leftwards open circle arrows|🔂 clockwise rightwards and leftwards open circle arrows with circled one overlay|🔃 clockwise downwards and upwards open circle arrows|🔄 anticlockwise downwards and upwards open circle arrows|🔅 low brightness symbol|🔆 high brightness symbol|🔇 speaker with cancellation stroke|🔈 speaker|🔉 speaker with one sound wave|🔊 speaker with three sound waves|🔰 japanese symbol for beginner|🔱 trident emblem|🔲 black square button|🔳 white square button|🔴 large red circle|🔵 large blue circle|🔶 large orange diamond|🔷 large blue diamond|🔸 small orange diamond|🔹 small blue diamond|🔺 up-pointing red triangle|🔻 down-pointing red triangle|🔼 up-pointing small red triangle|🔽 down-pointing small red triangle|🕉️ om symbol|🕋 kaaba|🕌 mosque|🕍 synagogue|🕎 menorah with nine branches|🛋️ couch and lamp|🛌 sleeping accommodation|🛍️ shopping bags|🛕 hindu temple|🛖 hut|🛗 elevator|🛝 playground slide|🛞 wheel|🛟 ring buoy|🟠 large orange circle|🟡 large yellow circle|🟢 large green circle|🟣 large purple circle|🟤 large brown circle|🟥 large red square|🟦 large blue square|🟧 large orange square|🟨 large yellow square|🟩 large green square|🟪 large purple square|🟫 large brown square|🟰 heavy equals sign|🤰 pregnant woman|🤱 breast-feeding|🤲 palms up together|🤳 selfie|🤴 prince|🤵 man in tuxedo|🤶 mother christmas|🤷 shrug|🤸 person doing cartwheel|🤹 juggling|🥻 sari|🥼 lab coat|🧌 troll|🧍 standing person|🧎 kneeling person|🧏 deaf person|🧡 orange heart|🫀 anatomical heart|🫁 lungs|🫂 people hugging|🫃 pregnant man|🫄 pregnant person|🫅 person with crown|🫰 hand with index finger and thumb crossed|🫱 rightwards hand|🫲 leftwards hand|🫳 palm down hand|🫴 palm up hand|🫵 index pointing at the viewer|🫶 heart hands"};
const EMT=[["\u2B50","Consigliate"],["\u{1F600}","Faccine e persone"],["\u{1F43B}","Animali e natura"],["\u{1F354}","Cibo e bevande"],["\u26BD","Attivit\u00e0"],["\u2708\uFE0F","Viaggi e luoghi"],["\u{1F4A1}","Oggetti"],["\u2764\uFE0F","Simboli"]];
const EMK=["people","animals","food","activities","travel","objects","symbols"];
let EMX=null;function emAll(){if(EMX)return EMX;EMX=EMK.map(k=>EMJ[k].split("|").map(x=>{const i=x.indexOf(" ");return[x.slice(0,i),x.slice(i+1)]}));return EMX}
let CT="x",CEDIT=false,NCAT=null,DR=null;
const IC_GRIP='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8.5h14M5 12h14M5 15.5h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
const IC_ARR='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M8 5L5 8.2M8 5l3 3.2M16 19V5M16 19l-3-3.2M16 19l3-3.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const IC_CHK='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const IC_PLS='<svg class="cpl" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
const IC_TRAY='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13l2-6.5A2 2 0 0 1 7.9 5h8.2a2 2 0 0 1 1.9 1.5L20 13v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 13h4.5l1 2h5l1-2H20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
function catList(){return CT==="x"?ord().map(n=>({n,e:CEMO[n]||"\u{1F3F7}\uFE0F",c:COL[n]})):S.ci}
function catSugList(){return CT==="x"?BSUG.concat(CSUGX).filter(z=>!Object.keys(CATS).some(k=>k.toLowerCase()===z[0].toLowerCase())&&!S.cx.some(k=>k.s===z[0])):CSUGI.filter(z=>!S.ci.some(k=>k.n.toLowerCase()===z[0].toLowerCase()||k.s===z[0]))}
function catRender(){
  const l=$("catl");if(!l)return;const x=CT==="x",list=catList(),sug=(CEDIT||(S.csh&&!document.documentElement.classList.contains("onb")))?[]:catSugList();
  l.classList.toggle("edm",CEDIT);
  let h=`<h2 class="seth">${x?"CATEGORIE DI SPESA":"CATEGORIE DI ENTRATA"}</h2>`;
  h+=list.length?`<div class="card setc cul2" id="catul">${list.map(c=>`<div class="cr" data-cn="${esc(c.n)}"><span class="ce">${esc(c.e)}</span><span class="cn2">${esc(c.n)}</span><i class="csw" style="background:${c.c}"></i><span class="cgr">${IC_GRIP}</span></div>`).join("")}</div>`:`<div class="card cempty">${IC_TRAY}Nessuna categoria di ${x?"spesa":"entrata"} trovata: aggiungine una dai suggerimenti oppure premi \u201C+ Nuova Categoria\u201D.</div>`;
  if(sug.length)h+=`<h2 class="seth">SUGGERITE</h2><div class="card setc">${sug.map(z=>`<button type="button" class="cr sg" data-cat-sug="${esc(z[0])}"><span class="ce">${z[1]}</span><span class="cn2">${esc(z[0])}</span>${IC_PLS}</button>`).join("")}</div>`;
  l.innerHTML=h;
  document.querySelectorAll("#ctabs [data-cat-tab]").forEach(b=>b.classList.toggle("on",b.dataset.catTab===CT));
  const ed=$("cedit");ed.innerHTML=CEDIT?IC_CHK:IC_ARR;ed.classList.toggle("ok",CEDIT);ed.setAttribute("aria-label",CEDIT?"Fine riordino":"Riordina le categorie");
  $("ceye").classList.toggle("on",!!S.csh);$("cslash").style.display=S.csh?"":"none";$("ceye").disabled=CEDIT;$("ceye").style.opacity=CEDIT?".45":""}
function catOpen(){CEDIT=false;catRender()}
function catName(n){return String(n||"").replace(/[\uFE00-\uFE0F\u20E3\u200D]/g,"").replace(/[^\p{L}\p{M}\p{N}\s'\u2019.\-]/gu,"").replace(/\s+/g," ").trim().slice(0,24)}
function catAdd(k,n,e,c,src){
  n=catName(n);if(!n)return"Scrivi il nome della categoria (solo lettere e numeri).";
  const lc=n.toLowerCase();
  if(k==="x"){if(Object.keys(CATS).some(z=>z.toLowerCase()===lc))return"Esiste gi\u00e0 una categoria di spesa con questo nome."}
  else if(S.ci.some(z=>z.n.toLowerCase()===lc))return"Esiste gi\u00e0 una categoria di entrata con questo nome.";
  const o={n,e:e||"\u{1F3F7}\uFE0F",c:c||CPAL[11]};if(src)o.s=src;
  if(k==="x"){S.cx.push(o);regCat(o);S.order=ord()}else S.ci.push(o);
  save();if(k==="x"){$("c").innerHTML=ord().map(z=>`<option>${z}</option>`).join("");reAll()}
  CT=k;catRender();return""}
/* trascinamento (riordino) */
function drStart(row,e){DR={row,y0:e.clientY,top0:row.offsetTop,id:e.pointerId};row.classList.add("drag");try{row.setPointerCapture(e.pointerId)}catch(_){}if(navigator.vibrate)try{navigator.vibrate(8)}catch(_){}}
function drMove(e){if(!DR||e.pointerId!==DR.id)return;const row=DR.row,ul=row.parentNode,y=e.clientY;
  const sibs=[...ul.children].filter(z=>z!==row),idx=sibs.filter(z=>{const r=z.getBoundingClientRect();return r.top+r.height/2<y}).length,ref=sibs[idx]||null;
  if(row.nextElementSibling!==ref)ul.insertBefore(row,ref);
  row.style.transform=`translateY(${y-DR.y0-(row.offsetTop-DR.top0)}px)`}
function drEnd(e){if(!DR||(e&&e.pointerId!==undefined&&e.pointerId!==DR.id))return;const row=DR.row,ul=row.parentNode;clearTimeout(DR.t);row.style.transform="";row.classList.remove("drag");DR=null;
  const names=[...ul.children].map(z=>z.dataset.cn);
  if(CT==="x"){S.order=names}else S.ci=names.map(n=>S.ci.find(z=>z.n===n)).filter(Boolean);
  save();if(CT==="x")reAll();catRender()}
document.addEventListener("pointerdown",e=>{const row=CEDIT&&e.target.closest?e.target.closest("#catul .cr"):null;if(!row||DR)return;
  if(e.target.closest(".cgr")){e.preventDefault();drStart(row,e);return}
  const sx=e.clientX,sy=e.clientY,t=setTimeout(()=>{if(!DR)drStart(row,{clientY:sy,pointerId:e.pointerId})},230);
  const cancel=ev=>{if(ev.type==="pointermove"&&Math.hypot(ev.clientX-sx,ev.clientY-sy)<8)return;clearTimeout(t);document.removeEventListener("pointermove",cancel);document.removeEventListener("pointerup",cancel);document.removeEventListener("pointercancel",cancel)};
  document.addEventListener("pointermove",cancel);document.addEventListener("pointerup",cancel);document.addEventListener("pointercancel",cancel)});
document.addEventListener("pointermove",drMove);document.addEventListener("pointerup",drEnd);document.addEventListener("pointercancel",drEnd);
document.addEventListener("touchmove",e=>{if(DR)e.preventDefault()},{passive:false});
document.addEventListener("contextmenu",e=>{if(CEDIT&&e.target.closest&&e.target.closest("#catul"))e.preventDefault()});
/* nuova categoria */
function ncEmoji(q){const g=$("emg");if(!g)return;q=(q||"").trim().toLowerCase();let r;
  if(q){const seen=new Set();r=[];EMOJI.concat(...emAll().map(a=>a)).forEach(z=>{if(!seen.has(z[0])&&(z[1].includes(q)||z[0]===q)){seen.add(z[0]);r.push(z)}})}
  else r=NCAT&&NCAT.tab>0?emAll()[NCAT.tab-1]:EMOJI;
  document.querySelectorAll("#emt [data-nct]").forEach(b=>b.classList.toggle("on",!q&&+b.dataset.nct===(NCAT?NCAT.tab:0)));
  g.innerHTML=r.length?r.map(z=>`<button type="button" data-nce="${z[0]}"${NCAT&&NCAT.e===z[0]?' class="on"':""} aria-label="${esc(z[1].split(" ")[0])}">${z[0]}</button>`).join(""):'<p>Nessun emoji trovato.</p>';g.scrollTop=0}
function ncSync(){if(!NCAT)return;$("ncp").innerHTML=NCAT.e?esc(NCAT.e):"<i>\u263A</i>";$("ncsw").style.background=NCAT.c;
  document.querySelectorAll("[data-nck]").forEach(b=>b.classList.toggle("on",b.dataset.nck===NCAT.k));
  $("ncpal").innerHTML=CPAL.map(c=>`<button type="button" data-ncc="${c}" style="background:${c}" aria-label="Colore ${c}">${c===NCAT.c?IC_CHK:""}</button>`).join("")}
function openCatNew(old){
  const ed=typeof old==="string"?old:"",x=CT==="x",cur=ed?catList().find(z=>z.n===ed):null;
  if(ed&&!cur)return;
  modal={kind:"newcat"};NCAT={k:CT,e:cur?cur.e:"",c:cur?cur.c:CPAL[11],tab:0,edit:ed};const tt=document.getElementById("toast");if(tt)tt.classList.remove("on");
  document.querySelector(".mbox").classList.add("sheet");$("mt").textContent=ed?"Modifica categoria":"Nuova categoria";
  $("mbody").innerHTML=`<div class="ns">${ed?"":`<div class="nem" style="margin:0 auto 4px"><button type="button" data-nck="x">Spesa</button><button type="button" data-nck="i">Entrata</button></div>`}<div class="nprev" id="ncp"></div><div class="ncpill" id="ncpill" hidden></div><div class="ncrow"><button type="button" class="ncsw" id="ncsw" data-ncsw="1" aria-label="Scegli il colore"></button><input id="ncn" class="ninp" placeholder="Nome categoria" maxlength="24" autocomplete="off" autocapitalize="sentences" aria-label="Nome categoria">${ed?"":`<button type="button" class="ncadd" data-ncadd="1" aria-label="Aggiungi categoria">+</button>`}</div><div class="ncpal" id="ncpal" hidden></div><div class="err" id="ncerr" role="alert"></div>${ed?`<div class="ceacts"><button type="button" class="nbt" data-cecancel="1">Annulla</button><button type="button" class="nbt danger" data-cedel="1">Elimina</button><button type="button" class="nbt ceok" data-cesave="1">Salva</button></div>`:""}<input id="nce" class="ninp" type="search" placeholder="Cerca emoji" autocomplete="off" aria-label="Cerca emoji"><div class="emt" id="emt" role="tablist">${EMT.map((t,i)=>`<button type="button" role="tab" data-nct="${i}" aria-label="${t[1]}">${t[0]}</button>`).join("")}</div><div class="emg" id="emg"></div></div>`;
  ncSync();ncEmoji("");if(ed)$("ncn").value=ed;
  $("nce").addEventListener("input",e=>ncEmoji(e.target.value));
  $("ncn").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();ed?catSave():ncAdd()}});
  $("ncn").addEventListener("input",e=>{$("ncerr").textContent="";const el=e.target,v=el.value.replace(/[︀-️⃣‍]/g,"").replace(/[^\p{L}\p{M}\p{N}\s'’.\-]/gu,"");if(v!==el.value){const pos=el.selectionStart-(el.value.length-v.length);el.value=v;try{el.setSelectionRange(pos,pos)}catch(_){}}});
  $("mod").hidden=false}
function catUse(k,n){return k==="x"?S.items.filter(i=>i.c===n).length+S.rec.filter(r=>r.t!=="in"&&r.c===n).length+S.sch.filter(r=>r.t!=="in"&&r.c===n).length:S.rec.filter(r=>r.t==="in"&&r.c===n).length+S.sch.filter(r=>r.t==="in"&&r.c===n).length}
function catRef(k,a,b){if(k==="x"){S.items.forEach(i=>{if(i.c===a)i.c=b});S.rec.forEach(r=>{if(r.t!=="in"&&r.c===a)r.c=b});S.sch.forEach(r=>{if(r.t!=="in"&&r.c===a)r.c=b})}
  else{S.rec.forEach(r=>{if(r.t==="in"&&r.c===a)r.c=b});S.sch.forEach(r=>{if(r.t==="in"&&r.c===a)r.c=b})}}
function catFin(k){save();if(k==="x")$("c").innerHTML=ord().map(z=>`<option>${z}</option>`).join("");closeModal();CT=k;catRender();reAll()}
function catSave(){if(!NCAT||!NCAT.edit)return;const k=NCAT.k,old=NCAT.edit,n=catName($("ncn").value),lc=n.toLowerCase();
  const err=m=>{$("ncerr").textContent=m};
  if(!n)return err("Scrivi il nome della categoria (solo lettere e numeri).");
  if(k==="x"){if(Object.keys(CATS).some(z=>z!==old&&z.toLowerCase()===lc))return err("Esiste già una categoria di spesa con questo nome.")}
  else if(S.ci.some(z=>z.n!==old&&z.n.toLowerCase()===lc))return err("Esiste già una categoria di entrata con questo nome.");
  const o0=(k==="x"?S.cx:S.ci).find(z=>z.n===old),sr=(o0&&o0.s)||(k==="x"&&BUILTIN.includes(old)?old:"");
  const o={n,e:NCAT.e||"\u{1F3F7}️",c:NCAT.c};if(sr)o.s=sr;
  if(k==="x"){
    if(n!==old){const L=S.lim[old];catRef("x",old,n);S.bud.forEach(b=>{if(b.c===old)b.c=n});S.order=ord().map(z=>z===old?n:z);if(S.lastCat===old)S.lastCat=n;if(KW[old]){KW[n]=KW[old];delete KW[old]}
      catDrop(old);if(BUILTIN.includes(old)&&!S.cdel.includes(old))S.cdel.push(old);S.cx=S.cx.filter(z=>z.n!==old);if(L)S.lim[n]=L}
    S.cx=S.cx.filter(z=>z.n!==n);S.cx.push(o);regCat(o);S.order=ord()}
  else{const ix=S.ci.findIndex(z=>z.n===old);if(ix<0)return;S.ci[ix]=o;if(n!==old){catRef("i",old,n);if(S.lastIc===old)S.lastIc=n}}
  catFin(k)}
function catDelAsk(){if(!NCAT||!NCAT.edit)return;const k=NCAT.k,old=NCAT.edit,u=catUse(k,old),oth=(k==="x"?ord():S.ci.map(z=>z.n)).filter(z=>z!==old);
  if(k==="x"&&u&&!oth.length)return($("ncerr").textContent="Questa è l\u2019unica categoria di spesa e viene usata: spostane prima i movimenti.");
  $("mt").textContent="Elimina categoria";
  const opts=oth.map(z=>`<option value="${esc(z)}">${esc(z)}</option>`).join("")+(k==="i"?'<option value="">Nessuna categoria</option>':"");
  $("mbody").innerHTML=`<div class="ns"><p class="cedp">Vuoi eliminare la categoria “${esc(old)}”?${u?` Viene usata da ${u} ${u===1?"movimento":"movimenti"}: scegli dove spostarli.`:""}</p>${u?`<select id="cemv" class="ninp" aria-label="Sposta i movimenti in">${opts}</select>`:""}<div class="ceacts two"><button type="button" class="nbt" data-cedback="1">Annulla</button><button type="button" class="nbt danger" data-cedelok="1">Elimina</button></div></div>`}
function catDel(){if(!NCAT||!NCAT.edit)return;const k=NCAT.k,old=NCAT.edit,mv=$("cemv");
  if(mv)catRef(k,old,mv.value);
  if(k==="x"){S.bud=S.bud.filter(b=>b.c!==old);catDrop(old);if(BUILTIN.includes(old)&&!S.cdel.includes(old))S.cdel.push(old);S.cx=S.cx.filter(z=>z.n!==old);S.order=(S.order||[]).filter(z=>z!==old);if(S.lastCat===old)delete S.lastCat}
  else{S.ci=S.ci.filter(z=>z.n!==old);if(S.lastIc===old)delete S.lastIc}
  catFin(k)}
function ncAdd(){if(!NCAT)return;const err=catAdd(NCAT.k,$("ncn").value,NCAT.e,NCAT.c);$("ncerr").textContent=err;if(err)return;
  const n=catName($("ncn").value);$("ncn").value="";NCAT.e="";ncSync();ncEmoji($("nce").value);
  const p=$("ncpill");p.textContent="Aggiunta: "+n;p.hidden=false;clearTimeout(p._t);p._t=setTimeout(()=>{p.hidden=true},2200)}

const SUBV=["appearance","appicon","notif","numentry","currency","categorie"];

const COL_L={Casa:"#0e9db6",Macchina:"#4f8df7",Cibo:"#f2a33a",Telefono:"#8a6df0",Bollette:"#e86f7c",Vacanze:"#2fb98a",Regali:"#9aa5bd"},COL_D={Casa:"#a8e8f6",Macchina:"#5ec5dc",Cibo:"#3aa0b8",Telefono:"#2f7f93",Bollette:"#7f9ba6",Vacanze:"#5b707a",Regali:"#3d4d55"};
const COL={...COL_L};
const CEMO={Casa:"\u{1F3E0}",Bollette:"\u{1F4A1}",Macchina:"\u{1F697}",Cibo:"\u{1F354}",Vacanze:"\u{1F3D6}\uFE0F",Regali:"\u{1F381}",Telefono:"\u{1F4F1}"};
const BSUG=BUILTIN.map(n=>[n,CEMO[n],COL_L[n]]);
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
let S={salary:0,pct:{...CATS},items:[],cx:[],ci:[],csh:false};
try{const r=localStorage.getItem(KEY);if(r){const p=JSON.parse(r);S={...S,...p,pct:{...CATS,...(p.pct||{})}};delete S.name;if(S.onb===undefined)S.onb=1}else S.onb=0}catch(e){}
function regCat(x){CATS[x.n]=0;COL_L[x.n]=x.c;COL_D[x.n]=x.c;COL[x.n]=x.c;CEMO[x.n]=x.e;if(S.pct)S.pct[x.n]=0;if(S.lim&&!S.lim[x.n])S.lim[x.n]={t:"eur",v:0}}
if(!Array.isArray(S.cx))S.cx=[];if(!Array.isArray(S.ci))S.ci=[];
if(!Array.isArray(S.cdel))S.cdel=[];
if(!Array.isArray(S.cx))S.cx=[];
if(!S.catV3){const rm={Spesa:"Cibo",Trasporti:"Macchina"},cs=c=>rm[c]||c,used=new Set([...(S.items||[]).map(i=>cs(i.c)),...(S.rec||[]).filter(r=>r.t!=="in").map(r=>r.c),...(S.sch||[]).filter(r=>r.t!=="in").map(r=>r.c)]);
  BUILTIN.forEach(n=>{if(!used.has(n)&&!S.cdel.includes(n))S.cdel.push(n)});S.cx=S.cx.filter(z=>!(BUILTIN.includes(z.n)&&!used.has(z.n)));S.catV3=true}
function catDrop(n){delete CATS[n];delete COL_L[n];delete COL_D[n];delete COL[n];delete CEMO[n];if(S.pct)delete S.pct[n];if(S.lim)delete S.lim[n]}
S.cdel.forEach(catDrop);
S.cx.forEach(regCat);
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
function reAll(){["render","renderRec","renderInc","renderCal","renderSal","renderSalEd","renderStats","renderBud"].forEach(f=>{try{if(typeof window[f]==="function")window[f]()}catch(e){}})}
function setDec(v){DEC=!!v;try{localStorage.setItem("spese-dec-v1",DEC?"1":"0")}catch(e){}reAll()}
const cap=t=>t?t.charAt(0).toLocaleUpperCase("it-IT")+t.slice(1):t;
const esc=s=>s.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const $=id=>document.getElementById(id);
const mk=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");
const sum=(m,f)=>S.items.filter(i=>i.m===m&&(!f||f(i))).reduce((t,i)=>t+i.a,0);
const MN=new Intl.DateTimeFormat("it-IT",{month:"short"});
$("month").value=mk(new Date());
$("c").innerHTML=ord().map(c=>`<option>${c}</option>`).join("");
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
function editRow(i){return `<li class="row ed"><input data-f="d" value="${esc(i.d)}" aria-label="Descrizione"><input data-f="a" type="number" min="0" step="0.01" value="${cvd(i.a)}" aria-label="Importo"><select data-f="c" aria-label="Categoria">${ord().map(c=>`<option${c===i.c?" selected":""}>${c}</option>`).join("")}</select><span class="acts"><button class="mini main" data-save="${i.id}">Salva</button><button class="mini" data-cancel="1">Annulla</button></span></li>`}
const addM=(m,n)=>{const [y,o]=m.split("-").map(Number);return mk(new Date(y,o-1+n,1))};
const ml=m=>{const [y,o]=m.split("-").map(Number);return new Intl.DateTimeFormat("it-IT",{month:"short",year:"numeric"}).format(new Date(y,o-1,1))};
if(!Array.isArray(S.rec))S.rec=[];
if(!Array.isArray(S.sch))S.sch=[];
if(!Array.isArray(S.bud))S.bud=[];
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
  return `<li class="row xr" data-recedit="${r.id}"><span>${esc(r.d)}</span><span class="amt">${eur2(r.a)}/${FQL[f]}</span><small>${r.t==="in"?(r.c?esc(r.c):"Entrata"):esc(r.c)}${f!=="m"?" · "+FQN[f]:""}, dal ${st} ${en?"al "+ens:"senza scadenza"}</small></li>`}
function recRange(r){const fd=x=>dFmt.format(new Date(+x.slice(0,4),+x.slice(5,7)-1,+x.slice(8,10))),st=recStart(r),en=r.end!==undefined?r.end:(r.to?(()=>{const [y,o]=r.to.split("-").map(Number);return r.to+"-"+String(new Date(y,o,0).getDate()).padStart(2,"0")})():"");
  return "Dal "+fd(st)+(en?" al "+fd(en):" senza scadenza")}
function recRow2(r){const inc=r.t==="in",ic=inc?S.ci.find(c=>c.n===r.c):null,cn=inc?(r.c||"Entrata"):r.c,bg=inc?(ic?ic.c:"#34c28a"):(COL[r.c]||"#8892a6"),em=inc?(ic?ic.e:"\u{1F4B6}"):(CEMO[r.c]||"\u{1F3F7}️");
  return `<li class="row xr" data-recedit="${r.id}"><span class="xic" style="background:${bg}"><span class="cem" aria-hidden="true">${esc(em)}</span></span><span class="xl"><span class="xn">${esc(r.d)}</span><span class="xcat">${esc(cn)}</span></span><span class="amt">${inc?"+":"-"}${eur2(r.a)}</span></li>`}
const FQG={m:"Mensili",q:"Trimestrali",s:"Semestrali",y:"Annuali"};
let rf={q:"",mode:"freq"};
const RFM={all:"Tutte le voci",freq:"Per frequenza",cat:"Per categoria"};
function rFilt(list){const q=(rf.q||"").trim().toLowerCase();return q?list.filter(r=>(r.d+" "+(r.c||"")+" "+eur2(r.a)+" "+String(cvd(r.a)).replace(".",",")).toLowerCase().includes(q)):list}
function recGroups(list,t){
  const srt=(a,b)=>{const x=recStart(a),y=recStart(b);return x<y?1:x>y?-1:(a.id>b.id?-1:a.id<b.id?1:0)},sg=t==="i"?"+":"-",mode=rf.mode;
  const box=(k,lb,g)=>{const open=dgOpen[k]!==false,tot=g.reduce((x,r)=>x+r.a,0);
    return `<li class="dg"><button type="button" class="dgh" data-dg="${k}" aria-expanded="${open}" aria-label="${esc(lb)}: ${g.length} movimenti, totale ${eur2(tot)}"><span class="dgd">${esc(lb)}</span><span class="amt">${sg}${eur2(tot)}</span><span class="cgc">${open?IC_UP:IC_DN}</span></button><ul class="dgl"${open?"":" hidden"}>${g.map(recRow2).join("")}</ul></li>`};
  if(mode==="all")return `<li class="dg"><ul class="dgl">${list.slice().sort(srt).map(recRow2).join("")}</ul></li>`;
  if(mode==="cat"){const by={};list.forEach(r=>{const n=r.c||(t==="i"?"Entrata":"Altro");(by[n]=by[n]||[]).push(r)});
    return Object.keys(by).sort((a,b)=>by[b].reduce((x,r)=>x+r.a,0)-by[a].reduce((x,r)=>x+r.a,0)).map(n=>box("r"+t+"c:"+n,n,by[n].sort(srt))).join("")}
  return ["m","q","s","y"].map(f=>{const g=list.filter(r=>(r.f||"m")===f).sort(srt);return g.length?box("r"+t+f,FQG[f],g):""}).join("")}
function renderRec(){
  const outs=S.rec.filter(r=>r.t!=="in"),fo=rFilt(outs);
  $("rec2").innerHTML=fo.length?recGroups(fo,"o"):`<li class="empty">${outs.length?"Nessun movimento trovato.":"Nessuna spesa ricorrente."}</li>`;renderInc()}
function renderInc(){
  const ins=S.rec.filter(r=>r.t==="in"),fi=rFilt(ins);
  $("rinc").innerHTML=fi.length?recGroups(fi,"i"):`<li class="empty">${ins.length?"Nessun movimento trovato.":"Nessuna entrata ricorrente."}</li>`}
function rUi(){const m=$("rmenu");if(!m)return;
  $("rfb").classList.toggle("on",rf.mode!=="freq");$("rsb").classList.toggle("on",!!(rf.q||"").trim());
  m.innerHTML=Object.keys(RFM).map(k=>`<button type="button" role="menuitemradio" aria-checked="${rf.mode===k}" class="${rf.mode===k?"on":""}" data-rmode="${k}"><span>${RFM[k]}</span>${rf.mode===k?IC_OK:""}</button>`).join("")}
function rMenu(open){const m=$("rmenu");if(!m)return;if(open)rUi();m.hidden=!open;$("rfb").setAttribute("aria-expanded",String(!!open))}
function rSClose(){const r=$("rsr");if(r&&!r.hidden){r.hidden=true;$("rq").blur();$("rsb").setAttribute("aria-expanded","false")}}
document.addEventListener("click",e=>{const T=e.target;if(!T.closest||$("v-ricorrenti").hidden)return;
  if(!T.closest("#rsr")&&!T.closest("[data-rsearch]"))rSClose();
  const mb=T.closest("[data-rmode]");
  if(mb){rf.mode=mb.dataset.rmode;rMenu(false);rUi();renderRec();return}
  if(T.closest("[data-rfilter]")){rMenu($("rmenu").hidden);return}
  if(T.closest("[data-rsearch]")){const r=$("rsr"),op=r.hidden;r.hidden=!op;$("rsb").setAttribute("aria-expanded",String(op));rMenu(false);if(op)$("rq").focus();else $("rq").blur();return}
  if(!T.closest("#rmenu"))rMenu(false)});
document.addEventListener("input",e=>{if(e.target.id==="rq"){rf.q=e.target.value;rUi();renderRec()}});
const MOPT=Array.from({length:60},(_,i)=>{const d=new Date(2026,i,1),n=new Intl.DateTimeFormat("it-IT",{month:"long",year:"numeric"}).format(d);return `<option value="${mk(d)}">${n[0].toUpperCase()+n.slice(1)}</option>`}).join("");
const IC_DEL='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/><path d="M10 11v6M14 11v6"/></svg>';
const IC_EDIT='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>';
const IC_UP='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>';
const IC_DN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
function renderCnt(){const m=$("month").value;$("rcnt2").textContent=S.rec.filter(r=>r.t!=="in").length;}
function setExpOpen(o){$("f").hidden=!o;if(o){$("d").focus()}else{$("f").reset()}}
let modal=null;
function closeModal(){$("mod").hidden=true;if(modal&&modal.kind==="budget-sheet"&&!bsRet)bs=null;modal=null;ne=null;am=null;$("mbody").innerHTML="";document.querySelector(".mbox").classList.remove("sheet")}
function openModal(kind,id){
  const r=kind==="edit-rec"?S.rec.find(x=>x.id===id):kind==="edit-exp"?S.items.find(i=>i.id==id):null,isRec=kind==="new-rec"||kind==="edit-rec";
  if(kind.startsWith("edit")&&!r)return;
  modal={kind,id};
  const cats=ord().map(c=>`<option${r&&r.c===c?" selected":""}>${c}</option>`).join("");
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
function openErase(){
  modal={kind:"erase"};
  $("mt").textContent="Elimina tutti i dati";
  $("mbody").innerHTML=`<p class="mtxt">Stai per eliminare e azzerare <b>tutti i dati</b> presenti nell’app: spese, entrate, movimenti ricorrenti, voci programmate, budget e nome. L’operazione non si può annullare. Se vuoi conservarli, esporta prima un backup.</p><div class="macts"><button type="button" class="mini" data-mclose>Annulla</button><button type="button" class="mini danger" data-erase="1">Elimina tutto</button></div>`;
  $("mod").hidden=false;$("mbody").querySelector("button").focus()}
function doErase(){try{localStorage.removeItem(KEY)}catch(e){}location.reload()}
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
  return {salary:typeof d.salary==="number"?d.salary:0,pct:{...CATS},items,rec,sals,lim,hide:d.hide===true,order:(Array.isArray(d.order)?d.order.map(cl):[]),col:{rec:!!(d.col&&d.col.rec),exp:!!(d.col&&d.col.exp)},recSeeded:true,recSeeded2:true,limV2:d.limV2===true,bud:cleanBud(d.bud),catV3:d.catV3===true,cdel:(Array.isArray(d.cdel)?d.cdel.map(cl).filter(n=>BUILTIN.includes(n)):[]),cx:cleanCats(d.cx,true),ci:cleanCats(d.ci,false),csh:d.csh===true}}
function cleanBud(a){const out=[],seen=new Set();if(!Array.isArray(a))return out;a.forEach(b=>{if(!b||typeof b.a!=="number"||!(b.a>0)||!["d","w","m","y"].includes(b.f)||typeof b.c!=="string")return;const c=catName(b.c);if(seen.has(c))return;seen.add(c);const d=Math.floor(+b.d)||0,mo=Math.floor(+b.mo)||0;out.push({id:"b"+out.length+Date.now(),a:Math.min(b.a,1e9),c,f:b.f,d:b.f==="w"?Math.min(6,Math.max(0,d)):Math.min(28,Math.max(1,d||1)),mo:Math.min(11,Math.max(0,mo))})});return out}
function cleanCats(a,x){if(!Array.isArray(a))return[];const seen=new Set(),out=[];
  a.forEach(c=>{if(!c||typeof c.n!=="string"||typeof c.c!=="string"||!/^#[0-9a-f]{6}$/i.test(c.c))return;const n=catName(c.n),e=typeof c.e==="string"?c.e.replace(/[<>&"]/g,"").slice(0,12):"";
    if(!n||seen.has(n.toLowerCase())||(x&&CATS[n]!==undefined&&!(S.cx||[]).some(z=>z.n===n)))return;seen.add(n.toLowerCase());const q={n,e:e||"\u{1F3F7}\uFE0F",c:c.c},sr=typeof c.s==="string"?catName(c.s):"";if(sr)q.s=sr;out.push(q)});return out}
function doImport(){if(!impData)return;S=impData;S.onb=1;save();location.reload()}
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
function catIcon(c){return'<span class="cem" aria-hidden="true">'+esc(CEMO[c]||"\u{1F3F7}\uFE0F")+'</span>'}
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
    $("ncw").hidden=false;$("nqn").textContent=FQN[ne.f];$("nal").textContent=ne.t==="in"?"Importo per accredito":"Importo per addebito";
    const cl=document.querySelector("[data-nfclear]");if(cl)cl.hidden=!$("nfd").value}
  if(ne.sch){document.querySelectorAll("[data-nt]").forEach(b=>b.classList.toggle("on",b.dataset.nt===ne.t));$("ncw").hidden=ne.t==="in";$("nal").textContent=ne.t==="in"?"Importo previsto in entrata":"Importo previsto in uscita"}
  if(ne.t!=="in"&&!ne.cat)ok=false;
  $("nsave").disabled=!ok;
  const inc=!!(ne.rec&&ne.t==="in"),nc=$("nchips"),want=inc?"i":"x";
  if(nc&&nc.dataset.k!==want){nc.dataset.k=want;nc.innerHTML=ncHtml(want)}
  document.querySelectorAll("[data-nc]").forEach(b=>b.classList.toggle("on",b.dataset.nc===(inc?ne.ic:ne.cat)));
  ndSum();
  const ic=inc?S.ci.find(c=>c.n===ne.ic):null;
  $("nci").innerHTML=inc?'<span class="cem" aria-hidden="true">'+esc(ic?ic.e:"\u{1F3F7}\uFE0F")+'</span>':catIcon(ne.cat);$("ncn").textContent=inc?(ne.ic||"Nessuna"):(ne.cat||"Nessuna");$("ncl").textContent=!inc&&ne.sug?"Categoria suggerita:":"Categoria:"}
function ncHtml(k){if(k==="x")return ord().length?ord().map(c=>`<button type="button" role="option" data-nc="${c}">${catIcon(c)}${c}</button>`).join(""):'<p class="nchint">Nessuna categoria di spesa: creane una in Impostazioni \u2192 Categorie.</p>';
  return S.ci.length?S.ci.map(c=>`<button type="button" role="option" data-nc="${esc(c.n)}"><span class="cem" aria-hidden="true">${esc(c.e)}</span>${esc(c.n)}</button>`).join(""):'<p class="nchint">Nessuna categoria di entrata: creane una in Impostazioni \u2192 Categorie.</p>'}
function neDesc(){
  if(!ne.manual){const g=suggestCat($("nd").value);
    if(g){ne.cat=g;ne.sug=true}else{ne.cat=(S.lastCat&&CATS[S.lastCat]!==undefined)?S.lastCat:(ord()[0]||"");ne.sug=false}}
  neUpdate()}
function nePress(k){ne.amt=amtNext(ne.amt,k);neUpdate()}
function neSave(){
  const d=cap($("nd").value.trim()),a=inv(neVal(),ne.oa);if(!d||!(a>0))return;
  if(ne.sch){const dt=$("ndd").value;if(!dt)return;const o={d,a,c:ne.t==="in"?"":ne.cat,t:ne.t,dt};
    if(ne.edit!==null){const x=S.sch.find(z=>z.id===ne.edit);if(x)Object.assign(x,o)}else S.sch.push(Object.assign({id:"s"+Date.now()},o));
    if(ne.t!=="in")S.lastCat=ne.cat;const m=dt.slice(0,7);if(m!==$("month").value){$("month").value=m;syncSal();ensureRec()}CAL.sel=dt;save();closeModal();render();return}
  if(ne.rec){const start=$("ndd").value,end=$("nfd").value;if(!start||(end&&end<start))return;
    const o={d,a,c:ne.t==="in"?(ne.ic||""):ne.cat,t:ne.t,f:ne.f,start,end,from:start.slice(0,7),to:end?end.slice(0,7):""};
    if(ne.edit!==null){const r=S.rec.find(x=>x.id===ne.edit);if(r){Object.assign(r,o,{skip:[]});const now=mk(new Date());S.items=S.items.filter(i=>!(i.rid===r.id&&(i.s==="plan"||i.m>=now)))}}
    else S.rec.push(Object.assign({id:"r"+Date.now()},o));
    if(ne.t!=="in")S.lastCat=ne.cat;else if(ne.ic)S.lastIc=ne.ic;ensureRec();save();closeModal();render();return}
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
  ne={amt:"",cat:(S.lastCat&&CATS[S.lastCat]!==undefined)?S.lastCat:(ord()[0]||""),sug:false,manual:false,st:"paid",dm:"pick",rec:!!rec,sch,edit:null,t:"out",f:"m",ic:S.ci.some(c=>c.n===S.lastIc)?S.lastIc:(S.ci[0]?S.ci[0].n:"")};
  const has=editId!==undefined&&editId!==null,eIt=!rec&&!sch&&has?S.items.find(i=>i.id==editId):null,eRc=rec&&has?S.rec.find(r=>r.id===editId):null,eSc=sch&&has?S.sch.find(x=>x.id===editId):null,E=eIt||eRc||eSc;
  if(eIt){ne.edit=eIt.id;ne.oa=eIt.a;ne.amt=String(cvd(eIt.a)).replace(".",",");ne.cat=CATS[eIt.c]!==undefined?eIt.c:ne.cat;ne.manual=true;ne.st=eIt.s||"paid"}
  if(eRc){ne.edit=eRc.id;ne.oa=eRc.a;ne.amt=String(cvd(eRc.a)).replace(".",",");ne.t=eRc.t==="in"?"in":"out";ne.f=eRc.f||"m";if(CATS[eRc.c]!==undefined){ne.cat=eRc.c}if(eRc.t==="in"&&S.ci.some(c=>c.n===eRc.c))ne.ic=eRc.c;ne.manual=true}
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
function amDone(){const am0=am,v=am.amt?Math.min(parseFloat(am.amt.replace(",",".")),am.max):null,cb=am.cb;closeModal();cb(v===null||isNaN(v)?null:inv(v,am0.o))}
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

const cgOpen={};let dgOpen={};
function fdt(i){return i.dt?i.dt.slice(8,10)+"/"+i.dt.slice(5,7)+"/"+i.dt.slice(0,4):i.m.slice(5,7)+"/"+i.m.slice(0,4)}
function openRecInfo(it){
  modal={kind:"rec-info"};
  $("mt").textContent="Spesa ricorrente";
  $("mbody").innerHTML=`<p class="mtxt"><b>${esc(it.d)}</b> è una spesa ricorrente: non si può modificare o eliminare da qui. Per gestirla vai nella sezione <b>Ricorrenti</b>.</p><div class="macts"><button type="button" class="mini" data-mclose>Chiudi</button><button type="button" class="main" data-view="ricorrenti" data-mclose>Vai a Ricorrenti</button></div>`;
  $("mod").hidden=false}
function expRow(i){const c=i.c;return `<li class="row xr" data-rowedit="${i.id}"><span class="xic" style="background:${COL[c]||"#8892a6"}">${catIcon(c)}</span><span class="xl"><span class="xn">${esc(i.d)}</span><span class="xcat">${esc(c)}</span>${i.rid?'<i class="rtg">Spesa ricorrente</i>':""}</span><span class="amt">-${eur2(i.a)}</span></li>`}
const DGM=["gen","feb","mar","apr","mag","giu","lug","ago","set","ott","nov","dic"],DGW=["Dom","Lun","Mar","Mer","Gio","Ven","Sab"];
function dgKey(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function dgLabel(k){const n=new Date(),t=dgKey(n);n.setDate(n.getDate()-1);if(k===t)return"Oggi";if(k===dgKey(n))return"Ieri";const d=new Date(+k.slice(0,4),+k.slice(5,7)-1,+k.slice(8,10));return DGW[d.getDay()]+", "+d.getDate()+" "+DGM[d.getMonth()]+(d.getFullYear()!==new Date().getFullYear()?" "+d.getFullYear():"")}
let spf={q:"",mode:"day"};
const SPM={all:"Tutte le voci",day:"Per giorno",week:"Per settimana",cat:"Per categoria"};
function spWeek(k){const d=new Date(+k.slice(0,4),+k.slice(5,7)-1,+k.slice(8,10));d.setDate(d.getDate()-((d.getDay()+6)%7));return dgKey(d)}
function spWLabel(k){const d=new Date(+k.slice(0,4),+k.slice(5,7)-1,+k.slice(8,10)),e=new Date(d);e.setDate(e.getDate()+6);return "Sett. "+d.getDate()+" "+DGM[d.getMonth()]+" – "+e.getDate()+" "+DGM[e.getMonth()]}
function renderGroups(all){
  if(!all.length)return '<li class="empty">Nessuna spesa in questo mese. Aggiungi la prima con “Nuova spesa”.</li>';
  const q=(spf.q||"").trim().toLowerCase(),its=q?all.filter(i=>(i.d+" "+i.c+" "+eur2(i.a)+" "+String(cvd(i.a)).replace(".",",")).toLowerCase().includes(q)):all;
  if(!its.length)return '<li class="empty">Nessuna spesa trovata.</li>';
  const key=i=>i.dt||(i.m+"-01"),srt=(a,b)=>key(a)<key(b)?1:key(a)>key(b)?-1:a.id>b.id?-1:a.id<b.id?1:0,mode=spf.mode;
  const rows=g=>g.map(i=>i.id==editId?editRow(i):expRow(i)).join("");
  if(mode==="all")return `<li class="dg"><ul class="dgl">${rows(its.slice().sort(srt))}</ul></li>`;
  const by={},meta={};
  its.forEach(i=>{let k,lb;if(mode==="week"){const w=spWeek(key(i));k="w"+w;lb=spWLabel(w)}else if(mode==="cat"){k="c:"+i.c;lb=i.c}else{k=key(i);lb=dgLabel(k)}
    (by[k]=by[k]||[]).push(i);meta[k]=lb});
  let ks=Object.keys(by);
  if(mode==="cat")ks.sort((a,b)=>by[b].reduce((x,i)=>x+i.a,0)-by[a].reduce((x,i)=>x+i.a,0));else ks.sort().reverse();
  return ks.map(k=>{
    const g=by[k].sort(srt),lb=meta[k];
    const open=dgOpen[k]!==false||g.some(i=>i.id==editId),t=g.reduce((x,i)=>x+i.a,0);
    return `<li class="dg"><button type="button" class="dgh" data-dg="${k}" aria-expanded="${open}" aria-label="${esc(lb)}: ${g.length} spese, totale ${eur2(t)}"><span class="dgd">${esc(lb)}</span><span class="amt">-${eur2(t)}</span><span class="cgc">${open?IC_UP:IC_DN}</span></button><ul class="dgl"${open?"":" hidden"}>${rows(g)}</ul></li>`}).join("")}
function spUi(){const m=$("spmenu");if(!m)return;
  $("spfb").classList.toggle("on",spf.mode!=="day");$("spsb").classList.toggle("on",!!(spf.q||"").trim());
  m.innerHTML=Object.keys(SPM).map(k=>`<button type="button" role="menuitemradio" aria-checked="${spf.mode===k}" class="${spf.mode===k?"on":""}" data-spmode="${k}"><span>${SPM[k]}</span>${spf.mode===k?IC_OK:""}</button>`).join("")}
function spMenu(open){const m=$("spmenu");if(!m)return;if(open)spUi();m.hidden=!open;$("spfb").setAttribute("aria-expanded",String(!!open))}
function spSClose(){const r=$("spsr");if(r&&!r.hidden){r.hidden=true;$("spq").blur();$("spsb").setAttribute("aria-expanded","false")}}
document.addEventListener("click",e=>{const T=e.target;if(!T.closest||$("v-spese").hidden)return;
  if(!T.closest("#spsr")&&!T.closest("[data-spsearch]"))spSClose();
  const mb=T.closest("[data-spmode]");
  if(mb){spf.mode=mb.dataset.spmode;spMenu(false);spUi();render();return}
  if(T.closest("[data-spfilter]")){spMenu($("spmenu").hidden);return}
  if(T.closest("[data-spsearch]")){const r=$("spsr"),op=r.hidden;r.hidden=!op;$("spsb").setAttribute("aria-expanded",String(op));spMenu(false);if(op)$("spq").focus();else $("spq").blur();return}
  if(!T.closest("#spmenu"))spMenu(false)});
document.addEventListener("input",e=>{if(e.target.id==="spq"){spf.q=e.target.value;spUi();render()}});
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

/* ===== Budget ===== */
const BMO=["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"],BWD=["lunedì","martedì","mercoledì","giovedì","venerdì","sabato","domenica"],BFN={d:"giorno",w:"settimana",m:"mese",y:"anno"},BFM={d:"Giornaliero",w:"Settimanale",m:"Mensile",y:"Annuale"};
let bs=null,bdt=null,bsRet=false;
const bEmo=c=>c===""?"":`<span class="cem" aria-hidden="true">${esc(CEMO[c]||"\u{1F3F7}️")}</span>`;
const bName=c=>c===""?"Complessivo":c;
function bPer(b,off){const t=new Date();t.setHours(0,0,0,0);let s,e;
  if(b.f==="d"){s=new Date(t);s.setDate(s.getDate()+off);e=new Date(s)}
  else if(b.f==="w"){const back=((t.getDay()+6)%7-b.d+7)%7;s=new Date(t);s.setDate(t.getDate()-back+off*7);e=new Date(s);e.setDate(s.getDate()+6)}
  else if(b.f==="m"){let m=t.getMonth();if(t.getDate()<b.d)m--;m+=off;s=new Date(t.getFullYear(),m,b.d);e=new Date(t.getFullYear(),m+1,b.d-1)}
  else{let y=t.getFullYear();if(t<new Date(y,b.mo,b.d))y--;y+=off;s=new Date(y,b.mo,b.d);e=new Date(y+1,b.mo,b.d-1)}
  const n=Math.round((e-s)/864e5)+1,idx=Math.min(n-1,Math.max(0,Math.round((t-s)/864e5)));
  return{s,e,k1:dgKey(s),k2:dgKey(e),n,idx,now:off===0}}
function bLbl(p,f){const a=p.s,b=p.e,f1=d=>d.getDate()+" "+DGM[d.getMonth()];if(f==="d")return f1(a)+(a.getFullYear()!==new Date().getFullYear()?" "+a.getFullYear():"");return f1(a)+(f==="y"||a.getFullYear()!==b.getFullYear()?" "+a.getFullYear():"")+" – "+f1(b)+(f==="y"||a.getFullYear()!==b.getFullYear()?" "+b.getFullYear():"")}
function bItems(b,p){return S.items.filter(i=>{if(i.s!=="paid")return false;if(b.c!==""&&i.c!==b.c)return false;const k=i.dt||(i.m+"-01");return k>=p.k1&&k<=p.k2}).sort((x,y)=>((y.dt||"")>(x.dt||"")?1:-1))}
function bStat(b,off){const p=bPer(b,off||0),it=bItems(b,p),sp=it.reduce((t,i)=>t+i.a,0),left=b.a-sp,r=b.a>0?sp/b.a:0;return{p,it,sp,left,r,col:r>=1?"#e5675b":r>=.75?"#f0a03c":"var(--g)",el:p.n>0?(p.idx+.5)/p.n:0,dl:p.n-p.idx}}
function bAmt(v){const a=Math.abs(v)*R;return ((!DEC||Math.abs(a-Math.round(a))<.005)?NFC0:NFC2).format(a)}
function bBar(st){return `<div class="bbar"><i style="width:${Math.min(100,Math.round(st.r*100))}%;background:${st.col}"></i>${st.p.now&&st.p.n>1?`<b class="bmk" style="left:${(st.el*100).toFixed(1)}%"></b>`:""}</div>`}
function renderBud(){const L=$("blist");if(!L)return;
  const ov=S.bud.filter(b=>b.c===""),cs=S.bud.filter(b=>b.c!==""),cards=[];
  if(!S.bud.length){L.innerHTML='<div class="bemp"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="12" width="4.5" height="8" rx="1.2"/><rect x="9.8" y="8" width="4.5" height="12" rx="1.2"/><rect x="16.5" y="4" width="4.5" height="16" rx="1.2"/></svg><p>Nessun budget presente</p></div>';return}
  let h="";
  ov.forEach(b=>{const st=bStat(b);const perDay=st.dl>0?st.left/st.dl:0;
    h+=`<button type="button" class="bcard bov" data-bcard="${b.id}"><div class="bch"><span>Complessivo</span><span>${b.f==="d"?"":st.dl+(st.dl===1?" giorno rimasto":" giorni rimasti")}</span></div><div class="bbig"><b${st.left<0?' class="neg"':""}>${st.left<0?"−":""}${bAmt(st.left)}</b><small>${st.left<0?"oltre il budget di "+bAmt(b.a):"rimasti su "+bAmt(b.a)}</small></div>${bBar(st)}<div class="bft">${st.left>0&&b.f!=="d"&&st.p.now?bAmt(perDay)+" al giorno per "+st.dl+(st.dl===1?" giorno":" giorni"):(st.sp?bAmt(st.sp)+" spesi":"Nessuna spesa")}</div></button>`});
  if(cs.length){h+='<div class="bgrid">'+cs.map(b=>{const st=bStat(b);
    return `<button type="button" class="bcard" data-bcard="${b.id}"><div class="bch"><span class="bcn">${bEmo(b.c)}${esc(b.c)}</span></div><div class="bbig"><b${st.left<0?' class="neg"':""}>${st.left<0?"−":""}${bAmt(st.left)}</b><small>${st.left<0?"oltre":"rimasti"}</small></div><div class="bft">${st.sp?bAmt(st.sp)+" spesi":"Nessuna spesa"}</div>${bBar(st)}</button>`}).join("")+"</div>"}
  L.innerHTML=h}
/* --- crea / modifica (finestra come "Nuova spesa") --- */
function bsOpen(id){const b=id?S.bud.find(x=>x.id===id):null;bsRet=false;
  bs=b?{id:b.id,a:(()=>{let s=cvd(b.a).toFixed(2).replace(".",",");if(NEM==="2"&&s.endsWith(",00"))s=s.slice(0,-3);return s})(),oa:b.a,c:b.c,f:b.f,d:b.d||1,mo:b.mo||0}:{id:"",a:"",oa:undefined,c:undefined,f:"m",d:1,mo:0};
  if(!b){const av=bsAvail();bs.c=av.ov?"":(av.cats[0]);}
  bsShow()}
function bsVal(){return parseFloat((bs.a||"0").replace(",","."))||0}
function bsAvail(){const used=new Set(S.bud.filter(b=>b.id!==bs.id).map(b=>b.c));return{ov:!used.has("")&&!(bs.id&&bs.c!==""),cats:ord().filter(c=>!used.has(c))}}
function bsEst(){const v=bsVal();if(!(v>0)||bs.f==="d")return"";const e=inv(v,bs.oa),n=bs.f==="w"?7:bs.f==="y"?365:new Date(new Date().getFullYear(),new Date().getMonth()+1,0).getDate(),x=e/n*R;return "≈ "+(x<10?NFC2:NFC0).format(x)+" al giorno"}
const BGRID='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/></svg>';
function bsShow(){const ed=!!bs.id,ttl=ed?"Modifica budget":"Nuovo budget";
  modal={kind:"budget-sheet"};document.querySelector(".mbox").classList.add("sheet");$("mt").textContent=ttl;document.querySelector(".mbox").setAttribute("aria-label",ttl);
  const card=(k,lab,ico)=>`<div class="ncwrap" id="bw_${k}"><div class="ncat" data-bdd="${k}" role="button" tabindex="0" aria-haspopup="listbox" aria-expanded="false"><span class="nci" id="bi_${k}">${ico||""}</span><div class="nct"><small id="bl_${k}">${lab}</small><b id="bv_${k}"></b></div><span class="ncc">${IC_DN}</span></div><div class="nchips" id="bc_${k}" role="listbox" hidden></div></div>`;
  $("mbody").innerHTML=`<div class="ns">${card("c","Categoria:")}${card("f","Frequenza:",IC_REP)}${card("mo","Mese di inizio:",IC_CLOCK)}${card("d","Data di inizio:",IC_CLOCK)}<div class="namt"><span>Importo</span><div class="nvv"><i>${SYM}</i><b id="bsval"></b></div><small class="bsest" id="bsest"></small></div><div class="kpad">${["1","2","3","4","5","6","7","8","9",NEM==="1"?"":",","0","bk"].map(k=>k===""?"<span></span>":`<button type="button" data-bk="${k}"${k==="bk"?' aria-label="Cancella"':""}>${k==="bk"?IC_BK:k}</button>`).join("")}</div><button type="button" class="nsave" id="bsave" data-bcreate="1" disabled><span>${ed?"Salva modifiche":"Salva budget"}</span>${IC_OK}</button></div>`;
  $("mod").hidden=false;bsUpd()}
function bsUpd(){if(!bs||!$("bsval"))return;const av=bsAvail(),ed=!!bs.id,y=bs.f==="y";
  const it=(k,v,t,on)=>`<button type="button" role="option" data-bsel="${k}" data-v="${esc(String(v))}" class="${on?"on":""}">${t}</button>`;
  $("bsval").textContent=bs.a||"0,00";$("bsval").classList.toggle("dim",!bs.a);
  $("bsest").textContent=bsEst();
  $("bi_c").innerHTML=bs.c===undefined?"":bs.c===""?BGRID:catIcon(bs.c);$("bv_c").textContent=bs.c===undefined?"Scegli categoria":bs.c===""?"Tutto (budget complessivo)":bs.c;
  $("bc_c").innerHTML=(av.ov?it("c","",`${BGRID}Tutto (budget complessivo)`,bs.c===""):"")+av.cats.map(c=>it("c",c,catIcon(c)+esc(c),bs.c===c)).join("")+(ed?"":`<button type="button" role="option" data-bnewcat="1"><span class="bplus2">+</span>Nuova categoria</button>`);
  $("bv_f").textContent=BFM[bs.f];$("bc_f").innerHTML=["d","w","m","y"].map(k=>it("f",k,BFM[k],bs.f===k)).join("");
  $("bw_mo").hidden=!y;$("bw_d").hidden=bs.f==="d";
  $("bv_mo").textContent=BMO[bs.mo].replace(/^./,x=>x.toUpperCase());$("bc_mo").innerHTML=BMO.map((n,i)=>it("mo",i,n.replace(/^./,x=>x.toUpperCase()),bs.mo===i)).join("");
  $("bl_d").textContent=y?"Giorno di inizio:":"Data di inizio:";
  if(bs.f==="w"){$("bv_d").textContent=BWD[bs.d].replace(/^./,x=>x.toUpperCase());$("bc_d").innerHTML=BWD.map((n,i)=>it("d",i,n.replace(/^./,x=>x.toUpperCase()),bs.d===i)).join("")}
  else{$("bv_d").textContent=y?bs.d+"° del mese":"Il "+bs.d+"° di ogni mese";$("bc_d").innerHTML=Array.from({length:28},(_,i)=>i+1).map(n=>it("d",n,n+"°",bs.d===n)).join("")}
  $("bsave").disabled=!(bsVal()>0&&bs.c!==undefined)}
function bsCloseDD(except){document.querySelectorAll('#mbody [data-bdd]').forEach(c=>{if(c.dataset.bdd===except)return;const n=$("bc_"+c.dataset.bdd);if(n&&!n.hidden){n.hidden=true;c.setAttribute("aria-expanded","false")}})}
function bsCreate(){if(!bs)return;const v=bsVal();if(!(v>0)||bs.c===undefined)return;
  const o={a:inv(v,bs.oa),c:bs.c,f:bs.f,d:bs.f==="d"?1:bs.d,mo:bs.f==="y"?bs.mo:0};
  if(bs.id){const b=S.bud.find(x=>x.id===bs.id);if(b)Object.assign(b,o)}else S.bud.push(Object.assign({id:"b"+Date.now()},o));
  const id=bs.id;save();closeModal();renderBud();if(id&&bdt&&bdt.id===id)bdOpen(id,bdt.off)}
/* --- dettaglio --- */
function bdOpen(id,off){const b=S.bud.find(x=>x.id===id);if(!b)return;bdt={id,off:off||0,menu:false};bdRender();$("bd").hidden=false}
function bdClose(){$("bd").hidden=true;bdt=null;$("bd").innerHTML=""}
function bdRender(){if(!bdt)return;const b=S.bud.find(x=>x.id===bdt.id);if(!b){bdClose();return}
  const st=bStat(b,bdt.off),C=2*Math.PI*70,Ln=C*240/360,fr=Math.min(1,st.r),ang=150+240*st.el;
  const gauge=`<svg class="bgauge" viewBox="0 0 180 180" aria-hidden="true"><circle cx="90" cy="90" r="70" fill="none" style="stroke:var(--line)" stroke-width="14" stroke-linecap="round" stroke-dasharray="${Ln} ${C}" transform="rotate(150 90 90)"/>${fr>0?`<circle cx="90" cy="90" r="70" fill="none" style="stroke:${st.col}" stroke-width="14" stroke-linecap="round" stroke-dasharray="${Ln*fr} ${C}" transform="rotate(150 90 90)"/>`:""}${st.p.now&&st.p.n>1?`<g transform="rotate(${ang} 90 90)"><path d="M170 90l-9-6v12z" style="fill:var(--ink)"/></g>`:""}</svg>`;
  const list=st.it.length?`<ul class="bdl">${st.it.slice(0,60).map(i=>`<li><span class="xic" style="background:${COL[i.c]||"#8892a6"}">${catIcon(i.c)}</span><span class="xl"><span class="xn">${esc(i.d)}</span><span class="xcat">${esc(i.c)} · ${esc(dgLabel(i.dt||(i.m+"-01")))}</span></span><span class="amt">-${eur2(i.a)}</span></li>`).join("")}</ul>`:`<div class="bnt"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 13l3-8h12l3 8v6H3z"/><path d="M3 13h5l1 2h6l1-2h5"/></svg><p>Nessuna transazione</p></div>`;
  $("bd").innerHTML=`<div class="bdb" data-bdclose="1"></div><div class="bds" role="dialog" aria-modal="true"><div class="bdh"><button type="button" class="bxb" data-bdclose="1" aria-label="Chiudi">✕</button><b class="bdt">${b.c===""?"Budget complessivo":bEmo(b.c)+esc(b.c)}</b><button type="button" class="bxb" data-bdmenu="1" aria-label="Altro">⋯</button></div>${bdt.menu?`<div class="bmenu bdm"><button type="button" data-bdedit="1">✎ Modifica budget</button><button type="button" class="bdel" data-bddel="1">🗑︎ Elimina budget</button></div>`:""}<div class="bgw">${gauge}<div class="bgc"><b${st.left<0?' class="neg"':""}>${st.left<0?"−":""}${bAmt(st.left)}</b><small>${st.left<0?"oltre il budget di "+bAmt(b.a):"rimasti su "+bAmt(b.a)}</small></div></div>${list}<div class="bpn"><button type="button" data-bpn="-1" aria-label="Periodo precedente">‹</button><span>${bLbl(st.p,b.f)}</span><button type="button" data-bpn="1" aria-label="Periodo successivo"${bdt.off>=0?" disabled":""}>›</button></div></div>`}
function bdAskDel(){const b=S.bud.find(x=>x.id===bdt.id);if(!b)return;bdt.menu=false;bdRender();const d=document.createElement("div");d.className="bcf";d.id="bcf";d.innerHTML=`<div class="bcb"><b>Eliminare il budget “${esc(bName(b.c))}”?</b><p>Questa azione non può essere annullata.</p><button type="button" class="bdo" data-bdelok="1">Elimina</button><button type="button" class="bdn" data-bdelno="1">Annulla</button></div>`;$("bd").appendChild(d)}
document.addEventListener("click",e=>{const T=e.target;if(!T.closest)return;
  const q=a=>{const x=T.closest("["+a+"]");return x};let x;
  if((x=q("data-bnew"))){bsOpen();return}
  if((x=q("data-bcard"))){bdOpen(x.dataset.bcard);return}
  if(bs&&modal&&modal.kind==="budget-sheet"){
    if((x=q("data-bdd"))){const k=x.dataset.bdd,n=$("bc_"+k);if(!n)return;const open=n.hidden;bsCloseDD(k);n.hidden=!open;x.setAttribute("aria-expanded",String(open));if(open){const on=n.querySelector(".on");if(on)n.scrollTop=Math.max(0,on.offsetTop-60)}return}
    if(q("data-bnewcat")){bsRet=true;closeModal();show("categorie");return}
    if((x=q("data-bsel"))){const k=x.dataset.bsel,v=x.dataset.v;if(k==="c")bs.c=v;else if(k==="f"){bs.f=v;bs.d=v==="w"?0:1;bs.mo=0}else if(k==="mo")bs.mo=+v;else if(k==="d")bs.d=+v;bsCloseDD();bsUpd();return}
    if((x=q("data-bk"))){bs.a=amtNext(bs.a,x.dataset.bk);bsUpd();return}
    if(q("data-bcreate")){bsCreate();return}
    if(!T.closest(".nchips"))bsCloseDD();
  }
  if(bdt){
    if(q("data-bdelok")){const b=S.bud.find(z=>z.id===bdt.id);if(b)S.bud=S.bud.filter(z=>z.id!==b.id);save();bdClose();renderBud();return}
    if(q("data-bdelno")){const c=$("bcf");if(c)c.remove();return}
    if(q("data-bdclose")){bdClose();return}
    if(q("data-bdmenu")){bdt.menu=!bdt.menu;bdRender();return}
    if(q("data-bdedit")){const id=bdt.id;bdt.menu=false;bdRender();bsOpen(id);return}
    if(q("data-bddel")){bdAskDel();return}
    if((x=q("data-bpn"))){bdt.off=Math.min(0,bdt.off+(+x.dataset.bpn));bdt.menu=false;bdRender();return}
    if(bdt.menu&&!T.closest(".bdm")){bdt.menu=false;bdRender()}
  }
});
function obShow(){$("ob").hidden=false;document.documentElement.classList.add("obo");$("ob").querySelector(".obw").scrollTop=0}
function obStep2(){$("ob").hidden=true;document.documentElement.classList.remove("obo");document.documentElement.classList.add("onb");CT="x";show("categorie")}
function obDone(){const t=CT;CT="x";const n=catList().length;CT=t;
  if(!n){CT="x";catRender();toast("Aggiungi almeno una categoria di spesa per continuare");return}
  S.onb=1;save();document.documentElement.classList.remove("onb");show("home")}
function show(v){if(!$("v-"+v))return;view=v;document.documentElement.classList.toggle("nosb",v==="entrate"||v==="statistiche");setTimeout(lockHome,0);["home","entrate","ricorrenti","calendario","spese","budget","statistiche","impostazioni","appearance","appicon","notif","numentry","currency","categorie"].forEach(x=>$("v-"+x).hidden=x!==v);document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("on",b.dataset.view===(v==="entrate"||v==="spese"||v==="ricorrenti"?"home":SUBV.includes(v)?"impostazioni":v)));$("pill").hidden=v==="home"||v==="impostazioni"||SUBV.includes(v)||v==="entrate"||v==="budget";$("mrow").style.display=v==="statistiche"||v==="impostazioni"||v==="budget"||SUBV.includes(v)?"none":"";if(v==="budget")renderBud();if(v==="statistiche")renderStats();if(v==="currency")curOpen();if(v==="categorie")catOpen();$("mrow").classList.toggle("sp",v==="spese"||v==="ricorrenti");(v==="ricorrenti"?$("rslot"):v==="calendario"?$("cbar"):v==="spese"?$("spslot"):$("mrow")).appendChild($("pill"));if(v==="entrate")renderSalEd();if(v==="ricorrenti"){const e=$("v-entrate");e.hidden=false;e.style.visibility="hidden";renderSalEd();e.hidden=true;e.style.visibility=""}if(v==="calendario")renderCal();scrollTo(0,0)}
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
  if(t.dataset.cpay){const x=S.sch.find(z=>z.id===t.dataset.cpay);if(x){S.items.push({id:Date.now(),m:x.dt.slice(0,7),dt:x.dt,d:x.d,a:x.a,c:CATS[x.c]!==undefined?x.c:(ord()[0]||x.c),s:"paid"});S.sch=S.sch.filter(z=>z.id!==x.id);save();render()}}
  if(t.dataset.nt&&ne){ne.t=t.dataset.nt;neUpdate()}
  if(t.dataset.nq&&ne){ne.f=t.dataset.nq;ncClose();neUpdate()}
  if(t.dataset.nfclear&&ne){$("nfd").value="";const w=$("nfw");if(w){delete w.dataset.val;wClose("nf")}neUpdate()}
  if(t.dataset.nc&&ne){if(ne.rec&&ne.t==="in")ne.ic=t.dataset.nc;else{ne.cat=t.dataset.nc;ne.manual=true;ne.sug=false}ncClose();neUpdate()}
  if(t.dataset.nsave&&ne)neSave();
  if(t.dataset.sm!==undefined)openSalAmt(t.dataset.sm);
  if(t.dataset.lv!==undefined&&t.tagName==="INPUT")openBudAmt(t.dataset.lv);
  if(t.dataset.ak&&am)amPress(t.dataset.ak);
  if(t.dataset.amok&&am)amDone();
  if(t.dataset.eye){S.hide=!S.hide;save();renderTop()}
  if(t.classList&&t.classList.contains("tg")){t.setAttribute("aria-checked",t.getAttribute("aria-checked")==="true"?"false":"true");if(t.id==="dtg")setDec(t.getAttribute("aria-checked")==="true");if(t.id==="ntg")noteToggle(t);if(t.id==="atg")authToggle(t);return}
  if(t.dataset.obgo){obStep2();return}
  if(t.dataset.obnext){obDone();return}
  if(t.dataset.set==="Intro"){obShow();return}
  {const SM={"Appearance":"appearance","App Icon":"appicon","Notifications":"notif","Number Entry":"numentry","Currency":"currency","Categories":"categorie"};if(t.dataset.set&&SM[t.dataset.set]){show(SM[t.dataset.set]);return}}
  if(t.dataset.nem){setNem(t.dataset.nem);return}
  if(t.dataset.nk){nkPress(t.dataset.nk);return}
  if(t.dataset.back==="set"){if(bsRet&&bs){bsRet=false;show("budget");bsShow();return}show("impostazioni");return}
  if(t.dataset.tp){setPref(t.dataset.tp,true);return}
  if(t.dataset.cur){curPick(t.dataset.cur);return}
  if(t.dataset.catTab){CT=t.dataset.catTab;catRender();return}
  if(t.dataset.catEye){S.csh=!S.csh;save();catRender();toast(S.csh?"Suggerimenti nascosti":"Suggerimenti visibili",true);return}
  if(t.dataset.catEdit){CEDIT=!CEDIT;catRender();return}
  {const cr=e.target.closest&&e.target.closest("#catul .cr");if(cr&&!CEDIT&&!DR&&cr.dataset.cn){openCatNew(cr.dataset.cn);return}}
  if(t.dataset.cesave){catSave();return}
  if(t.dataset.cecancel){closeModal();return}
  if(t.dataset.cedel){catDelAsk();return}
  if(t.dataset.cedback){openCatNew(NCAT.edit);return}
  if(t.dataset.cedelok){catDel();return}
  if(t.dataset.catNew){openCatNew();return}
  if(t.dataset.catSug){const z=catSugList().find(q=>q[0]===t.dataset.catSug);if(z)catAdd(CT,z[0],z[1],z[2],z[0]);return}
  if(t.dataset.nck&&NCAT){NCAT.k=t.dataset.nck;ncSync();return}
  if(t.dataset.nct&&NCAT){NCAT.tab=+t.dataset.nct;$("nce").value="";ncEmoji("");return}
  if(t.dataset.nce&&NCAT){NCAT.e=t.dataset.nce;ncSync();const sc=$("emg").scrollTop;ncEmoji($("nce").value);$("emg").scrollTop=sc;return}
  if(t.dataset.ncsw){$("ncpal").hidden=!$("ncpal").hidden;return}
  if(t.dataset.ncc&&NCAT){NCAT.c=t.dataset.ncc;ncSync();$("ncpal").hidden=true;return}
  if(t.dataset.ncadd){ncAdd();return}
  if(t.dataset.themeToggle){setPref(DK?"light":"dark",true);return}
  if(t.dataset.bell)openNotes();
  if(t.dataset.reload)location.reload();
  if(t.dataset.reset){if(t.dataset.sure){try{localStorage.removeItem(KEY)}catch(e){}location.reload()}else{t.dataset.sure="1";t.textContent="Conferma: cancella tutto"}}
  if(t.dataset.erase&&modal&&modal.kind==="erase"){doErase();return}
  if(t.dataset.eraseAsk){openErase();return}
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
  if(t.dataset.dg){dgOpen[t.dataset.dg]=dgOpen[t.dataset.dg]===false;render();lockHome()}
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
if(S.onb===0)obShow();
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
