/* I.T.E. 4.0.67 — unified TEST appointment dossier; local-only, read-only. */
(function(root){"use strict";
if(typeof document==="undefined"||!root.ITEServiceDossier40)return;
const D=root.ITEServiceDossier40,R=root.ITEServiceRegistry40,Q=root.ITEQuotes40,I=root.ITEInvoiceLedger40,B=root.ITEServiceContract40,S=root.ITEContractSettlement40;
const keys={s:"ite40_service_registry_TEST_v1",q:"ITE-4-QUOTES-TEST-1",i:"ITE-4-INVOICES-TEST-1",b:"ITE-4-SERVICE-CONTRACT-TEST-1",t:"ITE-4-CONTRACT-SETTLEMENT-TEST-1"};
const el=(tag,parent,txt)=>{const n=document.createElement(tag);if(txt!==undefined)n.textContent=String(txt);if(parent)parent.append(n);return n;};
const panel=el("section",document.querySelector(".wrap")||document.body);panel.id="ite-service-dossier-test";panel.className="panel";
el("h2",panel,"I.T.E. 4.0.67 — Fascicolo intervento e situazione economica TEST");
el("p",panel,"Cliente, sede, impianto, apparecchiatura, tecnico, rapporti, preventivi, Extra e fatture collegate. Solo lettura; nessun documento fiscale emesso.").className="hint";
const selector=el("select",el("label",panel,"Appuntamento")),actions=el("div",panel),status=el("p",panel),output=el("div",panel);actions.className="actions";status.setAttribute("role","status");
const button=(label,fn)=>{const b=el("button",actions,label);b.type="button";b.addEventListener("click",()=>{try{fn();}catch(e){status.textContent=e.message;}});return b;};
const archive=()=>{
 const s=R.importJSON(localStorage.getItem(keys.s)||"");
 const q=Q.importJson(localStorage.getItem(keys.q)||JSON.stringify(Q.empty()));
 const i=I.importJson(localStorage.getItem(keys.i)||JSON.stringify(I.empty()));
 const b=B.importJSON(localStorage.getItem(keys.b)||JSON.stringify(B.empty()),s,q);
 const t=S.importJson(localStorage.getItem(keys.t)||JSON.stringify(S.empty()),q,i);
 return {s,q,i,b,t};
};
let current=null;
function render(){
 output.replaceChildren();current=null;
 try{
  const a=archive(),old=selector.value;selector.replaceChildren();
  for(const ap of a.s.appointments){const o=el("option",selector,ap.start+" · "+ap.id);o.value=ap.id;}
  if(a.s.appointments.some(x=>x.id===old))selector.value=old;
  if(!selector.value){status.textContent="Nessun appuntamento TEST: crearne uno nel calendario operativo.";return;}
  const d=D.dossier(a.s,a.q,a.b,a.i,a.t,selector.value);current=d;
  el("h3",output,d.client.name+" · "+d.site.name);
  el("p",output,d.site.address+" · "+d.plant.name+" · "+d.equipment.name+" / "+d.equipment.model);
  el("p",output,"Tecnico: "+d.operator.name+" · Appuntamento: "+d.appointment.start+" — "+d.appointment.end);
  el("h3",output,"Rapporto intervento");
  el("pre",output,JSON.stringify(d.intervention,null,2)).style.whiteSpace="pre-wrap";
  el("h3",output,"Preventivi, Extra e fatture TEST");
  for(const f of d.financial){
   const item=el("div",output);item.className="item";
   el("strong",item,f.quoteId+" · "+f.status);
   el("p",item,"Contratto € "+f.contractTotal.toFixed(2)+" · Extra approvati € "+f.approvedExtras.toFixed(2)+" · In attesa € "+f.pendingExtras.toFixed(2));
   el("p",item,"Fatturato € "+f.billed.toFixed(2)+" · Incassato € "+f.paid.toFixed(2)+" · Da incassare € "+f.unpaid.toFixed(2)+" · Da fatturare € "+f.remainingToInvoice.toFixed(2));
   for(const doc of f.documents)el("p",item,doc.number+" · "+doc.date+" · "+doc.kind+" · € "+doc.total.toFixed(2)+" (pagato € "+doc.paid.toFixed(2)+")");
  }
  if(d.warnings.length)el("p",output,"Verifiche necessarie: "+d.warnings.join("; "));
  status.textContent="Fascicolo TEST aggiornato. Non usare come documento fiscale.";
 }catch(e){status.textContent="Archivi locali incoerenti o non disponibili: "+e.message;}
}
selector.addEventListener("change",render);
button("Aggiorna fascicolo",render);
button("Esporta CSV TEST",()=>{
 if(!current)throw Error("Nessun fascicolo disponibile");
 const url=URL.createObjectURL(new Blob([D.csv(current)],{type:"text/csv;charset=utf-8"}));
 const a=el("a");a.href=url;a.download="ite-fascicolo-intervento-TEST.csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
});
for(const event of ["ite:quotes-updated","ite:service-registry-updated","ite:service-contract-updated","ite:invoices-updated","ite:contract-settlement-updated"])document.addEventListener(event,render);
window.addEventListener("storage",e=>{if(Object.values(keys).includes(e.key))render();});
render();root.ITEServiceDossierUI40={refresh:render};
})(typeof globalThis!=="undefined"?globalThis:this);
