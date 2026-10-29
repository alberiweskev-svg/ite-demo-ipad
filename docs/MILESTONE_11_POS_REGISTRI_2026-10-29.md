# I.T.E. 4.0 — Milestone 11: registri operativi POS (29/10/2026)

## Perimetro e stato verificato

Ramo isolato: sviluppo-4.0.0-base. Base prima dei cambiamenti: af9d583f8477f598cb02a4c51bce194d312d92b0. Copia Git di sicurezza: backup/4.0-pre-pos-registri-2026-10-29. Nessuna modifica a main (operativa 3.0.74), al pacchetto Windows 2.7.5 o ai PDF reali.

Questa milestone rende più operativa la compilazione delle **12 sezioni POS già presenti**, senza sostituire il wizard originale Windows 2.7.5. Non è un POS normativamente completo o firmato.

## Implementato

- Cinque registri guidati, accessibili dall'editor della stessa pratica POS: personale/mansioni/formazione da verificare; attrezzature/uso/controlli; fasi/rischi/misure; mansioni/DPI/protezioni collettive; scenari/procedure di emergenza/referenti.
- Inserimento, modifica e rimozione di più righe per registro, con controlli di campi minimi, duplicati, caratteri non ammessi, lunghezza massima e massimo 15 righe per registro.
- Per il personale, selezione facoltativa di dipendenti/tecnici/collaboratori già presenti nell'anagrafica: propone nominativo e mansione, lascia vuota la formazione, e richiede conferma esplicita per aggiungere la riga.
- Conservazione del testo manuale già presente: nessuna migrazione distruttiva e nessuna sostituzione automatica. I dati delle righe guidate sono leggibili anche nelle normali aree di testo POS.
- I registri usano **esclusivamente i campi strutturati POS esistenti** (personale, attrezzature, rischi, dpi, emergenze): pertanto passano nel salvataggio con backup preventivo, revisioni, audit, esportazione del fascicolo e PDF di bozza già presenti. Nessun database parallelo o dato salvato fuori dall'archivio cifrato.
- Verifica incrociata **indicativa** di presenza personale/rischi/DPI/emergenze. Non è una valutazione dei rischi e non attesta l'efficacia delle misure.
- Interfaccia locale senza chiamate esterne, progettata per controlli touch iPad/Safari. Modulo separato pos-operativo.js caricato nella demo unica; hash SRI mantenuto dal controllo automatico dev/sync_sri.cjs.

## Test aggiunti

- dev/test_400_pos_registers.cjs: serializzazione reversibile, testo libero, aggiunta/modifica/rimozione, duplicati, limiti e segnalazioni incrociate.
- dev/test_400_technical_browser.cjs: aggiunta righe POS e conservazione testo manuale, persistenza e backup in Chromium/WebKit.
- .github/workflows/ite-4-regression.yml: controllo sintattico, test unitari e presenza del modulo nel pacchetto di anteprima.

Le verifiche automatiche GitHub devono essere consultate sul commit definitivo; l'esistenza dei test non equivale a un collaudo su iPad fisico.

## Limiti aperti

Il modulo POS 2.7.5 non è ancora portato integralmente: mancano modelli ufficiali, firma, verifica normativa dei contenuti, completa gestione attrezzature e personale da anagrafica, allegati e scadenze, stampa conforme. CAD e GAS restano separati e incompleti. Le righe guidate sono testo strutturato leggibile, non un archivio relazionale autonomo. I PDF restano **bozze non firmate**.

## Sicurezza e distribuzione

Dati sintetici nei test, nessun cliente o PDF reale nel repository. La versione 4.0 è un'anteprima di sviluppo e non deve sostituire la 3.0.74. GitHub Pages non viene attivato da questa milestone. Prima dell'utilizzo su iPad reale occorrono verifica pubblicazione, collaudo Safari fisico e backup scaricato fuori dal dispositivo.
