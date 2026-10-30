# Milestone 45 — Validazione geometrica dei rilievi CAD (30 ottobre 2026)

## Modifiche
- Controllo delle intersezioni tra segmenti non adiacenti dei contorni chiusi.
- Esclusione di poligoni auto-intersecanti, bordi che si toccano impropriamente, segmenti degeneri e superfici nulle.
- I contorni concavi semplici restano ammessi; nessuna superficie viene inventata per i contorni non validi.
- Perimetri geometrici conservati anche quando la superficie non è calcolabile; conversione metrica solo con scala calibrata.
- Test sintetici aggiunti per bow-tie, contorno concavo e contatto non adiacente.

## Verifica e limiti
Il codice e i test sono salvati nel ramo di sviluppo. I test automatici e la regressione Chromium/WebKit **non risultano eseguiti in questa sessione**: accesso terminale a GitHub bloccato da DNS. Le modifiche devono essere validate con `node --test tests/cad-room-measurements.test.cjs` e la pipeline completa prima di dichiarare conclusa la milestone. Controllare anche la generazione delle impronte di integrità degli script.

Backup: `backup/4.0-pre-cad-polygon-validation-2026-10-30-17`.
Nessuna modifica alla versione operativa 3.0.74, ai moduli Windows 2.7.5 o allo stato `published=false`. Nessun dato cliente reale usato.
