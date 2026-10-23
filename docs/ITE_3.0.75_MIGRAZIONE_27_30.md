# Migrazione operativa I.T.E. 2.7.x → 3.0.75
Fonte primaria: pacchetto utente ITE_2.7.3_AGGIORNA_DAL_GESTIONALE(1)(2).zip; patch CAD 2.7.5 5.5 e 5.5.1. Non assumere che le patch CAD costituiscano l'intero gestionale 2.7.5.

## Vincoli inderogabili
1. Mantenere la modalità di distribuzione 3.0: stesso link web/iPad, aggiornamenti progressivi senza reinstallazione manuale, dati locali persistenti e backup ripristinabile.
2. Riorganizzare navigazione e flussi in stile 2.7: anagrafica come punto di accesso, moduli separati ma collegati.
3. Non pubblicare modifiche non collaudate su main; ogni step su branch con prove sintetiche, versionamento e rollback.
4. Non mettere anagrafiche vere, PDF di clienti o backup in GitHub pubblico.
5. Non cancellare o sovrascrivere record esistenti per adeguare lo schema.

## Modello di relazione
- Anagrafica (persona/azienda, ruoli) → sedi/immobili → impianti → apparecchiature.
- Cliente ↔ preventivi ↔ cantieri ↔ interventi ↔ fatture.
- Intervento: appuntamento origine, tecnico, tempi reali, materiali, cliente, sede, eventuale cantiere, allegati e audit.
- Magazzino: registro movimenti immutabile con idempotency key e documento origine; fattura successiva a prelievo cantiere non scarica nuovamente.
- Listino: catalogo articoli/prezzi e storico variazioni, senza modificare la giacenza.
- Documenti: originale + classificazione + metadati essenziali + riferimenti; nessuna gerarchia di cartelle fittizie come vincolo dati.

## Sequenza di sviluppo
A. Backup/versione e test migrazione 3.0.74 su dataset sintetico.
B. Navigazione e scheda cliente unificata; menu semplici e ricerca diretta.
C. Classificazione e import: listino → catalogo; fatture → contabilità e movimenti; Di.Co. → anagrafiche e documenti tecnici.
D. Magazzino: ledger carico/scarico, idempotenza, giacenza annua e stampa.
E. Calendario/cantieri: ore per tecnico, materiali, costi, chiusura/revisione intervento.
F. Prove incrociate end-to-end, pubblicazione progressiva al link esistente.

## Accettazione
Non chiamare 'funzionante come 2.7' il sistema finché non superano le prove con dataset sintetico: cliente multi-sede, import listino, acquisto, vendita, Di.Co. cliente esistente/nuovo, intervento, cantiere, giacenza annuale, backup e ripristino.
