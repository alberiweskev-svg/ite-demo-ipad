/* I.T.E. 4.0.182 — embedded synthetic commercial dossier. */
(function(root){"use strict";
function init(){const D=root.ITE_CommercialDossier182,F=root.ITE_FieldWorkspaceBridge174,E=root.ITE_ExtrasWorkspaceBridge175,d=root.document;if(!D||!F||!E||!d)return;
 const parent=d.getElementById("ite-field-workspace-172");if(!parent)return;
 const host=d.createElement("div");host.className="panel";host.id="ite-commercial-dossier-182";
 const h=d.createElement("h3");h.textContent="Dossier interventi, Extra e preventivi — TEST 4.0.182";
 const note=d.createElement("p");note.className="hint";note.textContent="Riepilogo di sola lettura della sessione fittizia. Non emette fatture e non memorizza dati sul server.";
 const actions=d.createElement("div");actions.className="actions";const refresh=d.createElement("button");refresh.textContent="Aggiorna dossier";refresh.type="button";const exportBtn=d.createElement("button");exportBtn.textContent="Esporta CSV TEST";exportBtn.type="button";actions.append(refresh,exportBtn);
 const status=d.createElement("p");status.setAttribute("role","status");const output=d.createElement("div");host.append(h,note,actions,status,output);parent.append(host);
 let last=null;const eur=n=>(n/100).toLocaleString("it-IT",{style:"currency",currency:"EUR"});
 function render(){try{last=D.build(F.snapshot(),E.snapshot());output.replaceChildren();const p=d.createElement("p");p.textContent="Preventivi: "+last.stats.quotes+" · Da accettare: "+eur(last.stats.openCents)+" · Accettati: "+eur(last.stats.acceptedCents)+" · Rifiutati: "+eur(last.stats.rejectedCents)+" · Extra in attesa: "+last.stats.extrasPending;output.append(p);
 for(const r of last.records){const item=d.createElement("div");item.className="item";item.textContent=r.id+" · Intervento "+r.interventionId+" · "+r.status+" · "+eur(r.totalCents)+" · Fornitura "+eur(r.kinds.FORNITURA||0)+" · Posa "+eur(r.kinds.POSA||0)+" · Smontaggio "+eur(r.kinds.SMONTAGGIO||0)+" · Smaltimento "+eur(r.kinds.SMALTIMENTO||0);output.append(item)}
 status.textContent=last.valid?"Dossier TEST coerente.":"Anomalie ("+last.issues.length+"): "+last.issues.slice(0,8).map(x=>x.code+" "+x.id).join("; ");exportBtn.disabled=!last.valid;
 }catch(e){last=null;exportBtn.disabled=true;status.textContent="Dossier non disponibile: "+e.message}}
 refresh.addEventListener("click",render);exportBtn.addEventListener("click",()=>{if(!last||!last.valid)return;const url=URL.createObjectURL(new Blob([D.csv(last)],{type:"text/csv;charset=utf-8"}));const a=d.createElement("a");a.href=url;a.download="ITE-4.0.182-DOSSIER-TEST.csv";host.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)});
 F.subscribe(render);if(typeof E.subscribe==="function")E.subscribe(render);render();
}
if(root.document){if(root.document.readyState==="loading")root.document.addEventListener("DOMContentLoaded",init,{once:true});else init()}
})(typeof globalThis!=="undefined"?globalThis:this);
