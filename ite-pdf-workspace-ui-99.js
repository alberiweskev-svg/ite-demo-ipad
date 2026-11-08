/* I.T.E. 4.0.99 — iPad-friendly local staging; only TEST JSON, no PDF uploads. */
(function(root){"use strict";function mount(){if(!root.document)return;
const api=root.ITEPDFWorkspace99;if(!api)return;
const section=document.createElement("section");section.className="panel";section.id="ite-pdf-staging-99";
const title=document.createElement("h3");title.textContent="Revisione → collegamento → archivio TEST (4.0.99)";
const info=document.createElement("p");info.textContent="Caricare esclusivamente JSON fittizi di revisione e collegamenti. Anteprima obbligatoria prima di salvare localmente. Nessuna scrittura su fatture, anagrafiche operative o moduli 2.7.5.";
const revisions=document.createElement("input");revisions.type="file";revisions.accept=".json,application/json";revisions.multiple=true;revisions.setAttribute("aria-label","Revisioni JSON TEST");
const links=document.createElement("input");links.type="file";links.accept=".json,application/json";links.setAttribute("aria-label","Collegamenti JSON TEST");
const op=document.createElement("input");op.placeholder="Operatore TEST";op.value="Tecnico TEST";op.setAttribute("aria-label","Operatore");
const preview=document.createElement("button");preview.type="button";preview.textContent="Controlla e prepara";
const commit=document.createElement("button");commit.type="button";commit.textContent="Salva solo documenti pronti";commit.disabled=true;
const exportBtn=document.createElement("button");exportBtn.type="button";exportBtn.textContent="Esporta archivio TEST";
const status=document.createElement("p");status.setAttribute("role","status");const table=document.createElement("div");
let bundle=null;const store=root.localStorage;
function render(){table.replaceChildren();try{const db=api.load(store),s=api.summary(db);status.textContent="Archivio locale: "+s.total+" documenti TEST, revisione "+s.revision;const ul=document.createElement("ul");db.items.forEach(item=>{const li=document.createElement("li");li.textContent=item.documentId+" — "+item.destination+" — "+item.type;ul.append(li);});table.append(ul);}catch(e){status.textContent=String(e.message||e);}}
async function read(file){if(!file||file.size>250000)throw Error("JSON assente o troppo grande");return file.text();}
preview.onclick=async()=>{bundle=null;commit.disabled=true;table.replaceChildren();try{const files=Array.from(revisions.files||[]);if(!files.length||files.length>250)throw Error("Selezionare revisioni TEST");const reports=[];for(const f of files)reports.push(root.ITEPDFReview97.importJSON(await read(f)));
let linkEntries=[];if(links.files&&links.files[0]){const parsed=JSON.parse(await read(links.files[0]));if(Array.isArray(parsed))linkEntries=parsed;else if(parsed&&Array.isArray(parsed.links)){root.ITEDocumentLinks93.validate(parsed);linkEntries=parsed.links;}else throw Error("Formato collegamenti non valido");}
bundle=api.prepare(reports,linkEntries,op.value);const summary=root.ITEPDFHandoff98.preview(bundle);const ul=document.createElement("ul");bundle.items.forEach(item=>{const li=document.createElement("li");li.textContent=item.documentId+" → "+item.destination+": "+(item.warnings.join("; ")||"PRONTO TEST");ul.append(li);});table.append(ul);commit.disabled=summary.ready===0;status.textContent=summary.ready+" pronti; "+summary.blocked+" bloccati. I bloccati non saranno salvati.";}catch(e){status.textContent=String(e.message||e);}};
commit.onclick=()=>{try{if(!bundle)throw Error("Preparare prima il pacchetto");const ready={...bundle,items:bundle.items.filter(x=>x.readyForTestImport)};const db=api.load(store);const next=api.apply(db,ready,db.revision);api.save(store,next);bundle=null;commit.disabled=true;render();}catch(e){status.textContent=String(e.message||e);}};
exportBtn.onclick=()=>{try{const json=api.exportJSON(api.load(store)),url=URL.createObjectURL(new Blob([json],{type:"application/json"})),a=document.createElement("a");a.href=url;a.download="ITE-4.0.99-archivio-TEST.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){status.textContent=String(e.message||e);}};
section.append(title,info,revisions,links,op,preview,commit,exportBtn,status,table);(document.querySelector("main")||document.querySelector(".wrap")||document.body).append(section);render();}
if(root.document){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();}})(typeof globalThis!=="undefined"?globalThis:this);
