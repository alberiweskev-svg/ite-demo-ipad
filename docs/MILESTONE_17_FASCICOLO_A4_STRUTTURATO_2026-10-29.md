# Milestone 17 — Fascicolo strutturato A4 e indice allegati delle pratiche tecniche

29 ottobre 2026 — ramo `sviluppo-4.0.0-base` — **solo sviluppo**, nessuna pubblicazione.

## Funzioni aggiunte nella demo 4.0 unica

- Pulsante **Scheda A4 (bozza)** accanto alla stampa di ciascuna pratica Di.Co. elettrica, Di.Co. idrica/termica, Di.Ri., Allegati GAS H40/I40/A12/B12 e POS.
- Pulsante **Fascicolo strutturato A4 (bozza)** per il cliente selezionato e le pratiche visibili dopo i filtri; massimo 50 pratiche per esportazione.
- Copertina con indice pratiche e **indice degli allegati originali**, senza incorporare file, immagini, firme o byte originali.
- Sezioni strutturate in base ai gruppi di campi già previsti dalla compilazione guidata: identificazione, sede, impianto, apparecchiatura, cantiere, intervento, descrizioni, checklist, riferimenti, fonti originali e verifiche aperte.
- Evidenza di **revisioni CAD non aggiornate**, campi obbligatori mancanti, originali non collegati, PDR GAS non attestato da documento, POS senza cantiere e date incoerenti.
- Convalida dei collegamenti cliente → sede → impianto → apparecchiatura e cantiere, con blocco dell'esportazione quando originali o anagrafiche appartengono ad altri clienti.
- Esportazione HTML locale stampabile in A4, con filigrana testuale e avvertenze ripetute; escaping HTML, CSP restrittiva e nessuna richiesta di rete. Non modifica archivio, revisioni, audit, giacenze o preventivi.

## Vincoli e limiti

Le tavole sono **documenti preparatori non ufficiali**, non sostituiscono i modelli ministeriali Di.Co./Di.Ri. o quelli del distributore GAS. Nessuna dichiarazione di conformità, firma, prova o invio viene attestata automaticamente. L'HTML scaricato **non è cifrato**: va custodito con attenzione. Il controllo di completezza è interno e non equivale a verifica normativa. Non è stato portato il generatore Windows 2.7.5 né si dichiara la parità di stampa.

Il modello PDF sintetico già presente rimane disponibile, indipendente da questa funzione. Nessun dato reale o PDF originale è stato inserito nel repository.

## Verifiche riproducibili

- `node --check technical-structured-docs.js`
- `node dev/test_400_structured_docs.cjs`: dati fittizi, A4, escaping, isolamento clienti, fonti, originali, revisioni CAD, PDR GAS, POS, nessuna mutazione.
- `node dev/test_400_structured_docs_browser.cjs <cartella-demo>`: browser Chromium; ripetere con `ITE_TEST_BROWSER=webkit` per WebKit.
- CI `.github/workflows/ite-4-regression.yml` contiene i nuovi gate. **Controllare il risultato effettivo del run GitHub Actions**; la presenza di commit non prova il collaudo.
- `dev/sync_sri.cjs` include la nuova risorsa nello SHA-384.

Backup Git precedente alla milestone: `backup/4.0-pre-documenti-strutturati-2026-10-29-12`. La 3.0.74 operativa (`main`) e i moduli Windows 2.7.5 non vengono modificati.

## Da completare

1. Trasposizione dei modelli ufficiali Di.Co./Di.Ri./GAS con confronto campo-per-campo ai sorgenti 2.7.5 e validazione legale/tecnica.
2. Gestione delle firme, degli allegati normativi e delle prove senza dichiarazioni automatiche.
3. Parità POS/CAD e collegamento completo con materiali e magazzino.
4. Collaudo Safari su iPad fisico e pubblicazione controllata di un'unica demo 4.0 senza dati reali.
