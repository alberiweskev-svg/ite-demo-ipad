# Milestone 14 — CAD, catalogo, giacenze e tavola A4 in bozza

29 ottobre 2026 — ramo sviluppo-4.0.0-base.

## Funzioni
- Collegamento **facoltativo** tra un simbolo del CAD e un articolo reale di tipo Materiale del catalogo del gestionale. Il legame è un identificativo, non una copia del prezzo o una modifica del catalogo; resta nelle revisioni e nei backup cifrati. I disegni precedenti sono compatibili.
- Distinta raggruppata per **simbolo + articolo**: quantità, codice e descrizione, unità, prezzo archivio e ruolo del prezzo, giacenza calcolata dai movimenti. Evidenzia fabbisogno non coperto, unità non a pezzi, prezzi mancanti, articoli non associati e movimenti non numerici.
- **Nessun prelievo di magazzino** e nessuna prenotazione. I valori archivio non sono prezzi di vendita e non comprendono posa, ricarichi, IVA o sfridi. Un totale viene mostrato solo quando tutte le righe sono valorizzabili.
- Esportazione **CSV catalogo** con fornitura e posa da verificare separatamente; mantenuta l'esportazione CSV geometrica precedente.
- Esportazione **tavola A4 HTML locale**, orientamento orizzontale, disegno SVG, cliente e sede, distinta e avvertenze permanenti. Il file non è cifrato, firmato o certificato e va trattato come bozza.

## Integrità e compatibilità
- La validazione dell'archivio commerciale verifica che i riferimenti agli articoli nei simboli attuali esistano e siano materiali. Non impone nuove proprietà ai disegni legacy.
- Tutti i dati di collaudo sono sintetici. Nessun PDF reale, nessun aggiornamento di main, della 3.0.74 o del modulo Windows 2.7.5.
- Backup Git precedente: backup/4.0-pre-cad-catalogo-2026-10-29.

## Collaudo e limiti
- Test unitari: dev/test_400_cad_catalog.cjs, test CAD precedenti.
- Regressione completa Chromium e WebKit tramite workflow GitHub; lo stato effettivo va letto dalla pipeline.
- Non equivale a distinta esecutiva, computo metrico, preventivo o stampa professionale certificata. Il collaudo su iPad Safari fisico resta da eseguire.
