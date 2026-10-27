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


const unicodeMinusCredit=extractInvoiceText([
  'Destinatario: CLIENTE FITTIZIO BETA SRL',
  'Nota di credito n. 26 del 27/10/2026',
  'Imponibile € −100,00',
  'Totale IVA −€ 10,00',
  'Totale −110,00'
].join('\n'));
assert.equal(parseItalianMoney('−1.234,56'),-1234.56,'Preservare il segno meno matematico negli importi italiani');
assert.equal(unicodeMinusCredit.tipo_documento,'nota_credito');
assert.equal(unicodeMinusCredit.imponibile,-100,'Non perdere imponibile negativo con meno Unicode');
assert.equal(unicodeMinusCredit.importo_iva,-10,'Non perdere IVA negativa con meno Unicode');
assert.equal(unicodeMinusCredit.totale_documento,-110,'Non perdere totale negativo con meno Unicode');
assert.deepEqual(unicodeMinusCredit.anomalie,[],'Nessuna anomalia fittizia per importi coerenti');
assert.equal(extractInvoiceText('Fattura 27 del 27/10/2026\nTotale € 110,00').totale_documento,110,'Fattura positiva invariata');


const invalidInvoiceDate=extractInvoiceText([
  'Fattura 202 del 31/02/2026',
  'Destinatario: CLIENTE DEMO SRL',
  'Imponibile € 100,00',
  'Totale IVA € 10,00',
  'Totale € 110,00'
].join('\n'));
assert.equal(invalidInvoiceDate.numero_documento,'202','Conservare il numero del documento');
assert.equal(invalidInvoiceDate.data_emissione,null,'Non accettare una data impossibile');
assert.ok(invalidInvoiceDate.anomalie.includes('Data documento non valida: verificare originale'),'Segnalare esplicitamente la data impossibile');
assert.equal(invalidInvoiceDate.totale_documento,110,'Non alterare gli importi');
const leapDate=extractInvoiceText('Fattura 203 del 29/02/2024');
assert.equal(leapDate.data_emissione,'2024-02-29','Accettare il 29 febbraio di anno bisestile');
assert.ok(!leapDate.anomalie.some(x=>x.includes('Data documento non valida')),'Non segnalare date corrette');
const invalidCreditDate=extractInvoiceText('Nota di credito 204 del 31/11/2026');
assert.equal(invalidCreditDate.tipo_documento,'nota_credito');
assert.equal(invalidCreditDate.data_emissione,null);
assert.ok(invalidCreditDate.anomalie.some(x=>x.includes('Data documento non valida')),'Segnalare date impossibili anche nelle TD04');


const conflictingAmounts=extractInvoiceText([
  'Fattura 300 del 27/10/2026',
  'Destinatario: CLIENTE FITTIZIO DELTA SRL',
  'Imponibile € 100,00',
  'Totale IVA € 10,00',
  'Totale documento € 110,00',
  'Totale documento € 190,00'
].join('\n'));
assert.equal(conflictingAmounts.totale_documento,110,'Conservare il primo totale, senza sostituzioni automatiche');
assert.ok(conflictingAmounts.anomalie.includes('Valori discordanti per totale: verificare originale'),'Segnalare totali discordanti');

const repeatedAmounts=extractInvoiceText([
  'Fattura 301 del 27/10/2026',
  'Imponibile € 100,00',
  'Totale IVA € 10,00',
  'Totale € 110,00',
  'Totale documento € 110,00'
].join('\n'));
assert.ok(!repeatedAmounts.anomalie.some(x=>x.includes('Valori discordanti')),'Totali identici ripetuti non sono anomali');

const conflictingTaxAndVat=extractInvoiceText([
  'Fattura 302 del 27/10/2026',
  'Imponibile € 100,00',
  'Imponibile € 150,00',
  'Totale IVA € 10,00',
  'Totale IVA € 15,00',
  'Totale € 110,00'
].join('\n'));
assert.equal(conflictingTaxAndVat.imponibile,100,'Non sovrascrivere imponibile');
assert.equal(conflictingTaxAndVat.importo_iva,10,'Non sovrascrivere IVA');
assert.ok(conflictingTaxAndVat.anomalie.includes('Valori discordanti per imponibile: verificare originale'));
assert.ok(conflictingTaxAndVat.anomalie.includes('Valori discordanti per IVA: verificare originale'));

const conflictingCredit=extractInvoiceText([
  'Nota di credito 303 del 27/10/2026',
  'Totale € -110,00',
  'Totale documento € 110,00'
].join('\n'));
assert.equal(conflictingCredit.totale_documento,-110,'Non cambiare segno della nota di credito');
assert.ok(conflictingCredit.anomalie.includes('Valori discordanti per totale: verificare originale'));


const duplicateInvoiceHeadings=extractInvoiceText([
  'Fattura 501 del 27/10/2026',
  'Fattura 502 del 27/10/2026',
  'Totale € 110,00'
].join('\n'));
assert.equal(duplicateInvoiceHeadings.numero_documento,'501','Non sovrascrivere il primo numero');
assert.equal(duplicateInvoiceHeadings.totale_documento,110,'Non alterare importi');
assert.ok(duplicateInvoiceHeadings.anomalie.includes('Intestazioni documento discordanti: verificare originale'));
const repeatedSameHeading=extractInvoiceText('Fattura 503 del 27/10/2026\nFattura 503 del 27-10-2026');
assert.ok(!repeatedSameHeading.anomalie.some(x=>x.includes('Intestazioni documento discordanti')),'Copia identica non ambigua');
const conflictingHeadingDates=extractInvoiceText('Fattura 504 del 27/10/2026\nFattura 504 del 26/10/2026');
assert.ok(conflictingHeadingDates.anomalie.some(x=>x.includes('Intestazioni documento discordanti')),'Segnalare date differenti');
const conflictingCreditHeadings=extractInvoiceText('Nota di credito 505 del 27/10/2026\nNota di credito 506 del 27/10/2026');
assert.equal(conflictingCreditHeadings.numero_documento,'505');
assert.ok(conflictingCreditHeadings.anomalie.some(x=>x.includes('Intestazioni documento discordanti')));
const referenceIsNotHeading=extractInvoiceText('Nota di credito 507 del 27/10/2026\nRiferimento fattura 20 del 20/10/2026');
assert.ok(!referenceIsNotHeading.anomalie.some(x=>x.includes('Intestazioni documento discordanti')),'Riferimento a fattura non equivale a intestazione');
const mixedDocumentHeadings=extractInvoiceText('Fattura 508 del 27/10/2026\nNota di credito 509 del 27/10/2026');
assert.ok(mixedDocumentHeadings.anomalie.some(x=>x.includes('Intestazioni documento discordanti')),'Segnalare intestazioni di tipo diverso');


const payableSeparate=extractInvoiceText([
  'Fattura 610 del 27/10/2026',
  'Destinatario: CLIENTE FITTIZIO SRL',
  'Imponibile € 100,00',
  'Totale IVA € 22,00',
  'Totale documento € 122,00',
  'Totale da pagare € 102,00'
].join('\n'));
assert.equal(payableSeparate.totale_documento,122,'Non confondere totale documento con netto da pagare');
assert.equal(payableSeparate.totale_da_pagare,102,'Estrarre il netto da pagare separatamente');
assert.ok(!payableSeparate.anomalie.some(x=>x.includes('Valori discordanti per totale:')),'Totale e netto diversi non sono automaticamente un conflitto');
const onlyPayable=extractInvoiceText('Fattura 611 del 27/10/2026\nTotale da pagare € 50,00');
assert.equal(onlyPayable.totale_documento,null,'Il solo netto da pagare non e un totale documento');
assert.equal(onlyPayable.totale_da_pagare,50);
assert.ok(onlyPayable.anomalie.includes('Totale non individuato'));
const repeatedPayable=extractInvoiceText('Fattura 612 del 27/10/2026\nTotale € 80,00\nTotale da pagare € 60,00\nNetto a pagare € 55,00');
assert.equal(repeatedPayable.totale_documento,80);
assert.equal(repeatedPayable.totale_da_pagare,60);
assert.ok(repeatedPayable.anomalie.includes('Valori discordanti per totale da pagare: verificare originale'));

console.log('Invoice text parser: OK (synthetic fixtures)');
