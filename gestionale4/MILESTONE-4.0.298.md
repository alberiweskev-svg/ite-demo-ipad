# I.T.E. 4.0.298 — milestone integrata TEST

Questa milestone riprende dal commit 7347f9ddd1ae0d0f131ae816dfc930169c4ed80c. I motori 296 e 297 restano disponibili; il nuovo workspace li riutilizza senza modificare archivi operativi o moduli 3.0.74 / 2.7.5.

## Prova locale

Servire il repository con un server HTTP locale e aprire `/gestionale4/workspace298.html`. È disponibile anche un collegamento da `/gestionale4/index.html`. Non usare il doppio clic sul file HTML. In Backup caricare l'esempio fittizio, quindi aprire i moduli dalla barra di navigazione. Inserire esclusivamente dati sintetici. La pubblicazione web non è inclusa nella milestone.

## Funzioni consegnate

- Creazione e modifica di clienti, sedi, impianti, apparecchiature e interventi con gerarchia verificata.
- Agenda filtrabile per giorno, sette giorni, mese e operatore; modifica appuntamenti con rifiuto delle sovrapposizioni. Gli orari richiedono data ISO con fuso esplicito.
- Preventivi con più righe e importi separati per fornitura, posa, smontaggio, smaltimento ed Extra.
- Rapporti di arrivo e chiusura con descrizione e durata; un solo rapporto in corso per intervento.
- Extra proposti, approvati o rifiutati singolarmente; solo quelli approvati entrano nel totale del fascicolo.
- Registrazioni contabili dimostrative acquisto/vendita/proforma/TD04 collegate al preventivo. Le TD04 devono appartenere alla stessa commessa e non superare complessivamente l'importo della vendita. Le proforma non entrano nelle vendite nette.
- Collegamenti dei metadati PDF al fascicolo intervento, senza caricamento dei file.
- Salvataggio locale con rilettura, rollback degli errori, rilevamento di snapshot obsoleti, esportazione e ripristino JSON TEST. Un archivio corrotto non viene sostituito silenziosamente.

## Validazione riproducibile

`node --test gestionale4/tests/*.test.cjs`: 31 test superati, eseguiti localmente sia con TZ=UTC sia con TZ=Europe/Rome.

Anche i 17 script `gestionale4/test-*.js` sono stati eseguiti con esito positivo. Il controllo statico 256 cercava una chiamata rimossa già nel commit di partenza; è stato aggiornato al metodo transazionale `docFlow.register` effettivamente usato, mantenendo il test del ciclo revisioni.

`node gestionale4/tests/workspace298.browser.cjs`: test browser con Playwright/Chromium. Installare Playwright e Chromium; in alternativa impostare PLAYWRIGHT_MODULE al pacchetto installato e CHROME_PATH all'eseguibile Chrome. Verifica creazione e modifica, ricaricamento, agenda, righe preventivo, arrivo/chiusura, Extra, vendita/TD04, metadati, fascicolo, esportazione/ripristino e navigazione degli undici moduli a larghezza mobile. Collaudo locale eseguito con Chrome su Windows. Nessun errore JavaScript osservato.

Il workflow `ite-workspace298.yml` replica i test in UTC e Europe/Rome e produce un artifact di collaudo; non pubblica una demo. L'esito remoto va verificato separatamente dall'esito locale.

## Backup e limiti

Backup remoto prima delle modifiche: `backup/sviluppo-4.0.297-20261126`, stesso commit di partenza. Creato e verificato anche un bundle Git locale con la storia completa del ramo.

Archivio separato `ITE_WORKSPACE_298_TEST`, senza migrazione automatica dai vecchi banchi JSON o dagli archivi reali. Persistenza limitata al browser e al dispositivo; nessuna sincronizzazione multiutente, cifratura o autenticazione. Il rilevamento di snapshot obsoleti non sostituisce un database transazionale multiutente. Nessuna fatturazione elettronica, calcolo fiscale IVA, emissione documenti ufficiali, generazione/acquisizione PDF o convalida Safari/iPad reale. Le prove mobile verificano il layout Chrome, non l'hardware iPad. Nessun dato reale utilizzato nei test.
