/* I.T.E. 4.0.114: local-only manual text review. Never reads/uploads PDF bytes. */
(function(){
"use strict";
function mount(){
 if(!window.ITE_DocumentIntake114||document.getElementById("ite-doc-intake-114"))return;
 const section=document.createElement("section");section.id="ite-doc-intake-114";section.className="panel";
 const title=document.createElement("h2");title.textContent="Documenti tecnici e contabili — verifica TEST";section.appendChild(title);
 const info=document.createElement("p");info.className="hint";info.textContent="Inserire soltanto testo sintetico fittizio. Nessun PDF viene caricato, archiviato o inviato. Classificazione automatica indicativa: conferma manuale obbligatoria.";section.appendChild(info);
 const input=document.createElement("textarea");input.rows=5;input.placeholder="Testo fittizio del documento (senza dati reali)";input.setAttribute("aria-label","Testo documento fittizio");section.appendChild(input);
 const file=document.createElement("input");file.placeholder="Nome file fittizio (es. prova.pdf)";file.setAttribute("aria-label","Nome file fittizio");section.appendChild(file);
 const button=document.createElement("button");button.type="button";button.textContent="Analizza bozza TEST";section.appendChild(button);
 const output=document.createElement("pre");output.style.whiteSpace="pre-wrap";output.style.overflowWrap="anywhere";output.setAttribute("aria-live","polite");section.appendChild(output);
 button.addEventListener("click",function(){const draft=window.ITE_DocumentIntake114.draft(input.value,file.value,{});output.textContent=JSON.stringify(draft,null,2)});
 const anchor=document.querySelector("main")||document.querySelector(".wrap")||document.body;anchor.appendChild(section);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();
