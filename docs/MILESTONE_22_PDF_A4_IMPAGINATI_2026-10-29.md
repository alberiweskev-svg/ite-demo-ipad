# Milestone 22 — Schede tecniche PDF A4 impaginate (29 ottobre 2026)

## Perimetro e tutela delle versioni
Ramo `sviluppo-4.0.0-base`, versione sviluppo 4.0.0. La versione operativa `main` 3.0.74 e i moduli Windows 2.7.5 non sono stati modificati. Backup Git creato prima del lavoro: `backup/4.0-pre-pdf-impaginato-2026-10-29-18`.

## Funzioni implementate
1. Esportazione PDF locale delle otto tipologie di pratica esistenti in un formato A4 più leggibile, con testata, gerarchia tipografica, sezioni distinte e numerazione delle pagine.
2. Indice iniziale del fascicolo con riferimento, stato, numero di campi obbligatori ancora vuoti, originali verificabili e riferimenti esclusi per incoerenza.
3. Quadro di compilazione specifico per pratica che elenca i campi tecnici obbligatori mancanti, utilizzando gli stessi gruppi già definiti dal gestionale.
4. Spazio esplicitamente **non certificativo** per verifica umana, data e note; nessuna firma viene apposta, generata o simulata.
5. Conservazione dei dati già riportati dalla Milestone 21: cliente, sede, impianto, apparecchiatura, intervento, materiali CAD, checklist, fonti originali e verifiche.
6. Nessuna nuova rete o trasferimento di documenti. Nessuna modifica dell'archivio durante la stampa. Le esportazioni non sono cifrate.

## Test e accettazione
I test Node esistenti vengono ampliati con controlli su indice, campi obbligatori, conteggi originali, impaginazione, numerazione e assenza di firme digitali. Il test browser Chromium/WebKit verifica la presenza delle nuove sezioni nel PDF scaricato. La regressione GitHub va verificata dopo il commit.

## Limiti aperti
Queste schede **non sono modelli ministeriali ufficiali**. Per riprodurre fedelmente la Di.Co., la Di.Ri. e gli allegati GAS serve il confronto puntuale con i modelli ufficiali e gli originali Windows 2.7.5. Rimangono firme autentiche, prove normative, parità POS/CAD e collaudo su iPad fisico. La diagnostica WebKit di ricaricamento diretto rimane aperta.
