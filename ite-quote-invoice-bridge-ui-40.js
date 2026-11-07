/* I.T.E. 4.0.57 — Integrazione locale preventivo accettato -> bozza fattura TEST.
 * Nessuna emissione fiscale, invio server o modifica dei moduli 2.7.5.
 */
(function(root){
"use strict";
if(typeof document==="undefined"||!root.ITEQuoteInvoiceBridge40||!root.ITEQuotes40||!root.ITEInvoiceLedger40)return;
const bridge=root.ITEQuoteInvoiceBridge40,Q=root.ITEQuotes40,I=root.ITEInvoiceLedger40;
const QKEY="ITE-4-QUOTES-TEST-1",IKEY="ITE-4-INVOICES-TEST-1";
const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);return n;};
const panel=el("section");panel.id="ite-quote-invoice-test";panel.className="panel";
panel.append(el("h2","Da preventivo accettato a bozza fattura — TEST 4.0.57"),
 el("p","Anteprima e conferma esplicita. Fornitura e posa rimangono righe distinte; solo Extra approvati. Non emette fatture fiscali né utilizza dati reali."));
const status=el("p");status.setAttribute("role","status");
const grid=el("div");grid.className="grid";
function field(label,value,type="text"){const l=el("label",label),i=el("input");i.type=type;i.value=value;l.append(i);grid.append(l);return i;}
const selectLabel=el("label","Preventivo accettato TEST"),picker=el("select");selectLabel.append(picker);grid.append(selectLabel);
const id=field("ID nuova bozza TEST","TEST-INV-Q-001"),number=field("Numero bozza","BOZZA-TEST-001"),date=field("Data bozza","2026-11-07","date");
const extrasLabel=el("label","Includi Extra approvati"),extras=el("input");extras.type="checkbox";extras.checked=true;extras.style.width="auto";extrasLabel.prepend(extras);grid.append(extrasLabel);
const actions=el("div");actions.className="actions";const previewButton=el("button","Prepara anteprima"),confirmButton=el("button","Conferma e salva bozza TEST");previewButton.type=confirmButton.type="button";confirmButton.disabled=true;actions.append(previewButton,confirmButton);
const output=el("div");panel.append(grid,actions,status,output);
const read=(key,api)=>{const raw=localStorage.getItem(key);return raw?api.importJson(raw):api.empty();};
const snapshot=()=>({q:localStorage.getItem(QKEY)||"",i:localStorage.getItem(IKEY)||""});
let pending=null;
function invalidate(){pending=null;confirmButton.disabled=true;output.replaceChildren();}
function refresh(){invalidate();try{const db=read(QKEY,Q),old=picker.value;picker.replaceChildren();db.quotes.filter(q=>q.status==="ACCEPTED").forEach(q=>{const o=el("option",q.id+" · "+q.customer);o.value=q.id;picker.append(o);});if([...picker.options].some(o=>o.value===old))picker.value=old;if(!picker.options.length)status.textContent="Nessun preventivo accettato TEST disponibile.";}catch(e){status.textContent="Archivio preventivi da verificare: "+e.message;}}
function make(){const before=snapshot(),q=read(QKEY,Q),i=read(IKEY,I);const result=bridge.prepare(q,i,picker.value,id.value.trim(),number.value.trim(),date.value,{includeExtras:extras.checked});return {before,result,quoteId:picker.value,invoiceId:id.value.trim()};}
previewButton.addEventListener("click",()=>{try{invalidate();pending=make();const p=pending.result.preview;output.append(el("h3","Anteprima — "+p.customer),el("p","Righe: "+p.rows.length+" · Extra esclusi: "+p.excludedExtras+" · Imponibile € "+p.totals.taxable.toFixed(2)+" · IVA € "+p.totals.vat.toFixed(2)+" · Totale € "+p.totals.total.toFixed(2)));p.rows.forEach(r=>output.append(el("p",r.kind+" · "+r.description+" · "+r.category)));output.append(el("p",p.warning));confirmButton.disabled=false;status.textContent="Anteprima pronta. Verificare le voci prima di confermare.";}catch(e){invalidate();status.textContent=e.message;}});
confirmButton.addEventListener("click",()=>{try{if(!pending)throw Error("Preparare prima l'anteprima");const now=snapshot();if(now.q!==pending.before.q||now.i!==pending.before.i)throw Error("Archivio cambiato: ripetere anteprima");if(picker.value!==pending.quoteId||id.value.trim()!==pending.invoiceId)throw Error("Selezione cambiata: ripetere anteprima");
const fresh=make();if(JSON.stringify(fresh.result)!==JSON.stringify(pending.result))throw Error("Dati modificati: ripetere anteprima");
if(!root.confirm("Salvare la bozza TEST nell'archivio fatture locale? Non è una fattura fiscale."))return;
const backup=localStorage.getItem(IKEY);const next=I.exportJson(fresh.result.ledger);
try{localStorage.setItem(IKEY,next);}catch(e){if(backup===null)localStorage.removeItem(IKEY);else localStorage.setItem(IKEY,backup);throw e;}
invalidate();status.textContent="Bozza TEST salvata. Aggiornare il pannello fatture per visualizzarla.";refresh();}catch(e){invalidate();status.textContent=e.message;}});
[picker,id,number,date,extras].forEach(n=>n.addEventListener("change",invalidate));
root.addEventListener("storage",e=>{if(e.key===QKEY||e.key===IKEY)refresh();});
const host=document.querySelector("#ite-quotes-test")||document.querySelector("main .wrap")||document.body;host.insertAdjacentElement("afterend",panel);refresh();
})(typeof globalThis!=="undefined"?globalThis:this);
