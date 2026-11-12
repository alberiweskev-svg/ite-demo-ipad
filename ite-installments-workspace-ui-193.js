/* I.T.E. 4.0.193 — rate TEST integrate nel registro fiscale; nessun dato reale. */
(function(root){"use strict";
function init(){
 const d=root.document,A=root.ITE_Installments192,B=root.ITE_FiscalWorkspaceBridge185;
 const parent=d&&d.getElementById("ite-fiscal-workspace-184");if(!parent||!A||!B)return;
 const section=d.createElement("section");section.id="ite-installments-workspace-193";section.className="panel";
 const title=d.createElement("h3");title.textContent="Piani rateali e movimenti — TEST";
 const warning=d.createElement("p");warning.className="hint";warning.textContent="Archivio rateale temporaneo e separato dallo scadenziario semplice 4.0.191. Non registrare lo stesso pagamento in entrambi. Nessuna sincronizzazione, nessun dato reale.";
 const status=d.createElement("p");status.setAttribute("role","status");
 const planForm=d.createElement("form");planForm.className="grid";
 function field(form,caption,tag,type){const label=d.createElement("label");label.textContent=caption;const el=d.createElement(tag);if(type)el.type=type;label.append(el);form.append(label);return el}
 const documentSelect=field(planForm,"Fattura registrata senza piano", "select");
 const dates=field(planForm,"Date rate (AAAA-MM-GG, una per riga)","textarea");dates.rows=3;dates.placeholder="2026-12-15\n2027-01-15\n2027-02-15";dates.required=true;
 const create=d.createElement("button");create.type="submit";create.textContent="Crea piano rateale TEST";planForm.append(create);
 const movementForm=d.createElement("form");movementForm.className="grid";
 const installmentSelect=field(movementForm,"Rata con residuo","select");
 const amount=field(movementForm,"Importo €","input","number");amount.min="0.01";amount.step="0.01";amount.required=true;
 const movementDate=field(movementForm,"Data movimento","input","date");movementDate.required=true;movementDate.value="2026-11-12";
 const method=field(movementForm,"Metodo","select");for(const x of ["BONIFICO","CONTANTI","POS","ALTRO"]){const option=d.createElement("option");option.value=x;option.textContent=x;method.append(option)}
 const pay=d.createElement("button");pay.type="submit";pay.textContent="Registra movimento rateale TEST";movementForm.append(pay);
 const actions=d.createElement("div");actions.className="actions";
 function button(text){const b=d.createElement("button");b.type="button";b.textContent=text;actions.append(b);return b}
 const refresh=button("Verifica rate");const csv=button("Esporta CSV rate");const json=button("Esporta JSON rate");const clear=button("Svuota rate TEST");clear.className="secondary";
 const importLabel=d.createElement("label");importLabel.className="touch-file-picker";importLabel.textContent="Importa JSON rate TEST";const importFile=d.createElement("input");importFile.type="file";importFile.accept=".json,application/json";importLabel.append(importFile);actions.append(importLabel);
 const output=d.createElement("div");output.setAttribute("aria-live","polite");
 section.append(title,warning,planForm,movementForm,actions,status,output);parent.append(section);
 let store=A.create(),counter=0;
 const euro=x=>(x/100).toLocaleString("it-IT",{style:"currency",currency:"EUR"});
 const snapshot=()=>B.snapshot();
 function report(){return A.inspect(snapshot(),store)}
 function render(){
  const f=snapshot();documentSelect.replaceChildren();installmentSelect.replaceChildren();output.replaceChildren();
  const used=new Set(store.plans.map(x=>x.documentId));
  for(const doc of f.documents.filter(x=>["VENDITA","ACQUISTO"].includes(x.type)&&x.status==="REGISTRATO"&&!used.has(x.id))){
   const option=d.createElement("option");option.value=doc.id;option.textContent=doc.type+" "+doc.number+" — "+euro(doc.totals.totalCents);documentSelect.append(option)
  }
  create.disabled=!documentSelect.options.length;
  try{
   const r=report();status.textContent=r.valid?"Piani rateali coerenti — TEST.":"Anomalie: "+r.issues.join("; ");
   const summary=d.createElement("p");summary.textContent="Da incassare "+euro(r.totals.openReceivableCents)+" · Da pagare "+euro(r.totals.openPayableCents);output.append(summary);
   for(const row of r.rows){
    if(row.outstandingCents>0){const option=d.createElement("option");option.value=row.installmentId;option.textContent=row.documentNumber+" / "+row.installmentId+" — "+euro(row.outstandingCents);installmentSelect.append(option)}
    const item=d.createElement("div");item.className="item";item.textContent=row.type+" "+row.documentNumber+" · rata "+row.installmentId+" · "+row.dueDate+" · totale "+euro(row.amountCents)+" · pagato "+euro(row.paidCents)+" · residuo "+euro(row.outstandingCents);output.append(item)
   }
   pay.disabled=!r.valid||!installmentSelect.options.length;csv.disabled=json.disabled=!r.valid;
  }catch(err){status.textContent="Verifica impossibile: "+err.message;pay.disabled=csv.disabled=json.disabled=true}
 }
 function download(filename,content,mime){const url=URL.createObjectURL(new Blob([content],{type:mime}));const anchor=d.createElement("a");anchor.href=url;anchor.download=filename;section.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 planForm.addEventListener("submit",event=>{event.preventDefault();try{
  const values=dates.value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  if(!values.length||values.length>120)throw Error("NUMERO_RATE_NON_VALIDO");
  const id="rate_"+(++counter);store=A.split(snapshot(),store,documentSelect.value,values,id);dates.value="";render()
 }catch(err){status.textContent="Piano respinto: "+err.message}});
 movementForm.addEventListener("submit",event=>{event.preventDefault();try{
  if(!/^\d+(?:[.,]\d{1,2})?$/.test(amount.value))throw Error("IMPORTO_NON_VALIDO");
  const cents=Math.round(Number(amount.value.replace(",","."))*100);
  store=A.addMovement(snapshot(),store,{id:"pag_"+(++counter),installmentId:installmentSelect.value,date:movementDate.value,amountCents:cents,method:method.value});amount.value="";render()
 }catch(err){status.textContent="Movimento respinto: "+err.message}});
 refresh.addEventListener("click",render);
 csv.addEventListener("click",()=>{try{download("ITE-4.0.193-RATE-TEST.csv",A.csv(report()),"text/csv;charset=utf-8")}catch(err){status.textContent=err.message}});
 json.addEventListener("click",()=>{try{download("ITE-4.0.193-RATE-TEST.json",A.exportTest(snapshot(),store),"application/json")}catch(err){status.textContent=err.message}});
 importFile.addEventListener("change",async()=>{const file=importFile.files&&importFile.files[0];if(!file)return;try{
  if(file.size>2000000)throw Error("FILE_TROPPO_GRANDE");const candidate=A.importTest(snapshot(),await file.text());
  if(!root.confirm("Sostituire i piani rateali TEST della sessione?"))return;
  store=candidate;counter=Math.max(counter,store.plans.length+store.movements.length)+100;render()
 }catch(err){status.textContent="Importazione respinta: "+err.message}finally{importFile.value=""}});
 clear.addEventListener("click",()=>{if(!root.confirm("Eliminare solo i piani rateali TEST?"))return;store=A.create();counter=0;render()});
 render();
}
if(root.document){if(root.document.readyState==="loading")root.document.addEventListener("DOMContentLoaded",init,{once:true});else init()}
})(typeof globalThis!=="undefined"?globalThis:this);
