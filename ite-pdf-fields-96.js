/* I.T.E. 4.0.96 - estrazione assistita TEST; nessun invio o conservazione del PDF. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITEPDFFields96=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const MAX=15*1024*1024,MAX_TEXT=150000,SCHEMA="ITE-PDF-FIELDS-TEST-96";
const clean=x=>String(x||"").normalize("NFKC").replace(/[\u0000-\u001f]+/g," ").replace(/\s+/g," ").trim();
function extract(text,options){
 if(typeof text!=="string"||text.length>MAX_TEXT)throw Error("Testo PDF non valido o troppo lungo");
 const s=text.replace(/\r/g,""),upper=s.toUpperCase(),o=options||{};
 const type=/\bTD04\b|NOTA\s+DI\s+CREDITO/i.test(s)?"NOTA_CREDITO_TD04":/PRO\s?FORMA|\bPR\s*[-/]?\s*\d+/i.test(s)?"PROFORMA":/DICHIARAZIONE\s+DI\s+RISPONDENZA|DI\.?RI\.?/i.test(s)?"DIRI":/DICHIARAZIONE\s+DI\s+CONFORMIT|DI\.?CO\.?/i.test(s)?(/ELETTRIC|CEI|QUADRO/i.test(s)?"DICO_ELETTRICO":/IDRIC|SANITAR|ACQUA/i.test(s)?"DICO_IDRICO":"DA_VERIFICARE"):/ALLEGAT[IO]\s+GAS/i.test(s)?"ALLEGATI_GAS":/PIANO\s+OPERATIVO\s+DI\s+SICUREZZA/i.test(s)?"POS":/FATTURA|\bTD01\b|\bTD24\b/i.test(s)?(o.issuerIsITE===true?"FATTURA_VENDITA":o.issuerIsITE===false?"FATTURA_ACQUISTO":"DA_VERIFICARE"):"DA_VERIFICARE";
 const rules={number:/(?:NUMERO\s+(?:DOCUMENTO|FATTURA|DICHIARAZIONE)|N[.°º]\s*(?:FATTURA|DOCUMENTO)?|FATTURA\s*N[.°º]?)\s*[:#-]?\s*([A-Z0-9][A-Z0-9\/-]{0,28})/i,date:/(?:DATA\s+(?:DOCUMENTO|EMISSIONE|FATTURA)?|DEL)\s*[:\-]?\s*(\d{2}[/.\-]\d{2}[/.\-]\d{4})/i,vat:/(?:P\.?\s*IVA|PARTITA\s+IVA)\s*[:\-]?\s*(?:IT\s*)?(\d{11})/i,amount:/(?:TOTALE\s+(?:DOCUMENTO|FATTURA|DA\s+PAGARE)?|IMPORTO\s+TOTALE)\s*[:€\s]*([\d.]+,\d{2})/i,customer:/(?:COMMITTENTE|DESTINATARIO|CLIENTE)\s*[:\-]\s*([^\n]{2,100})/i,system:/(?:TIPOLOGIA\s+IMPIANTO|IMPIANTO\s+REALIZZATO)\s*[:\-]\s*([^\n]{2,100})/i};
 const fields={},evidence={};for(const [key,re] of Object.entries(rules)){const m=re.exec(s);if(m){fields[key]=clean(m[1]).slice(0,100);evidence[key]=clean(m[0]).slice(0,130);}}
 const warnings=["ESTRAZIONE_NON_VERIFICATA","NON_USARE_PER_EMISSIONE_O_CONTABILIZZAZIONE"];if(type==="DA_VERIFICARE")warnings.push("TIPO_DA_VERIFICARE");if(!Object.keys(fields).length)warnings.push("NESSUN_CAMPO_RICONOSCIUTO");
 return {schema:SCHEMA,type,fields,evidence,warnings,reviewRequired:true,officialReady:false};
}
async function readPDF(file,pdfjs){
 if(!file||file.size>MAX||file.size<1||!/\.pdf$/i.test(file.name||""))throw Error("Selezionare un PDF TEST fino a 15 MB");
 if(!pdfjs||typeof pdfjs.getDocument!=="function")throw Error("Lettore PDF.js non disponibile: nessun documento acquisito");
 const bytes=new Uint8Array(await file.arrayBuffer());if(String.fromCharCode(...bytes.slice(0,5))!=="%PDF-")throw Error("Firma PDF non valida");
 const task=pdfjs.getDocument({data:bytes,useSystemFonts:true,disableFontFace:true});let pdf;
 try{pdf=await task.promise;if(pdf.numPages>50)throw Error("PDF oltre 50 pagine");let text="";
  for(let p=1;p<=pdf.numPages;p++){const page=await pdf.getPage(p),content=await page.getTextContent();text+=content.items.map(x=>x.str||"").join(" ")+"\n";if(text.length>MAX_TEXT)throw Error("Testo oltre il limite");}
  return text;
 }finally{if(pdf&&pdf.destroy)await pdf.destroy();else if(task.destroy)await task.destroy();}
}
return Object.freeze({SCHEMA,MAX,extract,readPDF});
});