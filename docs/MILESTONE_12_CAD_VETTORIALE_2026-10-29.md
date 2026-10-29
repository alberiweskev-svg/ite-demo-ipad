# Milestone 12 — Disegno Tecnico I.T.E. CAD (bozze vettoriali)

29 ottobre 2026 · ramo esclusivo `sviluppo-4.0.0-base`

## Ambito realizzato
- Unica demo 4.0: pagina CAD integrata nel menu Documenti, Home e router, utilizzabile con puntatore e tocco (motore WebKit).
- Strumenti: muri punto-punto, linee, rettangoli, quote grafiche, testi, selezione/spostamento, rotazione 90°, duplica, elimina, ordine avanti/indietro, colori e annulla/ripeti.
- Reticolo e coordinate grafiche in tempo reale, esportazione SVG e JSON e reimportazione JSON con convalida (nessun SVG esterno eseguito).
- Disegni collegati a cliente, sede, cantiere e impianto; validazione incrociata e protezione dalla cancellazione dei riferimenti.
- Salvataggio nello stesso archivio cifrato `ITECommerce.settings.cadDrawings`, revisioni storicizzate (massimo 30), archiviazione conservativa, copia completa ITEHistory prima di ogni scrittura. Il backup completo contiene anche i disegni e le revisioni.
- Limiti: 200 elementi per disegno, 300 disegni, dati sintetici nei test. Nessuna pubblicazione Pages.

## Limiti dichiarati
Il CAD è una base vettoriale operativa **non equivalente** al CAD Windows 2.7.5: non sono ancora presenti librerie simboli impiantistici, gruppi/blocchi, distinta materiali, quote metriche calibrate, snap ad oggetti e stampa tecnica conforme. Le quote sono unità grafiche, non misure di cantiere. I disegni SVG e JSON esportati non sono cifrati e devono essere custoditi in modo sicuro. Nessun PDF ufficiale o certificazione è prodotto.

## Collaudo
`node dev/test_400_cad.cjs` valida geometrie, duplicazioni, trasformazioni, revisione, isolamento cliente e blocco dei riferimenti non validi. `dev/test_400_cad_browser.cjs` copre salvataggio, backup, revisioni, SVG, annulla/ripeti in Chromium e WebKit nella pipeline di regressione. Il test su iPad fisico resta da eseguire.
