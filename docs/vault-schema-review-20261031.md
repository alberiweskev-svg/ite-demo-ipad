# I.T.E. 4.0 — Mappa archivi verificata

Da lettura di `app.js` e `vault.js` sul ramo di sviluppo:

- Anagrafiche principali: archivio core esposto da `ITE.snapshot()` e memorizzato tramite `ITEVault.storage`.
- Commercio: IndexedDB `ITE_COMMERCIO_V1`, object store `state` e `journal`. Il record `state` contiene `documents`, `audit`, `articles`, `movements`, `files`, `batches`, `settings`, `revision`.
- Documenti tecnici: IndexedDB `ITE_DEMO_DOCUMENTI_312`, object store `docs`.
- Backup: IndexedDB `ITE_BACKUP_HISTORY_V1`.
- Il modulo commerciale dispone già di un protocollo di journal `pending` e controlli di revisione: non introdurre un secondo journal in parallelo senza migrazione e test di recovery.

**Blocco concreto:** i moduli transazionali di sviluppo non sono ancora integrati con la struttura di persistenza dell'app. Il core e il commercio non condividono una transazione IndexedDB; un adattatore che dichiara `atomic:true` non basta a garantirlo.

**Milestone successiva:** definire un unico protocollo di commit e recupero compatibile con il journal commerciale già presente, testare interruzioni e conflitti su dati fittizi, poi collegare la UI solo dopo verifica su Safari/WebKit. Nessuna modifica alla 3.0.74 o ai moduli 2.7.5.
