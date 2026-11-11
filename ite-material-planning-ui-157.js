/* I.T.E. 4.0.157 — integrazione pianificazione righe FORNITURA nel magazzino TEST. */
(function(root){"use strict";
let attempts=0;
function mount(){
const S=root.ITE_UnifiedSession129,P=root.ITE_MaterialPlanning156,I=root.ITE_Inventory154;
if(!S||!P||!I){if(++attempts<60)setTimeout(mount,150);return;}
if(document.getElementById("ite-material-planning-157"))return;
const node=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
const panel=node("section");panel.id="ite-material-planning-157";panel.className="panel";
panel.append(node("h2","Pianificazione materiali per righe FORNITURA — TEST 4.0.157"),node("p","Collega le singole righe di fornitura agli articoli, verifica la disponibilità complessiva e prenota un lotto atomico. Le righe POSA non movimentano materiali."));
const controls=node("div");controls.className="grid";
function control(label,tag="select"){const l=node("label",label),e=node(tag);l.append(e);controls.append(l);return e;}
const estimate=control("Preventivo accettato"),actor=control("Operatore TEST","input"),batch=control("ID lotto TEST","input");
actor.value="Operatore TEST";batch.placeholder="LOTTO-TEST-001";
panel.append(controls);
const rows=node("div"),summary=node("div"),status=node("p");status.setAttribute("role","status");
const actions=node("div");actions.className="actions";
const check=node("button","Verifica disponibilità"),reserve=node("button","Prenota tutte le righe"),audit=node("button","Controlla anomalie");
for(const b of [check,reserve,audit]){b.type="button";actions.append(b);}
panel.append(node("h3","Righe di fornitura"),rows,actions,summary,status);
const selects=new Map(),quantities=new Map();
const option=(select,value,label)=>{const o=node("option",label);o.value=value;select.append(o);};
function renderLines(){
rows.replaceChildren();selects.clear();quantities.clear();
const s=S.get(),e=s.commercial?.estimates?.find(x=>x.id===estimate.value),items=I.overview(s).items;
if(!e){rows.append(node("p","Seleziona un preventivo accettato."));return;}
for(const line of e.lines||[]){if(line.kind!=="FORNITURA")continue;
const box=node("fieldset"),legend=node("legend",line.description+" — massimo "+line.quantity),label=node("label","Articolo magazzino"),select=node("select");
for(const item of items)option(select,item.id,item.code+" — "+item.description+" (disponibili "+item.available+")");
label.append(select);const qlabel=node("label","Quantità da prenotare"),qty=node("input");qty.type="number";qty.min="0.001";qty.step="0.001";qty.value=String(line.quantity);qlabel.append(qty);
box.append(legend,label,qlabel);rows.append(box);selects.set(line.id,select);quantities.set(line.id,qty);}
if(!selects.size)rows.append(node("p","Nessuna riga FORNITURA presente."));
}
function mappings(){return [...selects].map(([lineId,select])=>({lineId,itemId:select.value,quantity:Number(quantities.get(lineId).value)}));}
function showPlan(){const p=P.plan(S.get(),estimate.value,mappings());summary.replaceChildren();
summary.append(node("p","Righe: "+p.rows.length+" · Revisione: "+p.revision+" · Prenotabile: "+(p.canReserve?"SÌ":"NO")));
for(const r of p.rows)summary.append(node("p",r.code+" — "+r.description+" · "+r.quantity));
for(const s of p.shortages)summary.append(node("p","Mancano "+s.missing+" unità di "+s.code));
return p;}
check.onclick=()=>{try{showPlan();status.textContent="Verifica completata.";}catch(e){status.textContent="Verifica respinta: "+e.message;}};
reserve.onclick=()=>{try{const s=S.get(),p=showPlan();if(!p.canReserve)throw Error("DISPONIBILITA_INSUFFICIENTE");const next=P.reserveAll(s,estimate.value,mappings(),actor.value.trim(),s.revision,batch.value.trim());S.restore(next,actor.value.trim());status.textContent="Lotto TEST prenotato; revisione "+next.revision;}catch(e){status.textContent="Prenotazione respinta: "+e.message;}};
audit.onclick=()=>{try{const a=P.audit(S.get());summary.replaceChildren();summary.append(node("p","Anomalie: "+a.problems.length));for(const p of a.problems)summary.append(node("p",p.code+" — "+p.id));}catch(e){status.textContent="Audit respinto: "+e.message;}};
function refresh(){const old=estimate.value;estimate.replaceChildren();for(const e of S.get().commercial?.estimates||[])if(e.status==="ACCETTATO")option(estimate,e.id,e.id);if([...estimate.options].some(x=>x.value===old))estimate.value=old;renderLines();}
estimate.onchange=renderLines;S.subscribe(refresh);
(document.getElementById("ite-inventory-155")||document.querySelector("main")||document.body).append(panel);refresh();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})(window);
