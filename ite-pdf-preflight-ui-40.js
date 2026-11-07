/* I.T.E. 4.0.71 — local Safari PDF preflight. No persistence or upload. */
(function(root){
 "use strict";
 if(typeof document==="undefined"||!root.ITEPdfPreflight40)return;
 const P=root.ITEPdfPreflight40;
 const make=(tag,parent,txt)=>{const e=document.createElement(tag);if(txt!==undefined)e.textContent=txt;parent.appendChild(e);return e;};
 function mount(){
  const host=document.getElementById("importazioni")||document.querySelector(".wrap");if(!host||document.getElementById("ite-pdf-preflight-40"))return;
  const section=make("section",host);section.id="ite-pdf-preflight-40";section.className="panel";
  make("h2",section,"Verifica PDF locale — TEST 4.0.71");
  make("p",section,"Selezione multipla su Safari/iPad. I file restano nel dispositivo: nessun invio, archiviazione, estrazione di dati cliente o collegamento automatico.").className="hint";
  const input=make("input",section);input.type="file";input.accept=".pdf,application/pdf";input.multiple=true;input.setAttribute("aria-label","Seleziona PDF da verificare localmente");
  const status=make("p",section);status.setAttribute("role","status");
  const summary=make("p",section),table=make("table",section);
  const records=[];
  const clear=make("button",section,"Cancella risultati dalla sessione");clear.type="button";
  const draw=()=>{
   table.replaceChildren();const tr=make("tr",table);for(const t of ["File","Esito","Tipologia proposta","Dimensione","Verifiche"])make("th",tr,t);
   for(const r of records){const row=make("tr",table);for(const val of [r.name,r.ok?"PDF riconosciuto":"Da verificare",r.kind||"—",r.bytes||"—",r.message])make("td",row,String(val));}
   const totals=P.review(records);summary.textContent=totals.total+" file · "+totals.valid+" riconosciuti · "+totals.invalid+" da verificare";
  };
  clear.addEventListener("click",()=>{records.length=0;input.value="";draw();status.textContent="Risultati cancellati; nessun dato salvato";});
  input.addEventListener("change",async()=>{
   records.length=0;const files=Array.from(input.files||[]);
   if(files.length>P.MAX_FILES){status.textContent="Massimo 30 PDF per sessione";input.value="";return;}
   status.textContent="Analisi locale in corso…";
   for(const f of files){
    try{
     if(f.size>P.MAX||!f.size)throw Error("Dimensione non consentita (max 25 MB)");
     const bytes=new Uint8Array(await f.arrayBuffer());
     const r=P.inspect(f.name,bytes);
     records.push({name:f.name,ok:r.hasEof&&!r.encrypted,kind:r.kind,bytes:r.bytes,message:r.warnings.join("; ")});
    }catch(e){records.push({name:f.name,ok:false,message:e.message});}
   }
   draw();status.textContent="Verifica locale terminata. Nessun PDF è stato caricato o archiviato.";
  });
  draw();
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount();
})(typeof window!=="undefined"?window:globalThis);
