# Milestone 21 — PDF tecnici contestualizzati (29 ottobre 2026)

## Perimetro
Unico gestionale 4.0, ramo `sviluppo-4.0.0-base`. Migliorata l'esportazione PDF locale delle bozze Di.Co. elettrica/idrica, Di.Ri., GAS H40/I40/A12/B12 e POS senza introdurre una seconda app.

## Implementato
1. I PDF riportano dati leggibili di cliente, sede, cantiere, impianto, apparecchiatura e intervento, derivati dai record anagrafici. I collegamenti incoerenti o riferiti ad altro cliente bloccano l'esportazione.
2. I campi tecnici sono ordinati per gruppi configurati nel modulo Pratiche, con etichette complete e indicazione esplicita dei campi obbligatori mancanti; restano visibili anche i campi storici non mappati.
3. Il PDF include riferimenti CAD e distinta preliminare per simboli/materiali tramite lo stesso modulo di verifica già usato nel fascicolo HTML, segnalando tavole assenti o revisioni superate.
4. Aggiunti i controlli qualità aperti della pratica. Nessuna verifica, firma o conformità viene attestata automaticamente.
5. Provenienza dei campi precompilati mostrata solo quando il documento è collegato, appartiene al cliente e alla sede/cantiere pertinente e il valore attuale coincide con quello proposto. Originali estranei esclusi.
6. Tutto resta locale; PDF non cifrato, nessun originale incorporato, nessun dato reale di test pubblicato.

## Test
Il test `dev/test_400_technical_pdf.cjs` verifica in modo sintetico contesto anagrafico, campi obbligatori, materiali CAD, controllo tecnico, origine dei dati, collegamenti incoerenti e isolamento tra sedi/clienti, oltre ai test PDF esistenti. La regressione CI deve essere confermata dopo il commit.

## Limiti
I PDF sono schede preparatorie, **non riproduzioni ufficiali dei modelli ministeriali o normativi**. Mancano modelli ufficiali verificati, firme, prove normative, parità integrale con Windows 2.7.5 e collaudo Safari su iPad fisico. La versione operativa 3.0.74 non è stata modificata.
