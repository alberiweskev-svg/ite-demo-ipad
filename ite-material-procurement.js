/* I.T.E. 4.0 — read-only purchase requirements from verified accepted supplies.
 * No stock writes, orders or reservations; never infer links from descriptions.
 */
(function(root){'use strict';
const link=typeof module!=='undefined'&&module.exports?require('./ite-material-link-audit.js'):root.ITEMaterialLinkAudit;
const stock=typeof module!=='undefined'&&module.exports?require('./ite-material-availability.js'):root.ITEMaterialAvailability;
const rows=x=>Array.isArray(x)?x:[];
const eq=(a,b)=>String(a??'')===String(b??'');
const round=x=>Math.round(x*1000)/1000;
function report(core,commerce){
 const checked=link.audit(core,commerce),issues=checked.issues.slice(),articles=rows(commerce?.articles),dispatches=rows(commerce?.settings?.materialDispatches);
 const grouped=new Map();
 for(const line of checked.lines){
  const article=articles.find(a=>eq(a.id,line.articleId));
  if(!article)continue;
  let dispatched=0;
  for(const d of dispatches){
   if(d.reversedAt||!eq(d.articleId,line.articleId)||!eq(d.siteId,line.siteId)||!eq(d.type,line.type)||!eq(d.sourceId,line.sourceId)||Number(d.lineIndex)!==line.lineIndex)continue;
   const q=Number(d.quantity);
   if(!Number.isFinite(q)||q<=0){issues.push({code:'DISPATCH_INVALID',articleId:line.articleId,message:'Uscita non valida'});continue}
   dispatched+=q;
  }
  if(dispatched>line.quantity+1e-7)issues.push({code:'DISPATCH_EXCESS',articleId:line.articleId,message:'Uscite superiori alla fornitura'});
  const remaining=round(Math.max(0,line.quantity-dispatched));
  const current=grouped.get(line.articleId)||{articleId:line.articleId,code:String(article.code||article.manufacturerCode||''),description:String(article.description||''),unit:String(article.unit||'pz'),committed:0,sites:[]};
  current.committed=round(current.committed+remaining);
  current.sites.push({siteId:line.siteId,sourceId:line.sourceId,type:line.type,lineIndex:line.lineIndex,planned:line.quantity,dispatched:round(dispatched),remaining});
  grouped.set(line.articleId,current);
 }
 const materials=[];
 for(const [articleId,item] of grouped){
  try{
   const physical=stock.stock(commerce?.movements,articleId),available=round(physical-item.committed);
   materials.push({...item,physical,available,toPurchase:round(Math.max(0,-available)),overcommitted:available<0});
  }catch(e){issues.push({code:'STOCK_INVALID',articleId,message:e.message})}
 }
 materials.sort((a,b)=>a.code.localeCompare(b.code,'it')||a.articleId.localeCompare(b.articleId));
 return {materials,issues,readOnly:true,stockChanged:false,readyForPurchase:issues.length===0};
}
const api=Object.freeze({report});
root.ITEMaterialProcurement=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
