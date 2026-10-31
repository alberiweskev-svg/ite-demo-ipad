/* I.T.E. 4.0 — XLSX preview using bundled local SheetJS.
 * No persistence, no warehouse movements. Only first worksheet by default.
 */
(function(root){'use strict';
const MAX_BYTES=8*1024*1024,MAX_ROWS=10000;
function parse(buffer,options={}){
 if(!(buffer instanceof ArrayBuffer)||buffer.byteLength===0||buffer.byteLength>MAX_BYTES)throw Error('File Excel assente o troppo grande (massimo 8 MiB)');
 const xlsx=options.XLSX||root.XLSX;
 if(!xlsx||typeof xlsx.read!=='function')throw Error('Libreria Excel locale non disponibile');
 const book=xlsx.read(new Uint8Array(buffer),{type:'array',cellDates:false,cellFormula:false,cellHTML:false,bookVBA:false});
 const sheetName=options.sheetName||book.SheetNames[0];
 if(!book.SheetNames.includes(sheetName))throw Error('Foglio Excel non trovato');
 const sheet=book.Sheets[sheetName],range=xlsx.utils.decode_range(sheet['!ref']||'A1');
 if(range.e.r-range.s.r>MAX_ROWS||range.e.c-range.s.c>100)throw Error('Foglio troppo grande');
 const csv=xlsx.utils.sheet_to_csv(sheet,{FS:'\t',RS:'\n',blankrows:false,strip:true});
 const parser=typeof require==='function'&&typeof module!=='undefined'&&module.exports?require('./ite-material-delimited-import.js'):root.ITEMaterialDelimitedImport;
 const result=parser.parse(csv,{delimiter:'\t'});
 return {...result,sheetName,readOnly:true,stockChanged:false};
}
const api=Object.freeze({parse});
root.ITEMaterialExcelImport=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
