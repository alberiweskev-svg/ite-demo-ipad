/* I.T.E. 4.0.183 — registro documenti TEST. Non emette fatture fiscali. */
(function(root){"use strict";
const TYPES=Object.freeze(["VENDITA","ACQUISTO","PROFORMA","TD04"]);
const copy=x=>JSON.parse(JSON.stringify(x));
const validDate=s=>typeof s==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+"T00:00:00Z"))&&new Date(s+"T00:00:00Z").toISOString().slice(0,10)===s;
const money=n=>Number.isFinite(n)&&n>=0&&Number.isSafeInteger(Math.round(n*100))?Math.round(n*100):null;
function validate(doc){
 const errors=[];if(!doc||typeof doc!=="object"||Array.isArray(doc))return ["DOCUMENTO_INVALIDO"];
 if(!TYPES.includes(doc.type))errors.push("TIPO_INVALIDO");
 if(typeof doc.id!=="string"||!/^[-A-Za-z0-9_]{1,64}$/.test(doc.id))errors.push("ID_INVALIDO");
 if(typeof doc.number!=="string"||!doc.number.trim()||doc.number.length>80)errors.push("NUMERO_INVALIDO");
 if(!validDate(doc.date))errors.push("DATA_INVALIDA");
 if(typeof doc.counterparty!=="string"||!doc.counterparty.trim()||doc.counterparty.length>180)errors.push("CONTROPARTE_INVALIDA");
 if(doc.type==="TD04"&&(!doc.reference||typeof doc.reference.number!=="string"||!doc.reference.number.trim()||!validDate(doc.reference.date)))errors.push("RIFERIMENTO_TD04");
 if(!Array.isArray(doc.lines)||doc.lines.length===0||doc.lines.length>200)errors.push("RIGHE_INVALIDe");
 else for(let i=0;i<doc.lines.length;i++){const l=doc.lines[i];if(!l||typeof l.description!=="string"||!l.description.trim()||l.description.length>500||money(l.unitPrice)===null||!Number.isSafeInteger(l.quantity)||l.quantity<=0||l.quantity>100000||![0,4,5,10,22].includes(l.vatRate))errors.push("RIGA_"+i);}
 if(doc.status!==undefined&&!["BOZZA","REGISTRATO","ANNULLATO"].includes(doc.status))errors.push("STATO_INVALIDO");
 return errors;
}
function totals(doc){const errs=validate(doc);if(errs.length)throw Error(errs.join(","));let net=0,vat=0;const vatGroups={};for(const l of doc.lines){const amount=money(l.unitPrice*l.quantity);if(amount===null)throw Error("IMPORTO_FUORI_LIMITE");const tax=Math.round(amount*l.vatRate/100);if(!Number.isSafeInteger(net+amount)||!Number.isSafeInteger(vat+tax))throw Error("TOTALE_FUORI_LIMITE");net+=amount;vat+=tax;const k=String(l.vatRate);if(!vatGroups[k])vatGroups[k]={netCents:0,vatCents:0};vatGroups[k].netCents+=amount;vatGroups[k].vatCents+=tax;}return {netCents:net,vatCents:vat,totalCents:net+vat,vatGroups};}
function createStore(docs=[]){const store={schema:"ITE_FISCAL_TEST_183",documents:[]};for(const d of docs)add(store,d);return store;}
function add(store,doc){if(!store||store.schema!=="ITE_FISCAL_TEST_183"||!Array.isArray(store.documents))throw Error("ARCHIVIO_INVALIDO");const errs=validate(doc);if(errs.length)throw Error(errs.join(","));if(store.documents.some(x=>x.id===doc.id))throw Error("ID_DUPLICATO");if(store.documents.some(x=>x.type===doc.type&&x.number===doc.number&&x.date.slice(0,4)===doc.date.slice(0,4)))throw Error("NUMERO_DUPLICATO");const clean=copy(doc);clean.status=clean.status||"BOZZA";clean.totals=totals(clean);store.documents.push(clean);return copy(clean);}
function transition(store,id,status){if(!["REGISTRATO","ANNULLATO"].includes(status))throw Error("STATO_NON_AMMESSO");const d=store.documents.find(x=>x.id===id);if(!d)throw Error("DOCUMENTO_ASSENTE");if(d.status!=="BOZZA")throw Error("DOCUMENTO_BLOCCATO");d.status=status;return copy(d);}
function summary(store){if(!store||store.schema!=="ITE_FISCAL_TEST_183")throw Error("ARCHIVIO_INVALIDO");const result={count:0,byType:{},issues:[]};const ids=new Set();for(const d of store.documents){if(ids.has(d.id))result.issues.push("ID_DUPLICATO:"+d.id);ids.add(d.id);const e=validate(d);if(e.length){result.issues.push(...e.map(x=>d.id+":"+x));continue;}const t=totals(d);if(JSON.stringify(t)!==JSON.stringify(d.totals))result.issues.push(d.id+":TOTALE_ALTERATO");const group=result.byType[d.type]||(result.byType[d.type]={count:0,netCents:0,vatCents:0,totalCents:0});group.count++;group.netCents+=t.netCents;group.vatCents+=t.vatCents;group.totalCents+=t.totalCents;result.count++;}return copy(result);}
function exportTest(store){const report=summary(store);if(report.issues.length)throw Error("ARCHIVIO_INCOERENTE");return JSON.stringify({schema:store.schema,documents:store.documents},null,2);}
function importTest(text){if(typeof text!=="string"||text.length>2000000)throw Error("DIMENSIONE_NON_VALIDA");const data=JSON.parse(text);if(!data||data.schema!=="ITE_FISCAL_TEST_183"||!Array.isArray(data.documents)||data.documents.length>5000)throw Error("FORMATO_NON_VALIDO");const store=createStore(data.documents);for(let i=0;i<data.documents.length;i++){const original=data.documents[i];if(!original.totals||JSON.stringify(original.totals)!==JSON.stringify(store.documents[i].totals))throw Error("ARCHIVIO_INCOERENTE");}if(summary(store).issues.length)throw Error("ARCHIVIO_INCOERENTE");return store;}
const api=Object.freeze({TYPES,validate,totals,createStore,add,transition,summary,exportTest,importTest});if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ITE_FiscalTest183=api;
})(typeof globalThis!=="undefined"?globalThis:this);
