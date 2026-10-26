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

assert.equal(extractInvoiceText('documento sconosciuto').tipo_documento,null);
assert.equal(extractInvoiceText('Fattura n° 7 del 07/01/2025').numero_documento,'7');
assert.equal(extractInvoiceText('Fattura nr. 22 del 07/01/2025').numero_documento,'22');
assert.equal(extractInvoiceText('Fattura 3 del 07/01/2025').direzione,'da_verificare');
assert.equal(extractInvoiceText('Documento sconosciuto').direzione,null);
assert.equal(extractInvoiceText('Fattura 9 del 07/01/2025\nIVA 10%').importo_iva,null);
console.log('Invoice text parser: OK (synthetic fixtures)');
