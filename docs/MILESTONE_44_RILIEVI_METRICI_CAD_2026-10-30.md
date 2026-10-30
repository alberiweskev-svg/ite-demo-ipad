# Milestone 44 — Rilievi metrici CAD (30 ottobre 2026)

## Implementato
- Perimetro e superficie dei rettangoli e dei circuiti di muri chiusi, espressi in metri e m² solo con scala impostata.
- Raggruppamento dei muri con estremi coincidenti; contorni aperti o ramificati segnalati e senza superficie.
- Riepilogo integrato nell'editor CAD esistente; disegni e storico salvati senza migrazioni.
- Test sintetici per contorni chiusi/aperti e scala mancante.

## Verifica
- Verificata sintassi JavaScript e prova diretta della geometria nel runtime isolato: stanza 4 × 3 m = 12 m² e 14 m; contorno aperto senza superficie.
- Test browser Chromium/WebKit e workflow GitHub non ancora verificati per questa milestone.
- Contorni auto-intersecanti non rilevati: le superfici sono **indicative**, da verificare sul posto; non costituiscono computo metrico ufficiale.

## Sicurezza e compatibilità
Backup ramo `backup/4.0-pre-cad-measurement-2026-10-30-16`. Nessun dato cliente usato. Nessuna modifica a `main` (3.0.74) né ai moduli Windows 2.7.5. `published=false`.
