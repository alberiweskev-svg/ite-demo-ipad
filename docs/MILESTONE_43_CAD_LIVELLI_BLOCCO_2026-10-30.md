# Milestone 43 — Livelli CAD e protezione editing (30 ottobre 2026)

## Sicurezza e continuità
Backup preventivo `backup/4.0-pre-cad-layers-2026-10-30-15`, origine `30ad58f05b7421ae4d933418cf4329899ce754c3`. Modifiche solo su `sviluppo-4.0.0-base`; `main` (3.0.74) e Windows 2.7.5 intatti. Dati di test esclusivamente sintetici.

## Blocco integrato
- Sette livelli: architettura, idrico, riscaldamento, elettrico, climatizzazione, gas, quote e note.
- Assegnazione del livello al nuovo elemento e modifica del livello per gruppo; livello `arch` implicito per i disegni legacy senza migrazione.
- Blocco/sblocco di elementi e gruppi persistente in revisione e backup. Un membro bloccato impedisce alterazioni dell'intero gruppo, compresa cancellazione, rotazione, modifica catalogo e cambio livello.
- Nascondi/mostra livello **solo nell'editor**. Gli elementi nascosti sono esclusi da selezione e snap, ma non dai salvataggi, distinte e stampe; non vengono eliminati.
- Copia di un gruppo bloccato ammessa; le copie incollate sono sbloccate con nuovi ID, senza alterare gli originali.
- Riepilogo per livello di elementi, blocchi, simboli, lunghezze muri/linee (metri solo con scala dichiarata), esportazione CSV locale indicativa.
- Undo/redo, revisione, cifratura e backup esistenti rimangono il percorso obbligato di salvataggio.

## Verifiche e limiti
`dev/test_400_cad_layers.cjs` verifica gruppi, protezione, validazione, compatibilità legacy, report, revisione e immutabilità. Integrato nelle pipeline build e regressione; esito GitHub da controllare sul commit finale. Nessuna certificazione metrica, nessuna conversione automatica in preventivo. Collaudo Safari su iPad fisico non effettuato. `published=false` resta invariato.
