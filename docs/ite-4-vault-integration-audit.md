# I.T.E. 4.0 — verifica integrazione archivio (31 ottobre 2026)

## Evidenza nel codice
- `vault.js` definisce tre database distinti: `ITE_DEMO_DOCUMENTI_312`, `ITE_COMMERCIO_V1`, `ITE_BACKUP_HISTORY_V1`.
- Il vault cifra i record IndexedDB individualmente con AES-GCM e contesto per database/store/ID.
- Il coordinatore `ite-operational-persistence.js` richiede un adapter esterno; **non** è collegato al vault.
- Le proprietà `encrypted` e `atomic` dell'adapter sono dichiarazioni, non verifiche di durabilità.

## Blocco architetturale
Una singola transazione IndexedDB non può comprendere object store appartenenti a database diversi. Pertanto non è corretto dichiarare atomica una scrittura coordinata su `ITE_DEMO_DOCUMENTI_312` e `ITE_COMMERCIO_V1`. Il salvataggio dei dati cliente e contabili, insieme all'audit, richiede un disegno esplicito: database unico con store multipli oppure protocollo journal/recovery idempotente verificato. Il backup prima della scrittura non sostituisce l'atomicità.

## Criteri per abilitare la persistenza reale
1. Mappare precisamente gli object store e il formato dei record, senza modificare quelli esistenti.
2. Stabilire un protocollo di commit e ripristino che preservi gli allegati binari e gli archivi 3.0.74.
3. Verificare backup/ripristino, perdita alimentazione, conflitti, audit e duplicati su dati fittizi.
4. Eseguire test WebKit/Safari su iPad prima di collegare l'interfaccia.
5. Lasciare la scrittura disabilitata finché non siano soddisfatte tutte le condizioni.

`ite-vault-integration-gate.js` è un controllo preventivo di capacità, **non** un adapter di persistenza né una prova che un archivio sia sicuro.
