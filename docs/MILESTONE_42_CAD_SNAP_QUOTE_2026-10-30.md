# Milestone 42 — CAD: snap geometrico e quote ortogonali (30 ottobre 2026)

## Backup e ambito
Backup Git precedente alle modifiche: `backup/4.0-pre-cad-snaps-2026-10-30-14`, base `bc69e552460506571e435865ac036dba01b87513`.
Modifiche soltanto al ramo `sviluppo-4.0.0-base`. Nessun intervento su `main`, versione operativa 3.0.74, o moduli Windows 2.7.5.

## Funzionalità
- Modalità snap avanzato opzionale nell'editor CAD esistente: estremi, punti medi e intersezioni di segmenti di muri, linee, quote e lati di rettangoli non ruotati.
- Ricerca incroci limitata ai segmenti vicini al puntatore; segmenti paralleli o sovrapposti non generano intersezioni arbitrarie.
- Aggancio su griglia di 10 unità coerente con la serializzazione corrente. Gli incroci non allineati alla griglia vengono arrotondati: **non sono quote esecutive di precisione**.
- Strumenti Quota orizzontale e Quota verticale con geometria vincolata all'asse, indipendenti dal vincolo ortogonale generale.
- Anteprima del tratto in unità grafiche e in centimetri indicativi solo se il tecnico ha impostato la scala; nessuna deduzione automatica di dimensioni reali.
- Nessun nuovo campo persistente: disegni legacy, storico, undo/redo, backup cifrato, A4 e CSV continuano con il formato CAD esistente.

## Verifiche
`dev/test_400_cad_snap.cjs` verifica intersezioni, punti medi, compatibilità snap legacy, limiti, quote H/V, validazione e immutabilità. Test browser CAD esteso su Chromium e WebKit per comandi e geometria. Workflow build e regressione aggiornati. Esito remoto da verificare sul commit finale.

## Limiti
Bozza tecnica, non CAD certificato e non sostituisce quote rilevate sul posto. Rettangoli ruotati esclusi dagli snap avanzati. Il test Safari su iPad fisico rimane necessario. Nessuna demo pubblicata finché `published=false`.
