# I.T.E. 4.0 — Verifica parità moduli 2.7.5 (1 novembre 2026)

**Stato:** checklist di collaudo, NON certificazione di parità funzionale. Il codice originale 2.7.5 deve essere confrontato con i moduli web, schermata per schermata e campo per campo. Non sostituire i programmi 2.7.5.

## CAD: priorità assoluta
Il repository 4.0 contiene già `ite-cad.js` e `ite-cad-workflow.js`, con API per `wall`, `line`, `rect`, `dimension`, `label`, `symbol`, snapping, ortogonalità, trasformazioni, salvataggio locale e storico. **Questo non prova che la demo aperta su iPad presenti tali strumenti:** la demo di collaudo esterna può essere diversa dal ramo GitHub. Verificare provenienza URL, commit pubblicato e caricamento degli script prima di dichiarare risolto il problema della «sola matita».

Collaudo manuale obbligatorio su Safari/iPad: muro punto-punto con quota durante il tracciamento; linee dritte; selezione e modifica; ridimensiona; ruota; sostituisci; cancella; duplica; copia/incolla; raggruppa/separa; ordine; quote; snap estremi/intersezioni; undo/redo; salvataggio e riapertura; stampa A4. Verificare trascinamento touch e ridimensionamento viewport. Eseguire `node test-cad-precision-regression.js` per i controlli geometrici automatizzati.

## Di.Co. / Di.Ri.
Recuperare il sorgente 2.7.5 e costruire matrice campo-per-campo: intestazione; committente; ubicazione; impresa; responsabile tecnico; tipologia impianto; descrizione; riferimenti normativi; allegati obbligatori/facoltativi; materiali; prove; firme; progressivo/data; import PDF con riconoscimento dei campi; salvataggio, riapertura, rigenerazione e stampa. Non presentare la maschera sintetica come equivalente alla 2.7.5.

## POS
Confrontare i 12 blocchi della procedura originale, avanti/indietro, attrezzature, professionisti separati, ricerca, firma, import POS esistente, filigrana I.T.E., esportazione/stampa.

## Allegati GAS
Confrontare tutte le sezioni del 2.7.5, i dati impianto, le schede tecniche, la navigazione, l'archiviazione e la stampa.

## Criteri di rilascio
1. Backup del ramo prima di ogni milestone; dati fittizi nei test.
2. Test Node realmente eseguiti e registrati; esiti GitHub Actions verificati.
3. Collegamento unico della demo pubblicato solo dopo verifica URL e commit.
4. Nessun dato cliente reale in GitHub o demo pubblica.
5. Versione operativa 3.0.74 invariata.
6. Ogni funzione deve essere dimostrata sul dispositivo, non solo presente nel codice.

**Blocco aperto:** senza accesso verificato ai sorgenti completi 2.7.5 non si può attestare equivalenza dei moduli. Non inferire il contenuto della versione desktop da screenshot parziali.
