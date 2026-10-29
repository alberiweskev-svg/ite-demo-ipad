# Milestone 24 — Rientro controllato dei PDF tecnici compilati (29 ottobre 2026)

## Obiettivo
Nell'unica demo I.T.E. 4.0, accanto al comando «PDF compilabile (bozza)» compare «Importa PDF compilato». Il tecnico può riaprire un AcroForm prodotto dal gestionale, confrontare i valori modificati e scegliere quali riportare nella pratica, senza reinserimento manuale.

## Funzioni integrate
- Esportazione con nove campi di identificazione **sola lettura** (ID pratica, revisione, cliente, tipo, sede, cantiere, impianto, apparecchiatura e intervento). Il rientro controlla tutte le corrispondenze; un PDF vecchio o di un'altra pratica viene rifiutato.
- Lettura locale con PDF.js già distribuito nel repository e worker locale. File massimo 6 MB e 30 pagine; solo campi testuali AcroForm univoci, noti e di lunghezza limitata.
- Anteprima delle differenze con selezione campo per campo: i campi vuoti vengono proposti, le sovrascritture di dati esistenti sono **deselezionate** e richiedono scelta esplicita.
- Scrittura selettiva in campi generali, data e sezioni strutturate; nessuna modifica ai collegamenti anagrafici, agli originali, alle checklist, alle firme o agli esiti di prova.
- Prima di salvare: controllo di coerenza tramite il validatore delle pratiche, backup `ITEHistory.create`, verifica della revisione corrente. Poi incremento della revisione, storico `REVISIONE` e registrazione audit `IMPORTA_CAMPI_PDF_TECNICO`. La provenienza automatica dell'originale viene rimossa dai soli campi effettivamente modificati.

## Test
- `dev/test_400_acroform.cjs`: metadata readonly, importazione selettiva, conflitti, cliente diverso, revisione obsoleta, campi sconosciuti e non-mutazione.
- `dev/test_400_technical_pdf_browser.cjs`: in Chromium e WebKit, modifica sintetica di un campo AcroForm, caricamento locale, anteprima, scelta esplicita della sovrascrittura, backup e revisione salvata.
- La regressione e la build GitHub sono il criterio di accettazione; non dichiarare completata la milestone prima di averle verificate.

## Limiti
L'importazione accetta soltanto i PDF AcroForm della nuova versione, con metadati di origine. I PDF precedenti senza tali campi non sono importabili automaticamente. I metadati non costituiscono firma digitale né prova crittografica di autenticità: sono controlli di coerenza locale. I PDF rimangono **bozze non ufficiali**, non cifrate, non firmate; non sostituiscono i modelli Di.Co./Di.Ri./GAS/POS della 2.7.5. Non vengono importati nuovi originali allegati dal PDF, né sono attestate prove o conformità.

## Conservazione
Backup Git preventivo: `backup/4.0-pre-acroform-roundtrip-2026-10-29-20`. Nessuna modifica al ramo `main` o alla versione 3.0.74, nessuna modifica ai moduli Windows 2.7.5, nessun documento cliente reale nei test. La demo non viene pubblicata online automaticamente.
