# Milestone 28 — Fatturazione lavori approvati e SAL (30/10/2026)

## Scopo
Riconciliare preventivi accettati ed Extra approvati con fatture vendita **già importate**, senza confondere approvazioni, fatturazione, incassi e costi. Ramo esclusivo `sviluppo-4.0.0-base`; backup Git `backup/4.0-pre-contract-billing-2026-10-30-00` dal commit `f22fd6c781b5396ad5bab778b000cd14b324a5b6`.

## Flusso integrato
1. Scheda cantiere → quadro economico → **Fatturazione lavori approvati e SAL**. Lavori da `ite_quotes` e `ite_extras` nel cantiere, senza copiarli né creare schede isolate.
2. Vengono proposte esclusivamente fatture vendita **Registrato**, con cliente e cantiere coerenti, imponibile e totale verificati, valuta EUR. Proforme, TD04, fatture acquisto e documenti non collegati non sono selezionabili.
3. Associazione manuale di una quota di imponibile fattura a un preventivo accettato o a un Extra approvato (anche parzialmente, solo per righe selezionate), con controlli su residui per documento e per lavoro. Le voci Fornitura e Posa restano distinte nell'origine.
4. Le associazioni sono persistite in `commerce.settings.contractBillingLinks`, dentro l'archivio cifrato, e protette da backup preventivo `ITEHistory.create`, transazione `ITECommerce.mutate`, audit e controllo strutturale in `ITECommerce.validate`.
5. Storno con motivazione obbligatoria, mantenendo la registrazione precedente. Se un lavoro cambia importo o perde approvazione, il collegamento storico non viene cancellato: è evidenziato come **da verificare**.
6. Piano SAL degli Extra: visualizzazione delle fasi percentuali e degli importi IVA inclusa come **previsione**, non come fatture o incassi generati.
7. Quadro distinto: lavori approvati (imponibile), attribuzioni (imponibile), fatture importate (imponibile), movimenti effettivi registrati sul documento (lordo), residuo documentale (lordo). I movimenti manuali del cantiere **non vengono sommati** ai movimenti del registro fatture per evitare doppio conteggio.
8. Registro CSV esportabile solo dopo avviso di dati non cifrati, con neutralizzazione formule CSV.

## Integrità e limiti
- `main` 3.0.74 e Windows 2.7.5 invariati. Nessun PDF reale, nessuna sincronizzazione bancaria, nessuna fattura elettronica emessa, nessun pagamento presunto.
- Le attribuzioni sono **collegamenti gestionali**, non quietanze né contabilità certificata. L'importo imponibile deve essere verificato dall'operatore; il saldo fatture resta gestito dal registro economico.
- Le note credito TD04 non riducono automaticamente i lavori approvati: rimangono nel registro contabile e richiedono riconciliazione separata.
- Collegamenti esistenti con riferimenti mancanti, approvazioni ritirate o imponibili cambiati sono conservati ma segnalati.
- I modelli ufficiali Di.Co./Di.Ri./GAS, POS/CAD 2.7.5 e il collaudo Safari su iPad fisico restano attività aperte.

## Verifiche
- `dev/test_400_contract_billing.cjs`: approvazione totale/parziale, separazione imponibile/IVA, cap fattura e lavori, isolamento clienti/cantieri, storno e audit, riferimenti obsoleti, SAL, CSV e movimenti fattura.
- `dev/sync_sri.cjs` esteso al nuovo modulo.
- Regressione GitHub: esito da verificare dopo il commit, senza anticipare un collaudo non ancora effettuato.
