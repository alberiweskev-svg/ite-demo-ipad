/* I.T.E. 4.0.284 — synthetic preflight integrated in existing demo. */
(function(root){"use strict";
function boot(){
const api=root.ITEPreflight284;if(!api||!root.ITEDossier269||!root.ITESales281||!root.ITEPurchases279||!root.ITECashflow282)return;
const section=document.createElement("section");section.id="ite-preflight-284";section.style.cssText="margin:20px auto;max-width:1100px;padding:16px;border:1px solid #b8c9d5;border-radius:12px;background:#fff;color:#243445";
section.innerHTML='<h2>4.0.284 · Verifica incrociata commerciale (TEST)</h2><p>Analisi locale di vendite, acquisti, TD04, incassi e scadenze. Nessuna emissione fiscale.</p><button type="button" id="ite-preflight-run">Verifica registri</button> <button type="button" id="ite-preflight-export" disabled>Esporta JSON TEST</button><pre id="ite-preflight-result" style="white-space:pre-wrap;overflow:auto;max-height:320px"></pre>';
document.body.appendChild(section);
const out=section.querySelector("#ite-preflight-result"),exportBtn=section.querySelector("#ite-preflight-export");let report=null;
section.querySelector("#ite-preflight-run").addEventListener("click",()=>{
try{
const dossier=root.ITEDossier269.load(localStorage),sales=root.ITESales281.load(localStorage,dossier),purchases=root.ITEPurchases279.load(localStorage,dossier);
const cash=root.ITECashflow282;const receivables=cash.load(localStorage,sales,dossier);
const payables=root.ITEPayables280?.load?.(localStorage,purchases,dossier);
if(!receivables||!payables)throw Error("ARCHIVI_SCADENZE_NON_DISPONIBILI");
report=api.inspect({dossier,sales,purchases,receivables,payables,today:new Date().toISOString().slice(0,10)});
out.textContent=JSON.stringify({totals:report.totals,blocked:report.blocked,issues:report.issues},null,2);exportBtn.disabled=false;
}catch(e){report=null;exportBtn.disabled=true;out.textContent="Verifica non disponibile: "+e.message;}
});
exportBtn.addEventListener("click",()=>{if(!report)return;const blob=new Blob([JSON.stringify(report,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="ite-preflight-284-test.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
})(typeof globalThis!=="undefined"?globalThis:this);
