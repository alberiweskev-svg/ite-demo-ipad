# I.T.E. 3.0.75 — Prova operativa e criteri di accettazione
Stato: progetto di revisione in ramo separato. Non pubblicare come versione funzionante senza collaudo.

## Principi
- Anagrafiche al centro. Scheda cliente unica con dati, sedi, impianti, apparecchiature, documenti, interventi, cantieri, preventivi, fatture, materiali e ore.
- Contabilità, magazzino/listini, calendario/interventi, cantieri, documenti tecnici: moduli separati ma relazionati tramite identificativi univoci.
- Importazione: classificazione del contenuto PRIMA di chiedere destinazioni. I listini non richiedono clienti/cantieri; fatture acquisto a fornitori e magazzino; fatture vendita a clienti; Di.Co. a cliente/sede/impianto.
- Un solo comando di importazione e massimo una conferma quando serve. Niente cartelle automatiche 'Da verificare > Anno da verificare > Soggetto da collegare > Senza cantiere' nell'interfaccia primaria.
- Nessuna variazione dei dati originali senza backup e migrazione reversibile. Nessuna duplicazione di movimenti.

## Prove obbligatorie su dati fittizi
1. Aprire un cliente e consultare immediatamente tutte le sue informazioni e gli elementi collegati.
2. Importare listino VIMAR: riconoscimento listino, archivio listini, nessuna richiesta cliente o cantiere; prezzi applicati solo dopo controllo.
3. Importare fattura acquisto con 10 pezzi: crea collegamento fornitore e carico magazzino +10 una sola volta.
4. Fattura vendita con 3 pezzi: collega cliente e scarica -3, evitando secondo scarico se già prelevati per cantiere.
5. Intervento da calendario: tecnico, arrivo/uscita, ore, materiali e cantiere/cliente collegati; nessuna duplicazione ore o materiali.
6. Di.Co. con cliente presente: aggiorna campi mancanti e allega PDF, senza inventare apparecchiatura.
7. Di.Co. con cliente assente: propone nuova anagrafica con dati estratti e collegamenti verificabili.
8. Stampa giacenza annua: saldo iniziale + carichi - scarichi +/- rettifiche = saldo finale, con valore e tracciabilità.
9. Backup prima della migrazione; ripristino verificato; nessun dato reale pubblicato nel repository.

## Interfaccia obiettivo
Menu semplice: Home, Anagrafiche, Calendario e interventi, Cantieri e preventivi, Contabilità, Magazzino e listini, Documenti tecnici, Impostazioni.
All'interno del cliente, riepilogo in una sola schermata e sezioni immediate.
Funzioni avanzate non visibili nella navigazione principale.
