/* I.T.E. 4.0.55 — preventivi/Extra integrated TEST panel. */
(function(){"use strict";if(typeof document==="undefined"||!globalThis.ITEQuotes40)return;
const api=globalThis.ITEQuotes40,KEY="ITE-4-QUOTES-TEST-1",el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);return n;};
const section=el("section");section.className="panel";section.id="ite-quotes-test";
section.append(el("h2","Preventivi e voci Extra — TEST 4.0.55"),el("p","Fornitura e posa separate; Extra approvati solo dopo accettazione del preventivo. Dati fittizi salvati esclusivamente in questo browser."));
const form=el("div");form.className="grid";
function field(label,value){const l=el("label",label),i=el("input");i.value=value||"";l.append(i);form.append(l);return i;}
const customer=field("Cliente TEST","Cliente dimostrativo"),date=field("Data","2026-11-07"),quoteId=field("ID preventivo","TEST-Q-DEMO");
const add=el("button","Crea preventivo TEST");add.type="button";form.append(add);
const picker=el("select"),actions=el("div");actions.className="actions";
const send=el("button","Invia"),accept=el("button","Accetta"),reject=el("button","Rifiuta");
for(const b of [send,accept,reject]){b.type="button";actions.append(b);}
const lines=el("div");lines.className="grid";
const lineId=fieldLocal("ID voce","TEST-L-001"),description=fieldLocal("Descrizione","Fornitura rubinetto"),kind=fieldSelect("Tipo",[["SUPPLY","Fornitura"],["INSTALLATION","Posa"],["REMOVAL","Smontaggio"],["DISPOSAL","Smaltimento"],["OTHER","Altro"]]),quantity=fieldLocal("Quantità","1"),price=fieldLocal("Prezzo unitario","100"),vat=fieldSelect("IVA",[["10","10%"],["22","22%"],["0","0%"],["4","4%"],["5","5%"]]);
function fieldLocal(label,value){const l=el("label",label),i=el("input");i.value=value;l.append(i);lines.append(l);return i;}
function fieldSelect(label,options){const l=el("label",label),s=el("select");for(const [v,t] of options){const o=el("option",t);o.value=v;s.append(o);}l.append(s);lines.append(l);return s;}
const extra=el("input");extra.type="checkbox";extra.style.width="auto";const extraLabel=el("label"," Voce Extra (solo preventivo accettato)");extraLabel.prepend(extra);lines.append(extraLabel);
const addLine=el("button","Aggiungi voce"),status=el("p"),output=el("div");addLine.type="button";lines.append(addLine);status.setAttribute("role","status");
section.append(form,picker,actions,lines,status,output);
function load(){const raw=localStorage.getItem(KEY);return raw?api.importJson(raw):api.empty();}
function save(db){localStorage.setItem(KEY,api.exportJson(db));render();}
function selected(){return picker.value;}
function act(fn){try{const result=fn();if(result)save(result);else render();status.textContent="Operazione TEST completata.";}catch(e){status.textContent=e.message;}}
function render(){const db=load(),old=picker.value;picker.replaceChildren();for(const q of db.quotes){const o=el("option",q.id+" · "+q.customer+" · "+q.status);o.value=q.id;picker.append(o);}if(db.quotes.some(q=>q.id===old))picker.value=old;output.replaceChildren();const q=db.quotes.find(x=>x.id===picker.value);if(!q)return;const s=api.summarize(db,q.id);output.append(el("h3",q.id+" · "+q.status),el("p","Base € "+s.base.total.toFixed(2)+" · Extra approvati € "+s.approvedExtras.total.toFixed(2)+" · Extra in attesa € "+s.pendingExtras.total.toFixed(2)+" · Totale contratto € "+s.contractTotal.toFixed(2)));for(const l of q.lines.concat(q.extras)){const item=el("div");item.className="item";item.append(el("p",l.kind+" · "+l.description+" · "+l.category+" · € "+l.total.toFixed(2)+(l.approval?" · "+l.approval:"")));if(l.approval==="PENDING"){for(const [decision,label] of [["APPROVED","Approva Extra"],["REJECTED","Rifiuta Extra"]]){const b=el("button",label);b.type="button";b.addEventListener("click",()=>act(()=>api.approveExtra(load(),q.id,l.id,decision)));item.append(b);}}output.append(item);}}
add.addEventListener("click",()=>act(()=>api.create(load(),{id:quoteId.value,customer:customer.value,date:date.value})));
picker.addEventListener("change",render);
for(const [b,state] of [[send,"SENT"],[accept,"ACCEPTED"],[reject,"REJECTED"]])b.addEventListener("click",()=>act(()=>api.setStatus(load(),selected(),state)));
addLine.addEventListener("click",()=>act(()=>api.addLine(load(),selected(),{id:lineId.value,description:description.value,kind:kind.value,quantity:Number(quantity.value),unitPrice:Number(price.value),vat:Number(vat.value)},extra.checked)));
(document.querySelector("#ite-invoices-test")||document.querySelector("main .wrap")||document.body).append(section);try{render();}catch(e){status.textContent="Archivio TEST da verificare: "+e.message;}
})();