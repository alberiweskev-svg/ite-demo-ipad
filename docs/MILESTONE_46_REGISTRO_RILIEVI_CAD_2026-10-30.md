# Milestone 46 — Registro rilievi ambienti CAD (30 ottobre 2026)

Integrato nell'editor CAD esistente: riepilogo numerato dei contorni, stato di validità, metri e metri quadrati soltanto con scala calibrata, totali limitati ai contorni validi, CSV scaricabile. Contorni aperti e auto-intersecanti esclusi dai totali. Avvertenza su sovrapposizioni e verifiche sul posto. Nessuna variazione di archivio, backup, versione 3.0.74 o moduli 2.7.5.

Test sintetici: `node --test tests/cad-room-report.test.cjs`. Il report non certifica la superficie catastale e non elimina il rischio di contorni sovrapposti.
