# Gestionale I.T.E. 3.0.73 — archivio protetto e prove incrociate

## Uso

Il collegamento del gestionale resta quello abituale. Alla prima apertura si sceglie una password di almeno 12 caratteri, ripetuta per conferma. Le aperture successive richiedono lo sblocco locale. La password non viene inviata, salvata in chiaro o recuperata da ChatGPT. Va conservata dall’utente: senza password non è possibile aprire l’archivio cifrato o i relativi backup.

Chiudere le altre schede del gestionale prima della prima protezione. Nei browser con Web Locks è consentita una sessione protetta alla volta; negli altri resta necessaria la disciplina di una sola scheda. Il programma continua ad aggiornarsi riaprendo lo stesso collegamento. Il blocco manuale è in testata; il blocco per inattività mantiene la soglia di quattro ore e chiede di completare un eventuale lavoro aperto prima del blocco per evitare perdite.

## Dati e migrazione

- Gli archivi precedenti restano nelle stesse chiavi e negli stessi database del browser. Non viene creato un nuovo archivio vuoto al posto di quello precedente.
- I dati principali in localStorage, gli allegati, l’archivio commerciale, il giornale delle operazioni e lo storico dei backup in IndexedDB vengono cifrati. Restano visibili soltanto identificativi tecnici e parametri di derivazione della chiave.
- AES-256-GCM con nonce casuale di 96 bit per ogni scrittura e autenticazione dei dati. La chiave è derivata dalla password con PBKDF2-SHA-256, sale casuale di 128 bit e 600.000 iterazioni. Il contesto lega ogni record a database, archivio e ID; chiave e password non vengono persistite.
- La primitiva GCM sincrona proviene da `@noble/ciphers` 1.3.0, fissata e inclusa nel repository; la derivazione usa Web Crypto. La corrispondenza della cifratura è verificata nei test con la decifratura indipendente di Web Crypto.
- La configurazione viene salvata prima della migrazione per rendere riprendibile un’interruzione. Ogni database è aggiornato con una transazione; una ripresa riconosce i record già cifrati. Errori e dati manomessi bloccano l’apertura, senza sostituire i dati con quelli dimostrativi.
- I backup esterni completi, lo scaricamento delle copie storiche e il vecchio export anagrafico vengono cifrati. Un backup proveniente da un’altra password viene aperto con una richiesta locale di quella password, poi reimportato nella cifratura corrente. I vecchi backup non cifrati restano importabili su comando.
- La stampa di un preventivo e il download esplicito di un documento originale restano esportazioni leggibili, perché servono a consegnare o usare quel documento: non vanno confusi con i backup protetti.

## Rete e componenti

PDF.js, SheetJS, Tesseract (worker, core WASM e lingua italiana), JSZip e la primitiva crittografica sono inclusi nel sito. Non si scaricano librerie da CDN esterne durante l’uso. `tools/vendor-sources.json` conserva versioni, fonti e SHA-256; il preparatore verifica i byte prima di conservarli. SheetJS 0.20.3 mantiene la fonte upstream con un mirror a impronta identica se la fonte principale non è raggiungibile. Licenze incluse in `vendor`.

La Content Security Policy limita le connessioni di script al file pubblico delle versioni e alla cartella dei componenti locali, oltre ai dati temporanei blob/data necessari all’elaborazione. Script e worker sono locali; immagini solo incorporate o temporanee; form esterni vietati. Gli script iniziali, l’applicazione e il kit TEST hanno controlli SRI. Gli handler storici necessari usano hash espliciti: non è consentita l’esecuzione generica di script inline.

Il codice applicativo non invia nomi, documenti, CF o dati catastali a server, IA o sistemi di telemetria. Le richieste necessarie al sito possono comunque esporre al servizio di hosting i normali metadati di connessione (es. indirizzo IP), non il contenuto dell’archivio.

## Limiti della protezione

Questa implementazione non costituisce una certificazione o una garanzia assoluta. Un’applicazione legittimamente sbloccata deve poter leggere i dati in memoria; un futuro aggiornamento malevolo che controllasse anche la pagina iniziale potrebbe cambiare codice e policy. SRI e CSP riducono alcuni rischi, ma non rendono innocuo il controllo compromesso dell’intera pubblicazione. La protezione dell’account che pubblica gli aggiornamenti resta necessaria. Non viene affermato un isolamento indipendente dal proprietario del codice, né una verifica di conformità legale.

Il dispositivo, la disponibilità dello spazio, i permessi del browser e la conservazione di password e backup esterni restano parte della continuità dei dati. Una password dimenticata non va risolta cancellando i dati del browser. Un archivio protetto non va aperto con una vecchia versione del gestionale.

## Archivio TEST

Inserimento aggiuntivo e identificato da `ITE_TEST_3073`: nessun ID o record preesistente viene riutilizzato o sovrascritto. Tutti i soggetti e gli immobili sono etichettati [TEST]. Codici fiscali e identificativi sono deliberatamente sintetici e non validi per uso ufficiale; i recapiti usano `example.invalid`. Non sono un insieme per validare i controlli ufficiali di CF, P.IVA o pratiche fiscali.

- Un cliente con due immobili e impianti diversi.
- Due clienti omonimi, distinti da CF sintetici differenti.
- Proprietaria e occupante come anagrafiche distinte; la relazione di occupazione è annotata nell’immobile TEST, senza introdurre automatismi non presenti nei moduli esistenti.
- Un fornitore, un professionista e un dipendente/operatore.
- Tre immobili, tre impianti, tre apparecchiature con matricole differenti e un cantiere con preventivo ed extra/SAL.
- Nove file generati sul dispositivo: fattura vendita, acquisto, nota di credito, proforma /PR, DDT, Di.Co. simulata senza validità, tabella omonimi con conflitti, fattura duplicata e documento incerto.

Nella pagina Importazioni si trovano il comando per caricare il lotto in anteprima, lo ZIP dei file fittizi e i risultati attesi. Il lotto non viene contabilizzato o caricato a magazzino senza i normali controlli e la registrazione dell’utente. La ripetizione dell’installazione non duplica i soggetti. I dati TEST vengono conservati anche nei backup.

## Verifiche

`tests/security.cjs` verifica migrazione da codice reale 3.0.72, originale File e storico, assenza di dati leggibili negli archivi persistenti, cifratura verificata con Web Crypto, password errata, manomissione, migrazione interrotta e ripresa, rifiuto di script con impronta errata, backup cifrato, ripristino con password diversa e successiva riapertura, assenza di richieste esterne e POST, blocco della connessione esterna, Excel/PDF/OCR reali locali e collegamenti dei nove file TEST. Il test SAL/importazioni preesistente è adattato allo sblocco e viene ripetuto.

I test lavorano con browser isolati e dati artificiali, non con l’archivio reale dell’utente. Gli screenshot prodotti dai test sono temporanei e non fanno parte del rilascio.
