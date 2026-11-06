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

/* Derive a reviewable TEST draft from linked records; never overwrite entered values. */
function suggest(dossier,hierarchy,existing={}){
 check(dossier&&/^TEST-[A-Z0-9-]{2,60}$/.test(dossier.id||""),"Solo fascicoli TEST");
 check(hierarchy&&typeof hierarchy==="object","Gerarchia TEST mancante");
 const link=dossier.link||{},get=(collection,id)=>{if(!id)return null;check(/^TEST-[A-Z0-9-]{2,60}$/.test(id),"Riferimento non TEST");const rows=hierarchy[collection];check(Array.isArray(rows),"Archivio "+collection+" mancante");const record=rows.find(x=>x.id===id);check(record,"Riferimento non trovato: "+id);return record};
 const client=get("clients",link.clientId),site=get("sites",link.siteId),plant=get("plants",link.plantId),equipment=get("equipment",link.equipmentId),appointment=get("appointments",link.appointmentId);
 check(client&&site&&site.clientId===client.id,"Cliente e sede non coerenti");
 if(plant)check(plant.siteId===site.id,"Impianto non coerente");
 if(equipment)check(plant&&equipment.plantId===plant.id,"Apparecchiatura non coerente");
 if(appointment)check(appointment.clientId===client.id&&appointment.siteId===site.id&&(!equipment||appointment.equipmentId===equipment.id),"Appuntamento non coerente");
 const choose=(x,keys)=>{for(const k of keys)if(typeof x?.[k]==="string"&&x[k].trim())return x[k].trim();return ""};
 const address=choose(site,["address","indirizzo","name","nome"]);
 const customer=choose(client,["name","nome","ragioneSociale"]);
 const plantDescription=choose(plant,["description","descrizione","name","nome"]);
 const deviceDescription=choose(equipment,["description","descrizione","name","nome","model","modello"]);
 const operator=appointment?get("operators",appointment.operatorId):null;
 const candidates={committente:customer,indirizzo:address,descrizioneImpianto:[plantDescription,deviceDescription].filter(Boolean).join(" — "),cantiere:choose(site,["name","nome"])||address,operatore:choose(operator,["name","nome"])};
 const allowed=REQUIRED[dossier.type];check(allowed,"Tipologia non supportata");
 const result=safeRecord(existing),filled=[],conflicts=[];
 for(const key of allowed){const candidate=candidates[key];if(!candidate)continue;const value=clean(candidate.slice(0,FIELD_LIMIT));if(!result[key]){result[key]=value;filled.push(key)}else if(result[key]!==value)conflicts.push(key)}
 return {fields:Object.fromEntries(Object.entries(result)),filled,conflicts,source:"GERARCHIA_TEST",requiresManualVerification:true};
}

return {TYPES,REQUIRED,LABELS,prepare,validate,preview,exportJson,importJson,suggest};
});
