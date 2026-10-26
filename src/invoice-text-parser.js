(function(root){
'use strict';
function parseItalianMoney(value){
  if(typeof value!=='string')return null;
  var s=value.replace(/[€\s]/g,'').trim();
  if(!/^-?\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?$|^-?\d+(?:,\d{1,2})?$/.test(s))return null;
  var n=Number(s.replace(/\./g,'').replace(',','.'));
  return Number.isFinite(n)?n:null;
}
function parseDate(value){
  var m=String(value||'').match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);
  if(!m)return null;
  var d=new Date(Date.UTC(+m[3],+m[2]-1,+m[1]));
  return d.getUTCFullYear()===+m[3]&&d.getUTCMonth()===+m[2]-1&&d.getUTCDate()===+m[1]?m[3]+'-'+m[2]+'-'+m[1]:null;
}
function extractInvoiceText(text){
  if(typeof text!=='string'||text.length>1000000)throw new Error('Testo non valido o troppo grande');
  var t=text.replace(/\r/g,'').normalize('NFKC');
  var invoice=t.match(/(?:copia\s+di\s+cortesia\s+)?fattura\s*(?:n(?:\.|°|º|r\.?)?\s*)?(\d+[\w/-]*)\s*(?:del|data)\s*(\d{2}[\/-]\d{2}[\/-]\d{4})/i);
  var total=t.match(/(?:totale\s*(?:documento|fattura|da\s+pagare)?|importo\s+totale)\s*[:€\s-]*([\d.]+,\d{2}|\d+,\d{2}|\d+)\b/i);
  var due=t.match(/(?:scadenza|scadenze|data\s+scadenza|pagamento\s+entro)\s*[:\n\s-]*(\d{2}[\/-]\d{2}[\/-]\d{4})/i);
  function amountAfter(label){var m=t.match(new RegExp('(?:^|\\n)\\s*(?:'+label+')\\s*[:€\\s-]*([\\d.]+,\\d{2}|\\d+,\\d{2}|\\d+)\\b','im'));return m?parseItalianMoney(m[1]):null;}
  var taxable=amountAfter('imponibile(?:\\s+totale)?|totale\\s+imponibile|base\\s+imponibile');
  var vatAmount=amountAfter('importo\\s+iva|iva\\s+importo|totale\\s+iva|iva(?:\\s+\\d{1,2}(?:[.,]\\d+)?\\s*%)?');
  var vatRateMatch=t.match(/(?:aliquota\\s+iva|iva)\\s*[:\\s]*(\\d{1,2}(?:[.,]\\d+)?)\\s*%/i);
  var reverse=/reverse\\s*charge|inversione\\s+contabile|art\\.?\\s*17[^\\n]{0,65}(?:comma|c\\.|c\\s|lett)/i.test(t);
  var clientMatch=t.match(/(?:^|\\n)\\s*(?:cliente|cessionario\\s*\\/?\\s*committente|destinatario|intestatario)\\s*[:\\-]\\s*([^\\n]{3,100})/im);
  var clientName=clientMatch?clientMatch[1].trim():null;
  if(clientName&&(/^[x*#█•.\\s-]+$/i.test(clientName)||/oscurat|omissis|anonim|redatt/i.test(clientName)))clientName=null;
  var missing=[];if(!clientName)missing.push('Cliente non individuato');if(taxable===null)missing.push('Imponibile non individuato');if(vatAmount===null&&!reverse)missing.push('Importo IVA non individuato');
  var result={tipo_documento:invoice?'fattura':null,cliente:clientName,cliente_stato:clientName?'Da verificare':'Cliente non individuato',imponibile:taxable,importo_iva:vatAmount,aliquota_iva:vatRateMatch?Number(vatRateMatch[1].replace(',','.')):null,reverse_charge:reverse,anomalie:missing,direzione:invoice?'da_verificare':null,numero_documento:invoice?invoice[1]:null,data_emissione:invoice?parseDate(invoice[2]):null,totale_documento:total?parseItalianMoney(total[1]):null,scadenza:due?parseDate(due[1]):null,origine:'testo_fornito',richiede_conferma:true};
  return result;
}
var api={parseItalianMoney:parseItalianMoney,parseDate:parseDate,extractInvoiceText:extractInvoiceText};
if(typeof module==='object'&&module.exports)module.exports=api;
else root.ITEInvoiceText=api;
})(typeof globalThis!=='undefined'?globalThis:this);
