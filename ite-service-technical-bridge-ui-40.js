/* I.T.E. 4.0.68 — read-only technical-document status in the single TEST service desk. */
(function(root){"use strict";
if(typeof document==="undefined"||!root.ITEServiceTechnicalBridge40||!root.ITETechnicalDossier40)return;
const Bridge=root.ITEServiceTechnicalBridge40,T=root.ITETechnicalDossier40,R=root.ITEServiceRegistry40;
const keys={service:"ite40_service_registry_TEST_v1",technical:"ITE-TECHNICAL-DOSSIER-40-1"};
const make=(tag,parent,value)=>{const e=document.createElement(tag);if(value!==undefined)e.textContent=String(value);parent.append(e);return e;};
const panel=make("section",document.querySelector(".wrap")||document.body);panel.id="ite-service-technical-bridge-test";panel.className="panel";
make("h2",panel,"I.T.E. 4.0.68 — Documenti tecnici per intervento TEST");
make("p",panel,"Stato Di.Co., Di.Ri., Allegati GAS, POS, CAD e rapporti collegati agli appuntamenti. Solo metadati, nessun PDF memorizzato.").className="hint";
const label=make("label",panel,"Appuntamento");const select=make("select",label);
const status=make("p",panel);status.setAttribute("role","status");const output=make("div",panel);
const refresh=make("button",panel,"Aggiorna documenti");refresh.type="button";
function render(){
 output.replaceChildren();
 try{
  const raw=localStorage.getItem(keys.service);
  if(!raw){select.replaceChildren();status.textContent="Creare prima un appuntamento nell'archivio TEST.";return;}
  const service=R.importJSON(raw),h=Bridge.hierarchy(service);
  const technical=T.importJson(localStorage.getItem(keys.technical)||JSON.stringify(T.empty()),h);
  const previous=select.value;select.replaceChildren();
  for(const a of service.appointments){const o=make("option",select,a.start+" · "+a.id);o.value=a.id;}
  if(service.appointments.some(a=>a.id===previous))select.value=previous;
  if(!select.value){status.textContent="Nessun appuntamento TEST.";return;}
  const result=Bridge.reconcile(service,technical,select.value);
  status.textContent=result.documents.length+" documenti collegati · "+result.warnings.length+" da completare";
  for(const d of result.documents){const row=make("div",output);row.className="item";
   make("strong",row,d.type+" · "+d.title);
   make("p",row,d.state+" · "+d.date+" · "+d.attachmentCount+" allegati verificati · "+d.auditCount+" eventi");
  }
  if(!result.documents.length)make("p",output,"Nessun documento collegato direttamente. I documenti della sede senza appuntamento restano nell'archivio tecnico.");
 }catch(e){status.textContent="Verifica archivi TEST non riuscita: "+e.message;}
}
refresh.addEventListener("click",render);select.addEventListener("change",render);
for(const ev of ["ite:service-registry-updated","ite:technical-dossier-updated"])document.addEventListener(ev,render);
root.addEventListener("storage",e=>{if(Object.values(keys).includes(e.key))render();});
render();root.ITEServiceTechnicalBridgeUI40={refresh:render};
})(typeof globalThis!=="undefined"?globalThis:this);
