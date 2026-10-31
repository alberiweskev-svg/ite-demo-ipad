/* I.T.E. 4.0 — audit accepted supply lines before enabling reservations.
 * No mutation, no automatic article matching by description.
 */
(function(root){'use strict';
const available=typeof module!=='undefined'&&module.exports?require('./ite-material-availability.js'):root.ITEMaterialAvailability;
const eq=(a,b)=>String(a??'')===String(b??'');
const list=x=>Array.isArray(x)?x:[];
function audit(core,commerce){
 const articles=list(commerce?.articles),sites=list(core?.cantieri),issues=[],lines=[];
 const byId=new Map();
 for(const a of articles){if(!a?.id||byId.has(String(a.id)))issues.push({code:'ARTICLE_ID',articleId:String(a?.id||''),message:'Articolo senza ID o duplicato'});else byId.set(String(a.id),a)}
 for(const site of sites){
  for(const [field,type] of [['ite_quotes','quote'],['ite_extras','extra']]){
   let sources;try{sources=JSON.parse(site?.[field]||'[]')}catch{issues.push({code:'SOURCE_PARSE',siteId:String(site.id),type,message:'Documento non leggibile'});continue}
   for(const source of list(sources)){
    const approved=type==='quote'?source.status==='Accettato':['Approvato','Parzialmente approvato'].includes(source.status);
    if(!approved)continue;
    const selected=type==='extra'&&source.status==='Parzialmente approvato'?source.approved_line_indices:null;
    if(selected!==null&&(!Array.isArray(selected)||new Set(selected).size!==selected.length||selected.some(i=>!Number.isSafeInteger(i)||i<0||i>=list(source.lines).length))){issues.push({code:'APPROVAL',siteId:String(site.id),sourceId:String(source.id),message:'Selezione righe approvate non valida'});continue}
    list(source.lines).forEach((line,index)=>{
     if(line.line_type!=='Fornitura'||selected!==null&&!selected.includes(index))return;
     const ref={siteId:String(site.id),type,sourceId:String(source.id),lineIndex:index};
     if(!line.articleId){issues.push({...ref,code:'UNLINKED',message:'Fornitura senza articolo archivio'});return}
     const article=byId.get(String(line.articleId));
     if(!article){issues.push({...ref,code:'MISSING_ARTICLE',message:'Articolo archivio non trovato'});return}
     if(article.kind!=='Materiale'){issues.push({...ref,code:'WRONG_KIND',message:'Articolo non classificato Materiale'});return}
     const unit=String(line.unit||line.um||'pz').trim(),articleUnit=String(article.unit||'pz').trim();
     if(!eq(unit,articleUnit)){issues.push({...ref,code:'UNIT_MISMATCH',message:'Unità di misura non coerente'});return}
     const quantity=Number(line.qty);
     if(!Number.isFinite(quantity)||quantity<=0||Math.abs(quantity*1000-Math.round(quantity*1000))>1e-7){issues.push({...ref,code:'QUANTITY',message:'Quantità non valida'});return}
     lines.push({...ref,articleId:String(article.id),quantity,unit});
    });
   }
  }
 }
 const stock=[];
 for(const article of articles.filter(a=>a?.kind==='Materiale'&&a.id)){
  try{stock.push(available.calculate(article.id,commerce,sites))}catch(e){issues.push({code:'STOCK',articleId:String(article.id),message:e.message})}
 }
 return {lines,stock,issues,readOnly:true,canAutoReserve:issues.length===0,stockChanged:false};
}
const api=Object.freeze({audit});
root.ITEMaterialLinkAudit=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
