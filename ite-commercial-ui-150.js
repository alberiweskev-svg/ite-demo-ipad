/* I.T.E. 4.0.150 — integrated commercial TEST workbench. */
(function(root){"use strict";let attempts=0;
function mount(){
 const S=root.ITE_UnifiedSession129,M=root.ITE_Commercial149,E=root.ITE_Extra150;
 if(!S||!M||!E){if(++attempts<80)setTimeout(mount,100);return;}
 if(document.getElementById("ite-commercial-150"))return;
 const el=(tag,txt)=>{const n=document.createElement(tag);if(txt!==undefined)n.textContent=txt;return n;};
 const panel=el("section");panel.id="ite-commercial-150";panel.className="panel";
 panel.append(el("h2","Preventivi ed Extra — TEST 4.0.150"),el("p","Fornitura e posa separate. Approvazione per singola voce; preventivo generato solo dalle voci approvate. Sessione locale TEST, nessun documento fiscale emesso."));
 const controls=el("div");controls.className="grid";
 const client=el("select"),site=el("select"),appointment=el("select"),actor=el("input"),extraId=el("input"),description=el("input"),kind=el("select"),qty=el("input"),price=el("input"),vat=el("select");
 actor.value="Operatore TEST";extraId.placeholder="EX-TEST-001";description.placeholder="Descrizione voce";qty.type="number";qty.min="0.01";qty.step="0.01";qty.value="1";price.type="number";price.min="0";price.step="0.01";price.value="0";
 for(const x of ["FORNITURA","POSA","SMONTAGGIO","SMALTIMENTO","ALTRO"]){const o=el("option",x);o.value=x;kind.append(o);}
 for(const x of [0,4,5,10,22]){const o=el("option",x+"%");o.value=x;vat.append(o);}vat.value="10";
 for(const [name,input] of [["Cliente",client],["Sede",site],["Appuntamento (facoltativo)",appointment],["Operatore",actor],["ID Extra",extraId],["Descrizione voce",description],["Tipo voce",kind],["Quantità",qty],["Prezzo unitario €",price],["IVA",vat]]){const label=el("label",name);label.append(input);controls.append(label);}
 const add=el("button","Aggiungi voce"),save=el("button","Salva Extra TEST"),list=el("div"),existing=el("div"),feedback=el("p");add.type=save.type="button";feedback.setAttribute("role","status");
 const actions=el("div");actions.className="actions";actions.append(add,save);
 panel.append(controls,actions,list,el("h3","Extra presenti e approvazioni"),existing,feedback);
 let rows=[];
 const option=(select,id,label)=>{const o=el("option",label);o.value=id;select.append(o);};
 function choices(){
  const state=S.get(),c=state.field.catalog,oldClient=client.value,oldSite=site.value,oldApp=appointment.value;
  client.replaceChildren();for(const x of c.clients||[])option(client,x.id,x.name||x.id);
  if((c.clients||[]).some(x=>x.id===oldClient))client.value=oldClient;
  site.replaceChildren();for(const x of c.sites||[])if(x.clientId===client.value)option(site,x.id,x.name||x.id);
  if((c.sites||[]).some(x=>x.id===oldSite&&x.clientId===client.value))site.value=oldSite;
  appointment.replaceChildren();option(appointment,"","Nessuno");
  for(const x of c.appointments||[])if(x.clientId===client.value&&x.siteId===site.value)option(appointment,x.id,(x.startAt||"")+" · "+x.id);
  if((c.appointments||[]).some(x=>x.id===oldApp&&x.clientId===client.value&&x.siteId===site.value))appointment.value=oldApp;
 }
 function renderRows(){
  list.replaceChildren();
  if(!rows.length)list.append(el("p","Aggiungere una o più voci."));
  else {const t=M.totals(rows);list.append(el("p","Imponibile € "+t.net.toFixed(2)+" · IVA € "+t.vat.toFixed(2)+" · Totale € "+t.gross.toFixed(2)));
   rows.forEach((r,i)=>{const p=el("p",r.kind+" · "+r.description+" · € "+r.unitPrice.toFixed(2));const b=el("button","Rimuovi");b.type="button";b.className="secondary";b.onclick=()=>{rows.splice(i,1);renderRows();};p.append(b);list.append(p);});}
 }
 function renderExisting(){
  existing.replaceChildren();const state=S.get();
  for(const x of state.commercial?.extras||[]){
   const box=el("div");box.className="item";box.append(el("strong",x.id+" · "+x.status));
   const selected=new Set(x.approvedLineIds||[]),checks=[];
   for(const r of x.lines||[]){const l=el("label"),cb=el("input");cb.type="checkbox";cb.style.width="auto";cb.checked=selected.has(r.id);checks.push([r.id,cb]);l.append(cb,document.createTextNode(" "+r.kind+" · "+r.description+" · € "+r.unitPrice));box.append(l);}
   const approve=el("button","Registra approvazione"),quote=el("button","Crea preventivo da approvati");approve.type=quote.type="button";
   approve.onclick=()=>{try{const st=S.get(),next=E.approve(st,x.id,checks.filter(v=>v[1].checked).map(v=>v[0]),actor.value,st.revision);S.restore(next,actor.value);feedback.textContent="Approvazione registrata nella sessione TEST.";}catch(err){feedback.textContent=err.message;}};
   quote.onclick=()=>{try{const st=S.get(),id="PREV-"+x.id;if(st.commercial.estimates.some(y=>y.id===id))throw Error("PREVENTIVO_GIA_PRESENTE");const next=E.quoteFromApproved(st,[x.id],id,actor.value,st.revision);S.restore(next,actor.value);feedback.textContent="Preventivo "+id+" creato nella sessione TEST.";}catch(err){feedback.textContent=err.message;}};
   box.append(approve,quote);existing.append(box);
  }
  if(!existing.children.length)existing.append(el("p","Nessun Extra nella sessione TEST."));
 }
 client.onchange=()=>{site.value="";choices();};site.onchange=choices;
 add.onclick=()=>{try{const r={id:"L"+(rows.length+1),kind:kind.value,description:description.value.trim(),quantity:Number(qty.value),unitPrice:Number(price.value),vatRate:Number(vat.value)};M.normalizeLines([...rows,r]);rows.push(r);description.value="";renderRows();feedback.textContent="Voce aggiunta.";}catch(err){feedback.textContent=err.message;}};
 save.onclick=()=>{try{const st=S.get(),id=extraId.value.trim();if(st.commercial.extras.some(x=>x.id===id))throw Error("EXTRA_GIA_PRESENTE");const next=E.saveExtra(st,{id,clientId:client.value,siteId:site.value,appointmentId:appointment.value,lines:rows,status:"DA_APPROVARE",approvedLineIds:[]},actor.value,st.revision);S.restore(next,actor.value);rows=[];renderRows();feedback.textContent="Extra salvato nella sessione TEST.";}catch(err){feedback.textContent=err.message;}};
 S.subscribe(()=>{choices();renderExisting();});(document.querySelector("main")||document.body).append(panel);choices();renderRows();renderExisting();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})(window);
