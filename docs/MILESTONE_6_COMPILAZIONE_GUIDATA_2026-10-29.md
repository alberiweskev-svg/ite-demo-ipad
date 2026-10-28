# Milestone I.T.E. 4.0 — compilazione tecnica guidata (29 ottobre 2026)

## Base e isolamento
- Punto di ripristino precedente: `8437563891446aa7ffb0125127160ef978a13269`.
- Modifiche esclusivamente su `sviluppo-4.0.0-base`. Nessuna pubblicazione GitHub Pages e nessun aggiornamento di `main`.
- `version.json` del solo ramo sviluppo distingue la demo `4.0.0` (canale `development`) dalla release operativa `3.0.74`.
- I dati restano locali nel vault cifrato; le pratiche sono incluse nel backup completo. Ogni salvataggio/revisione pratica richiede una copia preventiva tramite `ITEHistory.create`.

## Funzionalità effettivamente integrate
- Schede guidate per **Di.Co. elettrica**, **Di.Co. idrica/termica**, **Di.Ri.**, **GAS H40/I40/A12/B12** e **POS**.
- Campi strutturati per committente, ubicazione, impresa, materiali, verifiche, elaborati, apparecchi e dati specifici; nessuna prova o firma presunta.
- **POS in 12 sezioni preparatorie**: identificazione cantiere, committente/imprese, organizzazione, personale, lavorazioni, attrezzature, materiali, rischi, DPI, misure, emergenze, allegati/revisioni.
- I campi richiesti ancora vuoti vengono elencati come **da completare**, ma non impediscono il salvataggio di una bozza parziale.
- Campi strutturati validati per tipologia, lunghezza e date; campi estranei respinti. Bozze precedenti senza sezioni strutturate restano leggibili.
- I valori non salvati vengono conservati quando si passa temporaneamente da una tipologia all'altra nell'editor.
- Le sezioni compaiono nella stampa HTML **BOZZA NON VALIDA / NON FIRMATA**; i dati vengono sottoposti a escaping HTML.
- Test unitari con dati sintetici e test browser Chromium/WebKit aggiunti al flusso di regressione già esistente.

## Limiti da non confondere con funzionalità finite
- Non è il wizard POS Windows 2.7.5 portato integralmente: i 12 blocchi sono una base di compilazione strutturata, da confrontare puntualmente con il modello originale.
- Non sono disponibili modelli ministeriali PDF compilati, firma digitale, invio ufficiale, prove certificate, workflow GAS completo o CAD.
- La diagnostica WebKit di ricaricamento diretto rimane separata e non bloccante; il collaudo su Safari/iPad fisico non è stato eseguito.
- Nessun documento reale o PDF cliente è stato caricato nei test.

## Verifica e ripristino
I test del repository comprendono `node --check app.js`, `node dev/test_400_technical_drafts.cjs`, `node dev/test_400_technical_browser.cjs` su Chromium e WebKit, più la regressione completa e il controllo SRI. Consultare gli esiti GitHub Actions del commit specifico; non assumere esito positivo prima del completamento.

Il commit base sopra indicato resta il riferimento per confronti e recupero codice. Il ripristino dei dati utente richiede un backup completo verificato: il rollback del codice non equivale al recupero dell'archivio locale.
