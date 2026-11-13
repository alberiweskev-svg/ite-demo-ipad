/* I.T.E. 4.0.213 — local-only XML invoice preview; never uploads source files.
   This parser is intentionally conservative: unsupported documents are rejected. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITEFiscalXML213=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const MAX=750000,fail=s=>{throw Error(s);};
function clean(s){return String(s||"").trim();}
function cents(raw){const s=clean(raw);if(!/^-?\d{1,10}(?:\.\d{1,2})?$/.test(s))fail("IMPORTO_XML_NON_VALIDO");const neg=s[0]==="-",v=neg?s.slice(1):s;const [a,b=""]=v.split(".");const n=Number(a)*100+Number(b.padEnd(2,"0"));if(!Number.isSafeInteger(n))fail("IMPORTO_XML_NON_VALIDO");return neg?-n:n;}
function parse(xml,parser){if(typeof xml!=="string"||xml.length>MAX||xml.length<20)fail("XML_DIMENSIONE_NON_VALIDA");if(/<!DOCTYPE|<!ENTITY/i.test(xml))fail("XML_ENTITA_NON_CONSENTITE");if(typeof parser!=="function")fail("PARSER_XML_NON_DISPONIBILE");const doc=parser(xml);if(!doc||!doc.documentElement||doc.getElementsByTagName("parsererror").length)fail("XML_MALFORMATO");
const local=n=>n.localName||n.nodeName.split(":").pop();
function first(parent,name){if(!parent)return null;for(const node of parent.getElementsByTagName("*"))if(local(node)===name)return node;return null;}
function value(parent,name){const el=first(parent,name);return el?clean(el.textContent):"";}
const rootName=local(doc.documentElement);if(rootName!=="FatturaElettronica")fail("FORMATO_NON_FATTURA_ELETTRONICA");
const header=first(doc.documentElement,"FatturaElettronicaHeader"),body=first(doc.documentElement,"FatturaElettronicaBody"),general=first(body,"DatiGeneraliDocumento");if(!header||!general)fail("FATTURA_INCOMPLETA");
const code=value(general,"TipoDocumento"),number=value(general,"Numero"),date=value(general,"Data"),grossRaw=value(general,"ImportoTotaleDocumento");
if(!["TD01","TD04"].includes(code))fail("TIPO_DOCUMENTO_NON_SUPPORTATO");if(!number||number.length>100||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+"T00:00:00Z"))||new Date(date+"T00:00:00Z").toISOString().slice(0,10)!==date)fail("ESTREMI_NON_VALIDI");
const supplier=first(header,"CedentePrestatore"),customer=first(header,"CessionarioCommittente");if(!supplier||!customer)fail("CONTROPARTI_MANCANTI");
const identity=p=>value(p,"IdCodice")||value(p,"CodiceFiscale")||value(p,"Denominazione")||[value(p,"Nome"),value(p,"Cognome")].filter(Boolean).join(" ");
const seller=identity(supplier),buyer=identity(customer);if(!seller||!buyer)fail("CONTROPARTI_MANCANTI");
const summaries=[];for(const n of body.getElementsByTagName("*"))if(local(n)==="DatiRiepilogo")summaries.push(n);if(!summaries.length)fail("RIEPILOGO_IVA_MANCANTE");
let net=0,vat=0;for(const row of summaries){net+=cents(value(row,"ImponibileImporto"));vat+=cents(value(row,"Imposta"));}let gross=net+vat;
if(grossRaw){const stated=cents(grossRaw);if(Math.abs(Math.abs(stated)-Math.abs(gross))>2)fail("TOTALE_XML_DIVERGENTE");gross=stated;}
if(code==="TD04"){net=-Math.abs(net);vat=-Math.abs(vat);gross=-Math.abs(gross);}else if(net<0||vat<0||gross<0)fail("TOTALI_NEGATIVI");
return Object.freeze({documentCode:code,number,date,seller,buyer,netCents:net,vatCents:vat,grossCents:gross,requiresDirection:true,requiresCreditReference:code==="TD04",source:"LOCAL_XML_PREVIEW",warnings:["Verificare manualmente direzione, controparte, natura IVA, arrotondamenti e riferimento TD04. Nessuna registrazione automatica."]});}
function toLedger(preview,{direction,id,counterpartyId,referenceId}={}){if(!preview||preview.source!=="LOCAL_XML_PREVIEW"||!["IN","OUT"].includes(direction)||!id||!counterpartyId)fail("CONFERMA_MANUALE_INCOMPLETA");const type=preview.documentCode==="TD04"?"NOTA_CREDITO":direction==="IN"?"ACQUISTO":"VENDITA";if(type==="NOTA_CREDITO"&&!referenceId)fail("RIFERIMENTO_TD04_OBBLIGATORIO");return {id,direction,type,documentCode:preview.documentCode,number:preview.number,date:preview.date,counterpartyId,netCents:preview.netCents,vatCents:preview.vatCents,grossCents:preview.grossCents,...(type==="NOTA_CREDITO"?{referenceId}:{}) ,status:"DA_VERIFICARE"};}
return Object.freeze({parse,toLedger,cents,MAX});});
