/* I.T.E. 4.0.174 — Extra and quotes in the same TEST workspace; no persistence. */
(function(root){"use strict";
function init(){
 const E=root.ITE_InterventionExtras173,B=root.ITE_FieldWorkspaceBridge174,d=root.document;
 if(!E||!B||!d)return;
 const parent=d.getElementById("ite-field-workspace-172");if(!parent)return;
 const host=d.createElement("div");host.className="panel";host.id="ite-extras-workspace-174";parent.append(host);
 let s=E.empty(),seq=0;
 const el=(tag,txt)=>{const x=d.createElement(tag);if(txt!==undefined)x.textContent=txt;return x};
 const title=el("h3","Extra e preventivi — TEST 4.0.174"),note=el("p","Collegati agli interventi della stessa sessione. FORNITURA, POSA, SMONTAGGIO e SMALTIMENTO sono voci distinte. Nessun dato viene salvato.");note.className="hint";
 const status=el("p");status.setAttribute("role","status");
 const actions=el("div");actions.className="actions";const body=el("div");host.append(title,note,status,actions,body);
 function button(text,fn,into=actions){const b=el("button",text);b.type="button";b.addEventListener("click",fn);into.append(b);return b}
 function transact(fn){try{s=fn().state;status.textContent="Operazione TEST registrata — revisione "+s.revision;render()}catch(e){status.textContent="Operazione respinta: "+e.message}}
 function field(){return B.snapshot()}
 function form(label,defs,callback){body.replaceChildren(el("h4",label));const f=el("form");f.className="grid";const inputs={};
 defs.forEach(([key,name,opts,type])=>{const wrap=el("label",name);let x;if(opts){x=el("select");opts.forEach(([value,text])=>{const o=el("option",text);o.value=value;x.append(o)})}else{x=el("input");x.type=type||"text";x.maxLength=500}x.required=true;wrap.append(x);f.append(wrap);inputs[key]=x});
 const submit=el("button","Registra TEST");submit.type="submit";f.append(submit);f.addEventListener("submit",ev=>{ev.preventDefault();const values={};Object.keys(inputs).forEach(k=>values[k]=inputs[k].value);callback(values)});body.append(f)}
 function add(){const interventions=field().interventions;if(!interventions.length){status.textContent="Creare prima un appuntamento e registrare l'arrivo nella sezione Interventi.";return}
 form("Nuovo lavoro Extra",[
 ["interventionId","Intervento",interventions.map(i=>[i.id,i.id+" — "+i.status])],
 ["kind","Categoria",[["FORNITURA","FORNITURA"],["POSA","POSA"],["SMONTAGGIO","SMONTAGGIO"],["SMALTIMENTO","SMALTIMENTO"],["ALTRO","ALTRO"]]],
 ["description","Descrizione al cliente"],["quantity","Quantità",null,"number"],["unitPrice","Prezzo unitario €",null,"number"]
 ],v=>transact(()=>E.addExtra(s,s.revision,"OPERATORE_TEST",field(),{id:"EXT-"+(++seq),...v,quantity:Number(v.quantity),unitPrice:Number(v.unitPrice)})));
 const nums=body.querySelectorAll('input[type="number"]');nums.forEach((x,i)=>{x.min=i===0?"0.001":"0";x.step=i===0?"any":"0.01"})}
 function quote(){const accepted=s.extras.filter(x=>x.status==="ACCETTATO");if(!accepted.length){status.textContent="Occorre approvare almeno un Extra.";return}
 const ids=[...new Set(accepted.map(x=>x.interventionId))];form("Nuovo preventivo",[
 ["interventionId","Intervento",ids.map(id=>[id,id])],["paymentTerms","Condizioni di pagamento"]
 ],v=>{const chosen=accepted.filter(x=>x.interventionId===v.interventionId&&!s.quotes.some(q=>q.status!=="ANNULLATO"&&q.extraIds.includes(x.id)));if(!chosen.length){status.textContent="Nessuna voce disponibile.";return}transact(()=>E.makeQuote(s,s.revision,"OPERATORE_TEST",field(),{id:"PREV-"+(++seq),interventionId:v.interventionId,extraIds:chosen.map(x=>x.id),paymentTerms:v.paymentTerms}))})}
 function render(){actions.replaceChildren();button("Riepilogo Extra",list);button("+ Extra",add);button("+ Preventivo",quote);list()}
 function list(){body.replaceChildren();const interventions=new Set(field().interventions.map(i=>i.id));
 s.extras.forEach(x=>{const item=el("div");item.className="item";item.append(el("strong",x.kind+" — "+x.description),el("p",x.interventionId+" · "+x.quantity+" × € "+x.unitPrice.toFixed(2)+" · "+x.status));if(x.status==="PROPOSTO"){button("Approva",()=>transact(()=>E.decide(s,s.revision,"OPERATORE_TEST",x.id,"ACCETTATO")),item);button("Rifiuta",()=>transact(()=>E.decide(s,s.revision,"OPERATORE_TEST",x.id,"RIFIUTATO")),item)}if(!interventions.has(x.interventionId))item.append(el("p","Attenzione: intervento non più presente"));body.append(item)});
 s.quotes.forEach(q=>{const item=el("div");item.className="item";item.append(el("strong",q.id+" · "+q.status),el("p",q.interventionId+" · € "+(q.totalCents/100).toFixed(2)+" · "+q.lines.length+" voci"),el("p","Pagamento: "+q.paymentTerms));if(q.status==="DA_ACCETTARE"){button("Accetta preventivo",()=>transact(()=>E.setQuoteStatus(s,s.revision,"OPERATORE_TEST",q.id,"ACCETTATO")),item);button("Non accettato",()=>transact(()=>E.setQuoteStatus(s,s.revision,"OPERATORE_TEST",q.id,"NON_ACCETTATO")),item)}body.append(item)});
 if(!s.extras.length&&!s.quotes.length)body.append(el("p","Nessun Extra o preventivo nella sessione TEST."))}
 B.subscribe(()=>{if(!body.querySelector("form"))list()});render();
}
if(root.document){if(root.document.readyState==="loading")root.document.addEventListener("DOMContentLoaded",init,{once:true});else init()}
})(typeof globalThis!=="undefined"?globalThis:this);
