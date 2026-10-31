/* I.T.E. 4.0 — read-only availability against accepted quotations.
 * Reservations never change physical stock; only confirmed movements do.
 */
(function(root){'use strict';
const same=(a,b)=>String(a??'')===String(b??'');
const rows=x=>Array.isArray(x)?x:[];
const round=x=>Math.round(x*1000)/1000;
function quantity(x){const n=Number(x);if(!Number.isFinite(n)||n<=0||Math.abs(n*1000-Math.round(n*1000))>1e-7)throw Error('Quantità non valida');return n}
function stock(movements,articleId){
 let total=0;
 for(const m of rows(movements)){if(!same(m.articleId,articleId))continue;
  if(m.quantity===null||m.quantity===undefined||String(m.quantity).trim()===''||!Number.isFinite(Number(m.quantity)))throw Error('Movimento non valido');
  total+=Number(m.quantity);
 }
 return round(total);
}
function accepted(site){
 const result=[];
 for(const [field,type] of [['ite_quotes','quote'],['ite_extras','extra']]){
  let list;try{list=JSON.parse(site?.[field]||'[]')}catch{continue}
  for(const source of rows(list)){
   if(type==='quote'&&source.status!=='Accettato')continue;
   if(type==='extra'&&!['Approvato','Parzialmente approvato'].includes(source.status))continue;
   const selected=type==='extra'&&source.status==='Parzialmente approvato'?source.approved_line_indices:null;
   if(selected!==null&&(!Array.isArray(selected)||new Set(selected).size!==selected.length||selected.some(i=>!Number.isInteger(i)||i<0||i>=rows(source.lines).length)))continue;
   rows(source.lines).forEach((line,index)=>{
    if(line.line_type!=='Fornitura'||selected!==null&&!selected.includes(index)||!line.articleId)return;
    try{result.push({siteId:String(site.id),type,sourceId:String(source.id),lineIndex:index,articleId:String(line.articleId),quantity:quantity(line.qty),unit:String(line.unit||line.um||'pz')})}catch(_){}
   });
  }
 }
 return result;
}
function calculate(articleId,commerce,sites,options={}){
 if(!articleId)throw Error('Articolo obbligatorio');
 const physical=stock(commerce?.movements,articleId);
 const reservations=rows(sites).flatMap(accepted).filter(x=>same(x.articleId,articleId));
 const dispatched=rows(commerce?.settings?.materialDispatches);
 const committed=reservations.map(r=>{
  const used=dispatched.filter(d=>!d.reversedAt&&same(d.siteId,r.siteId)&&same(d.sourceId,r.sourceId)&&same(d.type,r.type)&&Number(d.lineIndex)===r.lineIndex&&same(d.articleId,r.articleId)).reduce((n,d)=>n+quantity(d.quantity),0);
  return {...r,dispatched:round(used),remaining:round(Math.max(0,r.quantity-used)),overdrawn:used>r.quantity+0.000001};
 });
 const reserved=round(committed.reduce((n,r)=>n+r.remaining,0));
 const requested=options.requested===undefined?0:quantity(options.requested);
 const available=round(physical-reserved);
 return {articleId:String(articleId),physical,reserved,available,requested,
  toPurchase:round(Math.max(0,requested-available)),overcommitted:available<0,
  reservations:committed,readOnly:true,stockChanged:false,
  warnings:[...(committed.some(x=>x.overdrawn)?['Uscite superiori alle quantità impegnate']:[]),...(available<0?['Impegni superiori alla giacenza']:[])]};
}
const api=Object.freeze({stock,accepted,calculate});
root.ITEMaterialAvailability=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
