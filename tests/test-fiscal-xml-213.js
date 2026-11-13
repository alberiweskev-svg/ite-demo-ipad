const assert=require("node:assert/strict"),X=require("../ite-fiscal-xml-213.js");
const {DOMParser}=globalThis;
assert.equal(X.cents("123.45"),12345);assert.equal(X.cents("-2.5"),-250);assert.throws(()=>X.cents("1e4"));
const xml='<FatturaElettronica><FatturaElettronicaHeader><CedentePrestatore><DatiAnagrafici><IdFiscaleIVA><IdCodice>111</IdCodice></IdFiscaleIVA></DatiAnagrafici></CedentePrestatore><CessionarioCommittente><DatiAnagrafici><CodiceFiscale>222</CodiceFiscale></DatiAnagrafici></CessionarioCommittente></FatturaElettronicaHeader><FatturaElettronicaBody><DatiGenerali><DatiGeneraliDocumento><TipoDocumento>TD01</TipoDocumento><Data>2026-11-13</Data><Numero>TEST-1</Numero><ImportoTotaleDocumento>122.00</ImportoTotaleDocumento></DatiGeneraliDocumento></DatiGenerali><DatiBeniServizi><DatiRiepilogo><ImponibileImporto>100.00</ImponibileImporto><Imposta>22.00</Imposta></DatiRiepilogo></DatiBeniServizi></FatturaElettronicaBody></FatturaElettronica>';
function parser(s){
 const tags=[...s.matchAll(/<([A-Za-z][A-Za-z0-9]*)>([^<]*)<\\/\\1>/g)];
 const leaf=(name,content)=>({localName:name,textContent:content,getElementsByTagName(){return [];}});
 const nodes=tags.map(m=>leaf(m[1],m[2]));
 const find=name=>nodes.filter(n=>n.localName===name);
 const group=(name,children)=>({localName:name,textContent:"",getElementsByTagName(tag){return tag==="*"?children:children.filter(n=>n.localName===tag);}});
 const header=group("FatturaElettronicaHeader",[group("CedentePrestatore",[leaf("IdCodice","111")]),group("CessionarioCommittente",[leaf("CodiceFiscale","222")])]);
 const general=group("DatiGeneraliDocumento",[leaf("TipoDocumento",s.includes("TD05")?"TD05":"TD01"),leaf("Numero","TEST-1"),leaf("Data","2026-11-13"),leaf("ImportoTotaleDocumento","122.00")]);
 const summary=group("DatiRiepilogo",[leaf("ImponibileImporto","100.00"),leaf("Imposta","22.00")]);
 const body=group("FatturaElettronicaBody",[general,summary]);
 const root=group("FatturaElettronica",[header,body]);
 return {documentElement:root,getElementsByTagName:()=>[]};
}
const p=X.parse(xml,parser);assert.equal(p.netCents,10000);assert.equal(p.vatCents,2200);assert.equal(p.grossCents,12200);assert.equal(p.seller,"111");assert.equal(p.buyer,"222");
const mapped=X.toLedger(p,{direction:"IN",id:"A-1",counterpartyId:"SUP-1"});assert.equal(mapped.type,"ACQUISTO");assert.equal(mapped.status,"DA_VERIFICARE");
assert.throws(()=>X.toLedger({...p,documentCode:"TD04"},{direction:"OUT",id:"N-1",counterpartyId:"C-1"}),/RIFERIMENTO/);
assert.throws(()=>X.parse('<!DOCTYPE x>'+xml,parser),/ENTITA/);assert.throws(()=>X.parse(xml.replace("TD01","TD05"),parser),/NON_SUPPORTATO/);
console.log("Fiscal XML 4.0.213: OK");