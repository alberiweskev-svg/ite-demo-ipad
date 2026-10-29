# Milestone 9 — Esportazione PDF tecnica locale (29 ottobre 2026)

## Perimetro e ripristino
- Repository `alberiweskev-svg/ite-demo-ipad`, esclusivamente ramo `sviluppo-4.0.0-base`.
- Punto di ripristino precedente alla milestone: `a6f045e2006f523ba3c892a7e258cac7601bba3f`.
- Nessuna modifica a `main`, GitHub Pages, gestionale operativo 3.0.74 o moduli Windows 2.7.5.

## Funzionalità implementate
- Nuovo modulo browser `technical-pdf.js` nella stessa demo 4.0; si attiva solo dopo lo sblocco dell'archivio cifrato.
- Pulsante PDF su ogni pratica tecnica Di.Co., Di.Ri., GAS e POS; fascicolo PDF multipratica che rispetta i filtri del registro e richiede un cliente selezionato.
- PDF A4 con impaginazione, numerazione delle pagine, dati generali e strutturati, checklist/evidenze, riferimenti agli originali e provenienza della precompilazione.
- Controlli contro esportazione di pratiche di altri clienti, duplicati e selezioni oltre 100 pratiche; originali di altri clienti non inclusi nemmeno nei riferimenti. Nessun byte degli originali incorporato.
- Nessuna modifica al database durante l'esportazione. File scaricato localmente, **non cifrato**: l'interfaccia lo segnala. Le diciture NON VALIDA / NON FIRMATA sono presenti su tutte le pagine.
- PDF di lavoro generato senza servizi esterni, senza firme, senza attestazioni di conformità e senza dichiarare prove eseguite. Non sostituisce i modelli ministeriali ufficiali.

## Verifiche
- `node dev/test_400_technical_pdf.cjs`: struttura PDF e xref, caratteri accentati, escape, paginazione, isolamento cliente, originali e limiti, nessuna mutazione.
- `node dev/test_400_technical_pdf_browser.cjs`: flusso di esportazione singola e fascicolo filtrato con dati fittizi, sia Chromium sia WebKit.
- Entrambi i test sono aggiunti al workflow di regressione. L'esito effettivo è quello registrato in GitHub Actions, non va presunto dal solo commit.
- Hash SHA-384 del nuovo script gestito da `dev/sync_sri.cjs` e dalla workflow di integrità.

## Da completare
- Porting fedele e verificato dei modelli ufficiali Di.Co./Di.Ri./GAS/POS dalla 2.7.5; allegati normativi e firme.
- Esportazione con grafica e intestazione ufficiale I.T.E., previo confronto con i modelli sorgente.
- Disegno CAD e test su iPad fisico Safari. Le diagnostiche WebKit intermittenti restano monitorate.
- Nessuna pubblicazione della demo senza approvazione.
