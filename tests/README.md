# Collaudo 3.0.73

Prerequisiti: Node.js, `playwright`, `@e965/xlsx` 0.20.3 e Python con ReportLab. Chromium può essere selezionato con `CHROMIUM_PATH`; altrimenti viene usata l’installazione di Playwright. `PLAYWRIGHT_MODULE` e `XLSX_MODULE` consentono di usare dipendenze già presenti nell’ambiente.

Eseguire dalla radice del repository:

```sh
python3 tests/security-fixtures.py
node tests/security.cjs
node tests/sal-imports.cjs
```

Il test di migrazione usa come riferimento il codice 3.0.72 dal commit `3dfe8387e3fc6788d9512aac16a46fc35c8f0397`. Richiede quindi il repository con quella revisione disponibile, non una copia superficiale che la escluda. Le fixture e le schermate vengono scritte nella directory temporanea della sessione; non contengono dati reali.

Per rigenerare le impronte dopo modifiche a `app.js`, `vault.js`, `test-data.js` o alla primitiva crittografica:

```sh
python3 tools/update-integrity.py
```

Le dipendenze locali si ricostruiscono con `python3 tools/fetch-vendor.py`: viene verificata l’impronta di ogni file. Non caricare dati reali nelle fixture o nei test.
