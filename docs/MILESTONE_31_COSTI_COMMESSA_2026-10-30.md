# Milestone 31 — Costi di commessa: manodopera e spese (30 ottobre 2026)

## Integrazione
Pannello **Costi di commessa** direttamente nella scheda cantiere della demo unica 4.0. Riutilizza il consuntivo materiali della Milestone 30 e il valore imponibile dei preventivi/Extra approvati della Milestone 28. Non altera le voci di Fornitura/Posa, le fatture o i movimenti di magazzino.

## Funzioni implementate
- Ore per operatore: sessioni di ingresso/uscita concluse per gli interventi automatici, oppure registrazioni `work_logs` per gli interventi manuali; evita il doppio conteggio. Le sessioni aperte sono escluse e segnalate.
- Tariffe interne di riferimento: operaio 44 €/h, professionista/collaboratore esterno 58 €/h; override per operatore salvato nell'archivio cifrato con backup e audit. Non sono tariffe di vendita.
- Spese aggiuntive: Trasferta, Noleggio, Smaltimento, Subappalto, Altro; importo netto, data e descrizione, storno motivato senza cancellazione.
- Riepilogo: costo noto materiali + ore + spese, imponibile lavori approvati e **differenza parziale**, chiaramente non identificata come utile o margine definitivo.
- CSV con protezione delle celle formula e conferma sui dati interni non cifrati.
- Verifica della coerenza cliente/cantiere, operatori e importi. Nessuna generazione automatica di fatture, pagamenti, scarichi o movimentazioni contabili.

## Limiti noti
La differenza è provvisoria: non include tutte le spese generali, oneri, imposte, fatture non consuntivate, tempi mancanti e rettifiche non inserite. I costi dei materiali privi di prezzo sono segnalati, non stimati. I tempi in corso non producono costo finché non chiusi. La classificazione professionista è basata sul ruolo anagrafico, da verificare prima dell'utilizzo reale. I dati dei test sono fittizi.

## Verifiche
Test unitari sintetici: ore automatiche/manuali, sessioni aperte, tariffe, spese, storni, clienti diversi e CSV. Test end-to-end Chromium e WebKit aggiunti alla regressione. Esito CI da verificare sui run successivi; Safari iPad fisico non collaudato.

## Protezione versioni
Backup precedente: `backup/4.0-pre-commessa-labor-expenses-2026-10-30-03` sul commit `62eae7a7`. Ramo operativo `main` 3.0.74 e moduli Windows 2.7.5 invariati. Nessuna demo pubblica 4.0 attivata.
