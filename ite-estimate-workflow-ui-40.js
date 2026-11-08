/* I.T.E. 4.0.80 — Banco integrato preventivi/Extra e contabilità TEST, senza dati reali. */
(function(root,factory){const api=factory(root.ITEEstimateWorkflow40);if(typeof module==="object"&&module.exports)module.exports=api;root.ITEEstimateWorkflowUI40=api;})(typeof globalThis!=="undefined"?globalThis:this,function(W){
"use strict";
function sample(){
 let s=W.empty();
 s=W.registerAppointment(s,{id:"TEST-APP-01",operatorId:"TEST-TEC-01",clientId:"TEST-CLI-01",siteId:"TEST-SED-01",plantId:"TEST-IMP-01",equipmentId:"TEST-APPAR-01"});
 s=W.registerEstimate(s,{id:"TEST-PREV-01",appointmentId:"TEST-APP-01",lines:[
 {id:"TEST-RIGA-01",type:"FORNITURA",category:"IDRICO",description:"Lavabo dimostrativo",quantity:1,unitPrice:120,status:"PROPOSTA",extra:false},
 {id:"TEST-RIGA-02",type:"POSA",category:"IDRICO",description:"Posa lavabo dimostrativo",quantity:1,unitPrice:80,status:"PROPOSTA",extra:false},
 {id:"TEST-RIGA-03",type:"SMONTAGGIO",category:"IDRICO",description:"Rimozione dimostrativa",quantity:1,unitPrice:30,status:"PROPOSTA",extra:true},
 {id:"TEST-RIGA-04",type:"SMALTIMENTO",category:"IDRICO",description:"Smaltimento dimostrativo",quantity:1,unitPrice:20,status:"PROPOSTA",extra:true}
 ]});
 return s;
}
function mount(doc){
 if(!doc||!doc.createElement||!W)return false;
 if(doc.getElementById("ite-estimate-workflow-panel-40"))return true;
 const host=doc.createElement("section");host.id="ite-estimate-workflow-panel-40";host.setAttribute("aria-label","Preventivi e Extra TEST");
 host.style.cssText="margin:16px auto;padding:16px;max-width:980px;border:2px solid #237c4a;border-radius:12px;font:16px system-ui;background:#fff;color:#172b20";
 host.innerHTML='<h2>Preventivi, Extra e contabilità — ambiente TEST</h2><p>Solo dati fittizi. Nessuna sincronizzazione con clienti, fatture o archivi operativi.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" data-act="demo">Carica esempio TEST</button><button type="button" data-act="approve">Approva fornitura e posa</button><button type="button" data-act="extra">Approva Extra</button><button type="button" data-act="export">Esporta JSON TEST</button><label>Importa JSON TEST <input type="file" accept=".json,application/json" data-act="import"></label></div><p role="status" aria-live="polite" data-out="status"></p><div data-out="report"></div>';
 const anchor=doc.querySelector("main")||doc.body;if(!anchor)return false;anchor.appendChild(host);
 let state=W.empty();const status=host.querySelector('[data-out="status"]'),output=host.querySelector('[data-out="report"]');
 const esc=x=>String(x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 function render(){
 const r=W.report(state);
 output.innerHTML='<p>Appuntamenti: '+r.rows.length+' · Segnalazioni: '+r.warnings.length+'</p><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse"><thead><tr><th>Appuntamento</th><th>Proposto</th><th>Approvato</th><th>Extra approvati</th><th>Fatturato</th><th>Da fatturare</th></tr></thead><tbody>'+r.rows.map(a=>'<tr>'+[a.appointmentId,a.proposedCents,a.approvedCents,a.extraApprovedCents,a.salesCents,a.unbilledCents].map((v,i)=>'<td style="padding:7px;border-bottom:1px solid #ddd">'+esc(i? (v/100).toFixed(2)+' €':v)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div><p>'+r.warnings.map(esc).join(' · ')+'</p>';
 }
 function action(fn){try{fn();render();status.textContent="Operazione TEST completata";}catch(e){status.textContent="Operazione non eseguita: "+e.message;}}
 host.querySelector('[data-act="demo"]').addEventListener("click",()=>action(()=>{state=sample();}));
 host.querySelector('[data-act="approve"]').addEventListener("click",()=>action(()=>{state=W.decide(state,"TEST-PREV-01",[{lineId:"TEST-RIGA-01",status:"ACCETTATA"},{lineId:"TEST-RIGA-02",status:"ACCETTATA"}]);}));
 host.querySelector('[data-act="extra"]').addEventListener("click",()=>action(()=>{state=W.decide(state,"TEST-PREV-01",[{lineId:"TEST-RIGA-03",status:"ACCETTATA"},{lineId:"TEST-RIGA-04",status:"ACCETTATA"}]);}));
 host.querySelector('[data-act="export"]').addEventListener("click",()=>action(()=>{const blob=new Blob([W.exportJSON(state)],{type:"application/json"});const url=URL.createObjectURL(blob),a=doc.createElement("a");a.href=url;a.download="ite-preventivi-TEST.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}));
 host.querySelector('[data-act="import"]').addEventListener("change",async e=>{const file=e.target.files&&e.target.files[0];if(!file)return;if(file.size>1000000){status.textContent="File troppo grande";return;}try{const imported=W.importJSON(await file.text());state=imported;render();status.textContent="Importazione TEST verificata";}catch(err){status.textContent="Importazione respinta: "+err.message;}finally{e.target.value="";}});
 render();return true;
}
if(typeof document!=="undefined"){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>mount(document));else mount(document);}
return Object.freeze({sample,mount});
});
