/* I.T.E. 4.0.160 — importazione controllata listini CSV e bolle TEST, nessun PDF reale. */
(function(root){"use strict";
const I=typeof module!=="undefined"&&module.exports?require("./ite-inventory-154.js"):root.ITE_Inventory154;
const clone=x=>JSON.parse(JSON.stringify(x)),str=x=>String(x??"").trim();
function parseCSV(input,delimiter){
 if(typeof input!=="string"||input.length>2000000)throw Error("CSV_NON_VALIDO");
 const d=delimiter||((input.split(/\r?\n/,1)[0].split(";").length>input.split(/\r?\n/,1)[0].split(",").length)?";":",");
 if(![";",",","\t"].includes(d))throw Error("SEPARATORE_NON_VALIDO");
 const rows=[];let row=[],cell="",quoted=false;
 for(let i=0;i<input.length;i++){const c=input[i];
 if(c==='"'){if(quoted&&input[i+1]==='"'){cell+='"';i++;}else if(!quoted&&cell.trim()===""){quoted=true;cell="";}else if(quoted){quoted=false;}else throw Error("CSV_VIRGOLETTE_NON_VALIDE");}
 else if(c===d&&!quoted){row.push(cell);cell="";}
 else if((c==="\n"||c==="\r")&&!quoted){if(c==="\r"&&input[i+1]==="\n")i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell="";if(rows.length>10001)throw Error("CSV_TROPPE_RIGHE");}
 else cell+=c;
 }if(quoted)throw Error("CSV_VIRGOLETTE_NON_CHIUSE");
 row.push(cell);if(row.some(x=>x.trim()))rows.push(row);return rows;
}
const decimal=v=>{const s=str(v).replace(/\s/g,"");if(!s)return NaN;const n=Number(s.includes(",")?s.replace(/\./g,"").replace(",","."):s);return Number.isFinite(n)?n:NaN;};
function preview(csv,options={}){
 const raw=parseCSV(csv,options.delimiter);if(raw.length<2)throw Error("CSV_SENZA_ARTICOLI");
 const names=raw[0].map(x=>str(x).toLowerCase().replace(/[^a-z0-9]/g,""));
 const aliases={code:["codice","code","sku","articolo"],description:["descrizione","description","nome"],price:["prezzo","price","prezzounitario"],vat:["iva","aliquota","vatrate"],unit:["um","unita","unit"],category:["categoria","category","tipologia"]};
 const col={};for(const [field,variants]of Object.entries(aliases)){col[field]=names.findIndex(x=>variants.includes(x));}
 if(col.code<0||col.description<0||col.price<0)throw Error("COLONNE_OBBLIGATORIE_MANCANTI");
 const seen=new Set(),rows=[],errors=[];
 raw.slice(1).forEach((r,i)=>{const line=i+2,code=str(r[col.code]),description=str(r[col.description]),price=decimal(r[col.price]),vat=col.vat<0?22:decimal(r[col.vat]),unit=col.unit<0?"pz":str(r[col.unit])||"pz",category=col.category<0?"ALTRO":str(r[col.category])||"ALTRO";
 let problem=null;if(!code||code.length>100||!description||description.length>500)problem="ARTICOLO_NON_VALIDO";
 else if(!Number.isFinite(price)||price<0||price>100000000)problem="PREZZO_NON_VALIDO";
 else if(![0,4,5,10,22].includes(vat))problem="IVA_NON_VALIDA";
 else if(seen.has(code.toLowerCase()))problem="CODICE_DUPLICATO_NEL_CSV";
 if(problem)errors.push({line,code,error:problem});else{seen.add(code.toLowerCase());rows.push({line,code,description,unitPrice:Math.round(price*100)/100,vatRate:vat,unit,category});}
 });
 return {schema:"ITE_SUPPLIER_PREVIEW_160",rows,errors,total:raw.length-1,valid:errors.length===0};
}
function importCatalog(state,report,actor,revision,sourceId){
 if(state?.schema!=="ITE_OPERATIONS_123"||!Array.isArray(state.inventory?.items)||!I)throw Error("ARCHIVIO_NON_VALIDO");
 if(state.revision!==revision)throw Error("REVISIONE_OBSOLETA");
 if(!str(actor)||!str(sourceId)||!/^[-\w]{1,80}$/.test(sourceId))throw Error("METADATI_OBBLIGATORI");
 if(report?.schema!=="ITE_SUPPLIER_PREVIEW_160"||!report.valid||!report.rows?.length)throw Error("ANTEPRIMA_NON_VALIDA");
 if(state.events.some(e=>e.sourceId===sourceId))throw Error("IMPORTAZIONE_DUPLICATA");
 let next=clone(state);let created=0,updated=0;
 for(const r of report.rows){const existing=next.inventory.items.find(x=>x.code.toLowerCase()===r.code.toLowerCase());if(existing)updated++;else created++;
 const id=existing?.id||"CSV-"+sourceId+"-"+r.line;
 if(next.inventory.items.some(x=>x.id===id&&x.code.toLowerCase()!==r.code.toLowerCase()))throw Error("ID_ARTICOLO_IN_CONFLITTO");
 next=I.item(next,{id,code:r.code,description:r.description,unitPrice:r.unitPrice,vatRate:r.vatRate,unit:r.unit,category:r.category},actor,next.revision);
 }
 next.events.push({revision:next.revision,type:"IMPORT_SUPPLIER_CATALOG_160",sourceId,actor:str(actor),created,updated,at:new Date().toISOString()});
 return {state:next,created,updated};
}
function receiveDelivery(state,delivery,actor,revision){
 if(state?.schema!=="ITE_OPERATIONS_123"||!Array.isArray(state.inventory?.items)||!Array.isArray(state.inventory?.movements))throw Error("ARCHIVIO_NON_VALIDO");
 if(revision!==state.revision)throw Error("REVISIONE_OBSOLETA");
 const ref=str(delivery?.reference);if(!/^[\w-]{1,80}$/.test(ref)||!str(actor))throw Error("DOCUMENTO_NON_VALIDO");
 if(!Array.isArray(delivery.lines)||!delivery.lines.length||delivery.lines.length>500)throw Error("RIGHE_NON_VALIDE");
 if(state.events.some(x=>x.type==="RECEIVE_DELIVERY_160"&&x.reference===ref))throw Error("DOCUMENTO_DUPLICATO");
 let next=clone(state);const seen=new Set();
 for(let i=0;i<delivery.lines.length;i++){const r=delivery.lines[i],id=str(r.itemId),n=r.quantity;
 if(seen.has(id))throw Error("ARTICOLO_DUPLICATO_NEL_DOCUMENTO");seen.add(id);
 if(typeof n!=="number"||!Number.isFinite(n)||n<=0||Math.abs(n*1000-Math.round(n*1000))>1e-7)throw Error("QUANTITA_NON_VALIDA");
 next=I.movement(next,{id:"DEL-"+ref+"-"+(i+1),itemId:id,direction:"IN",quantity:n,reference:"BOLLA_TEST:"+ref},actor,next.revision);
 }
 next.events.push({revision:next.revision,type:"RECEIVE_DELIVERY_160",reference:ref,actor:str(actor),at:new Date().toISOString()});
 return next;
}
const api=Object.freeze({parseCSV,preview,importCatalog,receiveDelivery});
if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ITE_SupplierImport160=api;
})(typeof globalThis!=="undefined"?globalThis:this);
