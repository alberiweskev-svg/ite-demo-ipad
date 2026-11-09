/* I.T.E. 4.0.104 — integrity audit for isolated TEST archives. Read-only. */
(function(root,factory){const api=factory(typeof module==="object"&&module.exports?require("./ite-workflow-100.js"):root.ITEWorkflow100);if(typeof module==="object"&&module.exports)module.exports=api;root.ITEIntegrity104=api;})(typeof globalThis!=="undefined"?globalThis:this,function(base){
"use strict";
const clone=x=>JSON.parse(JSON.stringify(x));
function audit(state){
 base.validate(state);
 const issues=[], rec=state.records, find=(k,id)=>rec[k].find(x=>x.id===id);
 const add=(kind,row,code,detail)=>issues.push({kind,id:row.id,code,detail});
 for(const s of rec.sites)if(!find("clients",s.clientId))add("sites",s,"CLIENT_MISSING","Cliente inesistente");
 for(const p of rec.plants){const site=find("sites",p.siteId);if(!site||!find("clients",p.clientId)||site.clientId!==p.clientId)add("plants",p,"LINEAGE","Sede o cliente incoerente");}
 for(const d of rec.devices){const plant=find("plants",d.plantId);if(!plant||plant.clientId!==d.clientId)add("devices",d,"LINEAGE","Impianto o cliente incoerente");}
 for(const kind of ["appointments","interventions"]){
  for(const row of rec[kind]){
   const site=find("sites",row.siteId),plant=find("plants",row.plantId),device=find("devices",row.deviceId);
   if(!find("clients",row.clientId)||!site||!plant||!device||!find("operators",row.operatorId)||site.clientId!==row.clientId||plant.clientId!==row.clientId||plant.siteId!==row.siteId||device.plantId!==row.plantId)add(kind,row,"LINEAGE","Gerarchia o operatore non coerente");
   if(kind==="appointments"){if(!Number.isFinite(Date.parse(row.startsAt))||row.endsAt&&(!Number.isFinite(Date.parse(row.endsAt))||Date.parse(row.endsAt)<=Date.parse(row.startsAt)))add(kind,row,"TIME","Orari appuntamento non validi");}
   else {const a=find("appointments",row.appointmentId);if(!a||["clientId","siteId","plantId","deviceId","operatorId"].some(k=>a[k]!==row[k]))add(kind,row,"APPOINTMENT","Intervento senza appuntamento coerente");
    if(row.leftAt&&(!row.arrivedAt||!Number.isFinite(Date.parse(row.leftAt))||Date.parse(row.leftAt)<Date.parse(row.arrivedAt)))add(kind,row,"TIME","Orari intervento incoerenti");
    if(["CHIUSO","REVISIONATO"].includes(row.status)&&(!row.arrivedAt||!row.leftAt))add(kind,row,"CLOSURE","Intervento chiuso senza tempi completi");
   }
  }
 }
 for(const kind of ["quotes","extras","invoices","documents"]){
  for(const row of rec[kind]){
   if(!find("clients",row.clientId))add(kind,row,"CLIENT_MISSING","Cliente inesistente");
   if(kind==="extras"){const q=find("quotes",row.quoteId);if(!q||q.clientId!==row.clientId)add(kind,row,"QUOTE","Extra associato a preventivo di altro cliente o inesistente");
    if(row.status==="PARZIALE"&&(!Number.isInteger(row.approvedQuantity)||row.approvedQuantity<1||row.approvedQuantity>=row.quantity))add(kind,row,"APPROVAL","Quantità approvata non valida");}
   if(kind==="documents"){
    if(row.officialReady!==false||row.accounted!==false)add(kind,row,"OFFICIAL","Flag ufficiale non consentito");
    const a=row.appointmentId&&find("appointments",row.appointmentId),p=row.plantId&&find("plants",row.plantId),d=row.deviceId&&find("devices",row.deviceId);
    if(row.appointmentId&&(!a||a.clientId!==row.clientId))add(kind,row,"APPOINTMENT","Appuntamento documento incoerente");
    if(row.plantId&&(!p||p.clientId!==row.clientId))add(kind,row,"PLANT","Impianto documento incoerente");
    if(row.deviceId&&(!d||d.clientId!==row.clientId||row.plantId&&d.plantId!==row.plantId))add(kind,row,"DEVICE","Apparecchiatura documento incoerente");
    if(a&&(row.plantId&&a.plantId!==row.plantId||row.deviceId&&a.deviceId!==row.deviceId))add(kind,row,"LINK","Documento non coerente con appuntamento");
   }
  }
 }
 const collisions=[];
 const ap=rec.appointments.filter(a=>a.status!=="ANNULLATO"&&Number.isFinite(Date.parse(a.startsAt))&&a.endsAt&&Number.isFinite(Date.parse(a.endsAt)));
 for(let i=0;i<ap.length;i++)for(let j=i+1;j<ap.length;j++)if(ap[i].operatorId===ap[j].operatorId&&Date.parse(ap[i].startsAt)<Date.parse(ap[j].endsAt)&&Date.parse(ap[j].startsAt)<Date.parse(ap[i].endsAt)){collisions.push([ap[i].id,ap[j].id]);add("appointments",ap[i],"OVERLAP","Sovrapposizione operatore con "+ap[j].id);}
 return clone({schema:"ITE-INTEGRITY-TEST-104",revision:state.revision,checked: Object.fromEntries(Object.keys(rec).map(k=>[k,rec[k].length])),issues,collisions,readyForOfficialUse:false,readOnly:true});
}
return Object.freeze({audit});
});