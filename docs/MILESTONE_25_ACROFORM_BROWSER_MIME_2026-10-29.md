# Milestone 25 — PDF AcroForm operativo in anteprima locale e regressione browser (29 ottobre 2026)

## Difetto individuato nella regressione
La Milestone 24 non superava il test Chromium: la lettura del PDF compilato non apriva l'anteprima perché il server di test serviva `vendor/pdf.mjs` come `application/octet-stream`. I moduli JavaScript importati dinamicamente richiedono un MIME JavaScript valido. Lo stesso errore era presente nell'avvio dell'anteprima Windows `AVVIA_ANTEPRIMA_WINDOWS.ps1`: quindi non era solo un falso negativo dei test, ma un blocco concreto all'uso della funzione.

## Correzioni integrate
- Aggiunto MIME `text/javascript; charset=utf-8` per i file `.mjs` al server locale Windows, inclusi PDF.js e relativo worker.
- Allineato il server di test Chromium/WebKit allo stesso comportamento dell'anteprima locale, senza aggirare la lettura reale con PDF.js.
- Il test browser continua a verificare esportazione, modifica sintetica di AcroForm, importazione selettiva, protezione della sovrascrittura, backup, revisione e fascicolo. Non utilizza dati clienti reali.

## Limiti
Il fix non certifica i modelli ufficiali Di.Co./Di.Ri./GAS/POS e non equivale a un collaudo Safari su iPad fisico. Le bozze PDF esportate non sono cifrate. La versione operativa 3.0.74 e i moduli Windows 2.7.5 non vengono modificati. Nessuna demo viene pubblicata online da questo commit.

## Evidenze
Backup preventivo: `backup/4.0-pre-acroform-browser-fix-2026-10-29-21`. Il risultato di build/regressione deve essere controllato sulle esecuzioni GitHub Actions del commit finale, senza considerare un test ancora in corso come superato.
