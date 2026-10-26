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
  var lines=t.split('\n').map(function(x){return x.trim();}).filter(Boolean);
  var invoice=t.match(/(?:copia\s+di\s+cortesia\s+)?fattura\s*(?:n(?:r|°|º|\.)*\.?\s*)?(\d+(?:[\/-][a-z0-9]+)?)\s*(?:del|data)\s*(\d{2}[\/-]\d{2}[\/-]\d{4})/i);
  var number=invoice?invoice[1]:null;
  var proforma=!!(number&&/\/PR$/i.test(number));
  function amount(label){
    var re=new RegExp('^(?:'+label+')[ \\t]*[:\\-]?[ \\t]*(?:€[ \\t]*)?([0-9][0-9.]*,[0-9]{2})(?=[ \\t€]|$)','i');
    for(var i=0;i<lines.length;i++){var m=lines[i].match(re);if(m)return parseItalianMoney(m[1]);}
    return null;
  }
  var taxable=amount('imponibile|totale[ \\t]+imponibile|base[ \\t]+imponibile');
  var vat=amount('totale[ \\t]+iva|importo[ \\t]+iva|iva[ \\t]+importo');
  var total=amount('totale(?:[ \\t]+documento|[ \\t]+fattura|[ \\t]+da[ \\t]+pagare)?|importo[ \\t]+totale');
  var rateMatch=t.match(/(?:aliquota(?:\s+iva)?|iva)\s*[:\s]*(\d{1,2}(?:[.,]\d+)?)\s*%/i);
  var reverse=/reverse\s*charge|inversione\s+contabile/i.test(t);
  var client=null;
  for(var j=0;j<lines.length;j++){
    var header=lines[j].match(/^(?:destinatario|cliente|cessionario\s*\/\s*committente|intestatario)\s*:?\s*(.*)$/i);
    if(!header)continue;
    var candidate=header[1].trim()||lines[j+1]||'';
    candidate=candidate.split(/\s{3,}|\s+copia\s+di\s+cortesia/i)[0].trim();
    if(candidate&&!/fattura|copia\s+di\s+cortesia|oscurat|omissis|redatt/i.test(candidate)&&!/^[-*xX#█•.\s]+$/.test(candidate))client=candidate;
    break;
  }
  var due=null;
  var dueMatch=t.match(/(?:^|\n)\s*scadenze?\s*:?\s*\n?\s*(\d{2}[\/-]\d{2}[\/-]\d{4})/im);
  if(dueMatch)due=parseDate(dueMatch[1]);
  var missing=[];
  if(!client)missing.push('Cliente non individuato');
  if(taxable===null)missing.push('Imponibile non individuato');
  if(vat===null&&!reverse)missing.push('Importo IVA non individuato');
  if(total===null)missing.push('Totale non individuato');
  return {tipo_documento:invoice?(proforma?'proforma':'fattura'):null,
    direzione:invoice?'da_verificare':null,numero_documento:number,
    data_emissione:invoice?parseDate(invoice[2]):null,
    cliente:client,cliente_stato:client?'Da verificare':'Cliente non individuato',
    imponibile:taxable,importo_iva:vat,
    aliquota_iva:rateMatch?Number(rateMatch[1].replace(',','.')):null,
    reverse_charge:reverse,totale_documento:total,scadenza:due,
    anomalie:missing,origine:'testo_fornito',richiede_conferma:true};
}
var api={parseItalianMoney:parseItalianMoney,parseDate:parseDate,extractInvoiceText:extractInvoiceText};
if(typeof module==='object'&&module.exports)module.exports=api;
else root.ITEInvoiceText=api;
})(typeof globalThis!=='undefined'?globalThis:this);
