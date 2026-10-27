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


const accountingCredit=extractInvoiceText([
  'Nota di credito 701 del 27/10/2026',
  'Destinatario: CLIENTE SINTETICO SRL',
  'Imponibile (100,00)',
  'Totale IVA € (10,00)',
  'Totale (€ 110,00)'
].join('\n'));
assert.equal(parseItalianMoney('(1.234,56)'),-1234.56,'Parentesi contabili indicano importo negativo');
assert.equal(parseItalianMoney('(€ 1.234,56)'),-1234.56,'Euro all interno delle parentesi');
assert.equal(parseItalianMoney('€ (1.234,56)'),-1234.56,'Euro all esterno delle parentesi');
assert.equal(parseItalianMoney('(-1.234,56)'),null,'Non accettare doppia indicazione di segno');
assert.equal(parseItalianMoney('(1.234,56'),null,'Non accettare parentesi incomplete');
assert.equal(accountingCredit.tipo_documento,'nota_credito');
assert.equal(accountingCredit.imponibile,-100,'Imponibile negativo con parentesi');
assert.equal(accountingCredit.importo_iva,-10,'IVA negativa con euro esterno');
assert.equal(accountingCredit.totale_documento,-110,'Totale negativo con euro interno');
assert.ok(!accountingCredit.anomalie.some(x=>x.includes('Totale non coerente')),'Importi contabili coerenti');
const accountingInvoice=extractInvoiceText('Fattura 702 del 27/10/2026\nTotale € 110,00');
assert.equal(accountingInvoice.totale_documento,110,'Fatture positive invariate');


const multipartInvoice=extractInvoiceText('Fattura 125/2026/A del 27/10/2026');
assert.equal(multipartInvoice.tipo_documento,'fattura','Fattura con piu segmenti nel numero');
assert.equal(multipartInvoice.numero_documento,'125/2026/A','Conservare tutto il numero fattura');
assert.equal(multipartInvoice.data_emissione,'2026-10-27');
const multipartCredit=extractInvoiceText('Nota di credito n. 8-2026/NC del 27/10/2026');
assert.equal(multipartCredit.tipo_documento,'nota_credito','Nota TD04 con numero composto');
assert.equal(multipartCredit.numero_documento,'8-2026/NC','Conservare il numero della nota');
const multipartProforma=extractInvoiceText('Fattura 126/2026/PR del 27/10/2026');
assert.equal(multipartProforma.tipo_documento,'proforma','Riconoscere il suffisso PR anche dopo altri segmenti');
assert.equal(multipartProforma.numero_documento,'126/2026/PR');
const multipartReference=extractInvoiceText('Riferimento fattura 125/2026/A del 27/10/2026');
assert.equal(multipartReference.numero_documento,null,'Un riferimento con numero composto non e una testata');
const multipartConflict=extractInvoiceText('Fattura 125/2026/A del 27/10/2026\\nFattura 125/2026/B del 27/10/2026'.replace('\\n','\n'));
assert.ok(multipartConflict.anomalie.some(x=>x.includes('Intestazioni documento discordanti')),'Segnalare numeri composti differenti');


// Regressione: TD04 richiamata in fattura non deve cambiare la classificazione.
const invoiceRefersToTd04=extractInvoiceText([
  'Fattura 901 del 27/10/2026',
  'Destinatario: CLIENTE FITTIZIO SRL',
  'Riferimento documento TD04 n. 44 del 01/10/2026',
  'Imponibile € 100,00',
  'Totale IVA € 22,00',
  'Totale documento € 122,00'
].join('\n'));
assert.equal(invoiceRefersToTd04.tipo_documento,'fattura','Una TD04 citata non modifica il tipo documento');
assert.equal(invoiceRefersToTd04.numero_documento,'901','Conservare il numero fattura');
assert.equal(invoiceRefersToTd04.data_emissione,'2026-10-27','Conservare la data fattura');
assert.equal(invoiceRefersToTd04.totale_documento,122,'Conservare il totale fattura');
const invoiceWithTd04Description=extractInvoiceText('Descrizione: riferimento a TD04 precedente\nFattura 902 del 27/10/2026');
assert.equal(invoiceWithTd04Description.tipo_documento,'fattura','Una descrizione TD04 non e una testata');
assert.equal(invoiceWithTd04Description.numero_documento,'902');
const genuineTd04Field=extractInvoiceText('Tipo documento: TD04\nRiferimento fattura 22 del 25/10/2026');
assert.equal(genuineTd04Field.tipo_documento,'nota_credito','Il campo Tipo documento TD04 resta valido');
assert.equal(genuineTd04Field.numero_documento,null,'Non usare il numero della fattura richiamata');
const genuineTd04Header=extractInvoiceText('TD04\nRiferimento fattura 23 del 25/10/2026');
assert.equal(genuineTd04Header.tipo_documento,'nota_credito','Intestazione TD04 autonoma valida');

// TD04 esplicita ma testata fattura: non classificare silenziosamente.
const conflictingTd04Type=extractInvoiceText([
  'Fattura 907 del 27/10/2026',
  'Tipo documento: TD04',
  'Totale documento € 110,00'
].join('\\n'.replace('\\n','\n')));
assert.equal(conflictingTd04Type.tipo_documento,'nota_credito');
assert.ok(conflictingTd04Type.anomalie.includes('Intestazioni documento discordanti: verificare originale'));
const ordinaryInvoice907=extractInvoiceText('Fattura 907 del 27/10/2026');
assert.ok(!ordinaryInvoice907.anomalie.some(x=>x.includes('Intestazioni documento discordanti')));
const ordinaryCredit907=extractInvoiceText('Nota di credito 907 del 27/10/2026');
assert.ok(!ordinaryCredit907.anomalie.some(x=>x.includes('Intestazioni documento discordanti')));

// Regressione: il tipo TD01 contraddice una nota di credito esplicita.
const creditWithTd01=extractInvoiceText([
  'Nota di credito 920 del 27/10/2026',
  'Tipo documento: TD01',
  'Destinatario: CLIENTE FITTIZIO GAMMA SRL',
  'Imponibile € 100,00',
  'Totale IVA € 22,00',
  'Totale documento € 122,00'
].join('\\n'.replace('\\n','\n')));
assert.equal(creditWithTd01.tipo_documento,'nota_credito');
assert.equal(creditWithTd01.numero_documento,'920');
assert.equal(creditWithTd01.totale_documento,122,'Preservare il totale originale');
assert.ok(creditWithTd01.anomalie.includes('Intestazioni documento discordanti: verificare originale'));
const creditWithTd04=extractInvoiceText('Nota di credito 921 del 27/10/2026\nTipo documento: TD04');
assert.ok(!creditWithTd04.anomalie.some(x=>x.includes('Intestazioni documento discordanti')),'Nota e TD04 coerenti');
const invoiceWithTd01=extractInvoiceText('Fattura 922 del 27/10/2026\nTipo documento: TD01');
assert.ok(!invoiceWithTd01.anomalie.some(x=>x.includes('Intestazioni documento discordanti')),'Fattura e TD01 coerenti');
const twoDeclaredTypes=extractInvoiceText('Tipo documento: TD01\nTipo documento: TD04');
assert.ok(twoDeclaredTypes.anomalie.includes('Intestazioni documento discordanti: verificare originale'),'Tipi dichiarati incompatibili');
const repeatedDeclaredType=extractInvoiceText('Tipo documento: TD04\nTipo documento: TD04');
assert.ok(!repeatedDeclaredType.anomalie.some(x=>x.includes('Intestazioni documento discordanti')),'Duplicati identici non sono un conflitto');


// Regressione: date italiane con punti, senza falsi conflitti tra copie dello stesso documento.
assert.equal(parseDate('27.10.2026'),'2026-10-27');
assert.equal(parseDate('31.02.2026'),null,'Rifiutare date impossibili con punti');
const dottedInvoice=extractInvoiceText([
  'Fattura 930 del 27.10.2026',
  'Destinatario: CLIENTE FITTIZIO DATA SRL',
  'Imponibile € 100,00',
  'Totale IVA € 10,00',
  'Totale documento € 110,00',
  'Scadenza pagamento: 31.10.2026'
].join('\n'));
assert.equal(dottedInvoice.tipo_documento,'fattura');
assert.equal(dottedInvoice.data_emissione,'2026-10-27');
assert.equal(dottedInvoice.scadenza,'2026-10-31');
assert.equal(dottedInvoice.totale_documento,110);
assert.deepEqual(dottedInvoice.anomalie,[],'Date puntate valide non generano anomalie');
const dottedCredit=extractInvoiceText('Nota di credito 931 del 27.10.2026');
assert.equal(dottedCredit.tipo_documento,'nota_credito');
assert.equal(dottedCredit.data_emissione,'2026-10-27');
const equivalentDateHeadings=extractInvoiceText('Fattura 932 del 27.10.2026\nFattura 932 del 27/10/2026');
assert.ok(!equivalentDateHeadings.anomalie.some(x=>x.includes('Intestazioni documento discordanti')),'Date equivalenti non sono un conflitto');
const differentDateHeadings=extractInvoiceText('Fattura 933 del 27.10.2026\nFattura 933 del 28/10/2026');
assert.ok(differentDateHeadings.anomalie.some(x=>x.includes('Intestazioni documento discordanti')),'Date realmente discordanti vanno segnalate');
const invalidDottedDate=extractInvoiceText('Fattura 934 del 31.02.2026');
assert.equal(invalidDottedDate.data_emissione,null);
assert.ok(invalidDottedDate.anomalie.some(x=>x.includes('Data documento non valida')));

console.log('Invoice text parser: OK (synthetic fixtures)');


// Integrazione reale della funzione textDocs del gestionale, con fixture sintetiche.
const fs=require('node:fs');
const vm=require('node:vm');
const appSource=fs.readFileSync(require('node:path').join(__dirname,'../app.js'),'utf8');
const begin=appSource.indexOf('function textDocs(text){');
const finish=appSource.indexOf('const libraries=new Map();',begin);
assert.ok(begin>0&&finish>begin,'La funzione di importazione del gestionale deve essere presente');
assert.match(appSource,/async function checkedTextDocs\(text\)\{await loadScript\('\.\/src\/invoice-text-parser\.js','ITEInvoiceText'\)/);
assert.match(appSource,/docs=await checkedTextDocs\(await pdfText\(bytes\)\)/);
assert.match(appSource,/docs=await checkedTextDocs\(await ocr\(url\)\)/);
const sandbox={
  window:{ITEInvoiceText:{extractInvoiceText}},
  blank:()=>({type:'Da verificare',number:'',date:'',net:null,tax:null,total:null,party:{name:''},lines:[],notes:[]}),
  norm:()=>'',date:parseDate,num:value=>value?Number(String(value).replace(/\./g,'').replace(',','.')):null,
  windowsDocumentType:text=>/^\s*nota di credito/im.test(text)?'Nota credito':/^\s*fattura/im.test(text)?'Fattura':'',
  windowsProformaNumber:()=>'',windowsPartyBlocks:()=>({}),direction:()=>'',partyText:()=>({}),copy:value=>value
};
const importText=vm.runInNewContext(appSource.slice(begin,finish)+'\ntextDocs',sandbox);
const guardedCredit=importText([
  'Nota di credito 800 del 27/10/2026',
  'Imponibile € -100,00',
  'Totale IVA € -10,00',
  'Totale documento € -110,00'
].join('\n'))[0];
assert.equal(guardedCredit.type,'Da verificare','Una lettura che perde il segno negativo non puo essere classificata automaticamente');
assert.ok(guardedCredit.notes.some(n=>n.includes('Segno negativo imponibile')),'Avviso imponibile negativo');
assert.ok(guardedCredit.notes.some(n=>n.includes('Segno negativo IVA')),'Avviso IVA negativa');
assert.ok(guardedCredit.notes.some(n=>n.includes('Segno negativo totale')),'Avviso totale negativo');
const guardedHeadings=importText('Fattura 801 del 27/10/2026\nFattura 802 del 27/10/2026\nTotale documento € 110,00')[0];
assert.equal(guardedHeadings.type,'Da verificare');
assert.ok(guardedHeadings.notes.some(n=>n.includes('Intestazioni documento discordanti')),'Intestazioni discordanti evidenziate nel gestionale');
const cleanInvoice=importText('Fattura 803 del 27/10/2026\nImponibile € 100,00\nTotale IVA € 10,00\nTotale documento € 110,00')[0];
assert.equal(cleanInvoice.number,'803','Non cambiare il numero letto dal gestionale');
assert.equal(cleanInvoice.total,110,'Non cambiare gli importi letti dal gestionale');
assert.ok(!cleanInvoice.notes.some(n=>n.startsWith('Controllo contabile:')),'Non aggiungere falsi avvisi a una fattura coerente');
sandbox.window.ITEInvoiceText=null;
const legacy=importText('Fattura 804 del 27/10/2026\nTotale documento € 110,00')[0];
assert.equal(legacy.total,110,'Il parser di confronto non modifica il comportamento della lettura principale');
// Riattivare il parser per le prove del controllo integrato.
sandbox.window.ITEInvoiceText={extractInvoiceText};
// Il netto da pagare non deve essere salvato come totale documento.
const onlyPayableImport=importText('Fattura 805 del 27/10/2026\nTotale da pagare € 50,00')[0];
assert.equal(onlyPayableImport.total,null,'Il solo netto da pagare non e un totale documento');
assert.equal(onlyPayableImport.type,'Da verificare','Un totale documento assente richiede verifica');
assert.ok(onlyPayableImport.notes.some(n=>n.includes('presente solo netto da pagare')),'Segnalare la distinzione contabile');
const payableBeforeTotal=importText('Fattura 806 del 27/10/2026\nTotale da pagare € 102,00\nTotale documento € 122,00')[0];
assert.equal(payableBeforeTotal.total,122,'Non prendere il primo netto da pagare come totale');
assert.ok(!payableBeforeTotal.notes.some(n=>n.includes('Totale documento assente')),'Nessun falso avviso se il totale esiste');
const totalBeforePayable=importText('Fattura 807 del 27/10/2026\nTotale documento € 122,00\nTotale da pagare € 102,00')[0];
assert.equal(totalBeforePayable.total,122,'Ordine inverso: totale documento invariato');
assert.ok(!totalBeforePayable.notes.some(n=>n.includes('Totale documento discordante tra due letture')),'Il netto diverso non e un conflitto');
// Una data di contratto o riferimento che precede l'intestazione non e' data emissione.
const earlierContractDate=importText([
  'Contratto del 01/10/2026',
  'Fattura 905 del 27/10/2026',
  'Imponibile € 100,00',
  'Totale IVA € 10,00',
  'Totale documento € 110,00'
].join('\n'))[0];
assert.equal(earlierContractDate.date,'2026-10-01','Riprodurre la data sbagliata letta dal parser principale');
assert.equal(earlierContractDate.number,'905','Numero documento invariato');
assert.equal(earlierContractDate.total,110,'Importo originale invariato');
assert.equal(earlierContractDate.type,'Da verificare','Non accettare una data emissione discordante');
assert.ok(earlierContractDate.notes.some(n=>n.includes('Data documento discordante tra due letture')),'Avviso esplicito sulla data');
const matchingIssueDate=importText([
  'Fattura 906 del 27/10/2026',
  'Contratto del 01/10/2026',
  'Totale documento € 110,00'
].join('\n'))[0];
assert.equal(matchingIssueDate.date,'2026-10-27','La data corretta resta invariata');
assert.ok(!matchingIssueDate.notes.some(n=>n.includes('Data documento discordante tra due letture')),'Nessun falso allarme sulla data corretta');

const conflictingTd04Import=importText([
  'Fattura 907 del 27/10/2026',
  'Tipo documento: TD04',
  'Totale documento € 110,00'
].join('\\n'.replace('\\n','\n')))[0];
assert.equal(conflictingTd04Import.type,'Da verificare','Una fattura con TD04 contraddittorio resta da verificare');
assert.ok(conflictingTd04Import.notes.some(n=>n.includes('Intestazioni documento discordanti')));

console.log('Invoice import guard: OK (synthetic fixtures)');


// Regressione: proforma con intestazione autonoma, anche senza suffisso /PR.
const explicitProformaHeading=extractInvoiceText([
  'Proforma n. 940 del 27/10/2026',
  'Destinatario: CLIENTE SINTETICO PROFORMA SRL',
  'Imponibile € 100,00',
  'Totale IVA € 10,00',
  'Totale documento € 110,00'
].join('\n'));
assert.equal(explicitProformaHeading.tipo_documento,'proforma');
assert.equal(explicitProformaHeading.numero_documento,'940');
assert.equal(explicitProformaHeading.data_emissione,'2026-10-27');
assert.equal(explicitProformaHeading.totale_documento,110);
assert.deepEqual(explicitProformaHeading.anomalie,[],'Proforma coerente non produce anomalie');
assert.equal(explicitProformaHeading.richiede_conferma,true,'La proforma resta soggetta a verifica');

const invoiceProformaHeading=extractInvoiceText('Fattura proforma n. 941/2026 del 27.10.2026');
assert.equal(invoiceProformaHeading.tipo_documento,'proforma');
assert.equal(invoiceProformaHeading.numero_documento,'941/2026');
assert.equal(invoiceProformaHeading.data_emissione,'2026-10-27');

const courtesyProformaHeading=extractInvoiceText('Copia di cortesia Proforma 942 del 27/10/2026');
assert.equal(courtesyProformaHeading.tipo_documento,'proforma');
assert.equal(courtesyProformaHeading.numero_documento,'942');

const referencedProformaOnly=extractInvoiceText('Riferimento proforma n. 943 del 27/10/2026');
assert.equal(referencedProformaOnly.tipo_documento,null,'Un riferimento a proforma non e un documento autonomo');
assert.equal(referencedProformaOnly.numero_documento,null,'Non usare il numero della proforma richiamata');

const mixedInvoiceProforma=extractInvoiceText('Proforma 944 del 27/10/2026\nFattura 945 del 27/10/2026');
assert.ok(mixedInvoiceProforma.anomalie.includes('Intestazioni documento discordanti: verificare originale'),
  'Una proforma e una fattura diverse richiedono verifica');
const mixedCreditProforma=extractInvoiceText('Proforma 946 del 27/10/2026\nNota di credito 947 del 27/10/2026');
assert.equal(mixedCreditProforma.tipo_documento,'nota_credito');
assert.ok(mixedCreditProforma.anomalie.includes('Intestazioni documento discordanti: verificare originale'));

const integratedProforma=importText('Proforma n. 948 del 27/10/2026\nTotale documento € 110,00')[0];
assert.equal(integratedProforma.number,'948','Conservare il numero proforma letto nel gestionale');
assert.equal(integratedProforma.total,110,'Conservare il totale proforma');
assert.ok(!integratedProforma.notes.some(n=>n.includes('Intestazioni documento discordanti')),
  'Nessun falso conflitto nella lettura integrata');

console.log('Explicit proforma headings: OK (synthetic fixtures)');


// Regressione: TD08 (nota di credito semplificata) e tipi fiscali contraddittori.
const fiscalTypeConflict='Intestazioni documento discordanti: verificare originale';
const td08Only=extractInvoiceText('Tipo documento: TD08\nRiferimento fattura 12 del 27/10/2026');
assert.equal(td08Only.tipo_documento,'nota_credito','TD08 identifica una nota di credito');
assert.ok(td08Only.anomalie.includes('Numero nota di credito non individuato'),'TD08 senza numero resta da verificare');
const td08Credit=extractInvoiceText('Nota di credito 303 del 27/10/2026\nTipo documento: TD08');
assert.equal(td08Credit.tipo_documento,'nota_credito');
assert.ok(!td08Credit.anomalie.includes(fiscalTypeConflict),'TD08 coerente non genera conflitto');
const creditWithTd02=extractInvoiceText('Nota di credito 300 del 27/10/2026\nTipo documento: TD02');
assert.ok(creditWithTd02.anomalie.includes(fiscalTypeConflict),'Nota di credito con TD02 richiede verifica');
const proformaWithTd01=extractInvoiceText('Proforma 301 del 27/10/2026\nTipo documento: TD01');
assert.ok(proformaWithTd01.anomalie.includes(fiscalTypeConflict),'Proforma con TD01 fiscale richiede verifica');
const invoiceWithTd08=extractInvoiceText('Fattura 302 del 27/10/2026\nTipo documento: TD08');
assert.equal(invoiceWithTd08.tipo_documento,'nota_credito');
assert.ok(invoiceWithTd08.anomalie.includes(fiscalTypeConflict),'Fattura con TD08 richiede verifica');
const ordinaryTd02=extractInvoiceText('Fattura 304 del 27/10/2026\nTipo documento: TD02');
assert.equal(ordinaryTd02.tipo_documento,'fattura');
assert.ok(!ordinaryTd02.anomalie.includes(fiscalTypeConflict),'TD02 con fattura non e un conflitto');
const integratedFiscalConflict=importText('Proforma 305 del 27/10/2026\nTipo documento: TD01\nTotale documento € 110,00')[0];
assert.equal(integratedFiscalConflict.type,'Da verificare');
assert.ok(integratedFiscalConflict.notes.some(n=>n.includes('Intestazioni documento discordanti')),'Conflitto proforma-TD01 visibile nel gestionale');
console.log('Fiscal type TD08 and contradictions: OK (synthetic fixtures)');


// Regressione: un riferimento a fattura non e' il numero della nota TD04/TD08.
// Il parser principale puo' leggere "12", ma il controllo deve segnalarlo senza
// alterare il testo o sovrascrivere il valore originale prima della conferma.
for(const fiscalCode of ['TD04','TD08']){
  const syntheticCredit='Tipo documento: '+fiscalCode+'\nRiferimento fattura 12 del 27/10/2026\nTotale documento € 110,00';
  const parsedCredit=extractInvoiceText(syntheticCredit);
  assert.equal(parsedCredit.numero_documento,null,'Numero della nota assente: '+fiscalCode);
  const importedCredit=importText(syntheticCredit)[0];
  assert.equal(importedCredit.number,'12','Lettura originale conservata per revisione: '+fiscalCode);
  assert.equal(importedCredit.type,'Da verificare','Nota senza numero non classificata automaticamente: '+fiscalCode);
  assert.ok(importedCredit.notes.some(n=>n.includes('Numero nota di credito non individuato')),
    'Avviso sul riferimento scambiato per numero nota: '+fiscalCode);
}
const numberedCredit=importText('Nota di credito 303 del 27/10/2026\nTipo documento: TD08\nTotale documento € 110,00')[0];
assert.ok(!numberedCredit.notes.some(n=>n.includes('Numero nota di credito non individuato')),
  'Nota numerata non deve generare falso avviso');
console.log('Credit note missing number import guard: OK (synthetic fixtures)');


// Regressione: scadenze di pagamento discordanti nella stessa fattura.
// Conservare la prima lettura, ma richiedere una verifica esplicita.
const conflictingDeadlines=extractInvoiceText([
  'Fattura 991 del 27/10/2026',
  'Destinatario: CLIENTE FITTIZIO SCADENZE SRL',
  'Imponibile € 100,00',
  'Totale IVA € 22,00',
  'Totale documento € 122,00',
  'Scadenza pagamento: 30/10/2026',
  'Scadenza pagamento: 31/10/2026'
].join('\n'));
assert.equal(conflictingDeadlines.scadenza,'2026-10-30','Prima scadenza conservata');
assert.ok(conflictingDeadlines.anomalie.includes('Scadenze pagamento discordanti: verificare originale'),
  'Scadenze diverse devono essere segnalate');
const matchingDeadlines=extractInvoiceText(
  'Fattura 992 del 27/10/2026\nScadenza pagamento: 30.10.2026\nScadenza pagamento: 30/10/2026'
);
assert.equal(matchingDeadlines.scadenza,'2026-10-30');
assert.ok(!matchingDeadlines.anomalie.some(x=>x.includes('Scadenze pagamento discordanti')),
  'Date equivalenti con separatori diversi non devono generare falsi conflitti');
const oneDeadline=extractInvoiceText('Fattura 993 del 27/10/2026\nScadenza pagamento: 30/10/2026');
assert.ok(!oneDeadline.anomalie.some(x=>x.includes('Scadenze pagamento discordanti')),
  'Una sola scadenza non e un conflitto');
const integratedDeadlineConflict=importText(
  'Fattura 994 del 27/10/2026\nScadenza pagamento: 30/10/2026\nScadenza pagamento: 31/10/2026'
)[0];
assert.equal(integratedDeadlineConflict.type,'Da verificare');
assert.ok(integratedDeadlineConflict.notes.some(x=>x.includes('Scadenze pagamento discordanti')),
  'Il controllo del gestionale deve mostrare il conflitto');
console.log('Conflicting payment deadlines: OK (synthetic fixtures)');


// Regressione: una scadenza impossibile non deve scomparire senza avviso.
// Usare solo documenti e nominativi fittizi.
const invalidDueDate=extractInvoiceText([
  'Fattura 995 del 27/10/2026',
  'Destinatario: CLIENTE FITTIZIO DATE SRL',
  'Imponibile € 100,00',
  'Totale IVA € 22,00',
  'Totale documento € 122,00',
  'Scadenza pagamento: 31/02/2026'
].join('\n'));
assert.equal(invalidDueDate.scadenza,null,'Non registrare una data di scadenza impossibile');
assert.ok(invalidDueDate.anomalie.includes('Scadenza pagamento non valida: verificare originale'),
  'Una scadenza impossibile richiede verifica manuale');
const integratedInvalidDue=importText('Fattura 996 del 27/10/2026\nScadenza pagamento: 31/02/2026')[0];
assert.equal(integratedInvalidDue.type,'Da verificare');
assert.ok(integratedInvalidDue.notes.some(x=>x.includes('Scadenza pagamento non valida')),
  'Il gestionale deve mostrare la scadenza non valida');
const validLeapDue=extractInvoiceText('Fattura 997 del 27/10/2026\nScadenza pagamento: 29/02/2028');
assert.equal(validLeapDue.scadenza,'2028-02-29');
assert.ok(!validLeapDue.anomalie.some(x=>x.includes('Scadenza pagamento non valida')),
  'Il 29 febbraio di un anno bisestile e valido');
const mixedInvalidDue=extractInvoiceText('Fattura 998 del 27/10/2026\nScadenza pagamento: 31/02/2026\nScadenza pagamento: 30/11/2026');
assert.equal(mixedInvalidDue.scadenza,null,'Non sostituire silenziosamente la prima scadenza non valida');
assert.ok(mixedInvalidDue.anomalie.some(x=>x.includes('Scadenza pagamento non valida')));
assert.ok(mixedInvalidDue.anomalie.some(x=>x.includes('Scadenze pagamento discordanti')));
console.log('Invalid payment deadline guard: OK (synthetic fixtures)');


// Regressione: il campo destinatario vuoto non deve diventare un identificativo fiscale
// o una voce contabile. Tutti i dati qui sotto sono fittizi.
for (const [label, followingLine] of [
  ['partita IVA abbreviata', 'P.IVA: 00000000000'],
  ['codice fiscale abbreviato', 'C.F.: ABCDEF00A00A000A'],
  ['partita IVA estesa', 'Partita IVA 00000000000'],
  ['codice fiscale esteso', 'Codice fiscale: ABCDEF00A00A000A'],
  ['riga imponibile', 'Imponibile € 100,00']
]) {
  const doc=extractInvoiceText('Fattura 1001 del 27/10/2026\nDestinatario\n'+followingLine);
  assert.equal(doc.cliente,null,'Non interpretare '+label+' come cliente');
  assert.ok(doc.anomalie.includes('Cliente non individuato'),'Segnalare il destinatario assente: '+label);
}
const legitimateRecipient=extractInvoiceText('Fattura 1002 del 27/10/2026\nDestinatario: CLIENTE INVENTATO SRL');
assert.equal(legitimateRecipient.cliente,'CLIENTE INVENTATO SRL','Un destinatario valido resta leggibile');
console.log('Missing recipient metadata guard: OK (synthetic fixtures)');
