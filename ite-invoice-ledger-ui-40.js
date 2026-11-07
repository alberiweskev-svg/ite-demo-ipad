/* I.T.E. 4.0.52: integrated, local-only invoice TEST workbench. */
(function(){
"use strict";
const api=globalThis.ITEInvoiceLedger40;
if(!api)return;
const KEY="ITE-4-INVOICES-TEST-1";
let db=api.empty();
try{const saved=localStorage.getItem(KEY);if(saved)db=api.importJson(saved);}catch(e){console.warn("Archivio fatture TEST non caricato",e);}
const el=(tag,text,attrs={})=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));return n;};
const panel=el("section");panel.id="ite-invoices-test";panel.className="panel";panel.append(el("h2","Fatture e note di credito — ambiente TEST 4.0.52"),el("p","Dati dimostrativi salvati solo in questo browser. Non caricare documenti o dati reali.",{class:"hint"}));
const status=el("p","",{"role":"status"}),summary=el("div"),table=el("div"),form=el("form"),controls=el("div");controls.className="actions";
const input=(label,type="text",value="")=>{const l=el("label",label),i=el("input");i.type=type;i.value=value;i.required=true;l.append(i);return [l,i];};
const [idL,id]=input("ID documento TEST","text","TEST-INV-001");
const [numberL,number]=input("Numero documento","text","PR-001");
const [partyL,party]=input("Controparte fittizia","text","Cliente TEST");
const [dateL,date]=input("Data","date","2026-11-06");
const [qtyL,qty]=input("Quantità","number","1");qty.min="0.01";qty.step="any";
const [priceL,price]=input("Prezzo unitario €","number","100");price.min="0";price.step="0.01";
const [vatL,vat]=input("IVA %","number","10");vat.min="0";vat.max="22";vat.step="1";
const typeL=el("label","Tipologia");const type=el("select");api.TYPES.forEach(t=>{const o=el("option",t);o.value=t;type.append(o);});typeL.append(type);
const submit=el("button","Registra documento TEST");submit.type="submit";
form.append(idL,typeL,numberL,partyL,dateL,qtyL,priceL,vatL,submit);
form.addEventListener("submit",e=>{e.preventDefault();try{const next=api.add(db,{id:id.value.trim(),type:type.value,number:number.value,party:party.value,date:date.value,lines:[{quantity:Number(qty.value),unitPrice:Number(price.value),vat:Number(vat.value)}]});save(next);status.textContent="Documento TEST registrato";id.value="TEST-INV-"+String(db.documents.length+1).padStart(3,"0");}catch(err){status.textContent=err.message;}});
function save(next){api.validate(next);localStorage.setItem(KEY,api.exportJson(next));db=next;render();document.dispatchEvent(new CustomEvent("ite:invoice-ledger-updated",{detail:{source:"invoice-workbench"}}));}
function button(text,fn){const b=el("button",text);b.type="button";b.addEventListener("click",fn);return b;}
controls.append(button("Esporta JSON TEST",()=>{const blob=new Blob([api.exportJson(db)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=el("a");a.href=url;a.download="ite-fatture-test.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}),button("Ripristina dati TEST",()=>{if(confirm("Cancellare esclusivamente le fatture TEST salvate in questo browser?")){save(api.empty());status.textContent="Archivio TEST azzerato";}}));
const importLabel=el("label","Importa archivio JSON TEST");const file=el("input");file.type="file";file.accept=".json,application/json";file.required=false;importLabel.append(file);
file.addEventListener("change",async()=>{try{const f=file.files[0];if(!f)return;if(f.size>2000000)throw Error("Archivio troppo grande");const candidate=api.importJson(await f.text());if(!confirm("Sostituire l'archivio fatture TEST locale?"))return;save(candidate);status.textContent="Archivio TEST importato";}catch(err){status.textContent=err.message;}finally{file.value="";}});
panel.append(form,controls,importLabel,status,summary,table);
function render(){summary.replaceChildren();table.replaceChildren();const s=api.summary(db);summary.append(el("p","Documenti: "+s.rows.length+" | Vendite aperte: € "+s.openSales.toFixed(2)+" | Acquisti aperti: € "+s.openPurchases.toFixed(2)+" | TD04 da recuperare: € "+s.creditsToRecover.toFixed(2)+" | Proforma: € "+s.proformas.toFixed(2)));
s.rows.forEach(r=>{const item=el("article");item.className="item";item.append(el("strong",r.number+" — "+r.type),el("p",r.party+" | Totale € "+r.total.toFixed(2)+" | Residuo € "+r.remaining.toFixed(2)+" | "+r.status));if(r.remaining>0){const pay=button(r.type==="CREDIT_NOTE"?"Registra recupero":"Registra pagamento",()=>{const amount=prompt("Importo TEST (massimo € "+r.remaining.toFixed(2)+")");if(amount===null)return;const n=Number(amount);if(!amount.trim()||!Number.isFinite(n)||n<=0){status.textContent="Importo non valido";return;}try{save(api.payment(db,r.id,n,new Date().toISOString().slice(0,10)));status.textContent="Movimento TEST registrato";}catch(err){status.textContent=err.message;}});item.append(pay);}table.append(item);});}
document.addEventListener("ite:invoice-ledger-updated",e=>{if(e.detail&&e.detail.source==="invoice-workbench")return;try{const saved=localStorage.getItem(KEY);db=saved?api.importJson(saved):api.empty();render();status.textContent="Archivio fatture TEST sincronizzato con gli altri moduli.";}catch(err){status.textContent="Sincronizzazione bloccata: "+err.message;}});
window.addEventListener("storage",e=>{if(e.key===KEY)document.dispatchEvent(new CustomEvent("ite:invoice-ledger-updated",{detail:{source:"other-tab"}}));});
const host=document.querySelector("main .wrap")||document.querySelector("main")||document.querySelector(".wrap")||document.body;host.append(panel);render();
})();