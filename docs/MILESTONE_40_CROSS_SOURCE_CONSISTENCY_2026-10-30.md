# Milestone 40 — Coerenza incrociata fonti e compilazione assistita (30 ottobre 2026)

## Blocco integrato
Il modulo ite-technical-consistency.js è caricato nella demo unica 4.0. Aggiunge **Coerenza fonti** a ogni pratica Di.Co./Di.Ri./GAS/POS e due report (A4 e CSV) per il cliente filtrato.

## Funzioni
- Controlla la gerarchia Cliente → Sede → Impianto → Apparecchiatura e i riferimenti al cantiere.
- Verifica originali, file mancanti, allegati registrati, revisioni superate, prove stornate, interventi non corrispondenti, collegamenti CAD e checklist.
- Segnala discrepanze tra PDR generale e PDR verificato, senza dedurre PDR o esiti di conformità.
- Propone da anagrafica soltanto committente, indirizzo e cantiere; **mai** sovrascrive dati compilati. Il comando di compilazione apre l'editor esistente e riempie solo campi vuoti, senza salvare automaticamente.
- Produce report A4 e CSV con escaping HTML, protezione da formule CSV, filtro obbligatorio per cliente e conferma di download non cifrato.

## Sicurezza
L'analisi è read-only; per confermare una pratica l'utente usa il salvataggio esistente con backup, revisione e audit. I riferimenti incrociati a clienti diversi bloccano il report. Nessun PDF reale pubblicato. Nessuna dichiarazione ufficiale o firma generata.

## Test e limiti
Il test sintetico dev/test_400_technical_consistency.cjs copre PDR, CAD, prove, allegati, revisioni, isolamento, HTML, CSV e immutabilità dei dati. I risultati della regressione completa e del collaudo Safari su iPad fisico vanno verificati separatamente. La riproduzione fedele dei modelli originali Windows 2.7.5 non è ancora completata.

Backup Git: backup/4.0-pre-technical-consistency-2026-10-30-12. Main 3.0.74 e Windows 2.7.5 invariati. Versione 4.0 development, published=false.
