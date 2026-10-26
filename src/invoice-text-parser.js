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
  var total=t.match(/(?:^|\n)\s*totale\s*(?:documento|fattura)?\s*[:€\s]*([\d.,]+)\s*(?:€)?\s*(?:\n|$)/im);
  var due=t.match(/(?:scadenza|scadenze)\s*[:\n\s]*(\d{2}[\/-]\d{2}[\/-]\d{4})/i);
  var result={tipo_documento:invoice?'fattura':null,direzione:invoice?'da_verificare':null,numero_documento:invoice?invoice[1]:null,data_emissione:invoice?parseDate(invoice[2]):null,totale_documento:total?parseItalianMoney(total[1]):null,scadenza:due?parseDate(due[1]):null,origine:'testo_fornito',richiede_conferma:true};
  return result;
}
var api={parseItalianMoney:parseItalianMoney,parseDate:parseDate,extractInvoiceText:extractInvoiceText};
if(typeof module==='object'&&module.exports)module.exports=api;
else root.ITEInvoiceText=api;
})(typeof globalThis!=='undefined'?globalThis:this);
