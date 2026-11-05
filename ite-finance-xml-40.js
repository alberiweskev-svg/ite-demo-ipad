/* I.T.E. 4.0: lettura locale XML FatturaPA esclusivamente sintetici TEST. */
(function(root){'use strict';
const batch=root.ITEFinanceBatch40||(typeof require==='function'?require('./ite-finance-batch-40.js'):null);
function decode(s){return String(s).replace(/&(?:amp|lt|gt|quot|apos);/g,x=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'" }[x]));}
function field(xml,tag){const m=xml.match(new RegExp('<(?:[A-Za-z_][\\w.-]*:)?'+tag+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[A-Za-z_][\\w.-]*:)?'+tag+'\\s*>','i'));return m?decode(m[1].trim()):'';}
function section(xml,tag){return field(xml,tag)}
function money(s){if(!/^-?\d+(?:[.,]\d{1,2})?$/.test(s))throw Error('IMPORTO_XML_NON_VALIDO');return Math.round(Number(s.replace(',','.'))*100)/100}
function parse(xml,identifier){
 if(typeof xml!=='string'||xml.length>500000||/<!DOCTYPE|<!ENTITY|<\?xml-stylesheet/i.test(xml))throw Error('XML_NON_SICURO');
 if(!/<(?:\w+:)?FatturaElettronica(?:\s|>)/i.test(xml))throw Error('NON_FATTURAPA');
 const body=section(xml,'FatturaElettronicaBody'),header=section(xml,'FatturaElettronicaHeader');
 if(!body||!header)throw Error('STRUTTURA_XML_INCOMPLETA');
 const general=section(body,'DatiGeneraliDocumento'),seller=section(header,'CedentePrestatore'),buyer=section(header,'CessionarioCommittente');
 const type=field(general,'TipoDocumento').toUpperCase(),number=field(general,'Numero'),date=field(general,'Data');
 if(!['TD01','TD04','TD06','TD24','TD25'].includes(type))throw Error('TIPO_XML_NON_SUPPORTATO');
 const sellerName=field(section(seller,'Anagrafica'),'Denominazione')||field(section(seller,'Anagrafica'),'Nome');
 const buyerName=field(section(buyer,'Anagrafica'),'Denominazione')||field(section(buyer,'Anagrafica'),'Nome');
 if(!/^TEST(?:[-\s]|$)/i.test(number)||!/^TEST(?:[-\s]|$)/i.test(sellerName)||!/^TEST(?:[-\s]|$)/i.test(buyerName))throw Error('SOLO_DATI_TEST');
 const issuer=/^TEST[-\s]ITE(?:[-\s]|$)/i.test(sellerName)?'ITE':/^TEST[-\s]ITE(?:[-\s]|$)/i.test(buyerName)?'ESTERNO':'INCERTO';
 const summaries=body.match(/<(?:[A-Za-z_][\\w.-]*:)?DatiRiepilogo(?:\\s[^>]*)?>/gi)||[];if(summaries.length!==1)throw Error('RIEPILOGHI_MULTIPLI_NON_SUPPORTATI');const summary=section(body,'DatiRiepilogo');if(!summary)throw Error('RIEPILOGO_MANCANTE');
 const net=money(field(summary,'ImponibileImporto')),vat=money(field(summary,'Imposta'));
 const total=net+vat;
 const declared=field(general,'ImportoTotaleDocumento');
 if(declared&&Math.abs(Math.abs(money(declared))-total)>0.02)throw Error('TOTALE_XML_NON_COERENTE');
 if(net<0||vat<0)throw Error('IMPORTO_NEGATIVO');
 const row={id:identifier,number,date,party:issuer==='ITE'?buyerName:sellerName,issuer,kind:type==='TD04'?'TD04':'FATTURA',net,vat,total:Math.round(total*100)/100};
 if(!batch)throw Error('BATCH_NON_DISPONIBILE');
 return batch.normalize(row);
}
const api=Object.freeze({parse});root.ITEFinanceXML40=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
