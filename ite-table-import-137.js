/* I.T.E. 4.0.137 — spreadsheet-style TSV hierarchy import, TEST only. */
(function(root){"use strict";
const fields={client:["id","name"],site:["id","clientId","address"],system:["id","siteId","description"],equipment:["id","systemId","brand","model","serial"],operator:["id","name","color"]};
const types={client:"ADD_CLIENT",site:"ADD_SITE",system:"ADD_SYSTEM",equipment:"ADD_EQUIPMENT",operator:"ADD_OPERATOR"};
const required={client:["id","name"],site:["id","clientId","address"],system:["id","siteId"],equipment:["id","systemId"],operator:["id","name"]};
function parse(text){
 if(typeof text!=="string"||text.length>100000)throw Error("TESTO_TROPPO_GRANDE");
 const lines=text.replace(/\r/g,"").split("\n").filter(x=>x.trim());
 if(lines.length<2||lines.length>101)throw Error("RIGHE_NON_VALIDE");
 const headers=lines.shift().split("\t").map(x=>x.trim());
 if(new Set(headers).size!==headers.length||headers[0]!=="kind"||!headers.includes("id"))throw Error("INTESTAZIONE_NON_VALIDA");
 const known=new Set(["kind",...Object.values(fields).flat()]);
 if(headers.some(x=>!known.has(x)))throw Error("COLONNA_SCONOSCIUTA");
 const commands=[];
 for(const [i,line] of lines.entries()){
  const values=line.split("\t");if(values.length!==headers.length)throw Error("COLONNE_RIGA_"+(i+2));
  const row=Object.fromEntries(headers.map((h,j)=>[h,values[j].trim()]));
  const kind=row.kind;if(!types[kind])throw Error("TIPO_RIGA_"+(i+2));
  const record={};for(const f of fields[kind])if(row[f])record[f]=row[f];
  for(const f of required[kind])if(!record[f])throw Error("OBBLIGATORIO_"+f+"_RIGA_"+(i+2));
  if(Object.keys(row).some(k=>k!=="kind"&&!fields[kind].includes(k)&&row[k]))throw Error("CAMPO_NON_PREVISTO_RIGA_"+(i+2));
  commands.push({type:types[kind],record});
 }
 return commands;
}
function prepare(state,text){return {format:"ITE_136_TEST_BATCH",expectedRevision:state.revision,commands:parse(text)};}
function preview(state,text,actor,deps){return deps.batch.preview(state,prepare(state,text),actor,{operations:deps.operations,audit:deps.audit});}
function commit(session,text,actor,deps,expectedRevision){
 if(session.get().revision!==expectedRevision)throw Error("REVISIONE_CAMBIATA");
 return deps.batch.commit(session,prepare(session.get(),text),actor,{operations:deps.operations,audit:deps.audit});
}
const example="kind\tid\tname\tclientId\taddress\tsiteId\tdescription\tsystemId\tbrand\tmodel\tserial\tcolor\nclient\tC137\tCliente Fittizio\t\t\t\t\t\t\t\t\t\nsite\tS137\t\tC137\tVia Esempio 1\t\t\t\t\t\t\t\n";
const api=Object.freeze({parse,prepare,preview,commit,example});if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ITE_TableImport137=api;
})(typeof globalThis!=="undefined"?globalThis:this);
