/* I.T.E. 4.0.75 — unified local TEST finance review, no fiscal issuance. */
(function(root){"use strict";
if(typeof document==="undefined"||!root.ITEFinanceWorkspace40)return;
const W=root.ITEFinanceWorkspace40,F=root.ITEFinanceReconcile40,KEY="ITE-4-FINANCE-WORKSPACE-TEST-1";
const host=document.querySelector(".wrap")||document.body;
const el=(tag,parent,value)=>{const x=document.createElement(tag);if(value!==undefined)x.textContent=String(value);if(parent)parent.append(x);return x;};
const panel=el("section",host);panel.id="ite-finance-workspace-test";panel.className="panel";
el("h2",panel,"I.T.E. 4.0.75 — Fatture, proforme e note credito TEST");
el("p",panel,"Archivio di collaudo locale, separato dalla contabilità operativa. Nessuna emissione fiscale, nessun caricamento su server.").className="hint";
const status=el("p",panel);status.setAttribute("role","status");
const form=el("div",panel);form.className="grid";
function field(label,placeholder){const box=el("label",form,label);const input=el("input",box);input.placeholder=placeholder;return input;}
const id=field("ID documento TEST","TEST-INV-001"),party=field("ID cliente/fornitore TEST","TEST-CLIENT-001"),app=field("ID appuntamento TEST","TEST-APP-001"),number=field("Numero documento","PR-72"),net=field("Imponibile EUR","100.00"),tax=field("IVA EUR","10.00"),total=field("Totale EUR","110.00"),paid=field("Incassato EUR (solo fattura)","0.00");
const direction=el("select",el("label",form,"Tipo movimento"));for(const s of ["VENDITA","ACQUISTO"]){const o=el("option",direction,s);o.value=s;}
const td=el("select",el("label",form,"Tipo documento"));for(const [v,label] of [["TD01","Fattura TD01"],["PR","Proforma PR"],["TD04","Nota credito TD04"]]){const o=el("option",td,label);o.value=v;}
const actions=el("div",panel);actions.className="actions";const output=el("div",panel);
function read(){try{return W.importJSON(localStorage.getItem(KEY)||W.exportJSON(W.empty()));}catch(e){throw Error("Archivio locale da verificare: "+e.message);}}
function write(a){const serialized=W.exportJSON(a);localStorage.setItem(KEY,serialized);render();}
function btn(label,fn){const b=el("button",actions,label);b.type="button";b.addEventListener("click",()=>{try{fn();}catch(e){status.textContent=e.message;}});return b;}
btn("Registra documento TEST",()=>{
 const a=read();const kind=td.value;const doc={id:id.value.trim(),partyId:party.value.trim(),appointmentId:app.value.trim(),direction:direction.value,td:kind==="PR"?"TD01":kind,number:kind==="PR"?"PR-"+number.value.replace(/^PR[- /]*/i,""):number.value,net:Number(net.value),tax:Number(tax.value),total:Number(total.value),paid:Number(paid.value||0)};
 F.validate(doc);a.documents.push(doc);a.links.push({appointmentId:doc.appointmentId,documentId:doc.id});write(a);
});
btn("Aggiorna riepilogo",render);
btn("Esporta backup JSON TEST",()=>{
 const blob=new Blob([W.exportJSON(read())],{type:"application/json"}),url=URL.createObjectURL(blob),a=el("a");a.href=url;a.download="ite-finance-workspace-TEST.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
});
const recovery=el("div",panel);recovery.className="grid";
const credit=el("select",el("label",recovery,"Nota credito TD04"));
const recId=el("input",el("label",recovery,"ID movimento TEST"));recId.placeholder="TEST-REC-001";
const amount=el("input",el("label",recovery,"Importo recuperato EUR"));amount.placeholder="20.00";
const method=el("select",el("label",recovery,"Modalità"));for(const v of ["INCASSO","COMPENSAZIONE"]){const o=el("option",method,v);o.value=v;}
btn("Registra recupero TD04",()=>{write(W.addRecovery(read(),{id:recId.value.trim(),documentId:credit.value,direction:method.value,amount:Number(amount.value)}));});
function render(){
 try{
 const r=W.report(read());output.replaceChildren();credit.replaceChildren();
 el("h3",output,"Situazione economica per appuntamento");
 for(const s of r.summaries){const div=el("div",output);div.className="item";el("strong",div,s.appointmentId);el("p",div,"Vendite € "+(s.salesCents/100).toFixed(2)+" · Acquisti € "+(s.purchasesCents/100).toFixed(2)+" · Proforme € "+(s.proformaCents/100).toFixed(2)+" · TD04 € "+(s.creditCents/100).toFixed(2)+" · Incassato € "+(s.receivedCents/100).toFixed(2)+" · Saldo € "+(s.balanceCents/100).toFixed(2));if(s.alerts.length)el("p",div,s.alerts.join("; "));}
 el("h3",output,"Recupero note di credito");
 for(const c of r.credits){const o=el("option",credit,c.documentId);o.value=c.documentId;el("p",output,c.documentId+" · "+c.status+" · Residuo € "+(c.residualCents/100).toFixed(2));}
 if(r.warnings.length)el("p",output,"Da verificare: "+r.warnings.join("; "));
 status.textContent="Riepilogo TEST aggiornato: "+r.documents+" documenti, "+r.links+" collegamenti.";
 }catch(e){status.textContent=e.message;}
}
render();
})(typeof globalThis!=="undefined"?globalThis:this);