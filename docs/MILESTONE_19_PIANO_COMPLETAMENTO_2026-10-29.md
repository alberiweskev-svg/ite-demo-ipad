# Milestone 19 — Piano di completamento del fascicolo tecnico

29 ottobre 2026 · ramo `sviluppo-4.0.0-base` · solo sviluppo, dati sintetici.

## Funzioni integrate

- Piano di lavoro trasversale alle pratiche selezionate dello **stesso cliente**: priorità, area, pratica, motivo e attività da verificare. Utilizza checklist, dati guidati, originali e distinta CAD già disponibili.
- Controlli fra pratiche GAS della medesima sede/cantiere su **PDR discordanti**, e riferimenti duplicati fra pratiche dello stesso tipo; sono segnalazioni per verifica manuale, non correzioni automatiche.
- Due nuove esportazioni dal pannello Pratiche tecniche: **Piano completamento A4** e **Attività da verificare CSV**. Il CSV neutralizza le formule pericolose; il piano A4 applica CSP restrittiva e escaping dei contenuti.
- Copertina del fascicolo strutturato A4 aggiornata con attività prioritarie e operative, più le prime 20 azioni; il piano separato conserva l'elenco completo.
- Le attività di confronto con i modelli ufficiali, le prove e le firme rimangono **verifiche esterne sempre aperte**: non vengono attestate né generate firme.

## Limiti e sicurezza

Nessuna equivalenza dichiarata con i modelli ufficiali Di.Co./Di.Ri./GAS Windows 2.7.5. Nessuna modifica ai dati sorgente, ai movimenti di magazzino, ai preventivi, alla versione 3.0.74 o a `main`. Esportazioni locali HTML/CSV **non cifrate** da custodire in luogo sicuro; nessun originale binario incorporato. Validazione preventiva dell'appartenenza al cliente e dei collegamenti.

## Test

`node dev/test_400_dossier_plan.cjs` e regressione esistente `node dev/test_400_structured_docs.cjs`; verificare esiti GitHub Actions prima del collaudo. Backup: `backup/4.0-pre-dossier-workflow-2026-10-29-15`.
