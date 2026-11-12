/* I.T.E. 4.0.184 — registro fiscale dimostrativo integrato, solo dati fittizi. */
(function(root){"use strict";
function init(){
 const A=root.ITE_FiscalTest183,d=root.document;if(!A||!d)return;
 const parent=d.getElementById("ite-field-workspace-172");if(!parent)return;
 const host=d.createElement("section");host.className="panel";host.id="ite-fiscal-workspace-184";
 const heading=d.createElement("h3");heading.textContent="Registro documenti — TEST 4.0.184";
 const note=d.createElement("p");note.className="hint";note.textContent="Solo simulazioni con dati inventati: nessuna fattura fiscale, nessun invio SDI e nessun salvataggio su server. I dati si perdono ricaricando la pagina.";
 const form=d.createElement("form");form.className="grid";
 function field(label,type,value){const wrap=d.createElement("label");wrap.textContent=label;const input=d.createElement("input");input.type=type;input.required=true;if(value!==undefined)input.value=value;wrap.append(input);form.append(wrap);return input}
 const typeWrap=d.createElement("label");typeWrap.textContent="Tipo documento";const type=d.createElement("select");for(const x of A.TYPES){const o=d.createElement("option");o.value=x;o.textContent=x;type.append(o)}typeWrap.append(type);form.append(typeWrap);
 const number=field("Numero documento","text","TEST-001"),date=field("Data","date","2026-11-12"),party=field("Controparte fittizia","text","Cliente Dimostrativo");
 const desc=field("Descrizione riga","text","Fornitura dimostrativa"),qty=field("Quantità intera","number","1"),price=field("Prezzo unitario €","number","100");
 qty.min="1";qty.step="1";price.min="0";price.step="0.01";
 const vatWrap=d.createElement("label");vatWrap.textContent="IVA %";const vat=d.createElement("select");for(const n of [0,4,5,10,22]){const o=d.createElement("option");o.value=String(n);o.textContent=n+"%";if(n===22)o.selected=true;vat.append(o)}vatWrap.append(vat);form.append(vatWrap);
 const refNum=field("TD04: numero documento originario","text",""),refDate=field("TD04: data documento originario","date","");
 function toggleRef(){refNum.parentElement.hidden=refDate.parentElement.hidden=type.value!=="TD04";refNum.required=refDate.required=type.value==="TD04"}type.addEventListener("change",toggleRef);toggleRef();
 const add=d.createElement("button");add.type="submit";add.textContent="Aggiungi documento TEST";form.append(add);
 const actions=d.createElement("div");actions.className="actions";const download=d.createElement("button");download.type="button";download.textContent="Esporta JSON TEST";const reset=d.createElement("button");reset.type="button";reset.className="secondary";reset.textContent="Svuota sessione TEST";actions.append(download,reset);
 const status=d.createElement("p");status.setAttribute("role","status");const output=d.createElement("div");host.append(heading,note,form,actions,status,output);parent.append(host);
 let store=A.createStore();root.ITE_FiscalWorkspaceBridge185=Object.freeze({snapshot:()=>JSON.parse(JSON.stringify(store)),addPrepared:prepared=>{const bridge=root.ITE_QuoteFiscalBridge185;if(!bridge)throw Error("BRIDGE_NON_DISPONIBILE");const result=bridge.insert(store,prepared);render();return result}});const eur=c=>(c/100).toLocaleString("it-IT",{style:"currency",currency:"EUR"});
 function render(){output.replaceChildren();const s=A.summary(store);const total=d.createElement("p");total.textContent="Documenti TEST: "+s.count+" · "+Object.entries(s.byType).map(([k,v])=>k+": "+v.count+" ("+eur(v.totalCents)+")").join(" · ");output.append(total);
 for(const doc of store.documents){const item=d.createElement("div");item.className="item";const line=d.createElement("strong");line.textContent=doc.type+" · "+doc.number+" · "+doc.date+" · "+doc.status;const details=d.createElement("small");details.textContent=doc.counterparty+" · "+eur(doc.totals.totalCents);item.append(line,details);
 if(doc.status==="BOZZA"){for(const [label,next] of [["Registra TEST","REGISTRATO"],["Annulla TEST","ANNULLATO"]]){const b=d.createElement("button");b.type="button";b.textContent=label;b.addEventListener("click",()=>{try{A.transition(store,doc.id,next);render()}catch(e){status.textContent=e.message}});item.append(b)}}output.append(item)}
 download.disabled=!s.count||s.issues.length>0;status.textContent=s.issues.length?"Anomalie: "+s.issues.join(", "):"Registro TEST coerente."}
 form.addEventListener("submit",e=>{e.preventDefault();try{const doc={id:"test_"+String(store.documents.length+1),type:type.value,number:number.value.trim(),date:date.value,counterparty:party.value.trim(),lines:[{description:desc.value.trim(),quantity:Number(qty.value),unitPrice:Number(price.value),vatRate:Number(vat.value)}]};if(doc.type==="TD04")doc.reference={number:refNum.value.trim(),date:refDate.value};A.add(store,doc);render();number.value="TEST-"+String(store.documents.length+1).padStart(3,"0")}catch(err){status.textContent="Documento non inserito: "+err.message}});
 download.addEventListener("click",()=>{try{const url=URL.createObjectURL(new Blob([A.exportTest(store)],{type:"application/json"}));const a=d.createElement("a");a.href=url;a.download="ITE-4.0.184-FISCALE-TEST.json";host.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}catch(e){status.textContent=e.message}});
 reset.addEventListener("click",()=>{if(!root.confirm("Eliminare tutti i documenti fittizi della sessione?"))return;store=A.createStore();render()});render();
}
if(root.document){if(root.document.readyState==="loading")root.document.addEventListener("DOMContentLoaded",init,{once:true});else init()}
})(typeof globalThis!=="undefined"?globalThis:this);
