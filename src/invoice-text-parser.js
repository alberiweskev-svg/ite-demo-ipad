(function(root){
'use strict';
function parseItalianMoney(value){
  if(typeof value!=='string')return null;
  var s=value.replace(/\u2212/g,'-').replace(/[€\s]/g,'').trim();
  // Le parentesi contabili indicano un importo negativo, anche nelle note di credito.
  if(/^\([0-9][0-9.,]*\)$/.test(s))s='-'+s.slice(1,-1);
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
  var t=text.replace(/\r/g,'').normalize('NFKC').replace(/\u2212/g,'-');
  var lines=t.split('\n').map(function(x){return x.trim();}).filter(Boolean);
  // Only accept an invoice heading, not a referenced invoice in a credit note or attachment.
  // A courtesy-copy heading may appear after the recipient name on the same line.
  var invoicePattern=/(?:copia[ \t]+di[ \t]+cortesia[ \t]+)?fattura[ \t]*(?:n(?:r|°|º|\.)*\.?[ \t]*)?(\d+(?:[\/-][a-z0-9]+)?)[ \t]*(?:del|data)[ \t]*(\d{2}[\/-]\d{2}[\/-]\d{4})/gi;
  var invoices=[], invoiceCandidate;
  while((invoiceCandidate=invoicePattern.exec(t))!==null){
    var prefix=t.slice(t.lastIndexOf('\n',invoiceCandidate.index-1)+1,invoiceCandidate.index).trim();
    if(!prefix||/^copia[ \t]+di[ \t]+cortesia\b/i.test(invoiceCandidate[0])){
      invoices.push(invoiceCandidate);
    }
  }
  var invoice=invoices[0]||null;
  var creditPattern=/(?:^|\n)\s*(?:copia\s+di\s+cortesia\s+)?nota\s+(?:di\s+)?(?:credito|accredito)\s*(?:n(?:r|°|º|\.)*\.?\s*)?(\d+(?:[\/-][a-z0-9]+)?)\s*(?:del|data)\s*(\d{2}[\/-]\d{2}[\/-]\d{4})/gim;
  var credits=[], creditCandidate;
  while((creditCandidate=creditPattern.exec(t))!==null)credits.push(creditCandidate);
  var credit=credits[0]||null;
  var isCredit=!!credit||/(?:^|\n)\s*(?:nota\s+(?:di\s+)?(?:credito|accredito)\b|TD04\b)|\btipo\s*documento\s*:?\s*TD04\b/im.test(t);
  var documentMatch=credit||(isCredit?null:invoice);
  var issueDate=documentMatch?parseDate(documentMatch[2]):null;
  var number=documentMatch?documentMatch[1]:null;
  var proforma=!isCredit&&!!(number&&/[\/-]PR$/i.test(number));
  var amountConflicts=[];
  function amount(label,fieldName){
    // Preserve negative signs before or after the euro symbol in credit-note amounts.
    var re=new RegExp('^(?:'+label+')[ \\t]*:?[ \\t]*(?:'+
      '(-?[ \\t]*€[ \\t]*-?|€[ \\t]*-?|-[ \\t]*|)([0-9][0-9.]*,[0-9]{2})'+
      '|(?:€[ \\t]*)?\\([ \\t]*(?:€[ \\t]*)?([0-9][0-9.]*,[0-9]{2})[ \\t]*\\)'+
      ')(?=[ \\t€]|$)','i');
    var found=[];
    for(var i=0;i<lines.length;i++){
      var m=lines[i].match(re);
      if(m){
        var value=m[3]!==undefined?parseItalianMoney('('+m[3]+')'):
          parseItalianMoney((m[1].indexOf('-')!==-1?'-':'')+m[2]);
        if(value!==null)found.push(value);
      }
    }
    if(found.length>1&&found.some(function(value){return Math.round(value*100)!==Math.round(found[0]*100);})){
      amountConflicts.push('Valori discordanti per '+fieldName+': verificare originale');
    }
    return found.length?found[0]:null;
  }
  var taxable=amount('imponibile|totale[ \\t]+imponibile|base[ \\t]+imponibile','imponibile');
  var vat=amount('totale[ \\t]+iva|importo[ \\t]+iva|iva[ \\t]+importo','IVA');
  var total=amount('totale(?:[ \\t]+documento|[ \\t]+fattura)?|importo[ \\t]+totale','totale');
  // Il netto da pagare puo' differire dal totale documento per ritenute o anticipi.
  var payable=amount('totale[ \\t]+da[ \\t]+pagare|netto[ \\t]+a[ \\t]+pagare','totale da pagare');
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
  var missing=amountConflicts.slice();
  // Repeated headings may be harmless copies; conflicting headings require manual review.
  // Never silently select a different document number or date.
  var headings=invoices.map(function(m){return 'fattura:'+m[1].toUpperCase()+':'+m[2].replace(/\//g,'-');})
    .concat(credits.map(function(m){return 'nota_credito:'+m[1].toUpperCase()+':'+m[2].replace(/\//g,'-');}));
  if(headings.length>1&&headings.some(function(value){return value!==headings[0];}))
    missing.push('Intestazioni documento discordanti: verificare originale');
  // Non correggere gli importi letti: segnala le differenze per verifica manuale.
  if(taxable!==null&&vat!==null&&total!==null){
    var deltaCents=Math.abs(Math.round((taxable+vat)*100)-Math.round(total*100));
    if(deltaCents>2)missing.push('Totale non coerente con imponibile e IVA: verificare sconti, ritenute, bollo e arrotondamenti');
  }
  if(isCredit&&!number)missing.push('Numero nota di credito non individuato');
  if(documentMatch&&!issueDate)missing.push('Data documento non valida: verificare originale');
  if(!client)missing.push('Cliente non individuato');
  if(taxable===null)missing.push('Imponibile non individuato');
  if(vat===null&&!reverse)missing.push('Importo IVA non individuato');
  if(total===null)missing.push('Totale non individuato');
  return {tipo_documento:isCredit?'nota_credito':invoice?(proforma?'proforma':'fattura'):null,
    direzione:(isCredit||invoice)?'da_verificare':null,numero_documento:number,
    data_emissione:issueDate,
    cliente:client,cliente_stato:client?'Da verificare':'Cliente non individuato',
    imponibile:taxable,importo_iva:vat,
    aliquota_iva:rateMatch?Number(rateMatch[1].replace(',','.')):null,
    reverse_charge:reverse,totale_documento:total,totale_da_pagare:payable,scadenza:due,
    anomalie:missing,origine:'testo_fornito',richiede_conferma:true};
}
var api={parseItalianMoney:parseItalianMoney,parseDate:parseDate,extractInvoiceText:extractInvoiceText};
if(typeof module==='object'&&module.exports)module.exports=api;
else root.ITEInvoiceText=api;
})(typeof globalThis!=='undefined'?globalThis:this);
