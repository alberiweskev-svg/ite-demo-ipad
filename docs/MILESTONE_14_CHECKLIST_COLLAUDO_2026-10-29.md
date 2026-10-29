# Checklist di collaudo — Milestone 14, CAD + catalogo

Data: 29 ottobre 2026. Ramo: `sviluppo-4.0.0-base`. Non pubblicare su GitHub Pages prima dei collaudi.

## Prova funzionale con dati sintetici
1. Sbloccare l'archivio locale cifrato con credenziali di test e aprire Disegno Tecnico I.T.E. CAD.
2. Selezionare un cliente fittizio, una sede fittizia e un impianto. Disegnare muri, quote e simboli; impostare la scala in cm/unità.
3. Creare nel Magazzino un articolo **Materiale** fittizio con unità `pz`, codice, descrizione e prezzo archivio. Tornare al CAD, scegliere **Aggiorna catalogo materiali**, selezionare il simbolo e associare l'articolo.
4. Salvare il disegno e verificare revisione e backup preventivo. Riaprire il disegno e controllare che il collegamento articolo sia rimasto.
5. Esportare distinta geometrica CSV, distinta catalogo CSV e tavola A4 HTML. Verificare codici, quantità, avvertenze e l'indicazione **BOZZA**.
6. Verificare che l'associazione non abbia creato movimenti di magazzino, ordini, fatture o preventivi.
7. Ripetere con un articolo a unità `m`, un prezzo mancante, una giacenza insufficiente e un simbolo senza articolo: devono apparire avvertenze, non valori economici fittizi.
8. Reimportare un disegno JSON schema 1/2 precedente e verificare che sia ancora modificabile senza nuovi campi obbligatori.

## Compatibilità
- Conservare la versione 3.0.74 su `main` e tutti i moduli Windows 2.7.5.
- Non inserire clienti reali né documenti reali nell'anteprima pubblica.
- Su iPad fisico verificare Safari, input touch, scaricamento dei tre file, persistenza dopo riavvio e stampa A4 da HTML; **test fisico non ancora effettuato**.

## Limiti
Il valore dei prezzi è quello del catalogo, con ruolo da verificare. Non rappresenta automaticamente costo, vendita o offerta. Fornitura e posa sono separate e da quantificare; non è un ordine di materiali. Le quote CAD restano da verificare in cantiere. Gli HTML/CSV/SVG esportati non sono cifrati.

## Evidenze
- `dev/test_400_cad_catalog.cjs`: riferimenti articolo, conteggi, stock, prezzo e compatibilità.
- `dev/test_400_cad_browser.cjs`: flusso browser Chromium/WebKit, archivio cifrato, backup, CSV e tavola A4.
- `.github/workflows/ite-4-regression.yml`: regressione integrata.
- La conferma dei test è esclusivamente il risultato della relativa esecuzione GitHub Actions, non questa checklist.
