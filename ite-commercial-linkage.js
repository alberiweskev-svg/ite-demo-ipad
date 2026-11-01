/* I.T.E. 4.0 — commercial linkage: synthetic/demo data only. No persistent writes. */
(function(root){'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const money=n=>Math.round((Number(n)+Number.EPSILON)*100)/100;
const validId=x=>typeof x==='string'&&x.trim().length>0;
function entity(c,key,id){return (c[key]||[]).find(x=>x.id===id)}
function checkContext(data,ref){
 if(!data||!data.catalog||!ref)throw Error('ARCHIVIO_O_CONTESTO_ASSENTE');
 const c=data.catalog,client=entity(c,'clients',ref.clientId),site=entity(c,'sites',ref.siteId),system=entity(c,'systems',ref.systemId),equipment=ref.equipmentId?entity(c,'equipment',ref.equipmentId):null;
 if(!client||!site||site.clientId!==client.id||!system||system.siteId!==site.id||(ref.equipmentId&&(!equipment||equipment.systemId!==system.id)))throw Error('GERARCHIA_NON_VALIDA');
 if(ref.appointmentId){const a=(data.appointments||[]).find(x=>x.id===ref.appointmentId);if(!a||a.clientId!==client.id||a.siteId!==site.id||a.systemId!==system.id||(ref.equipmentId&&a.equipmentId!==ref.equipmentId))throw Error('APPUNTAMENTO_NON_COERENTE')}
 return {clientId:client.id,siteId:site.id,systemId:system.id,equipmentId:equipment?equipment.id:null,appointmentId:ref.appointmentId||null};
}
function line(row){
 if(!row||!['FORNITURA','POSA','SMONTAGGIO','SMALTIMENTO','EXTRA'].includes(row.type))throw Error('TIPO_RIGA_NON_VALIDO');
 if(!validId(row.description)||!Number.isFinite(Number(row.quantity))||Number(row.quantity)<=0||!Number.isFinite(Number(row.unitPrice))||Number(row.unitPrice)<0)throw Error('RIGA_NON_VALIDA');
 return {type:row.type,description:row.description.trim(),quantity:Number(row.quantity),unitPrice:money(row.unitPrice),amount:money(Number(row.quantity)*Number(row.unitPrice)),vatRate:row.vatRate===22?22:row.vatRate===10?10:(()=>{throw Error('IVA_NON_VALIDA')})()};
}
function separateSupplyInstall(description,supply,install,vatRate=10){
 if(!validId(description))throw Error('DESCRIZIONE_OBBLIGATORIA');
 return [line({type:'FORNITURA',description:'Fornitura '+description,quantity:1,unitPrice:supply,vatRate}),line({type:'POSA',description:'Posa '+description,quantity:1,unitPrice:install,vatRate})];
}
function buildEstimate(data,ref,rows,extras=[]){
 const context=checkContext(data,ref);if(!Array.isArray(rows)||!Array.isArray(extras))throw Error('RIGHE_NON_VALIDE');
 const accepted=extras.filter(e=>e.status==='ACCETTATO');
 const seen=new Set();
 const extraRows=accepted.flatMap(e=>{if(!validId(e.id)||seen.has(e.id))throw Error('EXTRA_DUPLICATO');seen.add(e.id);if(e.clientId!==context.clientId||e.siteId!==context.siteId||e.systemId!==context.systemId||(context.appointmentId&&e.appointmentId!==context.appointmentId))throw Error('EXTRA_NON_COERENTE');return (e.lines||[]).map(line)});
 const all=rows.map(line).concat(extraRows);const base=money(all.reduce((s,r)=>s+r.amount,0));const vat=money(all.reduce((s,r)=>s+money(r.amount*r.vatRate/100),0));
 return {context,lines:all,extraIds:[...seen],taxable:base,vat,total:money(base+vat),persistence:'NONE'};
}
function commitPreview(data,estimate,expectedFingerprint){
 if(JSON.stringify(data)!==expectedFingerprint)throw Error('DATI_CAMBIATI_RIVERIFICARE');
 const fresh=checkContext(data,estimate.context);
 if(JSON.stringify(fresh)!==JSON.stringify(estimate.context))throw Error('CONTESTO_CAMBIATO');
 return clone(estimate);
}
const api=Object.freeze({checkContext,line,separateSupplyInstall,buildEstimate,commitPreview,fingerprint:data=>JSON.stringify(data)});
root.ITECommercialLinkage=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
