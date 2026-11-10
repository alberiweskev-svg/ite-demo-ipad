/* I.T.E. 4.0.135 — shared-session commercial review, read-only, iPad touch. */
(function(){"use strict";
function mount(){
 if(document.getElementById("ite-commercial-review-135")||!window.ITE_UnifiedSession129||!window.ITE_CommercialReview135)return;
 const session=window.ITE_UnifiedSession129,R=window.ITE_CommercialReview135;
 const el=(tag,value)=>{const e=document.createElement(tag);if(value!==undefined)e.textContent=value;return e;};
 const panel=el("section");panel.id="ite-commercial-review-135";panel.className="panel";
 panel.append(el("h2","4.0.135 — Controllo commerciale TEST"),el("p","Riepilogo in sola lettura: fatture vendita, acquisto, proforma e TD04. Nessuna emissione, invio o archiviazione remota."));
 const summary=el("p"),table=el("div"),issues=el("div"),classifier=el("div");
 const name=el("input"),sample=el("textarea"),ite=el("input"),check=el("button","Verifica classificazione TEST"),result=el("p");
 name.placeholder="Nome file fittizio";sample.placeholder="Testo fittizio, non incollare dati reali";sample.rows=2;ite.type="checkbox";
 const label=el("label"," Emessa da I.T.E. (simulazione)");label.prepend(ite);
 check.type="button";check.onclick=()=>{try{const c=R.classify({filename:name.value,text:sample.value,issuerIsITE:ite.checked});result.textContent="Tipo proposto: "+c.kind+" — "+c.confidence+"; conferma manuale necessaria.";}catch(e){result.textContent=e.message;}};
 classifier.append(el("h3","Classificazione indicativa"),name,sample,label,check,result);
 panel.append(summary,table,issues,classifier);
 (document.querySelector("main")||document.body).append(panel);
 session.subscribe(state=>{try{
  const report=R.inspect(state),t=report.totals;
  summary.textContent="Vendite € "+t.sales.toFixed(2)+" | Acquisti € "+t.purchases.toFixed(2)+" | Proforma € "+t.proforma.toFixed(2)+" | TD04 € "+t.credits.toFixed(2)+" | Vendite nette € "+t.netSales.toFixed(2);
  table.replaceChildren();for(const r of report.rows){const p=el("p",r.id+" — "+r.type+" — € "+r.gross.toFixed(2)+" — "+(r.appointmentId||"non attribuito"));table.append(p);}
  issues.replaceChildren(el("h3","Controlli ("+report.issues.length+")"));for(const issue of report.issues)issues.append(el("p",issue.id+" — "+issue.code));
 }catch(e){summary.textContent="Controllo non disponibile: "+e.message;}});
}
function wait(n=0){if(window.ITE_UnifiedSession129&&window.ITE_CommercialReview135)mount();else if(n<80)setTimeout(()=>wait(n+1),150);}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>wait());else wait();
})();
