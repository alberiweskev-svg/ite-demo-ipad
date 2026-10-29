# Milestone 15 — CAD → pratiche tecniche e preventivi cantiere

29 ottobre 2026 · sviluppo-4.0.0-base · demo I.T.E. 4.0.0 isolata.

## Implementato
- Pannello integrato nella sezione CAD esistente. Selezione di un disegno **salvato**, delle pratiche Di.Co./Di.Ri./GAS/POS compatibili e dei cantieri del medesimo cliente/sede.
- Collegamento persistente CAD-pratica in `ITECommerce.settings.cadPracticeLinks` (ID, cliente, revisioni, data), protetto dalla cifratura e incluso nel backup completo. Backup precedente obbligatorio prima di salvare.
- Validazione dei collegamenti all'apertura, alle mutazioni commerciali e durante il ripristino: nessun cliente diverso, sede/impianto incompatibile, disegno/pratica orfani o duplicati. Le revisioni successive non cancellano i riferimenti precedenti.
- Generazione di un **preventivo di cantiere in stato Da accettare** da simboli CAD collegati ad articoli del catalogo, con **Fornitura e Posa distinte**. Prezzi dei materiali calcolati soltanto quando l'articolo è un Materiale in pezzi con prezzo di costo verificabile (ruolo `cost`); ricarichi a fasce 30/25/20/15/5%. La posa richiede un prezzo esplicito inserito dall'operatore, mai stimato automaticamente. IVA selezionata 10%/22% e da verificare.
- Tracciabilità del preventivo con ID e revisione CAD, controllo duplicati per revisione/cantiere, nessuna modifica a preventivi già accettati e nessun movimento di magazzino. Prezzi e quantità vanno verificati prima dell'invio.
- Esportazione locale HTML di un fascicolo **bozza** con disegno vettoriale, riferimento pratica e distinta preliminare. Nessun originale PDF incorporato, nessuna firma o conformità attestata.

## Verifiche
- Test unitari `dev/test_400_cad_workflow.cjs`: compatibilità, protezione cliente, prezzi e fasce, duplicati, conservazione giacenze, validazione link e legacy.
- Test browser `dev/test_400_cad_workflow_browser.cjs`: Chromium e WebKit, creazione preventivo con backup, duplicato bloccato, magazzino invariato.
- Pipeline `.github/workflows/ite-4-regression.yml` e `build-400.yml` aggiornate. Gli esiti effettivi sono quelli di GitHub Actions, non impliciti nel commit.
- Backup Git precedente: `backup/4.0-pre-cad-pratiche-preventivi-2026-10-29`.

## Limiti e sicurezza
- Nessun preventivo è accettato, inviato o contabilizzato automaticamente; il costo materiale deve essere verificato e la posa è inserita manualmente.
- Non calcola sfridi, materiali a metro, ore stimate, quote esecutive, beni significativi o ripartizione IVA 10/22. Le lunghezze CAD sono solo indicative.
- Il fascicolo HTML è un file **non cifrato**, da custodire sul dispositivo. Non è un modello ufficiale Di.Co./Di.Ri./GAS.
- Nessun dato cliente o PDF reale nei test. `main`, la 3.0.74 operativa e i moduli Windows 2.7.5 non vengono modificati.
- Rimangono il porting completo POS/CAD/GAS, i modelli ufficiali, la pubblicazione di una demo 4.0 separata e il collaudo su iPad Safari fisico.
