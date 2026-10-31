# I.T.E. 4.0 — rilascio demo calendario isolata

## Stato verificato (31/10/2026)
- Workflow di packaging: run 41241008068, job package concluso con successo.
- Demo HTML: `ite-operations-demo.html`, dipendenze JavaScript/CSS locali.
- Dati: esclusivamente sintetici e in memoria; nessun accesso all'archivio clienti.
- La riuscita del packaging NON dimostra il funzionamento su iPad o la disponibilità di un URL pubblico.

## Percorso di collaudo senza modificare la 3.0.74
1. Scaricare l'artifact `ite4-calendar-demo-isolata` dal run GitHub Actions 41241008068.
2. Estrarre l'intero ZIP, conservando insieme HTML, CSS e JavaScript. Non aprire soltanto il file HTML dalla vista codice GitHub.
3. Servire la cartella su un server statico HTTPS dedicato alla demo, con percorso e distribuzione separati dalla 3.0.74. Non attivare GitHub Pages del repository senza verificare il sito esistente.
4. Verificare da desktop e iPad: apertura senza errori, caricamento tre esempi, filtro tecnico, filtro giorno, stampa, arrivo, chiusura, revisione, nuova chiusura, spostamento, annullamento, conflitti di agenda e azzeramento.
5. Non inserire dati reali; la demo non ha persistenza. Non promuoverla a produzione finché non sono verificati autenticazione, backup/ripristino, archivio cifrato e controlli di accesso.

## Criteri di accettazione
- Tutti i test browser e i controlli manuali iPad superati e registrati.
- URL HTTPS della demo distinto dal gestionale 3.0.74.
- Nessun accesso a clienti, fatture o file di produzione.
- Nessun cambiamento alla pubblicazione della versione 3.0.74.

## Prossima integrazione
Implementare un adapter di persistenza versionato, con migrazioni, backup preventivo, ripristino testato e audit immutabile; collegarlo inizialmente ad anagrafiche fittizie, poi al calendario. La connessione a dati reali richiede collaudo separato.
