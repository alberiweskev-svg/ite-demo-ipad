/* I.T.E. 4.0.163 — Procurement UI: shared TEST session, no server upload. */
(function(root){"use strict";
let attempts=0;
function mount(){
 const S=root.ITE_UnifiedSession129,P=root.ITE_Procurement162,I=root.ITE_Inventory154;
 const host=document.getElementById("ite-inventory-155");
 if(!S||!P||!I||!host){if(++attempts<80)setTimeout(mount,150);return;}
 if(document.getElementById("ite-procurement-163"))return;
 const el=(tag,value)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=value;return n;};
 const section=el("section");section.id="ite-procurement-163";section.className="panel";
 section.append(el("h2","Approvvigionamenti e ricevimento materiali — TEST 4.0.163"),
 el("p","Piano da preventivi accettati, controllo disponibilità, ricevimento da bolla e verifica coerenza. Solo dati fittizi."));
 const operator=el("input");operator.value="Operatore TEST";
 const reference=el("input");reference.placeholder="BOLLA-TEST-163-001";
 const selector=el("div"),preview=el("button","Calcola fabbisogni"),receive=el("button","Registra ricevimento TEST"),audit=el("button","Controlla archivio");
 for(const b of [preview,receive,audit])b.type="button";
 receive.disabled=true;
 const label=(t,n)=>{const l=el("label",t);l.append(n);return l;};
 section.append(label("Operatore",operator),label("Riferimento bolla univoco",reference),el("h3","Preventivi accettati"),selector);
 const actions=el("div");actions.className="actions";actions.append(preview,receive,audit);section.append(actions);
 const result=el("div"),status=el("p");status.setAttribute("role","status");section.append(result,status);
 let plan=null,inputs=new Map();
 function invalidate(){plan=null;receive.disabled=true;inputs=new Map();result.replaceChildren();}
 function renderEstimates(){
  const previous=new Set([...selector.querySelectorAll("input:checked")].map(x=>x.value));selector.replaceChildren();
  for(const e of S.get().commercial?.estimates||[]){if(e.status!=="ACCETTATO")continue;
   const cb=el("input");cb.type="checkbox";cb.value=e.id;cb.checked=previous.has(e.id);cb.style.width="auto";cb.addEventListener("change",invalidate);
   selector.append(label(" "+e.id+" — "+(e.siteId||"sede non indicata"),cb));}
 }
 function selected(){return [...selector.querySelectorAll("input:checked")].map(x=>x.value);}
 function build(){
  invalidate();const state=S.get();plan=P.requirements(state,selected());
  const table=el("table"),head=el("tr");
  for(const h of ["Codice","Articolo","Richiesti","Prenotati","Disponibili","Da ordinare","Da ricevere"])head.append(el("th",h));table.append(head);
  for(const r of plan.rows){const tr=el("tr");for(const x of [r.code,r.description,r.required,r.alreadyReserved,r.available,r.toOrder])tr.append(el("td",String(x)));
   const cell=el("td"),quantity=el("input");quantity.type="number";quantity.min="0";quantity.max=String(r.toOrder);quantity.step="0.001";quantity.value=String(r.toOrder);
   quantity.setAttribute("aria-label","Quantità da ricevere "+r.code);cell.append(quantity);tr.append(cell);table.append(tr);inputs.set(r.itemId,quantity);}
  result.append(table);
  if(plan.errors.length)result.append(el("p","Anomalie: "+plan.errors.map(e=>e.code).join(", ")));
  receive.disabled=!!plan.errors.length||!plan.rows.some(r=>r.toOrder>0);
  status.textContent="Piano TEST calcolato alla revisione "+plan.revision+". Quantità massime vincolate al fabbisogno.";
 }
 preview.onclick=()=>{try{build();}catch(e){invalidate();status.textContent="Piano respinto: "+e.message;}};
 receive.onclick=()=>{try{
  if(!plan||plan.revision!==S.get().revision)throw Error("ANTEPRIMA_SCADUTA");
  const lines=plan.rows.map(r=>({itemId:r.itemId,quantity:Number(inputs.get(r.itemId).value)})).filter(r=>r.quantity>0);
  if(!lines.length)throw Error("NESSUNA_QUANTITA");
  const out=P.receiveAgainstPlan(S.get(),plan,{reference:reference.value.trim(),lines},operator.value.trim(),plan.revision);
  S.restore(out.state,operator.value.trim());invalidate();status.textContent="Bolla TEST registrata. Residui da ordinare: "+out.remaining.rows.reduce((n,r)=>n+r.toOrder,0)+".";
 }catch(e){status.textContent="Ricevimento respinto: "+e.message;}};
 audit.onclick=()=>{try{const a=P.audit(S.get());status.textContent=a.ok?"Archivio TEST coerente alla revisione "+a.revision:"Anomalie: "+a.errors.map(e=>e.code+" "+(e.id||"")).join("; ");}catch(e){status.textContent="Verifica non riuscita: "+e.message;}};
 S.subscribe(()=>{invalidate();renderEstimates();});
 renderEstimates();host.append(section);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})(window);
