/* I.T.E. 4.0.71 — local-only PDF preflight; no network, storage or server transfer. */
(function(root,factory){
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 root.ITEPdfPreflight40=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const MAX=25_000_000,MAX_FILES=30;
 const types=Object.freeze(["DICO_ELETTRICO","DICO_IDRICO","DIRI","ALLEGATI_GAS","POS","ITE_CAD","RAPPORTO","DA_VERIFICARE"]);
 function classify(name){
  const s=String(name||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  if(/(?:allegat.*gas|gas.*allegat)/.test(s))return "ALLEGATI_GAS";
  if(/(?:diri|di[ ._-]*ri|rispondenza)/.test(s))return "DIRI";
  if(/(?:dico|di[ ._-]*co|conformita)/.test(s))return /(?:elettric|elettro)/.test(s)?"DICO_ELETTRICO":/(?:idraulic|idrico)/.test(s)?"DICO_IDRICO":"DA_VERIFICARE";
  if(/(?:piano.*sicurezza|\bpos\b)/.test(s))return "POS";
  if(/(?:cad|disegno|planimetria)/.test(s))return "ITE_CAD";
  if(/(?:rapporto|intervento)/.test(s))return "RAPPORTO";
  return "DA_VERIFICARE";
 }
 function assertFile(name,bytes){
  if(typeof name!=="string"||!name.toLowerCase().endsWith(".pdf"))throw Error("È richiesto un file PDF");
  if(!(bytes instanceof Uint8Array))throw Error("Contenuto non valido");
  if(!bytes.length||bytes.length>MAX)throw Error("PDF vuoto o superiore a 25 MB");
  if(bytes.length<8||String.fromCharCode(...bytes.subarray(0,5))!=="%PDF-")throw Error("Intestazione PDF non valida");
  if(!/^\d\.\d$/.test(String.fromCharCode(...bytes.subarray(5,8))))throw Error("Versione PDF non valida");
  return true;
 }
 function inspect(name,bytes){
  assertFile(name,bytes);
  // Only ASCII structural tokens: never return document text or private content.
  const tail=bytes.subarray(Math.max(0,bytes.length-4096));
  const ascii=Array.from(tail,b=>String.fromCharCode(b)).join("");
  const hasEof=/%%EOF(?:\s|$)/.test(ascii);
  const encrypted=/\/Encrypt\b/.test(Array.from(bytes.subarray(0,Math.min(bytes.length,100000)),b=>String.fromCharCode(b)).join(""));
  return Object.freeze({kind:classify(name),bytes:bytes.length,version:String.fromCharCode(...bytes.subarray(5,8)),hasEof,encrypted,
   warnings:[...(!hasEof?["Marcatore finale PDF non trovato: verificare il file"]:[]),...(encrypted?["Possibile PDF protetto: verifica manuale necessaria"]:[]),
    "La classificazione è indicativa; controllare il documento originale prima di registrarlo"]});
 }
 function review(items){
  if(!Array.isArray(items)||items.length>MAX_FILES)throw Error("Massimo 30 PDF per sessione");
  return {total:items.length,valid:items.filter(x=>x.ok).length,invalid:items.filter(x=>!x.ok).length,
   byType:types.reduce((acc,t)=>(acc[t]=items.filter(x=>x.ok&&x.kind===t).length,acc),{})};
 }
 return Object.freeze({MAX,MAX_FILES,types,classify,assertFile,inspect,review});
});
