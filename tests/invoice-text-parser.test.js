'use strict';
const assert=require('node:assert/strict');
const {extractInvoiceText,parseItalianMoney,parseDate}=require('../src/invoice-text-parser.js');
assert.equal(parseItalianMoney('1.234,56'),1234.56);
assert.equal(parseItalianMoney('320,00'),320);
assert.equal(parseItalianMoney('12,34,56'),null);
assert.equal(parseDate('31-02-2026'),null);

const obscured=extractInvoiceText([
  'Destinatario',
  'Copia di cortesia Fattura 1 del 07-01-2025 FORNITORE ESEMPIO',
  'Imponibile € 320,00',
  'Totale IVA € 0,00',
  'Scadenze',
  '31-03-2025'
].join('\n'));
assert.equal(obscured.tipo_documento,'fattura');
assert.equal(obscured.numero_documento,'1');
assert.equal(obscured.data_emissione,'2025-01-07');
assert.equal(obscured.cliente,null);
assert.equal(obscured.cliente_stato,'Cliente non individuato');
assert.equal(obscured.imponibile,320);
assert.equal(obscured.importo_iva,0);
assert.equal(obscured.totale_documento,null);
assert.equal(obscured.scadenza,'2025-03-31');
assert.ok(obscured.anomalie.includes('Totale non individuato'));

const proforma=extractInvoiceText([
  'Destinatario',
  'CLIENTE FANTASIA SRL     Copia di cortesia Fattura 10/PR del 07-01-2025',
  'Imponibile € 261,50',
  'Totale IVA € 26,15',
  'Totale € 287,65',
  'Scadenze',
  '07-01-2025 - € 287,65'
].join('\n'));
assert.equal(proforma.tipo_documento,'proforma');
assert.equal(proforma.numero_documento,'10/PR');
assert.equal(proforma.cliente,'CLIENTE FANTASIA SRL');
assert.equal(proforma.imponibile,261.5);
assert.equal(proforma.importo_iva,26.15);
assert.equal(proforma.totale_documento,287.65);
assert.equal(proforma.scadenza,'2025-01-07');
assert.deepEqual(proforma.anomalie,[]);
assert.equal(proforma.richiede_conferma,true);

const proformaDash=extractInvoiceText([
  'Destinatario: CLIENTE DEMO SRL',
  'Fattura 42-PR del 10/10/2026',
  'Imponibile € 100,00',
  'Totale IVA € 10,00',
  'Totale € 110,00'
].join('\n'));
assert.equal(proformaDash.tipo_documento,'proforma','Il suffisso -PR identifica una proforma');
assert.equal(proformaDash.numero_documento,'42-PR');
assert.equal(proformaDash.totale_documento,110);
assert.equal(extractInvoiceText('Fattura 43-pr del 10/10/2026').tipo_documento,'proforma','Suffisso -pr minuscolo');
assert.equal(extractInvoiceText('Fattura 44/A del 10/10/2026').tipo_documento,'fattura','Un suffisso ordinario non è proforma');

const creditNote=extractInvoiceText([
  'Nota di credito n. 8 del 12/10/2026',
  'Riferimento fattura n. 7 del 10/10/2026',
  'Imponibile € 100,00',
  'Totale IVA € 10,00',
  'Totale € 110,00'
].join('\n'));
assert.equal(creditNote.tipo_documento,'nota_credito','La nota di credito non è una fattura');
assert.equal(creditNote.numero_documento,'8','Il numero della nota prevale sulla fattura citata');
assert.equal(creditNote.data_emissione,'2026-10-12');
assert.equal(creditNote.richiede_conferma,true);
const td04Reference=extractInvoiceText('TD04\nRiferimento fattura 7 del 10/10/2026');
assert.equal(td04Reference.tipo_documento,'nota_credito');
assert.equal(td04Reference.numero_documento,null,'Non usare il numero della fattura richiamata');
assert.equal(td04Reference.data_emissione,null,'Non usare la data della fattura richiamata');
assert.ok(td04Reference.anomalie.includes('Numero nota di credito non individuato'));
const invoiceReferringToCredit=extractInvoiceText([
  'Fattura 12 del 15/10/2026',
  'Riferimento nota di credito n. 5 del 14/10/2026'
].join('\n'));
assert.equal(invoiceReferringToCredit.tipo_documento,'fattura','Un riferimento a una nota non cambia il tipo fattura');
assert.equal(invoiceReferringToCredit.numero_documento,'12');
assert.equal(invoiceReferringToCredit.data_emissione,'2026-10-15');


const referenceOnly=extractInvoiceText('Riferimento fattura n. 22 del 25/10/2026');
assert.equal(referenceOnly.tipo_documento,null,'Il riferimento a una fattura non è una fattura autonoma');
assert.equal(referenceOnly.numero_documento,null,'Non attribuire il numero della fattura richiamata');
assert.equal(referenceOnly.data_emissione,null,'Non attribuire la data della fattura richiamata');
const invoiceAfterReference=extractInvoiceText('Riferimento fattura n. 22 del 25/10/2026\nFattura 23 del 26/10/2026');
assert.equal(invoiceAfterReference.numero_documento,'23','Usare la testata del documento, non il primo riferimento');
assert.equal(invoiceAfterReference.data_emissione,'2026-10-26');
const descriptiveReference=extractInvoiceText('Descrizione: storno fattura 24 del 26/10/2026');
assert.equal(descriptiveReference.tipo_documento,null,'Non classificare una descrizione come documento');
assert.equal(extractInvoiceText('CLIENTE FITTIZIO SRL   Copia di cortesia Fattura 25 del 27/10/2026').numero_documento,'25','Mantenere le copie di cortesia con intestazione sulla stessa riga');

assert.equal(extractInvoiceText('documento sconosciuto').tipo_documento,null);
assert.equal(extractInvoiceText('Fattura n° 7 del 07/01/2025').numero_documento,'7');
assert.equal(extractInvoiceText('Fattura nr. 22 del 07/01/2025').numero_documento,'22');
assert.equal(extractInvoiceText('Fattura 3 del 07/01/2025').direzione,'da_verificare');
assert.equal(extractInvoiceText('Documento sconosciuto').direzione,null);
assert.equal(extractInvoiceText('Fattura 9 del 07/01/2025\nIVA 10%').importo_iva,null);

const negativeCredit=extractInvoiceText([
  'Destinatario: CLIENTE INVENTATO SRL',
  'Nota di credito n. 15 del 25/10/2026',
  'Imponibile € -100,00',
  'Totale IVA -€ 10,00',
  'Totale -110,00'
].join('\n'));
assert.equal(negativeCredit.tipo_documento,'nota_credito');
assert.equal(negativeCredit.imponibile,-100,'Preservare segno con € prima del meno');
assert.equal(negativeCredit.importo_iva,-10,'Preservare segno con meno prima di €');
assert.equal(negativeCredit.totale_documento,-110,'Preservare segno senza €');
assert.deepEqual(negativeCredit.anomalie,[]);
const positiveCredit=extractInvoiceText('Nota di credito n. 16 del 26/10/2026\nTotale € 110,00');
assert.equal(positiveCredit.totale_documento,110,'Non cambiare automaticamente segno delle note di credito');
const positiveInvoice=extractInvoiceText('Fattura 17 del 26/10/2026\nTotale € 110,00');
assert.equal(positiveInvoice.totale_documento,110,'Importo fattura positiva invariato');


const inconsistentInvoice=extractInvoiceText([
  'Destinatario: CLIENTE TEST ALFA SRL',
  'Fattura 99 del 27/10/2026',
  'Imponibile € 100,00',
  'Totale IVA € 10,00',
  'Totale € 115,00'
].join('\n'));
assert.equal(inconsistentInvoice.totale_documento,115,'Non modificare automaticamente il totale letto');
assert.ok(inconsistentInvoice.anomalie.some(x=>x.includes('Totale non coerente')),'Segnalare differenze senza alterare gli importi');
const inconsistentCredit=extractInvoiceText([
  'Nota di credito 100 del 27/10/2026',
  'Imponibile € -100,00',
  'Totale IVA € -10,00',
  'Totale € -115,00'
].join('\n'));
assert.equal(inconsistentCredit.totale_documento,-115);
assert.ok(inconsistentCredit.anomalie.some(x=>x.includes('Totale non coerente')),'Controllare anche i segni negativi');
const roundingInvoice=extractInvoiceText([
  'Fattura 101 del 27/10/2026',
  'Imponibile € 100,00',
  'Totale IVA € 10,00',
  'Totale € 110,02'
].join('\n'));
assert.ok(!roundingInvoice.anomalie.some(x=>x.includes('Totale non coerente')),'Tolleranza massima 2 centesimi');

console.log('Invoice text parser: OK (synthetic fixtures)');
