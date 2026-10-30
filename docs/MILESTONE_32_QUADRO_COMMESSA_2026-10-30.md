# Milestone 32 — Quadro integrato di riconciliazione commessa (30 ottobre 2026)

## Integrazione
Nuovo pannello in sola lettura nella **scheda cantiere** dell'unica demo 4.0. Aggrega le Milestone 27–31 tramite `ITEContractBilling.calculate` e `ITEJobEconomics.analyze`. Nessuna pagina isolata, nessuna nuova fattura o movimento di magazzino.

## Funzioni
- Confronto fra imponibile approvato di preventivi/Extra, importo attribuito alle fatture e fatturato registrato.
- Incassi/compensazioni e residui fatture esposti **al lordo IVA**, separati dagli importi netti.
- Materiali a costo noto, ore operatore e spese aggiuntive; differenza indicativa esplicitamente **non utile fiscale**.
- Dettagli per preventivo/Extra e fattura; segnalazioni di attribuzioni mancanti, dati incongruenti, costi materiali non verificati, ore aperte, materiali non attribuiti.
- Esportazione CSV con conferma per dati non cifrati e protezione contro formule in celle.
- Controllo cliente/cantiere tramite moduli di origine; nessuna trasmissione esterna.

## Test e limiti
Test sintetici unitari di approvati, fatture, incassi, residui, costi, protezione HTML/CSV, dati incompleti e isolamento cliente. Verifica JavaScript e regressione GitHub previste; il risultato CI deve essere controllato prima di dichiarare il completamento.

Il confronto è solo parziale: non comprende costi indiretti, imposte, spese mancanti o margini fiscalmente certificati. Il pannello non sostituisce i modelli originali Di.Co./Di.Ri./GAS, POS e CAD 2.7.5. Safari su iPad fisico non ancora collaudato.

## Protezione
Backup precedente: `backup/4.0-pre-commessa-reconciliation-2026-10-30-04` sul commit `47049a8`. `main` 3.0.74 e moduli Windows 2.7.5 invariati. Nessun dato reale nei test pubblici.
