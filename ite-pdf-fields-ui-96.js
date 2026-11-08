/* I.T.E. 4.0.96 - anteprima PDF TEST, nessun salvataggio del contenuto */
(function(root){ "use strict";
function mount(){if(!root.document||!root.ITEPDFFields96)return;
 const section=document.createElement("section");section.className="panel";section.id="ite-pdf-fields-96";
 const title=document.createElement("h3");title.textContent="Lettura assistita PDF TEST — 4.0.96";
 const note=document.createElement("p");note.textContent="Solo documenti fittizi. Lettura locale e anteprima: nessun PDF o testo viene archiviato o inviato. Ogni campo richiede verifica manuale.";
 const file=document.createElement("input");file.type="file";file.accept=".pdf,application/pdf";file.setAttribute("aria-label","PDF TEST da leggere");
 const issuer=document.createElement("select");for(const [v,t] of [["?","Emittente da verificare"],["ite","Emessa da I.T.E."],["other","Emessa da altro soggetto"]]){const opt=document.createElement("option");opt.value=v;opt.textContent=t;issuer.append(opt);}
 const run=document.createElement("button");run.type="button";run.textContent="Leggi PDF TEST in locale";
 const status=document.createElement("p");status.setAttribute("role","status");const output=document.createElement("pre");output.style.whiteSpace="pre-wrap";output.style.overflowWrap="anywhere";
 run.onclick=async()=>{output.textContent="";try{const f=file.files&&file.files[0];if(!f)throw Error("Selezionare un PDF TEST");const pdfjs=root.pdfjsLib||root.pdfjsDistBuildPdf;if(!pdfjs)throw Error("PDF.js non disponibile in questa demo: lettura non eseguita");status.textContent="Lettura locale in corso…";const raw=await root.ITEPDFFields96.readPDF(f,pdfjs);const report=root.ITEPDFFields96.extract(raw,{issuerIsITE:issuer.value==="?"?null:issuer.value==="ite"});output.textContent=JSON.stringify(report,null,2);status.textContent="Anteprima TEST pronta: verificare tutti i campi. Nessun dato salvato.";}catch(e){status.textContent=String(e.message||e);}};
 section.append(title,note,file,issuer,run,status,output);(document.querySelector("main")||document.querySelector(".wrap")||document.body).append(section);
}
if(root.document){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();}
})(typeof globalThis!=="undefined"?globalThis:this);