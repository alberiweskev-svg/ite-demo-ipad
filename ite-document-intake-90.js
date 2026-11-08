/* I.T.E. 4.0.90 — classificazione documentale TEST: nessun PDF reale memorizzato. */
(function(root,factory){
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 root.ITEDocumentIntake90=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const SCHEMA="ITE-DOCUMENT-MANIFEST-TEST-1",MAX_BYTES=15000000;
 const TYPES=Object.freeze(["DICO_ELETTRICO","DICO_IDRICO","DIRI","ALLEGATI_GAS","POS","CAD","FATTURA_VENDITA","FATTURA_ACQUISTO","PROFORMA","NOTA_CREDITO_TD04","LISTINO","DA_VERIFICARE"]);
 const clean=x=>String(x==null?"":x).normalize("NFKC").trim();
 function classify(input){
  const name=clean(input.name).toUpperCase(),body=clean(input.text).toUpperCase().slice(0,30000);
  const s=name+" "+body;
  if(/(?:\bTD04\b|NOTA DI CREDITO)/.test(s))return "NOTA_CREDITO_TD04";
  if(/(?:\bPRO\s?FORMA\b|\bPROFORMA\b|\bPR[ -]?\d{1,})/.test(s))return "PROFORMA";
  if(/(?:DICHIARAZIONE DI RISPONDENZA|\bDI[. ]?RI[.]?\b)/.test(s))return "DIRI";
  if(/(?:DICHIARAZIONE DI CONFORMIT|\bDI[. ]?CO[.]?\b)/.test(s))return /ELETTRIC|CEI|QUADRO/.test(s)?"DICO_ELETTRICO":/IDRIC|SANITAR|ACQUA/.test(s)?"DICO_IDRICO":"DA_VERIFICARE";
  if(/(?:ALLEGAT[IO] GAS|ALLEGATI OBBLIGATORI GAS)/.test(s))return "ALLEGATI_GAS";
  if(/(?:PIANO OPERATIVO DI SICUREZZA|\bPOS\b)/.test(s))return "POS";
  if(/(?:\bCAD\b|\.DXF\b|\.DWG\b)/.test(s))return "CAD";
  if(/(?:LISTINO|CATALOGO PREZZI)/.test(s))return "LISTINO";
  if(/(?:FATTURA|\bTD01\b|\bTD24\b)/.test(s)){
   if(input.issuerIsITE===true)return "FATTURA_VENDITA";
   if(input.issuerIsITE===false)return "FATTURA_ACQUISTO";
  }
  return "DA_VERIFICARE";
 }
 function validateRecord(r){
  if(!r||typeof r!=="object"||!TYPES.includes(r.type))throw Error("Tipologia documento non valida");
  if(!/^TEST-[A-Z0-9-]{3,60}$/.test(r.id))throw Error("ID TEST non valido");
  if(typeof r.name!=="string"||!r.name||r.name.length>180||/[\\/\x00-\x1f]/.test(r.name))throw Error("Nome documento non valido");
  if(!Number.isSafeInteger(r.size)||r.size<0||r.size>MAX_BYTES)throw Error("Dimensione non valida");
  if(r.mime!=="application/pdf"&&r.mime!=="application/json")throw Error("Formato non ammesso");
  if(r.clientId!==null&&(!/^TEST-[A-Z0-9-]{2,60}$/.test(r.clientId)))throw Error("Cliente TEST non valido");
  if(r.appointmentId!==null&&(!/^TEST-[A-Z0-9-]{2,60}$/.test(r.appointmentId)))throw Error("Appuntamento TEST non valido");
  if(typeof r.reviewRequired!=="boolean")throw Error("Revisione non valida");
  return true;
 }
 function createRecord(input){
  if(!input||typeof input!=="object")throw Error("Dati mancanti");
  const type=classify(input),r={
   id:clean(input.id),name:clean(input.name),size:input.size,mime:clean(input.mime),
   type,clientId:input.clientId==null?null:clean(input.clientId),
   appointmentId:input.appointmentId==null?null:clean(input.appointmentId),
   reviewRequired:type==="DA_VERIFICARE"||type==="NOTA_CREDITO_TD04"||type==="PROFORMA",
   source:"TEST_METADATA_ONLY"
  };
  validateRecord(r);return r;
 }
 function validateManifest(m){
  if(!m||m.schema!==SCHEMA||!Array.isArray(m.records)||m.records.length>2000)throw Error("Manifest incompatibile");
  const ids=new Set();
  for(const r of m.records){validateRecord(r);if(ids.has(r.id))throw Error("ID duplicato");ids.add(r.id);}
  return true;
 }
 function append(manifest,record){
  validateManifest(manifest);validateRecord(record);
  const next={schema:SCHEMA,records:[...manifest.records,JSON.parse(JSON.stringify(record))]};
  validateManifest(next);return next;
 }
 function empty(){return {schema:SCHEMA,records:[]};}
 function exportJSON(m){validateManifest(m);return JSON.stringify(m,null,2);}
 function importJSON(raw){
  if(typeof raw!=="string"||raw.length>1000000)throw Error("Manifest oltre 1 MB");
  const m=JSON.parse(raw);validateManifest(m);return JSON.parse(JSON.stringify(m));
 }
 function summary(m){
  validateManifest(m);const counts={};for(const t of TYPES)counts[t]=0;
  for(const r of m.records)counts[r.type]++;
  return {total:m.records.length,review:m.records.filter(r=>r.reviewRequired).length,counts};
 }
 return Object.freeze({SCHEMA,TYPES,MAX_BYTES,classify,createRecord,validateRecord,validateManifest,append,empty,exportJSON,importJSON,summary});
});