# Milestone 38 — Pacchetto tecnico integrato con registro allegati (30 ottobre 2026)

## Obiettivo
Collegare il registro degli originali della Milestone 37 ai documenti preparatori già esistenti, eliminando la divergenza fra allegati registrati e allegati esportati.

## Funzionalità
- ZIP locale con originali selezionati sia dai collegamenti precedenti della pratica sia dal registro `technicalAnnexLinks`; un file viene incluso una sola volta quando condiviso fra pratiche.
- Manifest JSON con provenienza di ogni collegamento, categoria, revisione della pratica, revisore dichiarato, data, ID pratica e SHA-256 del file; `annexRegisterVersion: 2` senza alterare il formato di base.
- Revoche escluse dal pacchetto; collegamenti attivi a revisioni superate o pratiche annullate bloccano il pacchetto finché non vengono regolarizzati.
- Controlli cliente, sede, impianto, apparecchiatura e intervento prima di utilizzare un collegamento; nessuna lettura di originali di clienti diversi.
- Fascicolo A4, matrice CSV e piano di completamento espongono categoria, revisore, revisione e stato dei riferimenti, anche se revocati o superati.
- SHA-256 ricalcolato sui byte di ogni originale prima di generare lo ZIP; il pacchetto non modifica i dati sorgenti.

## Test
`dev/test_400_original_bundle.cjs`: solo registro, compatibilità collegamenti storici, deduplicazione, revoca, revisione superata, isolamento clienti, manifest, A4 e CSV.
`dev/test_400_structured_docs_browser.cjs`: percorso ZIP su Chromium e WebKit con originale PDF sintetico registrato soltanto nel nuovo registro.
Il risultato GitHub Actions deve essere verificato separatamente; non dichiarare un collaudo prima dell'esito.

## Limiti
Documenti e ZIP restano **bozze non firmate e non cifrate**. SHA-256 dimostra l'integrità dei byte archiviati, non l'autenticità o conformità tecnica. Non sono riprodotti i modelli ministeriali Di.Co./Di.Ri. o gli allegati GAS ufficiali; il confronto con gli originali e la verifica tecnica restano necessari. Nessun dato cliente reale viene incluso nel repository.

Backup: `backup/4.0-pre-annex-package-integration-2026-10-30-10`. Ramo `main` 3.0.74 e moduli Windows 2.7.5 non modificati. `published=false`: nessuna demo pubblica 4.0.
