# Milestone 37 — Registro allegati originali delle pratiche tecniche (30 ottobre 2026)

## Obiettivo
Integrare nella stessa demo I.T.E. 4.0 il collegamento di documenti tecnici **gia importati** alle bozze Di.Co. elettrica/idrotermica, Di.Ri. e GAS H40/I40/A12/B12, mantenendo cliente, sede, cantiere, impianto e apparecchiatura coerenti. Nessun documento reale viene incluso nel repository.

## Funzioni sviluppate
- Pulsante **Allegati originali** nella lista delle pratiche tecniche, accanto a **Prove collegate**.
- Selezione dei soli documenti tecnici presenti nell'archivio locale, appartenenti allo stesso cliente e con originale identificato da file e impronta SHA-256. Prima di registrare un collegamento, ITECommerce.technicalOriginalHints ricalcola e verifica l'impronta del file.
- Categorie: schema, materiali, progetto, prove, requisiti tecnico-professionali, allegato GAS, libretto/schede, foto e altro.
- Riferimenti conservati in settings.technicalAnnexLinks, con revisione della pratica, revisore dichiarato, motivazione, data e storico di revoca. Il PDF non viene duplicato.
- Controlli di duplicato, cliente, sede/cantiere/impianto/apparecchiatura/intervento e integrita strutturale, richiamati anche dalla validazione dell'archivio e dai ripristini.
- Segnalazione di originale mancante, revisione superata, pratica annullata e riferimento revocato; apertura dell'originale attraverso il controllo SHA-256 esistente.
- Backup preventivo prima di collegamenti e revoche, audit, indice A4 HTML e CSV locale con escaping HTML, protezione formula CSV e avviso sul file non cifrato.
- Riepilogo allegati incluso nell'oggetto di report delle prove collegate, senza trasformare i documenti in attestazioni.

## Test aggiunti
- Esteso dev/test_400_technical_evidence.cjs con proprieta del documento, doppio collegamento, revisioni, originale mancante, revoca, XSS, CSV e audit.
- Esteso dev/test_400_technical_evidence_browser.cjs con PDF **sintetico**, SHA-256, archivio cifrato, collegamento tramite UI, esportazione, revoca e backup.
- SRI SHA-384 del modulo aggiornato in index.html.

## Limiti e sicurezza
Questo e un **registro di riferimenti** a PDF gia importati, non un nuovo parser PDF e non un generatore dei modelli ufficiali. SHA-256 verifica l'integrita dei byte salvati, non autenticita, firma, conformita o correttezza tecnica. La classificazione e il revisore sono dichiarati dall'operatore. Gli originali non sono incorporati nell'indice HTML/CSV. Il download resta non cifrato.

Restano da completare i modelli ufficiali Di.Co./Di.Ri./GAS, la parita funzionale POS/CAD con Windows 2.7.5, la stabilizzazione WebKit e il collaudo Safari su iPad fisico. published=false: nessuna demo pubblica 4.0 autorizzata.

Backup preventivo: ramo backup/4.0-pre-technical-annex-register-2026-10-30-09 dal commit 2668933ba3bb3fb307e28684e0847f65370f279d. Nessuna modifica a main 3.0.74 o ai moduli Windows 2.7.5.
