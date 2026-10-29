# Milestone 26 — Scadenziario tecnico-operativo integrato (29/10/2026)

## Origine e sicurezza
- Ramo di sviluppo: `sviluppo-4.0.0-base`, separato da `main` (3.0.74).
- Backup Git precedente: `backup/4.0-pre-scadenziario-operativo-2026-10-29-22` (commit `ff18b195becd7e2b728a8511e8a739b8872fc84a`).
- Nessun dato reale inserito nel repository; test esclusivamente sintetici. Nessuna modifica alla 2.7.5 Windows.
- Modulo `ite-maintenance-planner.js` con integrità SHA-384 verificata dal processo `dev/sync_sri.cjs`.

## Funzioni consegnate nel codice
1. Un'unica sezione **Scadenziario manutenzioni**, raggiungibile da Home e dal menu Calendario e lavori, compatibile con la navigazione già presente.
2. Lettura della gerarchia Cliente → Sede → Impianto → Apparecchiatura → Intervento, senza modificare dati e senza collegamenti tra clienti differenti. Le apparecchiature orfane sono segnalate nel riepilogo, non attribuite arbitrariamente.
3. Ultima manutenzione **completata e registrata**: le riparazioni e gli interventi programmati non aggiornano la data. Intervallo indicativo configurabile a 6, 12, 13, 24 o 36 mesi; orizzonte di controllo a 30/60/90/180 giorni.
4. Stati distinti: Scaduta, In scadenza, Programmata, Regolare, Storico assente, Dati da verificare. Un appuntamento futuro non equivale a manutenzione eseguita.
5. Ricerca per cliente, sede, impianto, apparecchiatura e matricola; filtri di stato; collegamento diretto al cliente e al modulo appuntamenti con apparecchiatura precompilata. Operatore, data e salvataggio restano espliciti.
6. Esportazione CSV delle righe filtrate, con conferma perché non cifrata, intestazioni in italiano, protezione dalle formule CSV e nessuna esposizione delle tariffe/ore interne.

## Limiti deliberati
- Le date sono **promemoria operativi**, non obblighi normativi, né calcoli automatici di controlli fumi, CRITER o FGAS. La periodicità va verificata sul libretto, prescrizioni e contratti.
- Non vengono creati appuntamenti in automatico, né inviati avvisi esterni; l'utente conferma i dati nel calendario.
- Non si modifica l'archivio durante calcoli o esportazioni.
- Il modulo non è un sostituto dei modelli Di.Co./Di.Ri./GAS o delle funzioni Windows 2.7.5.
- Safari su iPad fisico e il precedente crash WebKit di ricaricamento diretto restano da verificare.

## Test previsti in GitHub Actions
- `dev/test_400_maintenance_planner.cjs`: date, fine mese, gerarchia, isolamento, storico, pianificazione, filtri e sicurezza CSV.
- `dev/test_400_maintenance_browser.cjs`: percorso integrato Chromium/WebKit, archivio cifrato, vista, ricerca, esportazione CSV, passaggio al calendario.
- Regressione generale, controllo sintassi, SHA-384 e build devono essere valutati dai run Actions prima di dichiarare la milestone collaudata.

## Prossimi blocchi
- Completare i modelli originali Di.Co./Di.Ri./GAS quando disponibili i sorgenti ufficiali 2.7.5.
- Estendere i flussi preventivo → extra → fattura/proforma e i controlli degli interventi.
- Analizzare separatamente il crash WebKit al ricaricamento e validare su Safari iPad reale.
