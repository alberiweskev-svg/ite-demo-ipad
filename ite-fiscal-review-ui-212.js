/* I.T.E. 4.0.212 — fiscal review TEST, no production persistence or PDF parsing. */
(function(root){"use strict";
const F=root.ITEFiscalLedger211;
function mount(){
 if(!F||!root.document)return;
 const d=root.document, host=d.createElement("section");host.id="ite-fiscal-review-212";host.style.cssText="margin:16px 0;padding:16px;border:1px solid #999;border-radius:12px;max-width:100%;box-sizing:border-box";
 const title=d.createElement("h3");title.textContent="Registro fiscale integrato — collaudo 4.0.212";host.append(title);
 const notice=d.createElement("p");notice.textContent="Solo dati fittizi in memoria. Nessun collegamento a fatture reali, archivi operativi, SdI o PDF.";host.append(notice);
 const controls=d.createElement("div");controls.style.cssText="display:flex;flex-wrap:wrap;gap:8px";host.append(controls);
 const message=d.createElement("p");message.setAttribute("role","status");host.append(message);
 const output=d.createElement("div");host.append(output);
 const seed=[
 {id:"V-TEST-1",direction:"OUT",type:"VENDITA",documentCode:"TD01",number:"TEST-V1",date:"2026-11-13",counterpartyId:"CLIENTE-FITTIZIO",netCents:10000,vatCents:1000,grossCents:11000},
 {id:"A-TEST-1",direction:"IN",type:"ACQUISTO",documentCode:"TD01",number:"TEST-A1",date:"2026-11-13",counterpartyId:"FORNITORE-FITTIZIO",netCents:20000,vatCents:4400,grossCents:24400},
 {id:"PR-TEST-1",direction:"OUT",type:"PROFORMA",documentCode:"PR",number:"TEST-PR1",date:"2026-11-13",counterpartyId:"CLIENTE-FITTIZIO",netCents:5000,vatCents:500,grossCents:5500},
 {id:"NC-TEST-1",direction:"OUT",type:"NOTA_CREDITO",documentCode:"TD04",number:"TEST-NC1",date:"2026-11-13",counterpartyId:"CLIENTE-FITTIZIO",netCents:-2000,vatCents:-200,grossCents:-2200,referenceId:"V-TEST-1"}];
 let ledger=F.create(seed);
 const fmt=n=>(n/100).toLocaleString("it-IT",{style:"currency",currency:"EUR"});
 function button(label,fn){const b=d.createElement("button");b.type="button";b.textContent=label;b.style.cssText="padding:9px;min-height:44px";b.addEventListener("click",()=>{try{fn();render();message.textContent="Operazione TEST completata.";}catch(e){message.textContent="Operazione rifiutata: "+e.message;}});controls.append(b);}
 function download(content,name){const blob=new Blob([content],{type:"application/json"}),url=URL.createObjectURL(blob),a=d.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 function render(){
 output.replaceChildren();const t=ledger.totals(),summary=d.createElement("p");summary.textContent="Vendite "+fmt(t.vendite)+" · Acquisti "+fmt(t.acquisti)+" · Proforma "+fmt(t.proforma)+" · Note credito vendita "+fmt(t.noteCreditoVendita)+" · Saldo vendite "+fmt(t.saldoVendite)+" · Saldo acquisti "+fmt(t.saldoAcquisti);output.append(summary);
 const wrap=d.createElement("div");wrap.style.overflowX="auto";const table=d.createElement("table");table.style.width="100%";
 const head=d.createElement("tr");for(const label of ["Documento","Tipo","Controparte","Data","Totale","Stato","Azione"]){const th=d.createElement("th");th.textContent=label;head.append(th);}table.append(head);
 for(const item of ledger.snapshot()){const tr=d.createElement("tr");for(const value of [item.number,item.type,item.counterpartyId,item.date,fmt(item.grossCents),item.status]){const td=d.createElement("td");td.textContent=value;td.style.padding="6px";tr.append(td);}const action=d.createElement("td"),sel=d.createElement("select");sel.setAttribute("aria-label","Stato "+item.number);for(const s of ["REGISTRATO","DA_VERIFICARE","ANNULLATO"]){const opt=d.createElement("option");opt.value=s;opt.textContent=s;sel.append(opt);}sel.value=item.status;sel.addEventListener("change",()=>{try{ledger.changeStatus(item.id,sel.value);message.textContent="Stato TEST aggiornato.";render();}catch(e){message.textContent=e.message;render();}});action.append(sel);tr.append(action);table.append(tr);}wrap.append(table);output.append(wrap);
 }
 button("Ripristina esempi TEST",()=>{ledger=F.create(seed);});
 button("Esporta registro JSON TEST",()=>download(JSON.stringify({schema:"ITE_FISCAL_TEST_212",mode:"SYNTHETIC_TEST_ONLY",documents:ledger.snapshot()},null,2),"ite-registro-fiscale-test-212.json"));
 const picker=d.createElement("input");picker.type="file";picker.accept=".json,application/json";picker.setAttribute("aria-label","Importa registro fiscale sintetico");controls.append(picker);
 picker.addEventListener("change",async()=>{try{const file=picker.files&&picker.files[0];if(!file)return;if(file.size>300000)throw Error("FILE_TROPPO_GRANDE");const parsed=JSON.parse(await file.text());if(!parsed||parsed.schema!=="ITE_FISCAL_TEST_212"||parsed.mode!=="SYNTHETIC_TEST_ONLY"||!Array.isArray(parsed.documents))throw Error("SOLO_JSON_TEST_212");const next=F.create(parsed.documents);ledger=next;render();message.textContent="Registro TEST importato e validato.";}catch(e){message.textContent="Importazione rifiutata: "+e.message;}finally{picker.value="";}});
 const target=d.getElementById("ite-workflow-cockpit-203")||d.querySelector("main")||d.body;target.append(host);render();
}
if(root.document){if(root.document.readyState==="loading")root.document.addEventListener("DOMContentLoaded",mount,{once:true});else mount();}
})(typeof globalThis!=="undefined"?globalThis:this);
