# Milestone 33 — Verifica incrociata POS e report A4 (30 ottobre 2026)

## Integrazione
Nell'editor della pratica POS esistente, senza nuova pagina, compare **Verifica incrociata POS e report A4**. Riutilizza i cinque registri già presenti (personale, attrezzature, rischi, DPI, emergenze). Nessuna modifica automatica ai dati, nessun nuovo archivio.

## Implementato
- Controlli di presenza e completezza sui cinque registri, duplicati, formazione/abilitazioni da verificare, controlli attrezzature, misure preventive, protezioni collettive, emergenze e referenti.
- Matrice fase di rischio ↔ fase DPI con **corrispondenza testuale esatta normalizzata**; non inferisce idoneità dei DPI né relazioni tecniche non esplicite.
- Evidenza dei testi manuali preesistenti non interpretati, senza cancellarli.
- Report leggibile in app, CSV con protezione contro formule e HTML A4 con CSP restrittiva, escaping e dicitura **BOZZA NON FIRMATA**.
- Conferma prima di esportare file non cifrati. Nessuna chiamata di rete e nessuna firma o attestazione automatica.
- Utilizzo nella demo unica 4.0, con test sintetici Node e browser Chromium/WebKit; i risultati CI sono da verificare dopo il commit.

## Limiti
Non è un POS ufficiale o una valutazione dei rischi. Non sostituisce i modelli e il wizard Windows 2.7.5. Non attesta formazione, verifiche, sicurezza o conformità. Le corrispondenze fase/DPI sono soltanto testuali; testi liberi, allegati e normativa vanno controllati dall'operatore. Non è stato collaudato su iPad fisico.

## Protezione
Backup precedente: `backup/4.0-pre-pos-audit-2026-10-30-05` da `6f9e75e`. Nessuna modifica a `main` (3.0.74) o ai moduli Windows 2.7.5. Test solo sintetici, nessun documento reale pubblicato.
