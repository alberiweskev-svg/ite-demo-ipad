(function(root){'use strict';
const MAX=1500000;
function text(node,tag){const found=node.getElementsByTagName(tag)[0];return found?String(found.textContent||'').trim():''}
function euro(value){const n=Number(String(value).replace(',','.'));if(!Number.isFinite(n)||n<0||n>1e10)throw Error('IMPORTO_XML_NON_VALIDO');return Math.round(n*100)/100}
function parse(xml,options={}){
 if(typeof xml!=='string'||xml.length>MAX)throw Error('XML_TROPPO_GRANDE');
 const Parser=options.DOMParser||root.DOMParser;if(!Parser)throw Error('PARSER_XML_NON_DISPONIBILE');
 if(/<!DOCTYPE|<!ENTITY/i.test(xml))throw Error('XML_ENTITA_NON_AMMESSE');
 const doc=new Parser().parseFromString(xml,'application/xml');
 if(doc.getElementsByTagName('parsererror').length)throw Error('XML_NON_VALIDO');
 const rootEl=doc.documentElement;
 if(!rootEl||!['FatturaElettronica','FatturaElettronicaSemplificata'].includes(rootEl.localName||rootEl.nodeName))throw Error('NON_FATTURA_ELETTRONICA');
 const headers=doc.getElementsByTagName('DatiGeneraliDocumento');
 const subjects=doc.getElementsByTagName('CedentePrestatore');
 const recipients=doc.getElementsByTagName('CessionarioCommittente');
 if(!headers.length||!subjects.length||!recipients.length)throw Error('FATTURA_INCOMPLETA');
 const invoices=Array.from(headers).map((h,i)=>{
  const type=text(h,'TipoDocumento'),number=text(h,'Numero'),date=text(h,'Data');
  if(!['TD01','TD04','TD24','TD25'].includes(type))throw Error('TIPO_DOCUMENTO_DA_VERIFICARE');
  if(!number||!/^\\d{4}-\\d{2}-\\d{2}$/.test(date))throw Error('ESTREMI_DOCUMENTO_NON_VALIDI');
  const body=h.closest&&h.closest('FatturaElettronicaBody');
  const summaries=body?Array.from(body.getElementsByTagName('DatiRiepilogo')):Array.from(doc.getElementsByTagName('DatiRiepilogo'));
  if(!summaries.length)throw Error('RIEPILOGO_ASSENTE');
  const taxable=summaries.reduce((s,x)=>s+euro(text(x,'ImponibileImporto')),0);
  const vat=summaries.reduce((s,x)=>s+euro(text(x,'Imposta')),0);
  const declared=text(h,'ImportoTotaleDocumento');
  const total=declared?euro(declared):Math.round((taxable+vat)*100)/100;
  if(Math.abs(Math.round((taxable+vat-total)*100))>1)throw Error('TOTALI_XML_INCOERENTI');
  return {type,number,issuedAt:date,taxable,vat,total,credit:type==='TD04',direction:'DA_VERIFICARE',supplierName:text(subjects[0],'Denominazione')||[text(subjects[0],'Nome'),text(subjects[0],'Cognome')].filter(Boolean).join(' '),customerName:text(recipients[0],'Denominazione')||[text(recipients[0],'Nome'),text(recipients[0],'Cognome')].filter(Boolean).join(' '),bodyIndex:i,status:'ANTEPRIMA_NON_REGISTRATA'};
 });
 return {format:'ITE40_XML_PREVIEW_V1',documents:invoices,warnings:['Solo anteprima locale: nessun salvataggio, nessuna attribuzione automatica acquisto/vendita, nessuna trasmissione dati.','Verificare intestatari, imponibile, IVA e note di credito prima della registrazione.']};
}
const api=Object.freeze({parse});root.ITE40FinanceXmlPreview=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
