# Milestone 16 — Fonti tecniche incrociate: anagrafiche, interventi e CAD

29 ottobre 2026 · ramo \`sviluppo-4.0.0-base\` · sviluppo isolato I.T.E. 4.0.0.

## Blocco operativo integrato

- Nel modulo **Pratiche tecniche** è disponibile il controllo incrociato di **cliente → sede → impianto → apparecchiatura → intervento** con la tavola CAD già collegata alla pratica.
- Pulsante **Analizza fonti collegate** nella compilazione della pratica: mostra valori proposti con la fonte (cliente, sede, intervento chiuso, apparecchiatura, CAD e catalogo) e avvisi di incoerenza. L'operatore seleziona singolarmente i valori e applica **solo ai campi vuoti**. Non viene effettuato alcun salvataggio automatico: rimane il normale pulsante di salvataggio della pratica con backup preventivo e storico revisioni.
- **Materiali dal CAD**: recupera simboli associati a codici articolo in pezzi, quantità e descrizioni, riportandoli come **distinta preliminare da verificare** nei campi materiali e riferimenti guidati. Non deduce materiali realmente installati, non scarica il magazzino, non contabilizza né certifica.
- **Riferimento schema**: riporta ID e revisione del disegno soltanto se la revisione collegata coincide con quella salvata; se è cambiata, la precompilazione CAD viene bloccata e segnalata.
- **Apparecchiatura e intervento**: propone i dati tecnici disponibili in anagrafica e la descrizione lavori soltanto quando l'intervento collegato risulta chiuso; non deduce esiti di prove, verifiche, firme o conformità.
- **Fascicolo cliente**: pulsante **Controllo incrociato fascicolo cliente** in sola lettura. Richiede un cliente selezionato e presenta avvisi per ogni pratica del cliente, senza includere originali o trasferire dati online.

## Vincoli

- Non compila automaticamente il campo **PDR verificato** dei modelli GAS da un semplice PDR anagrafico. Non propone firme, esiti di prova o dichiarazioni di conformità.
- Blocca collegamenti tra clienti/sedi/impianti incoerenti, disegni archiviati o revisioni CAD non aggiornate. Se sono collegate più tavole, non sceglie arbitrariamente quale utilizzare.
- Non sovrascrive campi compilati. Dopo l'analisi rilegge le fonti prima di applicare e richiede una nuova analisi se cambiano.
- L'archivio cifrato e il normale backup/revisione delle pratiche restano gli unici percorsi di persistenza; la nuova analisi non modifica autonomamente i dati.
- Documenti ufficiali Di.Co./Di.Ri./GAS, firme, parità POS/CAD 2.7.5 e Safari su iPad fisico **non sono dichiarati completati**.

## Test

- \`dev/test_400_technical_sources.cjs\`: dati sintetici, isolamento clienti, materiale CAD, revisione obsoleta, intervento aperto, GAS senza PDR attestato, audit e magazzino invariato.
- \`dev/test_400_technical_sources_browser.cjs\`: Chromium e WebKit, selezione di un campo, conservazione del valore manuale, salvataggio con revisione e backup.
- CI: \`.github/workflows/ite-4-regression.yml\` e \`build-400.yml\`. Gli esiti vanno verificati sui run GitHub Actions; un commit non equivale a un collaudo superato.
- Backup Git pre-modifica: \`backup/4.0-pre-fonti-tecniche-2026-10-29-11\`.

Nessun PDF reale, dato cliente o identificativo sensibile è incluso nei test. Nessuna modifica a \`main\`, alla 3.0.74 operativa o al pacchetto Windows 2.7.5. La demo 4.0 non viene pubblicata automaticamente.
