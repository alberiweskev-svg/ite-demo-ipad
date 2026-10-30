# Milestone 29 — Consumi materiali per intervento, magazzino e cantiere (30/10/2026)

## Flusso
- Nella scheda intervento del calendario, un tecnico assegnato con accesso **In corso** può selezionare un materiale realmente presente in magazzino, quantità (fino a tre decimali) e nota.
- Ogni conferma genera **un consumo storico e un movimento di scarico** nella stessa transazione `ITECommerce.mutate`, dopo backup locale `ITEHistory.create`.
- La giacenza insufficiente blocca l'operazione; nessun magazzino negativo automatico. Il carico da fattura/DDT resta distinto e non viene ripetuto.
- Lo storno richiede un operatore assegnato e motivazione: registra un movimento compensativo di carico senza cancellare il consumo originale, e conserva audit e data.
- Il registro è integrato nella scheda intervento e nel riepilogo del cantiere; CSV per intervento/cantiere con protezione delle formule e avviso sui dati non cifrati.
- Il costo di acquisto è **storico e opzionale**, acquisito solo da `article.costPrice` verificabile al momento dello scarico. Il prezzo di vendita o di listino non è usato come costo.
- Nessuno scarico automatico da preventivi, Extra, CAD o documenti fiscali. Nessuna fattura, pagamento o margine presunto generato.

## Sicurezza e integrità
- Registro `commerce.settings.jobMaterialUsage` nel database locale cifrato, incluso nei backup completi.
- Validazione incrociata con intervento, cliente, cantiere, tecnico assegnato, articolo, movimento di scarico e eventuale movimento di storno.
- La validazione viene richiamata dall'archivio commercio durante mutazioni, recuperi e ripristini.
- Nessun dato reale nei test; `main` 3.0.74 e Windows 2.7.5 non modificati.

## Test
- `dev/test_400_job_materials.cjs`: giacenza, quantità, assegnazioni, isolamento cliente/cantiere, storni, costi storici, CSV, manomissioni.
- `ite-4-regression.yml`: sintassi e test integrati nella pipeline.
- Verifiche Chromium/WebKit e collaudo Safari iPad fisico: da confermare dopo l'esecuzione CI.

## Limiti
- Nessun trasferimento automatico tra magazzini e nessuna prenotazione materiali.
- Il registro non sostituisce DDT, contabilità industriale, fatture o inventario fiscale.
- Il porting dei modelli ufficiali Di.Co./Di.Ri./GAS e dei moduli Windows 2.7.5 rimane aperto.
