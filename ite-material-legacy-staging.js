/* I.T.E. 4.0 — stage multi-sheet legacy workbook as catalogue, never stock. */
(function(root){'use strict';
const legacy=typeof module!=='undefined'&&module.exports?require('./ite-material-legacy-workbook.js'):root.ITEMaterialLegacyWorkbook;
const importer=typeof module!=='undefined'&&module.exports?require('./ite-material-import.js'):root.ITEMaterialImport;
const clean=v=>String(v??'').trim();
function stage(workbook,{brand='',documentId='',XLSX,existing=[]}={}){
 const parsed=legacy.read(workbook,{XLSX});
 const issues=parsed.issues.map(x=>({...x,severity:'warning'}));
 const producer=clean(brand),doc=clean(documentId);
 if(!producer)issues.push({code:'BRAND_REQUIRED',severity:'blocking',message:'Marca da confermare prima di importare'});
 if(!doc)issues.push({code:'DOCUMENT_ID_REQUIRED',severity:'blocking',message:'Identificativo archivio obbligatorio'});
 const rows=parsed.articles.map(x=>({brand:producer,code:x.manufacturerCode,description:x.description,category:x.category,unit:x.unit,salePrice:x.price}));
 const preview=producer&&doc?importer.prepare('catalogue',existing,[{documentId:doc,kind:'LISTINO',rows}]):null;
 if(preview)for(const message of preview.issues)issues.push({code:'IMPORT_VALIDATION',severity:'blocking',message});
 return {mode:'catalogue',source:'legacy-multi-sheet',articles:parsed.articles,stats:parsed.stats,
 preview,issues,readyForReview:!!preview&&preview.rows.length>0&&!issues.some(x=>x.severity==='blocking'),
 readOnly:true,stockChanged:false,requiresReview:true,
 warning:'Anteprima senza scrittura. Giacenze storiche non caricate.'};
}
const api=Object.freeze({stage});root.ITEMaterialLegacyStaging=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
