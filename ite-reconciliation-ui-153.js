/* I.T.E. 4.0.153 — TEST-only integrated reconciliation console. */
(function(root){"use strict";let retries=0;
function mount(){
 const S=root.ITE_UnifiedSession129,R=root.ITE_Reconciliation152;
 if(!S||!R){if(++retries<80)setTimeout(mount,100);return;}
 if(document.getElementById("ite-reconciliation-153"))return;
 const el=(tag,txt)=>{const n=document.createElement(tag);if(txt!==undefined)n.textContent=txt;return n;};
 const panel=el("section");panel.id="ite-reconciliation-153";panel.className="panel";
 panel.append(el("h2","Riconciliazione preventivi / fatture / Extra — TEST 4.0.153"),el("p","Attribuzioni solo nella sessione TEST condivisa. Le proforma non sono contabilizzabili; le TD04 riducono il fatturato attribuito. Nessun documento fiscale viene emesso."));
 const grid=el("div");grid.className="grid";
 const estimate=el("select"),invoice=el("select"),amount=el("input"),actor=el("input"),id=el("input");
 amount.type="number";amount.min="0.01";amount.step="0.01";amount.placeholder="Importo da attribuire (€)";
 actor.value="Operatore TEST";id.placeholder="AL-TEST-001";
 for(const [name,input] of [["Preventivo accettato",estimate],["Fattura di vendita / TD04",invoice],["Importo €",amount],["Identificativo attribuzione",id],["Operatore",actor]]){const label=el("label",name);label.append(input);grid.append(label);}
 const save=el("button","Attribuisci importo TEST"),status=el("p"),overview=el("div"),coverage=el("div");
 save.type="button";status.setAttribute("role","status");panel.append(grid,save,status,el("h3","Situazione economica"),overview,el("h3","Copertura voci Extra approvate"),coverage);
 const option=(select,value,label)=>{const o=el("option",label);o.value=value;select.append(o);};
 function refresh(){
  const st=S.get(),c=st.commercial||{},oldQ=estimate.value,oldI=invoice.value;
  estimate.replaceChildren();invoice.replaceChildren();
  for(const q of c.estimates||[])if(q.status==="ACCETTATO")option(estimate,q.id,q.id+" · € "+Number(q.totals?.gross||0).toFixed(2));
  for(const d of c.invoices||[])if(d.direction==="VENDITA"&&d.kind!=="PROFORMA")option(invoice,d.id,d.number+" · "+d.kind+" · € "+Number(d.gross||0).toFixed(2));
  if([...estimate.options].some(x=>x.value===oldQ))estimate.value=oldQ;
  if([...invoice.options].some(x=>x.value===oldI))invoice.value=oldI;
  overview.replaceChildren();coverage.replaceChildren();
  try{
   const r=R.reconcile(st),x=R.extraCoverage(st);
   for(const q of r.estimates){const item=el("p",q.id+" · "+q.status+" · Totale € "+Number(q.total).toFixed(2)+" · Attribuito netto € "+q.netInvoiced.toFixed(2)+" · Residuo € "+q.remaining.toFixed(2));overview.append(item);}
   for(const d of r.invoices)overview.append(el("p",d.id+" · "+d.kind+" · Attribuito € "+d.allocated.toFixed(2)+" · Non attribuito € "+d.unallocated.toFixed(2)));
   for(const e of x.rows)coverage.append(el("p",e.id+" · Voci approvate "+e.approved+" · In preventivo "+e.quoted+" · Mancanti "+e.unquoted.join(", ")));
   for(const err of [...r.errors,...x.errors])coverage.append(el("p","Anomalia "+err.code+" · "+err.id));
   if(!r.estimates.length&&!r.invoices.length)overview.append(el("p","Nessun preventivo o documento nella sessione TEST."));
   if(!x.rows.length)coverage.append(el("p","Nessun Extra presente."));
  }catch(e){status.textContent="Controllo: "+e.message;}
 }
 save.onclick=()=>{try{
  const st=S.get(),next=R.allocate(st,{id:id.value.trim(),estimateId:estimate.value,invoiceId:invoice.value,amount:Number(amount.value)},actor.value.trim(),st.revision);
  S.restore(next,actor.value.trim());status.textContent="Attribuzione TEST registrata. Revisione "+next.revision;amount.value="";
 }catch(e){status.textContent="Attribuzione respinta: "+e.message;}};
 S.subscribe(refresh);(document.getElementById("ite-invoices-151")||document.getElementById("ite-commercial-150")||document.querySelector("main")||document.body).append(panel);refresh();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})(window);
