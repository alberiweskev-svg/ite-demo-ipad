/* I.T.E. 4.0 — unified XLSX preview routing, no writes.
 * Multi-sheet legacy archives are catalogue-only; ordinary sheets retain
 * the existing import path. Never derive physical stock from old balances.
 */
(function(root){'use strict';
const legacy=typeof module!=='undefined'&&module.exports?require('./ite-material-legacy-staging.js'):root.ITEMaterialLegacyStaging;
const standard=typeof module!=='undefined'&&module.exports?require('./ite-material-excel-import.js'):root.ITEMaterialExcelImport;
function inspect(buffer,{mode='catalogue',brand='',documentId='',existing=[],XLSX=root.XLSX,legacyArchive=false}={}){
 if(!(buffer instanceof ArrayBuffer)||buffer.byteLength===0||buffer.byteLength>8*1024*1024)throw Error('File Excel assente o troppo grande (massimo 8 MiB)');
 if(!XLSX||typeof XLSX.read!=='function')throw Error('Lettore XLSX non disponibile');
 if(!['catalogue','warehouse'].includes(mode))throw Error('Destinazione non valida');
 if(!legacyArchive){
  const result=standard.parse(buffer,{XLSX});
  return {mode,source:'standard-xlsx',rows:result.rows,sheetName:result.sheetName,
    issues:[],readOnly:true,stockChanged:false,requiresReview:true};
 }
 if(mode!=='catalogue')throw Error('Archivio Excel storico ammesso soltanto in Importa Archivio');
 const workbook=XLSX.read(new Uint8Array(buffer),{type:'array',cellFormula:false,cellHTML:false,bookVBA:false,cellDates:false});
 const result=legacy.stage(workbook,{brand,documentId,existing,XLSX});
 return {mode,source:'legacy-multi-sheet',rows:[],legacyResult:result,
  issues:result.issues,readOnly:true,stockChanged:false,requiresReview:true};
}
const api=Object.freeze({inspect});root.ITEMaterialWorkbookRouter=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
