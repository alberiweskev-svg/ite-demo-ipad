const assert=require("node:assert/strict");const E=require("./ite-pdf-fields-96.js");
const invoice=E.extract("FATTURA N. 254\nDATA: 02/10/2026\nPARTITA IVA: 03857941201\nTOTALE FATTURA € 497,76\nDESTINATARIO: Cliente TEST",{issuerIsITE:true});
assert.equal(invoice.type,"FATTURA_VENDITA");assert.equal(invoice.fields.vat,"03857941201");assert.equal(invoice.fields.amount,"497,76");assert.equal(invoice.officialReady,false);
assert.equal(E.extract("TD04 NOTA DI CREDITO",{issuerIsITE:false}).type,"NOTA_CREDITO_TD04");
assert.equal(E.extract("DICHIARAZIONE DI CONFORMITA IMPIANTO ELETTRICO").type,"DICO_ELETTRICO");
assert.equal(E.extract("DICHIARAZIONE DI RISPONDENZA").type,"DIRI");
assert.equal(E.extract("FATTURA").type,"DA_VERIFICARE");
assert.throws(()=>E.extract("x".repeat(150001)),/troppo lungo/);
(async()=>{await assert.rejects(E.readPDF({name:"test.pdf",size:100},null),/non disponibile/);console.log("PDF fields 96: OK");})().catch(e=>{console.error(e);process.exitCode=1;});