# Milestone 34 — Fascicolo operativo intervento integrato (30 ottobre 2026)

## Implementato
Nella scheda intervento da calendario è stato aggiunto il pannello Rapporto operativo e fascicolo intervento. Riutilizza i dati esistenti senza creare un nuovo archivio: cliente, sede, impianto, apparecchiatura, cantiere, operatori, accessi effettivi, consumi di magazzino, pratiche tecniche collegate e revisioni.

Sono disponibili la verifica interna, l'esportazione A4 HTML stampabile e il riepilogo CSV. Le esportazioni richiedono conferma perché non cifrate. I costi interni, prezzi e tariffe non sono esposti.

## Controlli
- Coerenza gerarchica cliente, sede, impianto, apparecchiatura e cantiere.
- Coerenza operatori e accessi; accessi senza uscita esclusi dal totale.
- Consumi stornati esclusi dalle quantità e conteggiati a parte; nessun nuovo scarico.
- Verifica che le pratiche tecniche appartengano al medesimo cliente.
- Avvisi su dati mancanti, interventi aperti e verifiche da effettuare.
- HTML con escaping e CSP restrittiva; CSV con neutralizzazione formule.

## Limiti e protezione
Il rapporto è una BOZZA NON FIRMATA, non sostituisce rapporti di controllo, Di.Co., Di.Ri., GAS o modelli 2.7.5. Non crea firme, esiti prove, movimenti o attestazioni. Nessun dato reale usato nei test.
Backup Git: backup/4.0-pre-intervention-dossier-2026-10-30-06 da b7dd162.
Versione operativa main 3.0.74 e Windows 2.7.5 invariati.
Test unitari e browser Chromium/WebKit aggiunti alla CI; l'esito va verificato dopo il commit. Safari iPad fisico non collaudato.
