/* I.T.E. 4.0 — Validate document metadata before import preview.
 * No writes; never infer delivery from invoice or listino.
 */
(function(root){'use strict';
const clean=v=>String(v??'').trim();
function validate(mode,documents){
 if(!['catalogue','warehouse'].includes(mode))throw Error('Destinazione non valida');
 if(!Array.isArray(documents)||!documents.length||documents.length>100)throw Error('Selezionare da 1 a 100 documenti');
 const issues=[],ids=new Set(),accepted=[];
 documents.forEach((doc,i)=>{
  const id=clean(doc?.documentId),kind=clean(doc?.kind),label='Documento '+(i+1);
  if(!id){issues.push(label+': identificativo mancante');return}
  const fingerprint=id.toUpperCase();
  if(ids.has(fingerprint)){issues.push(label+': identificativo duplicato '+id);return}
  ids.add(fingerprint);
  if(mode==='warehouse'&&!['DDT','FATTURA_ACQUISTO'].includes(kind)){issues.push(label+': documento non valido per il magazzino');return}
  if(mode==='catalogue'&&!['LISTINO','CATALOGO','DDT','FATTURA_ACQUISTO'].includes(kind)){issues.push(label+': tipo documento sconosciuto');return}
  if(!Array.isArray(doc.rows)||!doc.rows.length){issues.push(label+': nessun articolo');return}
  if(mode==='warehouse'&&doc.received!==true){issues.push(label+': ricezione fisica non confermata');return}
  if(mode==='warehouse'&&kind==='FATTURA_ACQUISTO'&&clean(doc.linkedDdtId).toUpperCase()===fingerprint){issues.push(label+': il DDT collegato coincide con la fattura');return}
  accepted.push(doc);
 });
 return {accepted,issues,canPreview:issues.length===0,readOnly:true,stockChanged:false};
}
const api=Object.freeze({validate});
root.ITEMaterialDocumentValidation=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
