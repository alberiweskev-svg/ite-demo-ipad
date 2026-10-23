# I.T.E. 3.0.74 — Importazione guidata e collegamento anagrafiche
Stato: specifica approvata dall'utente il 23/10/2026; implementazione e collaudo da completare. Branch separato da main 3.0.73.

## Flusso operativo
1. Selezione uno o più file (PDF, immagini, XML, tabelle). Analisi locale dei dati disponibili; nessuna trasmissione a servizi esterni senza autorizzazione.
2. Identificazione tipo documento, cliente, sede, impianto, apparecchiatura. Ogni campo deve riportare provenienza e livello di affidabilità; non inventare dati mancanti.
3. Confronto con archivio tramite CF/P.IVA, poi identificatori tecnici (matricola) e corrispondenze univoche. Gli omonimi o dati discordanti richiedono scelta esplicita.
4. Unica anteprima comprensibile: 'Collega a esistente' oppure 'Crea nuovo'. Per ogni nuovo cliente, sede, impianto, apparecchiatura mostrare i dati proposti. L'utente può correggerli.
5. Ordine obbligatorio di creazione: CLIENTE -> SEDE/IMMOBILE -> IMPIANTO -> APPARECCHIATURA -> DOCUMENTO. Non creare apparecchiature orfane. Se mancano sede o impianto chiedere collegamento o dati per creazione, mai inventare.
6. Unico comando 'Conferma e registra': transazione atomica, backup verificabile prima del commit, salvataggio file originale, collegamenti e audit. In caso di errore rollback e messaggio specifico.
7. Riepilogo dopo commit: numero clienti/sedi/impianti/apparecchiature/documenti creati o collegati, duplicati saltati; collegamenti cliccabili alle schede aggiornate.
8. Non duplicare soggetti e dispositivi; importazioni ripetute devono essere idempotenti. Mai sostituire valori esistenti divergenti senza revisione esplicita.
9. Conservare storico, allegati e dati del 3.0.73. Testare su dati fittizi e backup, non su dati reali. Non pubblicare come 3.0.74 finché i test non passano.

## Difetti attuali da correggere
- Il pulsante 'Registra le schede selezionate' può non produrre risultato percepibile: controllare il flusso readQueue/readiness/applyQueue/mutate e riportare errori vicino al pulsante con focus e scorrimento automatico.
- La scheda tecnica non propone creazione di cliente e apparecchiatura né gestisce l'intera catena di dipendenze.
- Semplificare l'interfaccia principale: analizza -> confronta -> conferma; categorie, statistiche e cartelle in pannello 'Dettagli avanzati'.

## Criteri di accettazione
- Documento con cliente e dispositivo assenti: propone entrambi e chiede sede/impianto se mancanti; salva solo dopo conferma.
- Cliente esistente e dispositivo nuovo: riusa cliente, crea dispositivo nel suo impianto corretto.
- Matricola già presente: collega senza duplicare.
- Due clienti omonimi: blocca creazione automatica, richiede scelta.
- Fallimento scrittura: nessuna scheda parziale e messaggio leggibile.
- Ripetizione file: nessun doppione.
- Registrazione confermata: visibile immediatamente in Anagrafiche, Immobili e impianti, Documenti.
