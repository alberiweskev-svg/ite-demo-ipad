# Milestone 13 — CAD metrico assistito, simboli, gruppi e distinta preliminare

29 ottobre 2026 — ramo isolato `sviluppo-4.0.0-base`

## Cosa è implementato

- Scala opzionale in **centimetri per unità grafica** (0,01–100), inseribile manualmente o calcolabile da un segmento di lunghezza reale conosciuta. Se non calibrata, le quote restano in unità grafiche. Scala, elementi e revisioni sono conservati nello stesso archivio cifrato con backup preventivo.
- **Aggancio agli estremi** di segmenti e simboli (raggio grafico di 18 unità), disattivabile; rimane la griglia da 10 unità. È un aiuto al disegno, non un rilievo automatico.
- Libreria di **9 simboli schematici**: presa, interruttore, quadro, lavabo, WC, radiatore, caldaia, split, valvola. Inserimento sul foglio, spostamento, rotazione a passi di 90°, colore e duplicazione.
- **Selezione multipla**, raggruppamento e separazione. Spostamento, duplicazione e colore di un elemento raggruppato si applicano all'intero gruppo. Rotazione e cancellazione restano per elemento, per evitare trasformazioni di gruppo non ancora collaudate.
- **Distinta indicativa** di simboli e quantità, lunghezze aggregate di muri e linee in metri solo quando è presente una scala; esportazione CSV. Le quantità non includono sfridi, giunti, accessori, diametri o costi. Non sono ordini materiali.
- Esportazione JSON schema 2 con scala e gruppi; importazione conservativa sia di schema 1 sia di schema 2. I disegni e le revisioni precedenti senza scala restano validi. Esportazione SVG con dicitura permanente di bozza.

## Persistenza e sicurezza

I dati restano in `ITECommerce.settings.cadDrawings` e nelle revisioni; `ITEHistory.create` precede la modifica. L'archivio resta cifrato e soggetto ai controlli di riferimenti cliente/sede/cantiere/impianto. Le esportazioni SVG, JSON e CSV **non sono cifrate**. Non sono stati inseriti documenti o anagrafiche reali. La versione 3.0.74 su `main` e il gestionale Windows 2.7.5 non sono stati modificati.

Backup Git preventivo: `backup/4.0-pre-cad-metrico-simboli-2026-10-29` (commit iniziale `c05cd7a`).

## Collaudo

`node --check ite-cad.js`, `node dev/test_400_cad.cjs` e `node dev/test_400_cad_advanced.cjs` verificano sintassi, geometria, scala, simboli, snap, gruppi, distinta, revisioni e compatibilità storica. `dev/test_400_cad_browser.cjs` è esteso per Chromium e WebKit: simbolo, scala, salvataggio cifrato con revisione, distinta CSV. L'esito effettivo è quello della pipeline GitHub Actions del commit finale; non va dichiarato superato prima della conclusione.

## Limiti e prossimo blocco

Questo **non è** un CAD professionale certificato e non riproduce ancora tutte le funzioni della 2.7.5. Mancano quotatura vincolata bidirezionale, snap a intersezioni/ortogonali, geometria calibrata verificata in cantiere, librerie dettagliate, distinta collegata al listino/magazzino, stampa tecnica impaginata, gestione gruppi avanzata e collaudo su iPad fisico. Il documento CAD e le quote restano bozze da verificare.
