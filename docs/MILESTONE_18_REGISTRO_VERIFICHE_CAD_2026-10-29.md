# Milestone 18 — Registro verifiche e distinta CAD nel fascicolo tecnico

29 ottobre 2026 — ramo sviluppo-4.0.0-base, solo sviluppo.

## Implementato

- Matrice di verifica **interna e non certificativa** per ogni pratica Di.Co., Di.Ri., GAS e POS: identificazione, sede/impianto, campi richiesti dalla compilazione guidata, originali, evidenze, riferimenti CAD, PDR e cronologia POS quando applicabili.
- Distinta dei materiali ricavata dai simboli delle tavole CAD collegate, con quantità raggruppate per articolo e simbolo, descrizione, unità, revisione e segnalazioni di articoli mancanti, unità incompatibili e giacenze non documentate/insufficienti.
- Controllo della revisione della tavola e dell'appartenenza al cliente **prima** di mostrare materiali o riferimenti: nessuna informazione delle tavole di altri clienti nell'export.
- Pulsante **Registro verifiche CSV (bozza)** nel pannello delle pratiche. Esporta soltanto le pratiche visibili del cliente selezionato (1–50), usando lo stesso filtro del fascicolo. CSV con escaping di virgolette, separatore e formule di foglio elettronico.
- Fascicolo A4 arricchito con matrice e distinta per pratica; nessuna mutazione di magazzino, interventi, preventivi o archivio; nessun file originale incorporato.
- Download HTML e CSV locali **non cifrati**: custodire in luogo sicuro. Nessun invio di dati in rete.

## Limiti espliciti

Le verifiche sono una checklist operativa, **non** un controllo normativo, una dichiarazione di conformità o una certificazione. Le quantità CAD e le giacenze sono indicative, non costituiscono ordine, scarico di magazzino o collaudo. Le firme e i modelli ufficiali Di.Co./Di.Ri./GAS devono ancora essere confrontati con i sorgenti 2.7.5 e validati.

## Test

- node --check technical-structured-docs.js
- node dev/test_400_structured_docs.cjs (dati sintetici, privacy, revisioni, quantità, giacenze, CSV anti-formula, sola lettura)
- node dev/test_400_structured_docs_browser.cjs <cartella-demo> (Chromium e WebKit, download HTML/CSV, isolamento cliente e salvataggio invariato)
- GitHub Actions: regressione completa e build, **da verificare dopo il commit**.

Backup preventivo: backup/4.0-pre-technical-audit-2026-10-29-14. Main 3.0.74 e moduli Windows 2.7.5 non modificati. Demo online non pubblicata.
