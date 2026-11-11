/* I.T.E. 4.0.165 — unified invoice section: reviewed TEST metadata batch. */
(function(root){"use strict";let attempts=0;
function mount(){
 const S=root.ITE_UnifiedSession129,B=root.ITE_DocumentBatch165,host=document.getElementById("ite-invoices-151");
 if(!S||!B||!host){if(++attempts<80)setTimeout(mount,150);return;}
 if(document.getElementById("ite-document-batch-165"))return;
 const el=(tag,txt)=>{const x=document.createElement(tag);if(txt!==undefined)x.textContent=txt;return x;};
 const label=(title,input)=>{const x=el("label",title);x.append(input);return x;};
 const section=el("section");section.id="ite-document-batch-165";section.className="panel";
 section.append(el("h2","Registrazione multipla documenti — TEST 4.0.165"),
 el("p","Metadati fittizi, verificati manualmente. Nessun PDF acquisito, nessuna fattura emessa. Tutto il lotto viene respinto se una riga non è valida."));
 const actor=el("input");actor.value="Operatore TEST";
 const vat=el("input");vat.value="03857941201";
 section.append(label("Operatore",actor),label("Partita IVA aziendale per classificazione",vat));
 const rows=el("div"),actions=el("div"),add=el("button","Aggiungi documento"),preview=el("button","Verifica lotto"),commit=el("button","Registra lotto TEST"),status=el("p"),summary=el("div");
 actions.className="actions";status.setAttribute("role","status");commit.disabled=true;
 for(const b of [add,preview,commit]){b.type="button";actions.append(b);}
 section.append(rows,actions,summary,status);let plan=null;
 const specs=[["number","Numero","text"],["date","Data","date"],["issuerVat","P.IVA emittente","text"],["net","Imponibile","number"],["vat","IVA","number"],["total","Totale","number"]];
 function invalidate(){plan=null;commit.disabled=true;summary.replaceChildren();}
 function addRow(){
  invalidate();const card=el("fieldset"),legend=el("legend","Documento TEST"),grid=el("div"),fields={};grid.className="grid";card.append(legend);
  for(const [key,title,type] of specs){const inp=el("input");inp.type=type;inp.placeholder=title;if(type==="number"){inp.min="0";inp.step="0.01";}fields[key]=inp;grid.append(label(title,inp));inp.addEventListener("input",invalidate);}
  const type=el("select");for(const t of ["FATTURA","PROFORMA","TD04"]){const o=el("option",t);o.value=t;type.append(o);}
  type.addEventListener("change",invalidate);grid.append(label("Tipologia",type));
  const confirmed=el("input");confirmed.type="checkbox";confirmed.style.width="auto";confirmed.addEventListener("change",invalidate);
  const remove=el("button","Rimuovi riga");remove.type="button";remove.className="secondary";remove.onclick=()=>{card.remove();invalidate();};
  card.append(grid,label("Confermo verifica manuale dei dati TEST",confirmed),remove);rows.append(card);
  card.read=()=>({number:fields.number.value,date:fields.date.value,issuerVat:fields.issuerVat.value,
   net:Number(fields.net.value),vat:Number(fields.vat.value),total:Number(fields.total.value),
   type:type.value,confirmed:confirmed.checked});
 }
 add.onclick=addRow;
 const read=()=>[...rows.querySelectorAll("fieldset")].map(x=>x.read());
 preview.onclick=()=>{try{plan=B.preview(S.get(),read(),vat.value);commit.disabled=false;summary.textContent="Lotto valido: "+plan.counts.total+" documenti, "+plan.counts.proforma+" proforma, "+plan.counts.credit+" TD04. Revisione "+plan.revision;status.textContent="Anteprima pronta: verificare prima di registrare.";}catch(e){invalidate();status.textContent="Verifica respinta: "+e.message;}};
 commit.onclick=()=>{try{if(!plan)throw Error("ANTEPRIMA_OBBLIGATORIA");const out=B.commit(S.get(),plan,actor.value,vat.value,plan.revision);S.restore(out.state,actor.value);invalidate();rows.replaceChildren();addRow();status.textContent="Registrati "+out.imported+" documenti TEST nel registro fatture condiviso.";}catch(e){invalidate();status.textContent="Registrazione respinta: "+e.message;}};
 S.subscribe(()=>{if(plan)invalidate();});
 vat.addEventListener("input",invalidate);
 addRow();host.append(section);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})(window);
