# I.T.E. — integrazione Windows 2.7.5 → iPad 3.0.65 e successive

Richiesta e criteri approvati: 18 ottobre 2026. Nessuna sezione, allegato o dato preesistente deve sparire. Il porting procede per processi separati, con sottocartelle, guida di compilazione, suggerimenti e controlli di conservazione a ogni rilascio.

## Fonte verificata

Pacchetto fornito: `ITE_2.7.5_AGGIORNAMENTO_DAL_GESTIONALE.zip`, cartella `ITE_2.7.5_UNIFICATO`. Il file `versione_ite.json` identifica **2.7.5 / RICONOSCIMENTO_PROFORME_PR**. `VERSIONE_UNIFICATA.txt` conserva invece l'etichetta storica 2.7.0: non è stato usato come identificatore della release corrente.

`WINDOWS_2.7.5_INVENTARIO.json` registra percorsi, dimensioni, SHA-256 e definizioni dei 142 file applicativi/modelli selezionati, escludendo le dipendenze di terzi. Include l'impronta del pacchetto originale, conservato tra i file forniti. L'inventario permette di ritrovare il codice esatto; non indica che tutti quei moduli siano già stati riscritti o collaudati per iPad.

## Mappa delle logiche e stato reale

| Processo | Sorgenti Windows individuati | Trasferito nella nuova app | Da integrare |
|---|---|---|---|
| Catalogo e prezzi | `catalog271.py`, `catalog271_ui.py`, `materialfiles21.py` | 3.0.68: colonne e righe, prezzi acquisto/vendita, marca+codice, controlli prezzi/duplicati, originale e storico; file Vimar reale 645 articoli | Altri formati e ulteriori casi documentali, alias materiali per fornitore |
| Importazioni e fatture | `import_progress262.py`, `invoice21.py`, `gestionale_ite.py` | Importazione singola/massiva, cartella/ZIP, XML/Excel/CSV/PDF/OCR, anteprima, acquisti/vendite distinti, duplicati e originali | Completare la parità dei parser e dei casi proforma, ritenute, fiscali e pagamenti Windows |
| Apprendimento locale | `ite18.py`, `ite20.py`: `document_layout_key`, `learn_document_layout`, `remember_product_alias`, `worksite_alias_memory` | 3.0.69: fingerprint del layout testuale equivalente a Windows, regole solo confermate, suggerimenti da applicare esplicitamente, opzioni listino, registro e rimozione regole, backup | Alias articolo/fornitore, correzioni OCR e collegamenti cantiere; nessun apprendimento di firme, prove, importi o pagamenti |
| Archivio unico | `archive25f.py`, `documents23.py` | Originale per hash, più collegamenti, categorie e cartelle logiche processo/tipo/anno/soggetto/cantiere, sottocartella aggiuntiva | Versioni documentali binarie, ulteriori allegati e flussi di approvazione |
| Anagrafiche condivise | `gestionale_ite.py`, `structure25*.py`, `plants24.py`, `equipment21.py` | Clienti/fornitori condivisi; completamento conservativo, sedi/cantieri/impianti/apparecchiature/interventi collegati | Parità estesa professionisti, personale, mezzi e gestione ruoli |
| Di.Co. / Di.Ri. | `dico258.py`, `dico259.py`, `moduli/ITE_DICO_DIRI_Assistant_integrato.html`, ZIP originale 4.3.5 | Riconoscimento e archiviazione delle dichiarazioni esistenti; 3.0.69 scheda tecnica e guida dedicate | Parser storico completo, nuove pratiche guidate, materiali, allegati obbligatori, stampa e revisioni |
| Gas | `moduli/apertura_gas/apertura_gas.py`, `reusegas22.py`, `gasux21.py`, `signaturegas21.py`, modelli H40/I40/A12/B12 e ZIP 0.15 | 3.0.69: categorie separate, riconoscimento testuale non ambiguo dei modelli, archiviazione originali e guida | Wizard, PDR, campi PDF, riuso selettivo di materiali/lavori, prove, firme e stampa |
| POS e documenti di sicurezza | `unified_modules.py`, `moduli/pos/static/app.js`, `moduli/pos/static/index.html`, ZIP POS 2.6.4 | 3.0.69: archivio POS/PSC/DVR, data/scadenza, collegamento al cantiere e guida | Wizard POS, personale, mansioni, rischi, DPI, attrezzature, allegati, revisioni e firme |
| DVR | Categoria e data nel profilo di `unified_modules.py` | Archiviazione dedicata 3.0.69 | Nel pacchetto esaminato non è stato trovato un generatore DVR autonomo equivalente al wizard POS. La redazione va progettata e verificata come modulo distinto |
| Rapporti e impianti | `technical253.py`–`technical257.py`, `plants24.py`, `equipment21.py` | Collegamenti alle entità già presenti | Import parziale CRITER/RCT, campi e matricole, controlli di coerenza e modelli di rapporto |
| Disegno tecnico e distinte | `drawings260.py`, `unified_modules.py`, archivi CAD 5.5 presenti | Censito | Portare strumenti di disegno e distinta, successivamente ai dati condivisi e al catalogo |
| Identità I.T.E. | `unified_modules.py / COMPANY_DEFAULTS`, `assets/logo_ite.png`, `assets/ite_symbol_watermark.png` | 3.0.69: logo originale in intestazione/icona, profilo verificato e comando per completare solo i campi azienda vuoti | Riutilizzo del profilo comune nelle stampe dei nuovi moduli; gli incarichi storici non vengono assunti come attuali |
| Sincronizzazione | `gestionale_ite.py`: `synchronize_shared_drafts`, `sync_dico_drafts_from_client/worksite`, `sync_gas_drafts_from_client/worksite`; `ite20.py`: `integration_sources` | Censito, limiti dichiarati in app; trasferimento tramite backup esistente | Ponte e protocollo Windows/iPad, identità stabili, anteprima differenze, gestione conflitti, retry e audit |

## Sequenza dei prossimi step

1. **3.0.69 — fondazioni organizzative e apprendimento confermato:** processi separati, guide, archivio a sottocartelle, schede tecniche, logo e profilo I.T.E.; conservazione di tutti gli archivi precedenti.
2. **Importazioni Windows e anagrafiche estese:** parità dei parser fatture/proforme, modelli di importazione memorizzati, alias materiali/fornitori, professionisti e personale; test con documenti reali di ogni categoria.
3. **Di.Co./Di.Ri.:** portare prima lettura e riuso parziale, poi compilazione guidata, allegati e stampa. Distinguere bozze da pratiche inviate.
4. **Gas:** portare modelli e wizard; riutilizzare solo materiali e tipologia lavori su comando, mantenendo cliente/PDR/matricole/firme/prove della pratica corrente.
5. **POS e sicurezza:** wizard dedicato, anagrafiche condivise, allegati, revisioni, ruoli e scadenze; DVR come processo distinto.
6. **Sincronizzazione effettiva:** introdurre un ponte autenticato o un pacchetto di scambio versionato, prima in ingresso e in sola lettura con anteprima. Abilitare scritture esterne solo con comando esplicito. Una pagina GitHub Pages non accede automaticamente al database SQLite del PC.
7. **Altri reparti:** rapporti impianti/manutenzioni, disegno tecnico e distinte, personale/mezzi/calendario, report aziendali e completamento dei flussi economici.

## Regole di dati e sincronizzazione

- Gli ID numerici di archivi differenti non sono un'identità globale. Per lo scambio Windows/iPad servono un identificativo stabile della sorgente e una mappa degli ID; CF/P.IVA e marca+codice aiutano il riconoscimento, ma non giustificano fusioni ambigue.
- Il Windows sincronizza anagrafiche e cantieri con le **bozze** Di.Co./gas nello stesso database. Le Di.Co. inviate e le pratiche gas inviate non vengono riscritte da quelle funzioni. Conservare questa distinzione nel porting.
- Conservare valori manuali e conflitti; mostrare fonte e proposta prima della sostituzione. Nessun valore inventato per dati mancanti. Non copiare automaticamente firme o risultati di prove da altre pratiche.
- Originali, modifiche, revisioni e regole confermate fanno parte del backup completo. Il trasferimento attuale è un backup/ripristino esplicito, non una sincronizzazione continua e non un merge Windows universale.
- Un listino non crea giacenze. DDT e fattura non devono duplicare il carico. Preventivo, proforma, fattura, incasso e pagamento rimangono entità/processi distinti.
- Le sottocartelle della 3.0.69 sono viste logiche degli originali conservati nell'archivio del browser. Non spostano file sul PC e non cancellano i collegamenti esistenti.

## Verifica 3.0.69

Controlli eseguiti: integrità sintattica dei 17 script; preventivi ed extra ancora presenti; conservazione anagrafiche e allegati; backup e ripristino con rollback; import XML/Excel/PDF/ZIP; file Vimar reale 645 articoli; corrispondenza con Windows su 54 prezzi e 7 classificazioni; confronto del fingerprint con la funzione Windows originale su 11 casi; 10 percorsi e relative guide; filtri e sottocartelle; schede tecniche senza importi fattura; classificazione per contenuto; apprendimento solo dopo controllo esplicito; prezzi mai ricordati come regola; opzioni catalogo separate per struttura; backup/ripristino e rimozione conservativa delle regole; profilo azienda senza sovrascrivere campi compilati.

Non completati in questo rilascio: generazione nuove Di.Co./Gas/POS/DVR, sincronizzazione continua PC/iPad, porting completo di tutti i parser Windows. I suggerimenti locali sono regole esplicite, non un modello IA addestrato sui file. L'OCR e i PDF richiedono verifica dei dati estratti.


## Aggiornamento 3.0.72 — SAL e importazioni

Base funzionale 3.0.70; conservata la modifica del menu 3.0.71. Nessuna modifica a chiavi, ID, schema degli archivi o file originali già registrati.

- Scheda Pagamenti / SAL nei lavori extra: fasi aggiungibili/eliminabili, etichette e percentuali, preset 30–30–30–10 / 40–40–20 / 30–40–30. Salvataggio solo con fasi complete, quote positive e somma 100%. Quote in euro sul totale IVA compresa, sconti compresi; residuo dei centesimi assegnato all’ultima rata anche in stampa. Le modifiche a extra approvati richiedono nuova approvazione. Controllo di modifiche concorrenti a righe, sconti e quote.
- Porting del classificatore `invoice21.py`: numero PR nell’intestazione (35 righe), proforma/preavviso, nota credito, fattura prima di riferimenti DDT, blocchi espliciti emittente/destinatario. Numerazione PR originale conservata; numero senza sigla esposto solo per confronto. La presenza casuale di PR o DDT nelle descrizioni non cambia il tipo.
- XML: valuta, ritenute, bollo, casse previdenziali, riepiloghi IVA/natura/esigibilità, condizioni e singole rate (importo, scadenza, modalità, IBAN). Le rate non diventano pagamenti eseguiti. Totale fiscale e ritenute rimangono distinti. Le valute estere non vengono sommate ai riepiloghi in euro.
- Righe XML: prezzo di listino conservato; sconti/maggiorazioni espliciti applicati in sequenza al prezzo netto. Quantità assente = 1, come in Windows; non si deducono sconti da discrepanze del totale. Numero riga e riferimenti DDT conservati.
- CSV/Excel anagrafiche: ruoli multipli separati da |, ; o virgola; Professionista, Dipendente, Titolare, Operatore e altri ruoli esistenti. Albo, numero/provincia di iscrizione, PEC professionale, professione e mansione riutilizzano i campi esistenti. Anteprima nominativi/ruoli; ruoli non riconosciuti bloccati anziché trasformati in clienti. Identità fiscali e conflitti seguono le protezioni precedenti.

Collaudo riproducibile: `tests/sal-imports.cjs`, Playwright/Chromium. Casi sintetici: salvataggio SAL, somma errata, annullamento, nuova approvazione, fatture/proforme/crediti/DDT, direzioni, due rate XML, ritenuta/bollo, sconti concatenati, reimportazione senza duplicati, ruoli multipli, permanenza dopo ricarica e round-trip del contenuto commerce nel backup completo. Nessun dato reale del dispositivo è usato nei test.

Questo rilascio completa il blocco SAL e amplia il blocco importazioni; non dichiara terminata la parità di tutti i parser Windows. Restano da portare/validare alias articolo-fornitore, ulteriori layout PDF e relativi documenti reali, apprendimento delle associazioni di colonne e anagrafiche Windows fuori dalle tabelle condivise. I moduli Di.Co./gas/POS e la sincronizzazione restano negli step dedicati già elencati.


## Aggiornamento 3.0.73 — protezione dei dati e archivio TEST

Aggiunte cifratura locale di archivio e backup con sblocco tramite password, migrazione conservativa degli archivi precedenti, dipendenze PDF/Excel/OCR/ZIP incluse nel programma, restrizioni di rete e integrità degli script. Inserimento aggiuntivo di otto anagrafiche TEST collegate a immobili, impianti, apparecchiature e cantiere, con nove documenti fittizi e risultati attesi. Procedura e limiti in [SICUREZZA_3.0.73.md](SICUREZZA_3.0.73.md). La protezione non modifica la sequenza dei moduli Windows ancora da portare.
