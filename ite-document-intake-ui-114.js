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

/* 4.0.123: single TEST operations workspace built on 4.0.121 and 4.0.122. */
(function(){
 if(typeof document==="undefined"||document.getElementById("ite-operations-loader-123"))return;
 let tries=0;
 const load=()=>{
  if(!window.ITE_FieldWorkspace121||!window.ITE_Commercial122){
   if(++tries<100)setTimeout(load,100);
   return;
  }
  const core=document.createElement("script");core.id="ite-operations-loader-123";core.src="./ite-operations-123.js?v=4.0.123";
  core.onload=()=>{const ui=document.createElement("script");ui.src="./ite-operations-ui-123.js?v=4.0.123";document.head.appendChild(ui);};
  document.head.appendChild(core);
 };
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load);else load();
})();

/* 4.0.124: additive read-only integrity audit, TEST snapshots and printable agenda. */
(function(){
 if(typeof document==="undefined"||document.getElementById("ite-audit-loader-124"))return;
 let tries=0;
 const load=()=>{
  if(!window.ITE_Operations123){if(++tries<100)setTimeout(load,100);return;}
  const core=document.createElement("script");core.id="ite-audit-loader-124";core.src="./ite-audit-124.js?v=4.0.124";
  core.onload=()=>{const ui=document.createElement("script");ui.src="./ite-audit-ui-124.js?v=4.0.124";document.head.appendChild(ui);};
  document.head.appendChild(core);
 };
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load);else load();
})();

/* 4.0.125: calendar TEST in the existing unified demo. */
(function(){
 if(typeof document==="undefined"||document.getElementById("ite-calendar-loader-125"))return;
 let attempts=0;
 const load=()=>{
  if(!window.ITE_Audit124){if(++attempts<100)setTimeout(load,100);return;}
  const core=document.createElement("script");core.id="ite-calendar-loader-125";core.src="./ite-calendar-125.js?v=4.0.125";
  core.onload=()=>{const ui=document.createElement("script");ui.src="./ite-calendar-ui-125.js?v=4.0.125";document.head.appendChild(ui);};
  document.head.appendChild(core);
 };
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load);else load();
})();

/* 4.0.126: integrated booking and intervention lifecycle, TEST-only. */
(function(){
 if(typeof document==="undefined"||document.getElementById("ite-booking-loader-126"))return;
 let attempts=0;
 const load=()=>{
  if(!window.ITE_Calendar125||!window.ITE_Operations123||!window.ITE_Audit124){if(++attempts<100)setTimeout(load,100);return;}
  const core=document.createElement("script");core.id="ite-booking-loader-126";core.src="./ite-booking-126.js?v=4.0.126";
  core.onload=()=>{const ui=document.createElement("script");ui.src="./ite-booking-ui-126.js?v=4.0.126";document.head.appendChild(ui);};
  document.head.appendChild(core);
 };
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load);else load();
})();

/* 4.0.127: touch booking from free calendar slots, TEST-only, same demo. */
(function(){
 if(typeof document==="undefined"||document.getElementById("ite-quick-calendar-loader-127"))return;
 let attempts=0;
 const load=()=>{
  if(!window.ITE_Booking126||!window.ITE_Calendar125||!window.ITE_Audit124){if(++attempts<100)setTimeout(load,100);return;}
  const core=document.createElement("script");core.id="ite-quick-calendar-loader-127";core.src="./ite-quick-calendar-127.js?v=4.0.127";
  core.onload=()=>{const ui=document.createElement("script");ui.src="./ite-quick-calendar-ui-127.js?v=4.0.127";document.head.appendChild(ui);};
  document.head.appendChild(core);
 };
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load);else load();
})();

/* 4.0.128: TEST-only appointment reschedule/cancel in unified demo. */
(function(){
 if(typeof document==="undefined"||document.getElementById("ite-appointment-lifecycle-loader-128"))return;
 let attempts=0;
 const load=()=>{
  if(!window.ITE_Booking126||!window.ITE_Calendar125||!window.ITE_Audit124){if(++attempts<100)setTimeout(load,100);return;}
  const core=document.createElement("script");core.id="ite-appointment-lifecycle-loader-128";core.src="./ite-appointment-lifecycle-128.js?v=4.0.128";
  core.onload=()=>{const ui=document.createElement("script");ui.src="./ite-appointment-lifecycle-ui-128.js?v=4.0.128";document.head.appendChild(ui);};
  document.head.appendChild(core);
 };
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load);else load();
})();

/* 4.0.129: consolidated TEST console; older panels retained for regression. */
(function(){
 if(typeof document==="undefined"||document.getElementById("ite-unified-loader-129"))return;
 let attempts=0;
 const load=()=>{
  if(!window.ITE_Operations123||!window.ITE_Audit124||!window.ITE_Booking126){if(++attempts<100)setTimeout(load,100);return;}
  const core=document.createElement("script");core.id="ite-unified-loader-129";core.src="./ite-unified-129.js?v=4.0.129";
  core.onload=()=>{const ui=document.createElement("script");ui.src="./ite-unified-ui-129.js?v=4.0.129";document.head.appendChild(ui);};
  document.head.appendChild(core);
 };
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load);else load();
})();

/* 4.0.130: guided hierarchy and booking on the existing 4.0.129 shared TEST session. */
(function(){
 if(typeof document==="undefined"||document.getElementById("ite-guided-loader-130"))return;
 let attempts=0;
 const load=()=>{
  if(!window.ITE_UnifiedSession129){if(++attempts<100)setTimeout(load,100);return;}
  const core=document.createElement("script");core.id="ite-guided-loader-130";core.src="./ite-guided-130.js?v=4.0.130";
  core.onload=()=>{const ui=document.createElement("script");ui.src="./ite-guided-ui-130.js?v=4.0.130";document.head.appendChild(ui);};
  document.head.appendChild(core);
 };
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load);else load();
})();

/* 4.0.131: synchronized dashboard, read-only on the existing 4.0.129 TEST session. */
(function(){
 if(typeof document==="undefined"||document.getElementById("ite-dashboard-loader-131"))return;
 let attempts=0;
 const load=()=>{
  if(!window.ITE_UnifiedSession129||!window.ITE_Commercial122){if(++attempts<100)setTimeout(load,100);return;}
  const core=document.createElement("script");core.id="ite-dashboard-loader-131";core.src="./ite-dashboard-131.js?v=4.0.131";
  core.onload=()=>{const ui=document.createElement("script");ui.src="./ite-dashboard-ui-131.js?v=4.0.131";document.head.appendChild(ui);};
  document.head.appendChild(core);
 };
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load);else load();
})();

/* 4.0.132: read-only TEST work-order dossier in the existing shared demo. */
(function(){
 if(typeof document==="undefined"||document.getElementById("ite-workorders-loader-132"))return;
 let tries=0;
 const load=()=>{
  if(!window.ITE_UnifiedSession129||!window.ITE_Audit124||!window.ITE_Commercial122){if(++tries<100)setTimeout(load,100);return;}
  const core=document.createElement("script");core.id="ite-workorders-loader-132";core.src="./ite-workorders-132.js?v=4.0.132";
  core.onload=()=>{const ui=document.createElement("script");ui.src="./ite-workorders-ui-132.js?v=4.0.132";document.head.appendChild(ui);};
  document.head.appendChild(core);
 };
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load);else load();
})();

/* 4.0.133: additive TEST reconciliation in the existing shared demo. */
(function(){
 if(typeof document==="undefined"||document.getElementById("ite-reconcile-loader-133"))return;
 let tries=0;
 const load=()=>{
  if(!window.ITE_UnifiedSession129||!window.ITE_Audit124||!window.ITE_WorkOrders132||!window.ITE_Commercial122){
   if(++tries<100)setTimeout(load,100);return;
  }
  const core=document.createElement("script");core.id="ite-reconcile-loader-133";core.src="./ite-reconcile-133.js?v=4.0.133";
  core.onload=()=>{const ui=document.createElement("script");ui.src="./ite-reconcile-ui-133.js?v=4.0.133";document.head.appendChild(ui);};
  document.head.appendChild(core);
 };
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load);else load();
})();

/* 4.0.134 — document-to-intervention assignment in the shared TEST console. */
(function(){
 if(typeof document==="undefined"||document.getElementById("ite-document-links-loader-134"))return;
 const core=document.createElement("script");core.id="ite-document-links-loader-134";core.src="./ite-document-links-134.js";
 core.onload=()=>{const ui=document.createElement("script");ui.src="./ite-document-links-ui-134.js";document.head.appendChild(ui);};
 document.head.appendChild(core);
})();

/* 4.0.135: commercial TEST review on the shared session; no operational changes. */
(function(){
 if(typeof document==="undefined"||document.getElementById("ite-commercial-review-loader-135"))return;
 let attempts=0;
 const load=()=>{
  if(!window.ITE_UnifiedSession129||!window.ITE_Audit124||!window.ITE_Commercial122){if(++attempts<100)setTimeout(load,100);return;}
  const core=document.createElement("script");core.id="ite-commercial-review-loader-135";core.src="./ite-commercial-review-135.js?v=4.0.135";
  core.onload=()=>{const ui=document.createElement("script");ui.src="./ite-commercial-review-ui-135.js?v=4.0.135";document.head.appendChild(ui);};
  document.head.appendChild(core);
 };
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load);else load();
})();

/* 4.0.136: atomic TEST batch workflow in the same shared demo; legacy modules untouched. */
(function(){
 if(typeof document==="undefined"||document.getElementById("ite-batch-loader-136"))return;
 let attempts=0;
 const load=()=>{
  if(!window.ITE_UnifiedSession129||!window.ITE_Audit124||!window.ITE_Operations123){if(++attempts<100)setTimeout(load,100);return;}
  const core=document.createElement("script");core.id="ite-batch-loader-136";core.src="./ite-batch-136.js?v=4.0.136";
  core.onload=()=>{const ui=document.createElement("script");ui.src="./ite-batch-ui-136.js?v=4.0.136";document.head.appendChild(ui);};
  document.head.appendChild(core);
 };
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load);else load();
})();

/* 4.0.137: spreadsheet-style TEST hierarchy import, reusing 4.0.136 atomic batch. */
(function(){
 if(typeof document==="undefined"||document.getElementById("ite-table-loader-137"))return;
 let attempts=0;
 const load=()=>{
  if(!window.ITE_UnifiedSession129||!window.ITE_Batch136||!window.ITE_Operations123||!window.ITE_Audit124){if(++attempts<100)setTimeout(load,100);return;}
  const core=document.createElement("script");core.id="ite-table-loader-137";core.src="./ite-table-import-137.js?v=4.0.137";
  core.onload=()=>{const ui=document.createElement("script");ui.src="./ite-table-import-ui-137.js?v=4.0.137";document.head.appendChild(ui);};
  document.head.appendChild(core);
 };
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load);else load();
})();


/* 4.0.138 — CSV/TSV hierarchy import in the existing shared TEST session. */
(function(){
 if(typeof document==="undefined"||document.getElementById("ite-csv-loader-138"))return;
 let tries=0;
 const load=()=>{
  if(!window.ITE_UnifiedSession129||!window.ITE_Batch136||!window.ITE_Operations123||!window.ITE_Audit124){if(++tries<100)setTimeout(load,100);return;}
  const core=document.createElement("script");core.id="ite-csv-loader-138";core.src="./ite-csv-import-138.js?v=4.0.138";
  core.onload=()=>{const ui=document.createElement("script");ui.src="./ite-csv-import-ui-138.js?v=4.0.138";document.head.appendChild(ui);};
  document.head.appendChild(core);
 };
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load);else load();
})();


/* 4.0.139: local TEST hierarchy CSV export and round-trip validation. */
(function(){
 if(typeof document==="undefined"||document.getElementById("ite-csv-export-loader-139"))return;
 let tries=0;
 const load=()=>{
  if(!window.ITE_UnifiedSession129||!window.ITE_CsvImport138){if(++tries<100)setTimeout(load,100);return;}
  const core=document.createElement("script");core.id="ite-csv-export-loader-139";core.src="./ite-csv-roundtrip-139.js?v=4.0.139";
  core.onload=()=>{const ui=document.createElement("script");ui.src="./ite-csv-roundtrip-ui-139.js?v=4.0.139";document.head.appendChild(ui);};
  document.head.appendChild(core);
 };
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load);else load();
})();

/* 4.0.140: integrated read-only day/week/month TEST calendar. */
(function(){
 if(typeof document==="undefined"||document.getElementById("ite-calendar-loader-140"))return;
 let tries=0;const load=()=>{
  if(!window.ITE_UnifiedSession129||!window.ITE_Operations123){if(++tries<100)setTimeout(load,100);return;}
  const core=document.createElement("script");core.id="ite-calendar-loader-140";core.src="./ite-calendar-140.js?v=4.0.140";
  core.onload=()=>{const ui=document.createElement("script");ui.src="./ite-calendar-ui-140.js?v=4.0.140";document.head.appendChild(ui);};
  document.head.appendChild(core);
 };
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load);else load();
})();
