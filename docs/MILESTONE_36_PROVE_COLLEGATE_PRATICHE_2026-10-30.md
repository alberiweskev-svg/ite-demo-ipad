# Milestone 36 — Prove di intervento riferite alle pratiche tecniche (30 ottobre 2026)

## Obiettivo e ambito
Collegare esplicitamente le rilevazioni della Milestone 35 alle bozze Di.Co. elettrica/idrotermica, Di.Ri. e allegati GAS H40/I40/A12/B12. Un collegamento è **un riferimento descrittivo**, non prova di conformità, verifica normativa, firma, modello ufficiale compilato o attestazione dell'esito.

## Funzioni implementate
- Modulo `ite-technical-evidence.js` nella demo unica 4.0, con comando **Prove collegate** per ciascuna pratica tecnica, senza modificare l'interfaccia operativa 3.0.74.
- Elenco delle prove candidate limitato allo stesso cliente e, se presente, allo stesso intervento. Per pratiche non associate a un intervento è obbligatoria la stessa apparecchiatura e la coerenza di impianto/cantiere; le prove stornate non sono selezionabili.
- Collegamento esplicito con revisore dichiarato e motivazione, data e revisione della pratica. Il revisore è testo dichiarato, **non identità autenticata né firma**.
- Revoca motivata, senza cancellare la registrazione originaria; rilevazione automatica di prova stornata, revisione pratica superata e pratica annullata. La revoca non riattiva prove e non modifica l'esito della misura.
- Archivio `ITECommerce.settings.technicalEvidenceLinks` cifrato, validazione in `ITECommerce.validate` inclusi backup/ripristino, controllo duplicati e coerenza cliente/intervento, backup preventivo e audit.
- Report A4 HTML e CSV locali, con avviso esplicito che i file scaricati non sono cifrati, escaping HTML e neutralizzazione formule CSV.
- Riferimenti inseriti nella **matrice di verifica interna** e nelle esportazioni A4/CSV e nel piano di completamento delle pratiche tecniche, senza copiare valori in campi dichiarativi o trasformarli in esiti certificati.

## Test sintetici aggiunti
- `dev/test_400_technical_evidence.cjs`: collegamenti, clienti diversi, interventi non corrispondenti, revisioni superate, prove stornate, revoca, duplicati, CSV/HTML, audit e nessuna alterazione delle prove.
- `dev/test_400_technical_evidence_browser.cjs`: percorso integrato con archivio cifrato, pratica Di.Co. fittizia, salvataggio, backup, esportazione CSV, revoca e audit; eseguito da CI su Chromium e WebKit.
- Estensione di `dev/test_400_structured_docs.cjs` per matrice, A4/CSV e isolamento cliente.
- Aggiornamento workflow di regressione, build e sincronizzazione SHA-384 dei nuovi script.

## Limitazioni esplicite
I modelli ufficiali Di.Co./Di.Ri./GAS e la parità funzionale Windows 2.7.5 **non sono ancora completati**. L'eventuale collegamento di una misura non sostituisce la verifica della strumentazione, la prova in campo, gli allegati normativi, il controllo professionale o le firme. Il modulo non produce PDF ufficiali e non importa PDF reali. Safari su iPad fisico e la pubblicazione online restano da verificare: `version.json` mantiene `published=false`.

Backup Git preventivo: `backup/4.0-pre-technical-evidence-2026-10-30-08` dal commit `be31358d726cda21eed553dd32c2bb464bb61099`. `main` 3.0.74 e i moduli Windows 2.7.5 sono fuori perimetro e non modificati.
