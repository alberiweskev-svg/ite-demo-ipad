/* I.T.E. 4.0 — milestone integrated domain core. Synthetic fixtures only; no production migration. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITEIntegratedCore225=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const TYPES=["clients","sites","plants","equipment","appointments","interventions","quotes","invoices","documents"];
const KINDS=["ACQUISTO","VENDITA","PROFORMA","TD04"];
const DOCS=["DICO","DIRI","POS","CAD","GAS","ALLEGATO"];
const clone=x=>JSON.parse(JSON.stringify(x));
const str=(x,n=180)=>typeof x==="string"&&x.trim().length>0&&x.length<=n;
function blank(){return {schema:"ITE_CORE_225",revision:0,clients:[],sites:[],plants:[],equipment:[],appointments:[],interventions:[],quotes:[],invoices:[],documents:[]};}
function validate(state){
 if(!state||state.schema!=="ITE_CORE_225"||!Number.isSafeInteger(state.revision)||state.revision<0)throw Error("SCHEMA_NON_VALIDO");
 const ids={};for(const type of TYPES){if(!Array.isArray(state[type])||state[type].length>10000)throw Error("COLLEZIONE_NON_VALIDA:"+type);
 ids[type]=new Set();for(const item of state[type]){if(!item||!str(item.id,64)||ids[type].has(item.id))throw Error("ID_NON_VALIDO:"+type);ids[type].add(item.id);}}
 const link=(type,id,from)=>{if(!ids[type].has(id))throw Error("RELAZIONE_NON_VALIDA:"+from+"->"+type);};
 state.clients.forEach(x=>{if(!str(x.name))throw Error("CLIENTE_NON_VALIDO");});
 state.sites.forEach(x=>{link("clients",x.clientId,"sites");if(!str(x.address))throw Error("SEDE_NON_VALIDA");});
 state.plants.forEach(x=>{link("sites",x.siteId,"plants");if(!str(x.type))throw Error("IMPIANTO_NON_VALIDO");});
 state.equipment.forEach(x=>{link("plants",x.plantId,"equipment");if(!str(x.type))throw Error("APPARECCHIO_NON_VALIDO");});
 const validDate=x=>typeof x==="string"&&/^\d{4}-\d\d-\d\dT\d\d:\d\d/.test(x)&&Number.isFinite(Date.parse(x));
 state.appointments.forEach(x=>{link("sites",x.siteId,"appointments");if(!str(x.operator)||!validDate(x.start)||!validDate(x.end)||Date.parse(x.end)<=Date.parse(x.start))throw Error("APPUNTAMENTO_NON_VALIDO");});
 state.interventions.forEach(x=>{link("sites",x.siteId,"interventions");if(x.equipmentId)link("equipment",x.equipmentId,"interventions");if(x.appointmentId){link("appointments",x.appointmentId,"interventions");const a=state.appointments.find(y=>y.id===x.appointmentId);if(a.siteId!==x.siteId)throw Error("SEDE_APPUNTAMENTO_DIVERSA");}if(!str(x.operator)||!["APERTO","IN_CORSO","CHIUSO"].includes(x.status))throw Error("INTERVENTO_NON_VALIDO");if(x.arrival&& !validDate(x.arrival)||x.exit&&!validDate(x.exit)||x.arrival&&x.exit&&Date.parse(x.exit)<Date.parse(x.arrival))throw Error("TEMPI_NON_VALIDI");});
 state.quotes.forEach(x=>{link("clients",x.clientId,"quotes");if(!Array.isArray(x.lines)||!["BOZZA","INVIATO","ACCETTATO","RIFIUTATO"].includes(x.status))throw Error("PREVENTIVO_NON_VALIDO");let lineIds=new Set();x.lines.forEach(l=>{if(!str(l.id)||lineIds.has(l.id)||!["FORNITURA","POSA","EXTRA_FORNITURA","EXTRA_POSA","SMONTAGGIO","SMALTIMENTO"].includes(l.kind)||!str(l.description,1000)||!Number.isSafeInteger(l.cents)||l.cents<0||!Number.isInteger(l.qty)||l.qty<1)throw Error("RIGA_NON_VALIDA");lineIds.add(l.id);});});
 state.invoices.forEach(x=>{link("clients",x.clientId,"invoices");if(!KINDS.includes(x.kind)||!str(x.number)||!Number.isSafeInteger(x.cents)||x.cents<0)throw Error("FATTURA_NON_VALIDA");if(x.quoteId)link("quotes",x.quoteId,"invoices");if(x.kind==="TD04"&&!str(x.originalInvoiceId))throw Error("NOTA_CREDITO_SENZA_ORIGINE");if(x.originalInvoiceId)link("invoices",x.originalInvoiceId,"invoices");});
 state.documents.forEach(x=>{if(!DOCS.includes(x.kind)||!str(x.filename,255)||!/^application\/pdf$/.test(x.mime)||!Number.isInteger(x.bytes)||x.bytes<0||x.bytes>20000000)throw Error("DOCUMENTO_NON_VALIDO");if(x.clientId)link("clients",x.clientId,"documents");if(x.siteId)link("sites",x.siteId,"documents");if(x.payload||x.base64||x.url)throw Error("CONTENUTO_PDF_NON_AMMESSO");});
 // Relazioni trasversali: una chiave esistente non basta se appartiene a un'altra sede o cliente.
 const byId=type=>new Map(state[type].map(item=>[item.id,item]));
 const sites=byId("sites"),plants=byId("plants"),equipment=byId("equipment"),appointments=byId("appointments"),quotes=byId("quotes"),invoices=byId("invoices");
 state.interventions.forEach(x=>{
  if(x.equipmentId&&plants.get(equipment.get(x.equipmentId).plantId).siteId!==x.siteId)throw Error("APPARECCHIO_SEDE_DIVERSA");
  if(x.appointmentId&&appointments.get(x.appointmentId).operator!==x.operator)throw Error("OPERATORE_APPUNTAMENTO_DIVERSO");
 });
 state.invoices.forEach(x=>{
  if(x.quoteId&&quotes.get(x.quoteId).clientId!==x.clientId)throw Error("CLIENTE_PREVENTIVO_FATTURA_DIVERSO");
  if(x.kind==="TD04"){const original=invoices.get(x.originalInvoiceId);if(!original||original.kind!=="VENDITA"||original.clientId!==x.clientId)throw Error("TD04_ORIGINALE_NON_VALIDO");}
 });
 state.documents.forEach(x=>{if(x.clientId&&x.siteId&&sites.get(x.siteId).clientId!==x.clientId)throw Error("DOCUMENTO_CLIENTE_SEDE_DIVERSI");});

 return true;
}
function totals(quote){let cents=0;for(const l of quote.lines)cents+=l.cents*l.qty;if(!Number.isSafeInteger(cents))throw Error("TOTALE_NON_VALIDO");return {cents,eur:(cents/100).toFixed(2)};}
function createStore(initial){let current=clone(initial||blank());validate(current);return Object.freeze({
 snapshot:()=>clone(current),
 transact:(expectedRevision,mutate)=>{if(expectedRevision!==current.revision)throw Error("REVISIONE_CONFLITTO");const next=clone(current);mutate(next);next.revision++;validate(next);current=next;return clone(current);},
 exportMetadata:()=>JSON.stringify(current),
 importMetadata:(raw,expectedRevision)=>{if(typeof raw!=="string"||raw.length>3000000)throw Error("IMPORT_TROPPO_GRANDE");const next=JSON.parse(raw);validate(next);if(expectedRevision!==current.revision)throw Error("REVISIONE_CONFLITTO");current={...clone(next),revision:current.revision+1};return clone(current);}
 });}
function add(store,type,item){if(!TYPES.includes(type))throw Error("TIPO_NON_VALIDO");const revision=store.snapshot().revision;return store.transact(revision,s=>{s[type].push(clone(item));});}
return Object.freeze({TYPES,KINDS,DOCS,blank,validate,totals,createStore,add});
});
