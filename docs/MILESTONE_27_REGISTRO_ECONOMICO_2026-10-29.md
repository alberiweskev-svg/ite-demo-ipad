# Milestone 27 — Registro economico integrato (29/10/2026)

## Perimetro
- Repository: `alberiweskev-svg/ite-demo-ipad`, ramo `sviluppo-4.0.0-base`.
- Backup Git pre-intervento: `backup/4.0-pre-financial-desk-2026-10-29-23`, da commit `8b3457e8a502e830e519fadd0d001d6d381e98f8`.
- `main` resta alla 3.0.74, moduli Windows 2.7.5 non modificati.
- Nuovo modulo `ite-financial-desk.js` caricato nella stessa demo protetta con SHA-384, senza servizi esterni.

## Funzionalità implementate
1. Pannello nell'area **Importazioni e archivio aziendale**: fatture vendita/acquisto, note credito TD04 e proforme, con ricerca, filtri e riepilogo.
2. Registro manuale incassi, pagamenti e rimborsi con data, importo e riferimento. Nessun pagamento è presunto a partire dall'importazione del documento.
3. Compensazione esplicita fattura–nota di credito **dello stesso verso e della stessa controparte**, senza generare movimenti bancari. Controllo degli importi residui in centesimi.
4. Stati differenziati per fatture (da incassare/pagare, parziali, chiuse) e note di credito (da recuperare/rimborsare, parziali, chiuse). Le proforme restano escluse dai saldi e dai movimenti.
5. Rilevazione di possibili duplicati, totali mancanti, valute non EUR, controparti non identificabili e scadenze da verificare; rate XML utilizzate quando coerenti con il totale.
6. Storno con motivazione obbligatoria, senza cancellare la registrazione originaria. Registro audit e backup automatico prima di ogni movimento/storno.
7. Esportazione CSV dei risultati filtrati con avviso di file non cifrato e neutralizzazione delle formule pericolose.

## Integrità e limiti
- Movimenti memorizzati in `commerce.settings.financialSettlements` nell'archivio locale cifrato esistente e inclusi nel backup completo. Scritture tramite `ITECommerce.mutate`, con controllo revisioni e validazione del registro.
- Le scadenze superate indicano **verifica richiesta**, non una prova che il cliente non abbia pagato.
- Nessuna riconciliazione bancaria automatica, nessun invio all'Agenzia delle Entrate, nessun bilancio fiscale certificato. Importi residui calcolati sul totale del documento (IVA inclusa quando presente).
- La compensazione richiede identità della controparte verificabile; nessuna associazione per sola somiglianza del nome.
- I PDF originali non sono copiati nel codice e i test usano esclusivamente documenti e soggetti sintetici.
- La versione operativa 3.0.74, POS/CAD/GAS Windows 2.7.5 e i dati reali restano invariati.
- Non è stata attivata una demo pubblica. Safari su iPad fisico e il crash WebKit al ricaricamento diretto restano aperti.

## Test
- `dev/test_400_financial_desk.cjs`: TD04, proforme, incassi parziali, compensazioni, storni, duplicati, rate e CSV.
- `dev/test_400_financial_browser.cjs`: percorso sintetico Chromium/WebKit con archivio cifrato, registrazione, compensazione, CSV e storno.
- `dev/sync_sri.cjs`: verifica integrità del nuovo modulo.
- La milestone è considerata collaudata solo dopo esito positivo della regressione GitHub completa e dei browser.

## Prossimi blocchi
- Collegamento dei movimenti economici ai preventivi e alle voci Extra approvate, evitando duplicazioni.
- Import dei modelli originali Di.Co./Di.Ri./GAS Windows 2.7.5, se disponibili i sorgenti.
- Analisi del crash WebKit e prova su iPad fisico.
