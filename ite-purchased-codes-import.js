/* I.T.E. 4.0 — Purchased codes supplier export to catalogue preview.
 * Never infer purchase quantities, receipts or stock from article-code lists.
 */
(function(root){'use strict';
const clean=x=>String(x??'').trim(),key=x=>clean(x).toUpperCase();
function parse(matrix,{existing=[]}={}){
 if(!Array.isArray(matrix)||!Array.isArray(existing))throw Error('Tabella non valida');
 const names=['Prc','Codice Art.','Descr. Art.','Cat. Sc.','Stato'];
 const header=matrix.findIndex(r=>Array.isArray(r)&&names.slice(0,3).every(n=>r.some(c=>key(c)===key(n))));
 if(header<0)throw Error('Intestazioni elenco codici acquistati non riconosciute');
 const indexes=names.map(n=>matrix[header].findIndex(v=>key(v)===key(n)));
 const seen=new Set(),known=new Set(existing.map(a=>key(a.brand)+'|'+key(a.manufacturerCode||a.code))),rows=[],issues=[];
 for(let i=header+1;i<matrix.length;i++){
  const cells=matrix[i]||[],brand=clean(cells[indexes[0]]),code=clean(cells[indexes[1]]),description=clean(cells[indexes[2]]);
  if(!brand&&!code&&!description)continue;
  if(!brand||!code||!description){issues.push({line:i+1,code:'INCOMPLETE'});continue}
  const id=key(brand)+'|'+key(code);
  if(seen.has(id)){issues.push({line:i+1,code:'DUPLICATE'});continue}
  seen.add(id);
  rows.push({brand,manufacturerCode:code,description,category:'',supplierCategory:clean(cells[indexes[3]]),
   supplierStatus:clean(cells[indexes[4]]),unit:'pz',kind:'Materiale',action:known.has(id)?'MATCH':'NEW',
   sourceLine:i+1,stockImported:false,quantity:null,price:null,vat:null});
 }
 return {rows,issues,readOnly:true,stockChanged:false,requiresReview:true,
  warning:'Codici produttore e categorie fornitore da verificare; prezzi, IVA e giacenze non presenti nel file.'};
}
const api=Object.freeze({parse});root.ITEPurchasedCodesImport=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
