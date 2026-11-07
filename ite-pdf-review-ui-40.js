/* I.T.E. 4.0.72 — integrated local PDF review queue, no upload or storage. */
(function(root){"use strict";if(typeof document==="undefined")return;
const P=root.ITEPdfPreflight40,R=root.ITEPdfReview40;if(!P||!R)return;
const make=(tag,parent,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;parent.appendChild(e);return e;};
function mount(){const host=document.getElementById("importazioni")||document.querySelector(".wrap");if(!host||document.getElementById("ite-pdf-review-40"))return;
const section=make("section",host);section.id="ite-pdf-review-40";section.className="panel";
make("h2",section,"Revisione PDF locale — TEST 4.0.72");
make("p",section,"Controllo e classificazione manuale prima di qualsiasi registrazione. I PDF restano sul dispositivo; non vengono salvati né inviati. Il riepilogo non contiene nomi dei file.").className="hint";
const input=make("input",section);input.type="file";input.accept=".pdf,application/pdf";input.multiple=true;input.setAttribute("aria-label","PDF da revisionare");
const appointment=make("input",section);appointment.placeholder="Appuntamento sintetico TEST-APP-1";appointment.setAttribute("aria-label","ID appuntamento TEST");
const status=make("p",section);status.setAttribute("role","status");const results=make("div",section);const out=make("pre",section);out.style.cssText="white-space:pre-wrap;overflow-wrap:anywhere";
const controls=make("div",section);controls.className="actions";const items=[];let token=0;
const render=()=>{results.replaceChildren();const s=R.summary(items.map(x=>x.record));make("p",results,s.total+" PDF · "+s.approved+" approvati · "+s.pending+" da revisionare · "+s.rejected+" respinti");
items.forEach((item,i)=>{const line=make("div",results);line.className="item";make("strong",line,"PDF "+(i+1)+" — "+item.name);
const sel=make("select",line);sel.setAttribute("aria-label","Tipologia PDF "+(i+1));R.allowed.forEach(k=>{const o=make("option",sel,k);o.value=k;});sel.value=item.record.kind;
const choice=make("select",line);choice.setAttribute("aria-label","Esito PDF "+(i+1));["pending","approved","rejected"].forEach(k=>{const o=make("option",choice,k);o.value=k;});choice.value=item.record.status;
const warning=make("p",line,item.record.warnings.join("; "));warning.className="hint";
const apply=()=>{try{item.record=R.decide(item.record,sel.value,choice.value);status.textContent="Revisione aggiornata";render();}catch(e){status.textContent=e.message;sel.value=item.record.kind;choice.value=item.record.status;}};
sel.addEventListener("change",apply);choice.addEventListener("change",apply);
});};
const button=(label,fn)=>{const b=make("button",controls,label);b.type="button";b.addEventListener("click",fn);};
button("Genera riepilogo TEST",()=>{try{out.textContent=JSON.stringify(R.manifest(items.map(x=>x.record),appointment.value.trim()),null,2);status.textContent="Riepilogo locale pronto: nessun archivio modificato";}catch(e){status.textContent=e.message;}});
button("Cancella sessione",()=>{token++;items.length=0;input.value="";out.textContent="";render();status.textContent="Sessione cancellata";});
input.addEventListener("change",async()=>{const current=++token;items.length=0;out.textContent="";const files=Array.from(input.files||[]);if(files.length>P.MAX_FILES){status.textContent="Massimo 30 PDF";return;}status.textContent="Verifica locale in corso";
for(const f of files){if(current!==token)return;try{if(f.size>P.MAX)throw Error("PDF superiore a 25 MB");const result=P.inspect(f.name,new Uint8Array(await f.arrayBuffer()));if(current!==token)return;items.push({name:f.name,record:R.create(result)});}catch(e){items.push({name:f.name,record:R.create({kind:"DA_VERIFICARE",hasEof:false,warnings:[e.message]})});}}
render();status.textContent="Verifica terminata: classificare e confermare ogni documento";});render();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount();
})(typeof window!=="undefined"?window:globalThis);