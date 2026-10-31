/* I.T.E. 4.0 — import legacy electrical workbook, catalogue preview only.
 * Based on anonymised column structure of a real multi-sheet workbook.
 * Does not import stock from historic spreadsheet balances.
 */
(function(root){'use strict';
const norm=s=>String(s??'').trim().toLowerCase().replace(/\s+/g,' ');
const str=v=>String(v??'').trim();
function code(v){
 if(v===null||v===undefined)return '';
 let s=str(v);
 // Historical cells store some codes as formula strings like ="30210.G".
 if(/^="[^"]+"$/.test(s))s=s.slice(2,-1);
 if(/^\d+(?:\.0+)?$/.test(s))s=s.replace(/\.0+$/,'');
 return s;
}
function read(workbook,options={}){
 const XLSX=options.XLSX||root.XLSX;
 if(!XLSX?.utils?.sheet_to_json)throw Error('Lettore Excel mancante');
 if(!workbook?.SheetNames||!workbook.Sheets)throw Error('Cartella Excel non valida');
 const articles=[],issues=[],seen=new Map(),stats=[];
 for(const name of workbook.SheetNames){
  const matrix=XLSX.utils.sheet_to_json(workbook.Sheets[name],{header:1,defval:null,raw:false});
  const headerIndex=matrix.findIndex(r=>Array.isArray(r)&&r.some(v=>norm(v)==='codice')&&r.some(v=>norm(v)==='descrizione'));
  if(headerIndex<0){stats.push({sheet:name,rows:0,skipped:true});continue}
  const header=matrix[headerIndex].map(norm),at=x=>header.findIndex(v=>v===x);
  const ci=at('codice'),di=at('descrizione'),pi=at('prezzo');
  let count=0;
  for(let i=headerIndex+1;i<matrix.length;i++){
   const row=matrix[i]||[],c=code(row[ci]),description=str(row[di]);
   if(!c&&!description)continue;
   if(!c||!description){issues.push({sheet:name,row:i+1,code:'INCOMPLETE',message:'Codice o descrizione mancante'});continue}
   if(c.startsWith('#')||c.startsWith('=')){issues.push({sheet:name,row:i+1,code:'FORMULA_CODE',message:'Codice non interpretabile'});continue}
   const rawPrice=pi>=0?row[pi]:null;
   const price=rawPrice===null||str(rawPrice)===''?null:Number(str(rawPrice).replace(',','.'));
   if(price!==null&&(!Number.isFinite(price)||price<0)){issues.push({sheet:name,row:i+1,code:'PRICE',message:'Prezzo da verificare'});continue}
   const key=c.toUpperCase();
   if(seen.has(key)){issues.push({sheet:name,row:i+1,code:'DUPLICATE_CODE',message:'Codice presente anche in '+seen.get(key)});continue}
   seen.set(key,name);
   articles.push({manufacturerCode:c,description,price,sourceSheet:name,sourceRow:i+1,category:'Elettrico',unit:'pz',stockImported:false});
   count++;
  }
  stats.push({sheet:name,rows:count,skipped:false});
 }
 return {articles,issues,stats,readOnly:true,stockChanged:false,requiresReview:true,
  warning:'Quantità acquistate, posate e giacenze storiche non importate. Marca e IVA da confermare.'};
}
const api=Object.freeze({read,code});
root.ITEMaterialLegacyWorkbook=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
