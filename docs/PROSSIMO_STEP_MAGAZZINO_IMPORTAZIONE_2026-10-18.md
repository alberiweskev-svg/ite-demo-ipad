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
