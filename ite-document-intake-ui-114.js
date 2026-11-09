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

/* 4.0.115: load the integrated review modules from the existing demo entry point. */
(function(){
 if(typeof document==="undefined"||document.getElementById("ite-workflow-loader-115"))return;
 const script=document.createElement("script");script.id="ite-workflow-loader-115";script.src="./ite-document-workflow-115.js";
 script.onload=function(){const ui=document.createElement("script");ui.src="./ite-document-workflow-ui-115.js";document.head.appendChild(ui)};
 document.head.appendChild(script);
})();

/* 4.0.116: additive integrity workspace. Prior 4.0.115 kept unchanged for regression. */
(function(){
 if(typeof document==="undefined"||document.getElementById("ite-integrity-loader-116"))return;
 const script=document.createElement("script");script.id="ite-integrity-loader-116";script.src="./ite-document-integrity-116.js";
 script.onload=function(){const ui=document.createElement("script");ui.src="./ite-document-integrity-ui-116.js";document.head.appendChild(ui)};
 document.head.appendChild(script);
})();

/* 4.0.117: one integrated TEST workspace; dependencies loaded after existing 4.0.116. */
(function(){
 if(typeof document==="undefined"||document.getElementById("ite-batch-loader-117"))return;
 const load=()=>{if(!window.ITE_DocumentIntegrity116){setTimeout(load,100);return;}
 const script=document.createElement("script");script.id="ite-batch-loader-117";script.src="./ite-document-batch-117.js";
 script.onload=function(){const ui=document.createElement("script");ui.src="./ite-document-batch-ui-117.js";document.head.appendChild(ui);};
 document.head.appendChild(script);};
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load);else load();
})();

/* 4.0.118: connect existing local PDF reader to batch review, in the same document workspace. */
(function(){
 if(typeof document==="undefined"||document.getElementById("ite-pdf-bridge-loader-118"))return;
 const load=()=>{
  if(!window.ITE_DocumentBatch117||!window.ITE_DocumentIntegrity116){setTimeout(load,100);return;}
  const reader=document.createElement("script");reader.id="ite-pdf-bridge-loader-118";reader.src="./ite-pdf-local-reader.js?v=4.0.118";
  reader.onload=()=>{
   const core=document.createElement("script");core.src="./ite-document-pdf-bridge-118.js?v=4.0.118";
   core.onload=()=>{const review=document.createElement("script");review.src="./ite-document-review-119.js?v=4.0.119";review.onload=()=>{const adapter=document.createElement("script");adapter.src="./ite-document-registry-bridge-120.js?v=4.0.120";adapter.onload=()=>{const ui=document.createElement("script");ui.src="./ite-document-review-ui-119.js?v=4.0.120";document.head.appendChild(ui);};document.head.appendChild(adapter);};document.head.appendChild(review);};
   document.head.appendChild(core);
  };
  document.head.appendChild(reader);
 };
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load);else load();
})();

/* 4.0.121: integrated field TEST workspace, no operational data access. */
(function(){
 if(typeof document==="undefined"||document.getElementById("ite-field-loader-121"))return;
 const core=document.createElement("script");core.id="ite-field-loader-121";core.src="./ite-field-workspace-121.js?v=4.0.121";
 core.onload=function(){const ui=document.createElement("script");ui.src="./ite-field-workspace-ui-121.js?v=4.0.121";document.head.appendChild(ui);};
 document.head.appendChild(core);
})();

/* 4.0.122: TEST commercial workflow integrated into field workspace. */
(function(){
 if(typeof document==="undefined"||document.getElementById("ite-commercial-loader-122"))return;
 const load=()=>{if(!window.ITE_FieldWorkspace121){setTimeout(load,100);return;}
 const core=document.createElement("script");core.id="ite-commercial-loader-122";core.src="./ite-commercial-122.js?v=4.0.122";
 core.onload=()=>{const ui=document.createElement("script");ui.src="./ite-commercial-ui-122.js?v=4.0.122";document.head.appendChild(ui);};document.head.appendChild(core);};
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load);else load();
})();
