/* I.T.E. 4.0.216 — integrated document/customer association UI. Synthetic TEST only. */
(function(root){"use strict";
function mount(){
 const d=root.document,S=root.ITEWorkspaceStore209,A=root.ITEWorkspaceAudit215;
 if(!d||!S||!A)return;
 const host=d.createElement("section");host.id="ite-document-links-216";host.style.cssText="margin:16px 0;padding:16px;border:1px solid #aaa;border-radius:12px";
 const h=d.createElement("h3");h.textContent="Collegamenti documenti / clienti — TEST 4.0.216";host.append(h);
 const hint=d.createElement("p");hint.textContent="Solo archivio sintetico locale. Le associazioni sono salvate insieme a fatture, anagrafiche e preventivi, con controllo revisioni.";host.append(hint);
 const status=d.createElement("p");status.setAttribute("role","status");host.append(status);
 const controls=d.createElement("div");controls.style.cssText="display:flex;flex-wrap:wrap;gap:8px";host.append(controls);
 const summary=d.createElement("div");host.append(summary);
 let store=null;
 function element(tag,label){const e=d.createElement(tag);e.setAttribute("aria-label",label);e.style.cssText="min-height:44px;max-width:100%";controls.append(e);return e;}
 const documentSelect=element("select","Documento fiscale"),clientSelect=element("select","Cliente"),quoteSelect=element("select","Preventivo"),interventionSelect=element("select","Intervento");
 function option(select,value,label){const o=d.createElement("option");o.value=value;o.textContent=label;select.append(o);}
 function button(label,fn){const b=element("button",label);b.type="button";b.textContent=label;b.addEventListener("click",()=>{try{fn();status.textContent="Operazione TEST completata.";}catch(e){status.textContent="Operazione rifiutata: "+e.message;}});return b;}
 function open(){const raw=root.localStorage&&root.localStorage.getItem(S.KEY);if(!raw)throw Error("ARCHIVIO_TEST_ASSENTE");const p=S.decode(raw);store=S.create(root.localStorage,p.field,p.commercial);store.restore();return store.snapshot();}
 function refresh(){const p=open();documentSelect.replaceChildren();clientSelect.replaceChildren();quoteSelect.replaceChildren();interventionSelect.replaceChildren();
 option(documentSelect,"","Documento");option(clientSelect,"","Cliente");option(quoteSelect,"","Nessun preventivo");option(interventionSelect,"","Nessun intervento");
 for(const x of p.fiscal.filter(x=>x.direction==="OUT"))option(documentSelect,x.id,x.number+" — "+x.type);
 for(const x of p.field.clients)option(clientSelect,x.id,x.name||x.id);
 for(const x of p.commercial.quotes)option(quoteSelect,x.id,x.id);
 for(const x of p.field.interventions)option(interventionSelect,x.id,x.id);
 show(p);
 }
 function show(p){const result=A.audit(p,p.documentLinks||[]);summary.replaceChildren();
 const info=d.createElement("p");info.textContent="Collegati: "+result.linked.length+" · Da collegare: "+result.unlinked.length+" · Anomalie: "+result.issues.length;summary.append(info);
 const list=d.createElement("ul");for(const x of result.linked){const li=d.createElement("li");li.textContent=x.documentId+" → "+x.clientId+(x.quoteId?" · preventivo "+x.quoteId:"");list.append(li);}
 for(const x of result.issues){const li=d.createElement("li");li.textContent="ANOMALIA: "+x.code+" — "+x.documentId;list.append(li);}
 summary.append(list);
 }
 function saveLinks(transform){if(!store)open();const old=store.snapshot();const next=transform(old.documentLinks||[]);S.validateDocumentLinks(next);A.validateLinks({...old,documentLinks:next},next);store.save({...old,documentLinks:next},old.revision);refresh();}
 button("Ricarica archivio TEST",refresh);
 button("Associa documento",()=>{const documentId=documentSelect.value,clientId=clientSelect.value;if(!documentId||!clientId)throw Error("SELEZIONARE_DOCUMENTO_E_CLIENTE");
 const link={documentId,clientId};if(quoteSelect.value)link.quoteId=quoteSelect.value;if(interventionSelect.value)link.interventionId=interventionSelect.value;
 saveLinks(links=>[...links.filter(x=>x.documentId!==documentId),link]);});
 button("Rimuovi associazione",()=>{const id=documentSelect.value;if(!id)throw Error("SELEZIONARE_DOCUMENTO");saveLinks(links=>links.filter(x=>x.documentId!==id));});
 button("Esporta associazioni TEST",()=>{const p=open(),raw=A.encodeLinks(p.documentLinks||[]);const blob=new Blob([raw],{type:"application/json"}),url=URL.createObjectURL(blob),a=d.createElement("a");a.href=url;a.download="ite-associazioni-test-216.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
 const picker=element("input","Importa associazioni TEST");picker.type="file";picker.accept=".json,application/json";
 picker.addEventListener("change",async()=>{try{const f=picker.files&&picker.files[0];if(!f)return;if(f.size>200000)throw Error("FILE_TROPPO_GRANDE");const links=A.decodeLinks(await f.text());saveLinks(()=>links);status.textContent="Associazioni TEST importate.";}catch(e){status.textContent="Importazione rifiutata: "+e.message;}finally{picker.value="";}});
 (d.getElementById("ite-workflow-cockpit-203")||d.querySelector("main")||d.body).append(host);
 try{refresh();}catch(e){status.textContent="Aprire prima l'archivio sintetico TEST: "+e.message;}
}
if(root.document){if(root.document.readyState==="loading")root.document.addEventListener("DOMContentLoaded",mount,{once:true});else mount();}
})(typeof globalThis!=="undefined"?globalThis:this);
