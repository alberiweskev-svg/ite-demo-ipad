/* I.T.E. 4.0.66 — integrated service/quotation associations, TEST only. */
(function(root){
"use strict";
if(typeof document==="undefined")return;
const B=root.ITEServiceContract40,R=root.ITEServiceRegistry40,Q=root.ITEQuotes40,W=root.ITEServiceWorkflow40;
if(!B||!R||!Q||!W)return;
const SERVICE_KEY="ite40_service_registry_TEST_v1",QUOTE_KEY="ITE-4-QUOTES-TEST-1",LINK_KEY="ITE-4-SERVICE-CONTRACT-TEST-1";
const make=(tag,parent,label)=>{const e=document.createElement(tag);if(label!==undefined)e.textContent=String(label);if(parent)parent.append(e);return e;};
const panel=make("section",document.querySelector(".wrap")||document.body);panel.id="ite-service-contract-test";panel.className="panel";
make("h2",panel,"I.T.E. 4.0.66 — Contratti collegati agli interventi TEST");
make("p",panel,"Collegamenti espliciti tra preventivi, sedi, apparecchiature e appuntamenti. Nessuna fattura emessa; archivi locali e dati fittizi.").className="hint";
const status=make("p",panel);status.setAttribute("role","status");
const controls=make("div",panel);controls.className="grid";
const results=make("div",panel);
function select(label,parent){const l=make("label",parent,label);return make("select",l);}
const targetType=select("Collega il preventivo a",controls);
for(const [id,label] of [["APPOINTMENT","Appuntamento"],["EQUIPMENT","Apparecchiatura"],["SITE","Sede"]]){const o=make("option",targetType,label);o.value=id;}
const target=select("Destinazione",controls),quote=select("Preventivo",controls);
const noteLabel=make("label",controls,"Nota associazione");const note=make("input",noteLabel);note.maxLength=500;
const actions=make("div",panel);actions.className="actions";
function button(label,fn,parent=actions){const b=make("button",parent,label);b.type="button";b.addEventListener("click",()=>{try{fn();}catch(e){status.textContent="Operazione bloccata: "+e.message;}});return b;}
const read=()=>{const s=R.importJSON(localStorage.getItem(SERVICE_KEY)||"");const q=Q.importJson(localStorage.getItem(QUOTE_KEY)||JSON.stringify(Q.empty()));const b=B.importJSON(localStorage.getItem(LINK_KEY)||JSON.stringify(B.empty()),s,q);return {s,q,b};};
function persist(b,s,q){B.check(b,s,q);localStorage.setItem(LINK_KEY,B.exportJSON(b,s,q));render();status.textContent="Collegamento TEST salvato.";document.dispatchEvent(new CustomEvent("ite:service-contract-updated"));}
const id=()=> "TEST-LINK-"+Date.now().toString(36).toUpperCase()+"-"+Math.random().toString(36).slice(2,7).toUpperCase();
function populate(el,rows,display){const old=el.value;el.replaceChildren();for(const r of rows){const o=make("option",el,display(r));o.value=r.id;}if(rows.some(x=>x.id===old))el.value=old;}
function destinations(s){return targetType.value==="SITE"?s.sites:targetType.value==="EQUIPMENT"?s.equipment:s.appointments;}
function targetLabel(s,x){if(targetType.value==="SITE")return x.name+" — "+(x.address||x.id);if(targetType.value==="EQUIPMENT")return x.name+" — "+(x.model||x.id);const c=W.context(s,x.id);return x.start+" — "+c.client.name+" — "+c.equipment.name;}
function refreshTargets(){try{const {s}=read();populate(target,destinations(s),x=>targetLabel(s,x));}catch(e){status.textContent="Archivio anagrafiche da verificare: "+e.message;}}
targetType.addEventListener("change",refreshTargets);
button("Associa preventivo",()=>{const {s,q,b}=read();if(!target.value||!quote.value)throw Error("Selezionare destinazione e preventivo");const next=B.attach(b,s,q,{id:id(),targetType:targetType.value,targetId:target.value,quoteId:quote.value,note:note.value,createdAt:new Date().toISOString()});persist(next,s,q);});
button("Esporta collegamenti JSON",()=>{const {s,q,b}=read();const blob=new Blob([B.exportJSON(b,s,q)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=make("a");a.href=url;a.download="ite-service-contract-TEST.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);});
const importLabel=make("label",actions,"Importa collegamenti TEST");const file=make("input",importLabel);file.type="file";file.accept=".json,application/json";file.addEventListener("change",async()=>{try{const f=file.files&&file.files[0];if(!f||f.size>2000000)throw Error("File non valido o troppo grande");const {s,q}=read();const next=B.importJSON(await f.text(),s,q);if(!confirm("Sostituire i collegamenti TEST locali? Esportare prima il backup."))return;persist(next,s,q);}catch(e){status.textContent="Importazione bloccata: "+e.message;}finally{file.value="";}});
function render(){try{const {s,q,b}=read();populate(target,destinations(s),x=>targetLabel(s,x));populate(quote,q.quotes,x=>x.id+" — "+x.customer+" — "+x.status);results.replaceChildren();
make("p",results,b.links.length+" associazioni · "+s.appointments.length+" appuntamenti · "+q.quotes.length+" preventivi").className="hint";
for(const a of s.appointments){const ctx=W.context(s,a.id),summary=B.summary(b,s,q,a.id);const item=make("div",results);item.className="item";
make("strong",item,a.start+" · "+ctx.client.name+" · "+ctx.equipment.name);
if(summary.unlinked)make("p",item,"Nessun preventivo associato");
for(const row of summary.quotes){make("p",item,row.id+" · "+row.status+" · Contratto € "+row.contractTotal.toFixed(2)+" · Extra approvati € "+row.approvedExtras.toFixed(2)+" · Extra in attesa € "+row.pendingExtras.toFixed(2));}
}
const linked=make("div",results);make("h3",linked,"Gestione associazioni");
for(const l of b.links){const item=make("div",linked);item.className="item";make("span",item,l.quoteId+" → "+l.targetType+" / "+l.targetId+" · "+l.note);button("Rimuovi",()=>{const latest=read();persist(B.detach(latest.b,latest.s,latest.q,l.id),latest.s,latest.q);},item);}
status.textContent="";
}catch(e){results.replaceChildren();status.textContent="Archivi TEST non disponibili o incoerenti: "+e.message;}}
document.addEventListener("ite:quotes-updated",render);
document.addEventListener("ite:service-registry-updated",render);
window.addEventListener("storage",e=>{if([SERVICE_KEY,QUOTE_KEY,LINK_KEY].includes(e.key))render();});
render();
root.ITEServiceContractUI40={refresh:render};
})(typeof globalThis!=="undefined"?globalThis:this);
