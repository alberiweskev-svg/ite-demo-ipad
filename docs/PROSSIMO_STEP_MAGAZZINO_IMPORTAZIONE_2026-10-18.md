# Prossimo step — Magazzino e importazione documentale
Data richiesta: 18 ottobre 2026
Base: Gestionale I.T.E. 3.0.66.
Stato: requisiti registrati per il prossimo step; questo documento non dichiara implementate le funzioni.

## Priorità e conservazione
Questo step precede il successivo ampliamento del consuntivo interventi.
Ogni aggiornamento deve conservare dati, allegati, storico, collegamenti e funzionalità esistenti, inclusi cantieri, preventivi, lavori extra e backup. Versioni progressive. Backup e verifiche prima delle modifiche.

## Obiettivo operativo
Un solo comando IMPORTA DOCUMENTI, per un file, più file e importazione massiva di cartelle/ZIP dove supportati dal dispositivo. Analizzare il contenuto, riconoscere il tipo, estrarre i dati e smistare nelle sezioni corrette.
Formati previsti: XML, PDF anche scansioni mediante OCR, immagini, Excel, CSV e altri formati utili. Dichiarare esplicitamente eventuali formati non ancora supportati, senza importazioni apparentemente riuscite ma vuote.
Il riconoscimento non deve dipendere soltanto da nome file, estensione o cartella. Riutilizzare i modelli documentali già confermati sui campioni.

## Documenti e archivi
- Fatture di vendita e acquisto, storiche e correnti.
- Proforme, note di credito, preventivi clienti e fornitori.
- Bolle e DDT.
- Di.Co. precedenti: elettrico, idrico, termico, clima, gas e altre tipologie, con protocolli e allegati.
- Anagrafiche clienti e fornitori, anche da importazioni tabellari.
- Catalogo articoli/listini e magazzino con movimenti reali.

## Dati estratti e collegamenti
Creare o completare le anagrafiche con tutti i dati effettivamente presenti e leggibili: denominazione, nominativo, P.IVA, CF, indirizzi, contatti, PEC, codice destinatario e ulteriori dati disponibili. Non inventare dati mancanti.
Estrarre numero, data, anno, soggetti, righe articolo, codici produttore, marca/modello quando presenti, quantità, unità di misura, prezzi, sconti, imponibile, IVA, totale, scadenze, condizioni e riferimenti ad altri documenti.
Collegamenti: CLIENTE → SEDI/IMMOBILI → IMPIANTI → APPARECCHIATURE → INTERVENTI/DOCUMENTI; collegare inoltre cantieri e fornitori. Riconoscere i collegamenti certi e segnalare quelli mancanti o ambigui.
Un dato si inserisce una sola volta e viene riutilizzato ovunque. Un originale documentale può avere più collegamenti senza duplicare il file.
Aggiornamento automatico delle anagrafiche per dati nuovi e certi; nessuna sovrascrittura silenziosa di dati discordanti. Storico modifiche e risoluzione dei conflitti.
Identificazione soggetti in primo luogo tramite CF/P.IVA; confronto anche di altri identificativi senza unire omonimi alla cieca.

## Regole economiche
Vendita: emittente I.T.E. identificato con certezza; documenti ufficiali emessi tramite Zucchetti/Tieni il Conto.
Acquisto: fornitore esterno e destinatario I.T.E. verificati; non basta che l'emittente sia diverso da I.T.E.
Distinguere fattura, proforma e nota di credito dalla dicitura, tipologia e numerazione, anche se hanno la stessa impaginazione.
Tenere separati preventivato, fatturato, incassato, costi e pagamenti. Una fattura non dimostra automaticamente un incasso o un pagamento. La proforma non incrementa il fatturato definitivo.
Import storico per anno di competenza; conservare riferimenti acconti/saldi e documenti collegati.
Non bloccare l'archiviazione se manca un intervento: mantenere l'assegnazione da completare e non inventare collegamenti.

## Catalogo e magazzino
Catalogo unico per dati articoli riutilizzati in preventivi, Di.Co. e lavori; giacenze e movimenti gestiti separatamente.
Archivio magazzino: entrate, uscite, giacenze, provenienza, documento, cliente/cantiere/intervento collegato, rettifiche e storico.
DDT e fattura della stessa fornitura non devono generare due carichi. Proforma e preventivo non generano automaticamente movimenti.
L'uso di un articolo in un preventivo o in una Di.Co. non scarica la giacenza; scarico per materiale effettivamente installato/registrato.
Articolo esistente: riutilizzare codice e dati, senza duplicazione. Nuovo: creazione guidata/automatica quando identificato con certezza. Acquistato ma non caricato: gestire carico e scarico tracciati senza duplicare operazioni successive.

## Di.Co. e originali
Conservare il documento originale e acquisire i dati compilati, numero, data, anno, cliente, immobile, impianto, materiali e riferimenti disponibili.
Riutilizzare i dati nel modulo Di.Co. senza confondere una ricostruzione con una nuova dichiarazione ufficiale emessa.
Conservare protocolli non ancora associati in attesa di collegamento, senza creare dichiarazioni fittizie.
Modificare un'anagrafica non deve riscrivere automaticamente documenti già emessi: mantenere originale e gestire esplicitamente aggiornamento/versione.

## Flusso e controlli
Carica → analizza → riconosce → confronta archivio → controlla duplicati/conflitti → anteprima/esito → registra nelle categorie appropriate.
Automatizzare i casi certi; sottoporre soltanto dubbi e conflitti alla verifica dell'utente. Non ripetere dati già acquisiti.
Duplicati per impronta del file e identità documentale (tipo, soggetto, numero, data/anno); rieseguire lo stesso import non deve duplicare documenti, anagrafiche, costi o movimenti.
Documenti incerti, illeggibili o incompleti restano DA VERIFICARE, senza registrazioni economiche o movimenti inventati.
Registro importazioni con file originale, data, origine, classificazione, dati estratti, collegamenti, esito e modifiche.
Collaudare import singolo/massivo misto, reimportazione, scansioni, conflitti anagrafici, DDT+fattura e integrità dei backup con tutti i nuovi archivi.

## Ordine di realizzazione
1. Verificare quanto già esiste e predisporre schema e backup compatibili.
2. Archivio articoli e magazzino, anagrafiche e collegamenti condivisi.
3. Importazione singola/massiva e riconoscimento, iniziando dai formati/campioni verificati.
4. Smistamento, aggiornamenti anagrafici, collegamenti economici/documentali e controlli.
5. Collaudo completo prima della pubblicazione, senza rimuovere le funzioni precedenti.


## Stato attuazione — versione 3.0.67
Pubblicata e verificata online il 18 ottobre 2026.
- Aggiunti Articoli e magazzino e Importazione documenti, mantenendo le sezioni precedenti.
- Importazione singola/massiva: XML FatturaPA, CSV/TSV, Excel/ODS, PDF, immagini con OCR, cartelle e ZIP. Motori PDF/OCR/Excel/ZIP caricati su richiesta dalla rete; elaborazione documenti sul dispositivo.
- Anteprima, categorie, originali conservati una volta e collegamenti multipli; creazione/completamento anagrafiche e conservazione dei campi discordanti.
- Riconoscimento direzione XML tramite P.IVA/CF I.T.E. configurati; estrazione generica PDF/OCR da verificare. Dati tecnici Di.Co. estratti per i campi riconoscibili; nessuna nuova dichiarazione ufficiale generata automaticamente.
- Articoli e movimenti separati, carichi da documenti soltanto dopo conferma, controlli su DDT/fattura, rettifiche tracciate.
- Archivi nuovi inclusi nel backup completo, nello storico e nel ripristino; protezione importazioni interrotte e confronto di revisione.
- Test superati: XML acquisto/TD04, CSV anagrafiche e conflitti, duplicati file e identità documentale, Excel reale, PDF reale, ZIP misto, Di.Co. testuale, collegamenti cantieri, doppio carico DDT/fattura, errore quota con rollback, backup/ripristino nuovi archivi. Verificata apertura delle due schermate sul sito pubblicato.
Limiti dichiarati nell'interfaccia: massimo 500 file, 20 MB per file, 100 MB per lotto; PDF fino a 100 pagine. Dati mancanti o incerti richiedono verifica; importazione fattura non equivale a incasso/pagamento. La rigenerazione completa nel modulo Di.Co., i campioni documentali personalizzati e l'automatismo per impaginazioni non ancora verificate restano da collaudare/estendere separatamente.


## Correzione e porting — versione 3.0.68
Riferimento indicato dall'utente: Gestionale Windows 2.7.5, pacchetto ITE_2.7.5_AGGIORNAMENTO_DAL_GESTIONALE.zip. Adattate le funzioni del modulo catalog271.py presente nel pacchetto: header_map, detect_header, price, classify, key e i controlli di prepare/apply (marca+codice, doppioni, prezzi discordanti e variazioni di almeno 10 volte, aggiornamento prezzi con storico e conservazione descrizioni). SQLite/Tk non vengono eseguiti su iPad: i dati restano nel modello transazionale locale dell'app.
Correzione aggiuntiva verificata sul VIMAR ARKE FRUTTI.xlsx originale: intestazione alla riga 2 e codici in formule testuali come ="19000.B" senza valore memorizzato. Recuperate soltanto stringhe costanti e riferimenti semplici; non vengono eseguite formule generiche o macro. Estratte 645 righe con codici unici, somma dei prezzi unitari 14409,63, nessun ricarico o movimento automatico.
Anteprima Articoli dedicata, paginata, con marca/categoria, prezzi prima/dopo, stato delle righe e abbinamento manuale delle colonne quando necessario; rimossi dal flusso listino i campi da fattura e la richiesta di cliente/cantiere. Categoria predefinita confermabile come nella versione Windows. Distinti costo acquisto e prezzo vendita/listino; quantità del listino non caricano giacenze.
Confronto automatico con il codice Windows originale: 54 casi prezzo e 7 casi di classificazione coerenti. Collaudati file reale, codici con suffissi/zeri, 645 articoli dopo conferma categoria ELETTRICO, reimportazione senza duplicati, aggiornamento per marca+codice, descrizioni preservate, carichi assenti, outlier 10x e duplicati discordanti bloccati, backup completo. Ripassati test fatture/CSV/PDF/Excel/ZIP/Di.Co., cantieri, extra, rollback e ripristino.
La base operativa richiesta è la 3.0.65, conservata insieme alle funzioni di protezione e archivio già introdotte; numerazione progressiva 3.0.68 per evitare downgrade o sovrascrittura di versioni.


## Step 3.0.69 — organizzazione aziendale e apprendimento confermato

Trasferimento incrementale richiesto dal Gestionale Windows 2.7.5: dieci percorsi con guide, archivi logici processo/categoria/anno/soggetto/cantiere e sottocartella aggiuntiva; schede tecniche dedicate per dichiarazioni, gas e sicurezza; riconoscimento dal contenuto; memoria locale delle sole classificazioni confermate, fingerprint equivalente al Windows, suggerimenti da applicare esplicitamente e opzioni listino separate dalla variazione prezzi. Tutto incluso nel backup e ripristino. Profilo I.T.E. disponibile dalla fonte Windows con completamento dei soli campi vuoti; logo originale utilizzato in intestazione e icona.

Piano completo, limiti e prossimi moduli: [PIANO_PORTING_WINDOWS_2.7.5.md](PIANO_PORTING_WINDOWS_2.7.5.md). Inventario di 142 file applicativi e modelli con SHA256: [WINDOWS_2.7.5_INVENTARIO.json](WINDOWS_2.7.5_INVENTARIO.json).

Collaudi: regressioni cantieri/preventivi/extra, backup/rollback, import XML/Excel/PDF/ZIP, Vimar reale645 articoli, 54 confronti prezzi/7 classificazioni con Windows; 11 fingerprint confrontati con la funzione originale; nuovi percorsi, cartelle, schede tecniche, apprendimento confermato e revocabile, profilo conservativo, vecchi archivi e backup regole. Generazione nuove Di.Co./Gas/POS/DVR e sincronizzazione automatica PC/iPad non sono ancora attive; l’app lo indica nei processi pertinenti.
