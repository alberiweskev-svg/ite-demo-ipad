/* I.T.E. 4.0 — commercial domain: customer-facing quote lines, separated supply/installation.
   Pure, no persistence, no real customer data; amounts are net EUR. */
(function(root){'use strict';
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
const money=n=>Number.isFinite(n)&&n>=0;
const TYPE=Object.freeze({SUPPLY:'FORNITURA',INSTALL:'POSA',REMOVAL:'SMONTAGGIO',DISPOSAL:'SMALTIMENTO',EXTRA:'EXTRA'});
function markup(cost){
 if(!money(cost))throw Error('COSTO_NON_VALIDO');
 const rate=cost<=100?.30:cost<=500?.25:cost<=1000?.20:cost<=5000?.15:.05;
 return {rate,price:round(cost*(1+rate))};
}
function line(input){
 if(!input||typeof input!=='object')throw Error('VOCE_NON_VALIDA');
 const {id,description,kind,quantity,unitPrice,vatRate}=input;
 if(typeof id!=='string'||!id.trim()||typeof description!=='string'||!description.trim())throw Error('ID_DESCRIZIONE_OBBLIGATORI');
 if(!Object.values(TYPE).includes(kind))throw Error('TIPO_VOCE_NON_VALIDO');
 if(!Number.isFinite(quantity)||quantity<=0||!money(unitPrice))throw Error('QUANTITA_PREZZO_NON_VALIDI');
 if(![0,.04,.10,.22].includes(vatRate))throw Error('ALIQUOTA_NON_VALIDA');
 const net=round(quantity*unitPrice),vat=round(net*vatRate);
 return {id:id.trim(),description:description.trim(),kind,quantity,unitPrice:round(unitPrice),vatRate,net,vat,gross:round(net+vat)};
}
function build({id,clientId,siteId,validDays=30,issuedAt,lines,notes=''}) {
 if(!id||!clientId||!siteId||!Array.isArray(lines)||!lines.length)throw Error('TESTATA_O_VOCI_MANCANTI');
 if(![15,30].includes(validDays))throw Error('VALIDITA_NON_VALIDA');
 if(typeof issuedAt!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(issuedAt)||Number.isNaN(Date.parse(issuedAt+'T12:00:00Z')))throw Error('DATA_NON_VALIDA');
 const normalized=lines.map(line),ids=new Set(normalized.map(x=>x.id));
 if(ids.size!==normalized.length)throw Error('ID_VOCE_DUPLICATO');
 const totals=normalized.reduce((a,x)=>{a.net=round(a.net+x.net);a.vat=round(a.vat+x.vat);a.gross=round(a.gross+x.gross);a.byKind[x.kind]=round((a.byKind[x.kind]||0)+x.net);return a},{net:0,vat:0,gross:0,byKind:{}});
 const expiry=new Date(issuedAt+'T12:00:00Z');expiry.setUTCDate(expiry.getUTCDate()+validDays);
 return {id:String(id),clientId:String(clientId),siteId:String(siteId),issuedAt,expiresAt:expiry.toISOString().slice(0,10),validDays,lines:normalized,totals,notes:String(notes)};
}
function addPair(lines,{id,description,supplyPrice,installationPrice,quantity=1,vatRate=.10}){
 if(!Array.isArray(lines)||!id||!description)throw Error('COPPIA_NON_VALIDA');
 if(!money(supplyPrice)||!money(installationPrice))throw Error('PREZZI_NON_VALIDI');
 return lines.concat([
 {id:id+'-F',description:'Fornitura '+description,kind:TYPE.SUPPLY,quantity,unitPrice:supplyPrice,vatRate},
 {id:id+'-P',description:'Posa '+description,kind:TYPE.INSTALL,quantity,unitPrice:installationPrice,vatRate}
 ]);
}
function crmText(item){return line(item).description}
function classifyDocument({type,issuerIsITE=false,isCourtesyCopy=false}){
 const t=String(type||'').toUpperCase().trim();
 if(t==='TD04')return {category:issuerIsITE?'NOTA_CREDITO_VENDITA':'NOTA_CREDITO_ACQUISTO',paymentDue:false,recoveryStatus:'DA_RECUPERARE'};
 if(isCourtesyCopy||t==='PR'||t==='PROFORMA')return {category:'PROFORMA',paymentDue:false};
 if(t==='TD01'||t==='TD24'||t==='FATTURA')return {category:issuerIsITE?'FATTURA_VENDITA':'FATTURA_ACQUISTO',paymentDue:true};
 return {category:'DA_VERIFICARE',paymentDue:false};
}
const api=Object.freeze({TYPE,markup,line,build,addPair,crmText,classifyDocument});
root.ITECommercial=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
