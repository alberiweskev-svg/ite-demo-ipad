/* I.T.E. 4.0 — independent catalogue and warehouse import staging.
 * Pure preview, no writes. Physical receipt is never inferred from invoices.
 */
(function(root){'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const clean=x=>String(x??'').trim();
const norm=x=>clean(x).normalize('NFKC').toUpperCase();
const qty=x=>{const n=Number(x);if(!Number.isFinite(n)||n<=0||Math.round(n*1000)!==n*1000)throw Error('Quantità non valida');return n};
function articleKey(row){const brand=norm(row.brand||row.producer),code=norm(row.manufacturerCode||row.code),unit=norm(row.unit||'pz');if(!brand||!code)throw Error('Marca e codice produttore obbligatori');return brand+'|'+code+'|'+unit}
function normalize(row){if(!row||typeof row!=='object')throw Error('Riga articolo non valida');
 const article={brand:clean(row.brand||row.producer),manufacturerCode:clean(row.manufacturerCode||row.code),description:clean(row.description),category:clean(row.category||row.type),unit:clean(row.unit||'pz'),vat:row.vat??null,costPrice:row.costPrice??null,salePrice:row.salePrice??null};
 articleKey(article);if(!article.description)throw Error('Descrizione obbligatoria');
 for(const p of ['costPrice','salePrice'])if(article[p]!==null&&(!Number.isFinite(Number(article[p]))||Number(article[p])<0))throw Error('Prezzo non valido');
 if(article.vat!==null&&(!Number.isFinite(Number(article.vat))||Number(article.vat)<0||Number(article.vat)>100))throw Error('IVA non valida');
 return article;
}
function prepare(mode,existing,documents){
 if(!['catalogue','warehouse'].includes(mode))throw Error('Tipo importazione non valido');
 if(!Array.isArray(existing)||!Array.isArray(documents))throw Error('Archivi non validi');
 const known=new Map(existing.map(x=>[articleKey(x),x]));
 const seenDocs=new Set(),seenRows=new Set(),rows=[],issues=[];
 for(const doc of documents){
  const documentId=clean(doc?.documentId),kind=clean(doc?.kind);
  if(!documentId||seenDocs.has(documentId)){issues.push('Documento mancante o duplicato: '+documentId);continue}
  seenDocs.add(documentId);
  if(mode==='warehouse'&&!['DDT','FATTURA_ACQUISTO'].includes(kind)){issues.push('Documento non valido per carico: '+documentId);continue}
  if(!Array.isArray(doc.rows)){issues.push('Righe documento assenti: '+documentId);continue}
  doc.rows.forEach((raw,index)=>{try{
   const article=normalize(raw),key=articleKey(article),fingerprint=documentId+'|'+index;
   if(seenRows.has(fingerprint))throw Error('Riga duplicata');seenRows.add(fingerprint);
   const existingArticle=known.get(key);
   const entry={documentId,documentKind:kind,lineIndex:index,key,action:existingArticle?'MATCH':'NEW',article,existingId:existingArticle?.id||null};
   if(mode==='warehouse'){
    entry.quantity=qty(raw.quantity);
    entry.received=doc.received===true;
    entry.requiresReceiptConfirmation=true;
    entry.possibleDuplicate=kind==='FATTURA_ACQUISTO'&&Boolean(doc.linkedDdtId);
    entry.linkedDdtId=clean(doc.linkedDdtId);
   }
   rows.push(entry);
  }catch(e){issues.push(documentId+' riga '+(index+1)+': '+e.message)}});
 }
 return {mode,rows:clone(rows),issues,readOnly:true,requiresExplicitConfirmation:true,
  stockChanged:false,warning:'Anteprima soltanto: nessuna modifica ad archivio o giacenze.'};
}
const api=Object.freeze({prepare,articleKey,normalize});
root.ITEMaterialImport=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
