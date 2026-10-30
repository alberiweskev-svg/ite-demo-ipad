# Milestone 39 — Stabilizzazione archivio cifrato e sospensione iPad (30 ottobre 2026)

## Ambito
Stabilizzare la chiusura forzata dopo quattro ore di inattività, anche con modulo aperto, e la successiva riapertura dell'archivio cifrato. Il blocco emerso nella regressione della Milestone 38 avveniva dopo la simulazione di sospensione: `#app-shell` non tornava visibile entro 45 secondi, nonostante il completamento dei test precedenti.

## Modifiche integrate
- Chiusura fail-closed: mascheramento immediato della pagina e dell'applicazione prima della navigazione, azzeramento dei byte della chiave e disabilitazione dell'archivio.
- Chiusura anticipata delle connessioni IndexedDB attive e rilascio del Web Lock esclusivo prima del ricaricamento; il cleanup su `pagehide` rimane idempotente.
- Protezione da blocchi multipli durante `visibilitychange`, `pointerdown` e timer periodico, senza introdurre un secondo archivio.
- Riavvio del conteggio inattività dopo il completamento dello sblocco, non durante la derivazione della chiave.
- Test unitario del ciclo di blocco forzato, protezione dei moduli non salvati durante il blocco manuale, ordine di pulizia, chiave azzerata e blocco ripetuto.
- Test browser con attesa del completamento del caricamento prima di sbloccare l'archivio dopo la sospensione simulata.

## Sicurezza e limiti
Il blocco forzato scarta i dati **non salvati** nel modulo aperto; non modifica gli allegati già confermati. Il browser deve supportare Web Locks e IndexedDB. Le prove su Chromium/WebKit e la regressione generale sono subordinate all'esito effettivo della pipeline GitHub; il collaudo su Safari/iPad fisico resta da fare. Non dichiarare risolto il precedente difetto WebKit senza più verifiche positive.

Backup Git preventivo: `backup/4.0-pre-vault-idle-safety-2026-10-30-11`. Ramo operativo `main` e moduli Windows 2.7.5 intatti. Nessun documento reale pubblicato; `published=false`.
