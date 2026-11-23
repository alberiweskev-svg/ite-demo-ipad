/* I.T.E. 4.0.278 handover UI: synthetic metadata only. */
(function(root){"use strict";
function init(){const d=root.ITEDossier269,t=root.ITETechnical271,h=root.ITEHandover278;if(!d||!t||!h||!root.document)return;
const anchor=document.getElementById("ite-audit-277")||document.querySelector("main")||document.querySelector(".wrap");if(!anchor)return;
const section=document.createElement("section");section.id="ite-handover-278";section.className="panel";section.innerHTML='<h2>Fascicolo tecnico di consegna — prova 4.0.278</h2><p class="hint">Solo dati TEST e metadati. Nessun PDF viene importato o inviato. Lo stato PRONTO PER REVISIONE non certifica la conformità.</p><div class="grid"><label>Sede <select id="ite-handover-site"></select></label><label>Tipologia impianto <select id="ite-handover-category"><option value="GENERICA">Generica</option><option value="GAS">Gas</option><option value="ELETTRICO">Elettrico</option><option value="IDRICO">Idrico</option><option value="TERMICO">Termico</option></select></label></div><div class="actions"><button type="button" id="ite-handover-check">Verifica fascicolo</button><button type="button" id="ite-handover-export" class="secondary">Esporta manifest JSON</button></div><pre id="ite-handover-result" style="white-space:pre-wrap;overflow-wrap:anywhere" aria-live="polite"></pre>';
anchor.appendChild(section);
const select=section.querySelector("#ite-handover-site"),category=section.querySelector("#ite-handover-category"),out=section.querySelector("#ite-handover-result");let latest=null;
function data(){const state=d.load(root.localStorage),reg=t.load(root.localStorage,state);return {state,reg};}
function refresh(){const {state}=data();select.replaceChildren();for(const s of state.sites){const option=document.createElement("option");option.value=s.id;option.textContent=s.id;select.appendChild(option);}if(!state.sites.length)out.textContent="Nessuna sede TEST presente nel dossier.";}
function check(){try{const {state,reg}=data();if(!select.value)throw Error("Nessuna sede selezionata");latest=h.resolve(state,reg,select.value,{category:category.value});out.textContent=JSON.stringify(latest,null,2);}catch(e){latest=null;out.textContent="Verifica non disponibile: "+e.message;}}
section.querySelector("#ite-handover-check").addEventListener("click",()=>{refresh();check();});
section.querySelector("#ite-handover-export").addEventListener("click",()=>{check();if(!latest)return;const blob=new Blob([JSON.stringify(latest,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="TEST-fascicolo-"+latest.siteId+".json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
try{refresh();}catch(e){out.textContent="Archivio di prova non disponibile: "+e.message;}
}
if(root.document){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();}
})(typeof globalThis!=="undefined"?globalThis:this);