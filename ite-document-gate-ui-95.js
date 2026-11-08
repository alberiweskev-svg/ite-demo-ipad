/* I.T.E. 4.0.95 — cruscotto unico gate documentale TEST. */
(function(root,factory){const api=factory(root);if(typeof module==="object"&&module.exports)module.exports=api;root.ITEDocumentGateUI95=api;})(typeof globalThis!=="undefined"?globalThis:this,function(root){
"use strict";
function load(store){
 const I=root.ITEDocumentIntake90,L=root.ITEDocumentLinks93,S=root.ITEServiceLedger40,R=root.ITEDocumentReview92,W=root.ITEDocumentWorkspace91;
 if(!I||!L||!S||!R||!W||!root.ITEDocumentGate95)throw Error("Moduli TEST non caricati");
 const manifest=W.load(store),links=L.load(store);
 const ledger=S.load(store);
 let reviews;
 if(typeof R.load==="function")reviews=R.load(store);
 return root.ITEDocumentGate95.evaluate(manifest,links,ledger,reviews);
}
function mount(target,store){
 if(!target||!store||!root.ITEDocumentGate95)return false;
 if(target.dataset.iteGate95==="ready")return true;
 target.dataset.iteGate95="ready";
 const h=root.document.createElement("h3");h.textContent="Verifica fascicoli documentali TEST — 4.0.95";
 const note=root.document.createElement("p");note.textContent="Verifica incrociata locale: nessun PDF letto o caricato. Nessun documento può essere dichiarato pronto per emissione ufficiale.";
 const controls=root.document.createElement("div"),client=root.document.createElement("input"),blocked=root.document.createElement("input"),run=root.document.createElement("button"),exp=root.document.createElement("button");
 client.placeholder="Filtra ID cliente TEST";client.setAttribute("aria-label","Filtra ID cliente TEST");
 blocked.type="checkbox";const label=root.document.createElement("label");label.append(blocked,root.document.createTextNode(" Solo anomalie"));
 run.type="button";run.textContent="Verifica archivi TEST";exp.type="button";exp.textContent="Esporta rapporto JSON TEST";
 const status=root.document.createElement("p");status.setAttribute("role","status");
 const list=root.document.createElement("div");let report=null;
 function render(){list.replaceChildren();if(!report)return;const rows=root.ITEDocumentGate95.filter(report,{clientId:client.value.trim(),onlyBlocked:blocked.checked});status.textContent=report.summary.total+" documenti, "+report.summary.metadataReady+" pronti solo come metadati, "+report.summary.blocked+" bloccati, "+report.summary.orphanLinks+" collegamenti orfani. Emissioni ufficiali: 0.";
 for(const r of rows){const p=root.document.createElement("p");p.textContent=r.name+" | "+r.type+" | "+(r.readyForMetadataArchive?"Metadati verificati":"DA COMPLETARE")+" | "+r.issues.join(", ");list.append(p);}}
 run.onclick=()=>{try{report=load(store);render();}catch(e){status.textContent="Verifica non disponibile: "+e.message;}};
 client.oninput=render;blocked.onchange=render;
 exp.onclick=()=>{try{if(!report)report=load(store);const blob=new Blob([root.ITEDocumentGate95.exportReport(report)],{type:"application/json"});const url=URL.createObjectURL(blob),a=root.document.createElement("a");a.href=url;a.download="ite-gate-documenti-95-test.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){status.textContent=e.message;}};
 controls.append(client,label,run,exp);target.append(h,note,controls,status,list);run.click();return true;
}
function autoMount(){if(!root.document||!root.localStorage)return false;let t=root.document.getElementById("ite-document-gate-95");if(!t){t=root.document.createElement("section");t.id="ite-document-gate-95";t.className="panel";(root.document.querySelector("main")||root.document.querySelector(".wrap")||root.document.body).append(t);}return mount(t,root.localStorage);}
 if(root.document){if(root.document.readyState==="loading")root.document.addEventListener("DOMContentLoaded",autoMount);else autoMount();}
 return Object.freeze({load,mount,autoMount});
});
