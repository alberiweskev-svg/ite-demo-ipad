# Milestone 35 — Registro prove e misure tecniche per intervento (30 ottobre 2026)

## Ambito implementato
Nel ramo `sviluppo-4.0.0-base` è stato introdotto `ite-field-checks.js`, caricato nella stessa demo 4.0 e montato nella scheda intervento da calendario. Nessuna modifica al ramo `main` o ai moduli Windows 2.7.5.

- Registrazione da operatore assegnato durante un intervento `In corso` di misure strumentali, prove funzionali e verifiche visive, con settore idrico, termico, elettrico, climatizzazione, gas o altro.
- Descrizione, valore numerico opzionale e unità controllata, strumento, note ed esito descrittivo (`Rilevato`, `Da verificare`, `Non eseguito`). Non si generano esiti di conformità, firme o certificazioni.
- Collegamento verificato a cliente, sede, impianto, apparecchiatura, cantiere, intervento e operatore; isolamento dei clienti e blocco delle incongruenze.
- Registro conservato in `ITECommerce.settings.fieldChecks` nell'archivio cifrato; backup automatico applicativo prima di ogni registrazione e storno, audit degli eventi e correzioni per storno motivato senza eliminazione del record originale.
- Storico delle prove della stessa apparecchiatura visibile nella scheda intervento, con dati dei precedenti interventi collegati.
- Esportazione CSV delle prove, con conferma per i dati non cifrati e neutralizzazione delle formule.
- Fascicolo intervento A4/CSV della Milestone 34 esteso con le prove attive, gli esiti e il numero di storni; prove stornate escluse dal rapporto.
- Validazione del registro all'interno di `ITECommerce.validate`, quindi anche in mutate, backup, importazione e ripristino.

## Test e protezioni
Test sintetici `dev/test_400_field_checks.cjs` e `dev/test_400_field_dossier.cjs`, test browser `dev/test_400_field_checks_browser.cjs` in Chromium e WebKit integrati nella regressione. Le verifiche devono risultare effettivamente superate su GitHub Actions prima di dichiarare la milestone collaudata.

Integrità SHA-384 aggiornata per il nuovo modulo, per il fascicolo intervento, `app.js` e `vault.js`. Backup Git preventivo: `backup/4.0-pre-field-checks-2026-10-30-07` dal commit `7b25a3ec6dd8710c7d16b49ee8459bb358f80baf`.

## Limiti e lavoro residuo
Questa è una scheda di rilevazioni tecniche, non un rapporto di controllo normativo e non sostituisce Di.Co., Di.Ri., allegati GAS, libretti, rapporti FGAS/CRITER o modelli Windows 2.7.5. La conformità a tali modelli non è dichiarata. Il precedente crash intermittente WebKit al ricaricamento resta aperto fino a collaudi ripetuti e su iPad fisico. Non pubblicare dati reali; la demo online resta non pubblicata (`version.json: published=false`).
