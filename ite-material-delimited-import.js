/* I.T.E. 4.0 — safe CSV / TSV import mapping, preview only.
 * Spreadsheet XLSX and scanned PDFs require dedicated parsers and human review.
 */
(function(root){'use strict';
const importCore=typeof module!=='undefined'&&module.exports?require('./ite-material-import.js'):root.ITEMaterialImport;
const aliases={
 brand:['marca','produttore','brand','manufacturer'],
 code:['codice produttore','codice articolo','codice','sku','part number','codice fornitore'],
 description:['descrizione','articolo','prodotto','description'],
 category:['categoria','tipologia','famiglia','category'],
 unit:['um','u.m.','unita misura','unità di misura','unit','udm'],
 quantity:['quantita','quantità','qta','qtà','qty','pezzi'],
 vat:['iva','aliquota iva','vat'],
 costPrice:['prezzo acquisto','prezzo netto','costo unitario','cost'],
 salePrice:['prezzo vendita','prezzo listino','listino','price']
};
const clean=x=>String(x??'').trim().replace(/^\uFEFF/,'');
const key=x=>clean(x).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
function split(text,delimiter){const lines=[];let line=[],value='',quoted=false;
 for(let i=0;i<text.length;i++){const ch=text[i];
  if(ch==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++}else quoted=!quoted}
  else if(ch===delimiter&&!quoted){line.push(value);value=''}
  else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&text[i+1]==='\n')i++;line.push(value);if(line.some(x=>clean(x)))lines.push(line);line=[];value=''}
  else value+=ch;
 }
 if(quoted)throw Error('CSV con virgolette non chiuse');
 line.push(value);if(line.some(x=>clean(x)))lines.push(line);
 return lines;
}
function parse(text,options){
 if(typeof text!=='string'||text.length>5000000)throw Error('File assente o troppo grande (max 5 MB di testo)');
 const delimiter=options?.delimiter||((text.split('\n')[0].match(/;/g)||[]).length>=(text.split('\n')[0].match(/,/g)||[]).length?';':',');
 if(![';',',','\t'].includes(delimiter))throw Error('Separatore non supportato');
 const matrix=split(text,delimiter);
 if(!matrix.length||matrix.length>10001)throw Error('Numero righe non valido');
 const header=matrix.shift().map(key),used=new Set(),mapping={};
 for(const [field,names] of Object.entries(aliases)){
  const matches=header.map((name,index)=>names.some(a=>key(a)===name)?index:-1).filter(i=>i>=0);
  if(matches.length>1)throw Error('Colonne ambigue: '+field);
  if(matches.length===1){mapping[field]=matches[0];used.add(matches[0])}
 }
 if(mapping.brand===undefined||mapping.code===undefined||mapping.description===undefined)throw Error('Colonne obbligatorie mancanti: marca, codice, descrizione');
 const number=x=>{const s=clean(x);if(!s)return null;const n=Number(s.replace(/\s/g,'').replace(/\.(?=\d{3}(?:\D|$))/g,'').replace(',','.'));return Number.isFinite(n)?n:s};
 const rows=matrix.map((cells,index)=>{const out={_sourceLine:index+2};for(const [field,i] of Object.entries(mapping))out[field]=['quantity','vat','costPrice','salePrice'].includes(field)?number(cells[i]):clean(cells[i]);return out});
 return {rows,mapping,unknownColumns:header.map((h,i)=>used.has(i)?null:h).filter(Boolean),delimiter};
}
function preview(mode,existing,files){
 if(!Array.isArray(files)||!files.length||files.length>100)throw Error('Seleziona da 1 a 100 file');
 const docs=[],errors=[];
 for(const file of files){try{
  const parsed=parse(file.text,file.options),documentId=clean(file.documentId);
  if(!documentId)throw Error('Numero o identificativo documento obbligatorio');
  docs.push({documentId,kind:clean(file.kind),received:file.received===true,linkedDdtId:clean(file.linkedDdtId),rows:parsed.rows});
 }catch(e){errors.push(clean(file.name||'file')+': '+e.message)}}
 const result=importCore.prepare(mode,existing,docs);
 return {...result,issues:[...errors,...result.issues],fileCount:files.length,parsedDocuments:docs.length};
}
const api=Object.freeze({parse,preview});
root.ITEMaterialDelimitedImport=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
