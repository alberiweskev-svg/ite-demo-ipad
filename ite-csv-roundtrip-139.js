/* I.T.E. 4.0.139 — reversible TEST hierarchy CSV export and audit; local only. */
(function(root){"use strict";
const kinds=["client","site","system","equipment","operator"];
const fields={client:["id","name"],site:["id","clientId","address"],system:["id","siteId","description"],equipment:["id","systemId","brand","model","serial"],operator:["id","name","color"]};
const collections={client:"clients",site:"sites",system:"systems",equipment:"equipment",operator:"operators"};
const header=["kind","id","name","clientId","address","siteId","description","systemId","brand","model","serial","color"];
function cells(state){
 const c=state?.field?.catalog;if(!c)throw Error("STATO_TEST_NON_VALIDO");
 const result=[];for(const kind of kinds){const arr=c[collections[kind]];if(!Array.isArray(arr))throw Error("COLLEZIONE_NON_VALIDA:"+kind);
  for(const item of arr){const row={kind};for(const key of fields[kind])row[key]=String(item[key]??"");result.push(row);}
 }return result;
}
function audit(state){
 const rows=cells(state),issues=[],ids={};
 for(const kind of kinds)ids[kind]=new Set(rows.filter(r=>r.kind===kind).map(r=>r.id));
 for(const r of rows){
  if(!r.id)issues.push("ID_VUOTO:"+r.kind);
  const parent=r.kind==="site"?["client",r.clientId]:r.kind==="system"?["site",r.siteId]:r.kind==="equipment"?["system",r.systemId]:null;
  if(parent&&!ids[parent[0]].has(parent[1]))issues.push("PADRE_ASSENTE:"+r.kind+":"+r.id);
 }
 return {ok:issues.length===0,issues,counts:Object.fromEntries(kinds.map(k=>[collections[k],rows.filter(r=>r.kind===k).length])),total:rows.length};
}
function quote(value,sep){
 let s=String(value??"");
 // Spreadsheet formula injection defense: prefix a literal apostrophe, preserving user data in spreadsheet viewers.
 if(/^[\s\uFEFF]*[=+@-]/.test(s))s="'"+s;
 if(s.includes('"')||s.includes(sep)||/[\r\n]/.test(s))return '"'+s.replace(/"/g,'""')+'"';
 return s;
}
function exportCsv(state,sep=";"){
 if(![";",",","\t"].includes(sep))throw Error("SEPARATORE_NON_VALIDO");
 const report=audit(state);if(!report.ok)throw Error("GERARCHIA_NON_VALIDA:"+report.issues.join(","));
 const rows=cells(state);if(rows.length>100)throw Error("LIMITE_100_RIGHE_IMPORT");
 return [header.join(sep),...rows.map(r=>header.map(h=>quote(r[h]??"",sep)).join(sep))].join("\r\n")+"\r\n";
}
function roundtrip(state,parser,sep=";"){
 const text=exportCsv(state,sep),rows=cells(state);
 // Spreadsheet-sanitized formula-like values cannot round-trip byte-for-byte.
 const imported=parser.parse(text,sep);
 const normalize=x=>Object.fromEntries(fields[x.kind].map(k=>[k,String(x[k]??"")]));
 const left=rows.map(normalize).map(JSON.stringify).sort(),right=imported.map(x=>normalize({kind:x.kind,...x.record})).map(JSON.stringify).sort();
 return {ok:JSON.stringify(left)===JSON.stringify(right),rows:rows.length,bytes:text.length};
}
const api=Object.freeze({cells,audit,exportCsv,roundtrip,header});
if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ITE_CsvRoundtrip139=api;
})(typeof globalThis!=="undefined"?globalThis:this);
