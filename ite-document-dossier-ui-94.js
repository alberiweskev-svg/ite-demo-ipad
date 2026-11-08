/* I.T.E. 4.0.94 — interfaccia fascicolo documentale TEST per Safari/iPad. */
(function(root){"use strict";if(!root.document)return;
function mount(){
 const D=root.ITEDocumentDossier94,W=root.ITEDocumentWorkspace91,L=root.ITEDocumentLinks93,S=root.ITEServiceLedger40,R=root.ITEDocumentReview92;
 if(!D||!W||!L||!S||!R||document.getElementById("ite-document-dossier-94"))return;
 const host=document.querySelector("#main-content")||document.querySelector("main")||document.querySelector(".wrap");if(!host)return;
 const section=document.createElement("section");section.id="ite-document-dossier-94";section.className="panel";host.append(section);
 const add=(tag,txt,parent=section)=>{const e=document.createElement(tag);if(txt!==undefined)e.textContent=txt;parent.append(e);return e;};
 add("h2","Fascicolo documentale integrato — TEST 4.0.94");
 add("p","Vista locale in sola lettura: documenti, clienti, sedi, impianti, apparecchiature e appuntamenti. Nessun PDF acquisito o trasmesso.");
 const client=add("select"),only=add("label"),checkbox=add("input");checkbox.type="checkbox";checkbox.style.width="auto";only.append(checkbox,document.createTextNode(" Solo anomalie"));
 const actions=add("div");actions.className="actions";const refresh=add("button","Aggiorna fascicolo",actions),exportBtn=add("button","Esporta CSV TEST",actions);refresh.type=exportBtn.type="button";
 const status=add("p");status.setAttribute("role","status");const results=add("div");let report=null;
 function read(){const raw=localStorage.getItem("ite-40-service-workspace-test-v1");if(!raw)throw Error("Archivio fascicoli TEST assente");return S.importJSON(raw);}
 function render(){const m=W.load(localStorage),l=L.load(localStorage),s=read(),r=R.load(localStorage);report=D.build(m,l,s,r);
 const selected=client.value;client.replaceChildren();const opt=(v,t)=>{const o=document.createElement("option");o.value=v;o.textContent=t;client.append(o);};opt("","Tutti i clienti TEST");report.clients.forEach(c=>opt(c.id,c.name+" ("+c.documents+" documenti)"));client.value=selected;
 const docs=D.select(report,{clientId:client.value,onlyIssues:checkbox.checked});results.replaceChildren();
 for(const d of docs){const item=add("div",undefined,results);item.className="item";add("strong",d.name+" — "+d.type,item);add("small",[d.clientId,d.siteId,d.plantId,d.equipmentId,d.appointmentId].filter(Boolean).join(" / ")||"Senza collegamento",item);add("p",d.issues.join(", ")||"Nessuna anomalia rilevata",item);}
 status.textContent=report.summary.documents+" documenti, "+report.summary.linked+" collegati, "+report.summary.needsAttention+" con anomalie, "+report.summary.orphanLinks+" collegamenti orfani.";
 }
 const safe=()=>{try{render();}catch(e){status.textContent=e.message;results.replaceChildren();report=null;}};
 refresh.addEventListener("click",safe);client.addEventListener("change",safe);checkbox.addEventListener("change",safe);
 exportBtn.addEventListener("click",()=>{try{if(!report)throw Error("Aggiornare il fascicolo prima di esportare");const blob=new Blob(["\uFEFF"+D.csv(report,{clientId:client.value,onlyIssues:checkbox.checked})],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="ite-fascicolo-documentale-TEST-4.0.94.csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){status.textContent=e.message;}});
 safe();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})(typeof globalThis!=="undefined"?globalThis:this);