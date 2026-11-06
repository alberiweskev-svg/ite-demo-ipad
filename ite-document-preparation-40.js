/* I.T.E. 4.0.49 — Offline document preparation for TEST technical dossiers.
 * Structured field mapping only: no PDF extraction, uploads, network or real customer data.
 * Draft preparation does NOT constitute a signed or legally valid Di.Co./Di.Ri.
 */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITEDocumentPreparation40=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const TYPES=["DICO_ELETTRICO","DICO_IDRICO","DIRI","ALLEGATI_GAS","POS","ITE_CAD","RAPPORTO_INTERVENTO"];
const FIELD_LIMIT=250;
const REQUIRED={
 DICO_ELETTRICO:["committente","indirizzo","descrizioneImpianto","impresa","responsabileTecnico"],
 DICO_IDRICO:["committente","indirizzo","descrizioneImpianto","impresa","responsabileTecnico"],
 DIRI:["committente","indirizzo","descrizioneImpianto","professionista","verifiche"],
 ALLEGATI_GAS:["committente","indirizzo","tipoGas","apparecchi","prove"],
 POS:["cantiere","indirizzo","impresa","responsabile","rischi"],
 ITE_CAD:["titoloTavola","scala","descrizioneImpianto"],
 RAPPORTO_INTERVENTO:["committente","indirizzo","operatore","descrizioneLavori","esito"]
};
const LABELS={committente:"Committente",indirizzo:"Indirizzo",descrizioneImpianto:"Descrizione impianto",impresa:"Impresa",responsabileTecnico:"Responsabile tecnico",professionista:"Professionista",verifiche:"Verifiche",tipoGas:"Tipo gas",apparecchi:"Apparecchi",prove:"Prove",cantiere:"Cantiere",responsabile:"Responsabile",rischi:"Rischi",titoloTavola:"Titolo tavola",scala:"Scala",operatore:"Operatore",descrizioneLavori:"Lavori eseguiti",esito:"Esito"};
const OWN=Object.prototype.hasOwnProperty;
function check(x,msg){if(!x)throw new Error(msg)}
function clean(v){check(typeof v==="string"&&v.length<=FIELD_LIMIT,"Campo non valido o troppo lungo");return v.trim().replace(/\s+/g," ")}
function safeRecord(x){check(x&&typeof x==="object"&&!Array.isArray(x),"Campi non validi");const out=Object.create(null);for(const [key,value] of Object.entries(x)){check(OWN.call(LABELS,key),"Campo non riconosciuto: "+key);out[key]=clean(value)}return out}
function prepare(dossier,fields,opts={}){
 check(dossier&&TYPES.includes(dossier.type),"Tipologia non supportata");
 check(/^TEST-[A-Z0-9-]{2,60}$/.test(dossier.id||""),"Solo documenti TEST");
 check(dossier.state==="DRAFT"||dossier.state==="REVIEW","Documento non modificabile");
 const data=safeRecord(fields),required=REQUIRED[dossier.type],missing=required.filter(k=>!data[k]);
 const flags=[];
 if(missing.length)flags.push("CAMPI_OBBLIGATORI_MANCANTI");
 if(!Array.isArray(dossier.attachments)||dossier.attachments.length===0)flags.push("ALLEGATI_DA_VERIFICARE");
 if(["DICO_ELETTRICO","DICO_IDRICO","DIRI","ALLEGATI_GAS"].includes(dossier.type))flags.push("VERIFICHE_TECNICHE_E_FIRME_NON_ATTESTATE");
 if(opts.source==="PDF")flags.push("DATI_DA_CONFRONTARE_CON_PDF_ORIGINALE");
 return {schema:"ITE-PREP-40-1",documentId:dossier.id,type:dossier.type,fields:Object.fromEntries(Object.entries(data)),missing,flags,readyForManualReview:missing.length===0,validForIssue:false};
}
function validate(prep,dossier){
 check(prep&&prep.schema==="ITE-PREP-40-1"&&prep.documentId===dossier.id&&prep.type===dossier.type,"Preparazione incompatibile");
 const expected=prepare(dossier,prep.fields);
 check(JSON.stringify(expected.missing)===JSON.stringify(prep.missing),"Campi mancanti alterati");
 check(prep.validForIssue===false,"Emissione non autorizzata");
 check(prep.readyForManualReview===expected.readyForManualReview,"Esito revisione alterato");
 check(Array.isArray(prep.flags)&&prep.flags.includes("ALLEGATI_DA_VERIFICARE")===expected.flags.includes("ALLEGATI_DA_VERIFICARE"),"Verifica allegati alterata");
 return true;
}
function preview(prep,dossier){validate(prep,dossier);const lines=["BOZZA TECNICA TEST — NON VALIDA PER EMISSIONE",dossier.type+" — "+dossier.id,""];for(const k of REQUIRED[dossier.type])lines.push(LABELS[k]+": "+(prep.fields[k]||"[DA COMPILARE]"));lines.push("","Controlli da completare: "+(prep.flags.join(", ")||"revisione manuale"));return lines.join("\n")}
function exportJson(prep,dossier){validate(prep,dossier);return JSON.stringify(prep,null,2)}
function importJson(json,dossier){check(typeof json==="string"&&json.length<=20000,"Archivio troppo grande");const p=JSON.parse(json);validate(p,dossier);return prepare(dossier,p.fields)}
return {TYPES,REQUIRED,LABELS,prepare,validate,preview,exportJson,importJson};
});
