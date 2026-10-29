# Milestone 23 — Schede PDF compilabili AcroForm (29 ottobre 2026)

## Obiettivo e integrazione
Nell'unica demo I.T.E. 4.0, per ogni pratica tecnica viene aggiunto il comando **PDF compilabile (bozza)** accanto all'esportazione PDF tradizionale. Il nuovo modulo `technical-acroform.js` utilizza il motore `ITETechnicalPDF` esistente per verificare la coerenza di cliente, sede, impianto, apparecchiatura e intervento prima di creare un documento locale.

## Funzioni implementate
- PDF AcroForm con campi editabili precompilati da archivio: riferimento, data, descrizione, materiali, verifiche, note e tutti i campi strutturati della tipologia.
- Supporto alle 8 tipologie: Di.Co. elettrica, Di.Co. idrica/termica, Di.Ri., GAS H40/I40/A12/B12 e POS.
- Campi a testo multilinea, paginazione automatica, font Helvetica WinAnsi, stream di apparenza, indice di integrità PDF (xref) e contatore degli originali verificabili.
- Limiti di dimensione e numero campi, escape dei valori PDF, blocco su clienti/sedi incoerenti e assenza di chiamate di rete.
- Pulsante contestuale, download locale, integrazione SRI e test CI con soli dati sintetici.

## Limiti importanti
Queste schede **non riproducono i modelli ufficiali**: non sono Di.Co., Di.Ri., allegati GAS o POS validi e non sostituiscono i moduli Windows 2.7.5. Nessuna firma, esito di prova o dichiarazione di conformità è generata automaticamente. La modifica dei campi in un lettore PDF non aggiorna l'archivio I.T.E.; l'eventuale file compilato va gestito manualmente. Il PDF non è cifrato. Alcuni caratteri Unicode fuori da WinAnsi possono essere sostituiti da '?'. Il comportamento di compilazione e salvataggio su Safari/iPad fisico resta da collaudare.

## Verifiche
`node --check technical-acroform.js` e `node dev/test_400_acroform.cjs` sono inclusi nella regressione. Il test controlla le otto tipologie, il formato PDF, campi editabili, multilinea, xref, paginazione, escaping, isolamento cliente/sede e non-mutazione dell'archivio. Esito finale della CI da verificare nella run GitHub.

## Sicurezza e compatibilità
Backup preventivo: `backup/4.0-pre-acroform-2026-10-29-19`. Il ramo `main` 3.0.74 non è stato modificato, né sono stati modificati i moduli Windows 2.7.5. Nessun documento cliente reale o dato sensibile viene inserito nel repository.
