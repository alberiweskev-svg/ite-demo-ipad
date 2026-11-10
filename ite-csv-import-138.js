/* I.T.E. 4.0.138 — local CSV/TSV hierarchical import; TEST data only. */
(function(root){"use strict";
const kinds=["client","site","system","equipment","operator"];
const schema={client:["id","name"],site:["id","clientId","address"],system:["id","siteId","description"],equipment:["id","systemId","brand","model","serial"],operator:["id","name","color"]};
const required={client:["id","name"],site:["id","clientId","address"],system:["id","siteId"],equipment:["id","systemId"],operator:["id","name"]};
const commands={client:"ADD_CLIENT",site:"ADD_SITE",system:"ADD_SYSTEM",equipment:"ADD_EQUIPMENT",operator:"ADD_OPERATOR"};
function csv(text,delimiter){
 const rows=[];let row=[],cell="",quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];
  if(quoted){if(c==='"'&&text[i+1]==='"'){cell+='"';i++;}else if(c==='"')quoted=false;else cell+=c;}
  else if(c==='"'){if(cell)throw Error("VIRGOLETTE_NON_VALIDE");quoted=true;}
  else if(c===delimiter){row.push(cell);cell="";}
  else if(c==="\n"){row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell="";}
  else if(c!=="\r")cell+=c;
 }
 if(quoted)throw Error("VIRGOLETTE_NON_CHIUSE");
 row.push(cell);if(row.some(x=>x.trim()))rows.push(row);
 return rows;
}
function parse(text,delimiter){
 if(typeof text!=="string"||text.length>100000)throw Error("TESTO_TROPPO_GRANDE");
 const sep=delimiter||((text.split(/\r?\n/,1)[0]||"").includes("\t")?"\t":";");
 if(!["\t",";",","].includes(sep))throw Error("SEPARATORE_NON_VALIDO");
 const rows=csv(text.replace(/^\uFEFF/,""),sep);
 if(rows.length<2||rows.length>101)throw Error("RIGHE_NON_VALIDE");
 const header=rows.shift().map(x=>x.trim());if(header[0]!=="kind"||!header.includes("id")||new Set(header).size!==header.length)throw Error("INTESTAZIONE_NON_VALIDA");
 const allowed=new Set(["kind",...Object.values(schema).flat()]);if(header.some(x=>!allowed.has(x)))throw Error("COLONNA_SCONOSCIUTA");
 const seen=new Set(),records=[];
 for(const [index,values] of rows.entries()){
  if(values.length!==header.length)throw Error("COLONNE_RIGA_"+(index+2));
  const data=Object.fromEntries(header.map((h,j)=>[h,values[j].trim()]));
  const kind=data.kind;if(!kinds.includes(kind))throw Error("TIPO_RIGA_"+(index+2));
  const record={};for(const key of schema[kind])if(data[key])record[key]=data[key];
  for(const key of required[kind])if(!record[key])throw Error("OBBLIGATORIO_"+key+"_RIGA_"+(index+2));
  if(header.some(key=>key!=="kind"&&!schema[kind].includes(key)&&data[key]))throw Error("CAMPO_NON_PREVISTO_RIGA_"+(index+2));
  const unique=kind+":"+record.id;if(seen.has(unique))throw Error("ID_DUPLICATO_"+unique);seen.add(unique);
  records.push({kind,record,line:index+2});
 }
 records.sort((a,b)=>kinds.indexOf(a.kind)-kinds.indexOf(b.kind));
 return records;
}
function prepare(state,text,delimiter){
 const rows=parse(text,delimiter);
 const catalog=state?.field?.catalog;if(!catalog)throw Error("STATO_TEST_NON_VALIDO");
 const collections={client:"clients",site:"sites",system:"systems",equipment:"equipment",operator:"operators"};
 for(const {kind,record} of rows)if(catalog[collections[kind]]?.some(x=>x.id===record.id))throw Error("ID_GIA_PRESENTE_"+kind+":"+record.id);
 return {format:"ITE_136_TEST_BATCH",expectedRevision:state.revision,commands:rows.map(x=>({type:commands[x.kind],record:x.record}))};
}
function preview(state,text,actor,deps,delimiter){return deps.batch.preview(state,prepare(state,text,delimiter),actor,{operations:deps.operations,audit:deps.audit});}
function commit(session,text,actor,deps,expectedRevision,delimiter){
 const state=session.get();if(state.revision!==expectedRevision)throw Error("REVISIONE_CAMBIATA");
 return deps.batch.commit(session,prepare(state,text,delimiter),actor,{operations:deps.operations,audit:deps.audit});
}
const example='kind;id;name;clientId;address;siteId;description;systemId;brand;model;serial;color\nequipment;EQ138;;;;;;SY138;Marca TEST;Modello TEST;SN138;\nsystem;SY138;;;;SI138;Riscaldamento TEST;;;;\nsite;SI138;;CL138;Via Fittizia 1;;;;;;\nclient;CL138;Cliente Fittizio;;;;;;;;;\n';
const api=Object.freeze({csv,parse,prepare,preview,commit,example});
if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ITE_CsvImport138=api;
})(typeof globalThis!=="undefined"?globalThis:this);
