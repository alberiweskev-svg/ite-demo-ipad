/* I.T.E. 4.0: lettura locale XML FatturaPA esclusivamente sintetici TEST. */
(function(root){'use strict';
const batch=root.ITEFinanceBatch40||(typeof require==='function'?require('./ite-finance-batch-40.js'):null);
function decode(s){return String(s).replace(/&(?:amp|lt|gt|quot|apos);/g,x=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'" }[x]));}
function field(xml,tag){const m=xml.match(new RegExp('<(?:[A-Za-z_][\\w.-]*:)?'+tag+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[A-Za-z_][\\w.-]*:)?'+tag+'\\s*>','i'));return m?decode(m[1].trim()):'';}
function section(xml,tag){return field(xml,tag)}
function money(s){if(!/^-?\d+(?:[.,]\d{1,2})?$/.test(s))throw Error('IMPORTO_XML_NON_VALIDO');return Math.round(Number(s.replace(',','.'))*100)/100}
function parse(xml,identifier){
 if(typeof xml!=='string'||xml.length>500000||/<!DOCTYPE|<!ENTITY|<\?xml-stylesheet/i.test(xml))throw Error('XML_NON_SICURO');
 if(!/^\s*(?:<\?xml\s+[^?]*\?>\s*)?<(?:[A-Za-z_][\w.-]*:)?FatturaElettronica(?:\s[^>]*)?>[\s\S]*<\/(?:[A-Za-z_][\w.-]*:)?FatturaElettronica\s*>\s*$/i.test(xml))throw Error('NON_FATTURAPA');
 if((xml.match(/<(?:[A-Za-z_][\w.-]*:)?FatturaElettronicaHeader(?:\s[^>]*)?>/gi)||[]).length!==1)throw Error('HEADER_NON_UNICO');
 const bodies=xml.match(/<(?:[A-Za-z_][\w.-]*:)?FatturaElettronicaBody(?:\s[^>]*)?>/gi)||[];if(bodies.length!==1)throw Error('MULTI_BODY_NON_SUPPORTATO');
 const body=section(xml,'FatturaElettronicaBody'),header=section(xml,'FatturaElettronicaHeader');
 if(!body||!header)throw Error('STRUTTURA_XML_INCOMPLETA');
 const general=section(body,'DatiGeneraliDocumento'),seller=section(header,'CedentePrestatore'),buyer=section(header,'CessionarioCommittente');
 const type=field(general,'TipoDocumento').toUpperCase(),number=field(general,'Numero'),date=field(general,'Data');
 if(!['TD01','TD04','TD06','TD24','TD25'].includes(type))throw Error('TIPO_XML_NON_SUPPORTATO');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date+'T12:00:00Z'))||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date)throw Error('DATA_XML_NON_VALIDA');
 if(!number||number.length>180||!seller||!buyer)throw Error('ANAGRAFICA_XML_INCOMPLETA');
 const sellerName=field(section(seller,'Anagrafica'),'Denominazione')||field(section(seller,'Anagrafica'),'Nome');
 const buyerName=field(section(buyer,'Anagrafica'),'Denominazione')||field(section(buyer,'Anagrafica'),'Nome');
 if(!/^TEST(?:[-\s]|$)/i.test(number)||!/^TEST(?:[-\s]|$)/i.test(sellerName)||!/^TEST(?:[-\s]|$)/i.test(buyerName))throw Error('SOLO_DATI_TEST');
 const issuer=/^TEST[-\s]ITE(?:[-\s]|$)/i.test(sellerName)?'ITE':/^TEST[-\s]ITE(?:[-\s]|$)/i.test(buyerName)?'ESTERNO':'INCERTO';
 const summaries=body.match(/<(?:[A-Za-z_][\w.-]*:)?DatiRiepilogo(?:\s[^>]*)?>/gi)||[];
 if(!summaries.length||summaries.length>20)throw Error('RIEPILOGHI_NON_VALIDI');
 const segments=body.match(/<(?:[A-Za-z_][\w.-]*:)?DatiRiepilogo(?:\s[^>]*)?>[\s\S]*?<\/(?:[A-Za-z_][\w.-]*:)?DatiRiepilogo\s*>/gi)||[];
 if(segments.length!==summaries.length)throw Error('RIEPILOGHI_NON_VALIDI');
 let netCents=0,vatCents=0;
 for(const segment of segments){
   const n=money(field(segment,'ImponibileImporto')),v=money(field(segment,'Imposta'));
   if(n<0||v<0)throw Error('IMPORTO_NEGATIVO');
   const rate=field(segment,'AliquotaIVA'),nature=field(segment,'Natura');
   if(rate){const percent=Number(rate.replace(',','.'));if(!Number.isFinite(percent)||percent<0||percent>100)throw Error('ALIQUOTA_XML_NON_VALIDA');if(Math.abs(v-Math.round(n*percent)/100)>0.03&&!nature)throw Error('IVA_XML_NON_COERENTE');}
   if(n>10000000||v>10000000)throw Error('IMPORTO_XML_ECCESSIVO');
   netCents+=Math.round(n*100);vatCents+=Math.round(v*100);
 }
 const net=netCents/100,vat=vatCents/100,total=(netCents+vatCents)/100;
 const declared=field(general,'ImportoTotaleDocumento');
 if(declared&&Math.abs(Math.abs(Math.round(money(declared)*100))-(netCents+vatCents))>2)throw Error('TOTALE_XML_NON_COERENTE');
 const row={id:identifier,number,date,party:issuer==='ITE'?buyerName:sellerName,issuer,kind:type==='TD04'?'TD04':'FATTURA',net,vat,total:Math.round(total*100)/100};
 if(!batch)throw Error('BATCH_NON_DISPONIBILE');
 return batch.normalize(row);
}
const api=Object.freeze({parse});root.ITEFinanceXML40=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
