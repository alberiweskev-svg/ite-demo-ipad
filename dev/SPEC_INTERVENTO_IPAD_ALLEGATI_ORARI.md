# Gestionale I.T.E. 4.0 — completamento flusso intervento (collaudo iPad 24/10/2026)

## Esito collaudo
Confermati: cliente → sede → impianto → apparecchiatura → appuntamento; “Sono arrivato” registra timestamp; “Ho finito” registra uscita; riepilogo durata; intervento ordinario senza diritto fisso.

## Requisiti obbligatori da implementare
1. All'arrivo aprire la scheda operativa dell'intervento, senza richiedere nuovamente cliente/sede/apparecchiatura.
2. Durante l'intervento, PRIMA di chiudere, permettere caricamento di più foto (scatta foto iPad o seleziona file), rapporti di controllo, note e documenti. Salvare gli allegati nello storico corretto. Non disabilitare “Aggiungi documento” durante lo stato In corso.
3. Il pulsante di chiusura deve offrire una verifica di orari, rapporto e allegati; consentire chiusura anche senza allegati, ma con avviso esplicito.
4. Correzione dell'ora effettiva di arrivo e uscita se il tecnico ha registrato in ritardo. Mostrare sempre i timestamp automatici originali e i valori effettivi corretti; motivazione obbligatoria, operatore e timestamp della correzione nell'audit. Validare uscita >= ingresso; durata e report ricalcolati.
5. Per interventi chiusi, “Revisiona intervento” deve consentire correzioni e aggiunta allegati senza cancellare precedente chiusura, storico o documenti; salvare eventi di revisione e nuova chiusura.
6. Test automatici e manuali su Safari iPad: foto con fotocamera, upload file, orari corretti, salvataggio/ricaricamento, revisione e backup cifrato.

## Vincoli
- Lavorare SOLO sul ramo sviluppo-4.0.0-base e sulla demo isolata 4.0; NON modificare main / versione 3.0.74.
- Usare dati fittizi, mai dati reali in demo pubblica.
- Non dichiarare funzionalità implementata senza codice, test e pubblicazione verificati.
