# Milestone 41 — CAD: editing geometrico avanzato integrato (30 ottobre 2026)

## Contesto e conservazione
Ramo esclusivo \`sviluppo-4.0.0-base\`. Backup Git **prima di qualsiasi modifica**: \`backup/4.0-pre-cad-advanced-editing-2026-10-30-13\`, base \`890f976a3f8232a35eeebc633c816dda6c9e84ea\`.
Nessuna modifica al ramo operativo \`main\` (3.0.74) o al pacchetto Windows 2.7.5. Non si modificano formati dati o schemi di persistenza; il salvataggio CAD continua con \`ITEHistory.create\`, revisione e archivio cifrato.

## Blocco funzionale
Nell'**editor CAD esistente**, non in una pagina isolata:
- Rotazione geometrica 90° di gruppi ed elementi: muri/linee/quote ruotano realmente sul foglio, non solo nel metadato. I gruppi ruotano attorno al proprio centro e, se necessario, vengono traslati senza accorciare la geometria per restare nel foglio. Le icone e le etichette ruotano anche visivamente.
- Ridimensionamento geometrico 50–200% attorno al centro della selezione; evita segmenti degeneri e trasformazioni fuori foglio. I simboli mantengono dimensione grafica costante: il fattore agisce sulle loro posizioni, non sulle icone.
- Eliminazione di gruppo completo distinta dall'eliminazione del singolo elemento, con conferma; ordine avanti/indietro di gruppo mantenendo l'ordine interno; duplicazione e colori del gruppo già esistenti conservati.
- Sostituzione di simbolo con altro simbolo del catalogo schematico; se il simbolo cambia viene **rimosso l'articolo di magazzino associato**, da ricollegare manualmente per evitare distinta o preventivo errati.
- Copia e incolla di gruppo/elemento **soltanto nella memoria volatile dell'editor CAD**, senza usare clipboard del sistema o rete; nuovi ID di elemento e di gruppo, offset di 20 unità. Appunti azzerati al cambio cliente, all'apertura di altro disegno e al comando Nuovo.
- Raggruppamento rifiutato se la selezione comprende solo parte di un gruppo preesistente; spostamenti e trasformazioni fuori foglio rifiutati senza deformare segmenti.
- Tutte le modifiche transitano per il meccanismo già esistente di **Annulla/Ripeti**, segnalazione bozza modificata e salvataggio con backup e revisione.

## Test e limiti
- Test unitari sintetici \`dev/test_400_cad_transform.cjs\` integrati nella regressione: rotazione, scala, clipboard, gruppi, ordine, sostituzione, limiti geometrici e immutabilità.
- Test browser CAD esteso per sostituzione, appunti interni, incolla e annulla su Chromium/WebKit nella pipeline.
- Esiti della build e della regressione **da verificare per il commit finale**. Safari su iPad fisico non collaudato.
- CAD sempre **bozza non certificata**; nessuna quotatura vincolata professionale, nessuna misura reale dedotta, nessuna firma o attestazione. Stampa e distinta restano indicative. Non equivale ancora al modulo Windows 2.7.5.

## Prossimi lavori
Confronto puntuale con funzioni 2.7.5, strumenti quota ortogonale e snap a intersezioni, libreria simboli completa, modelli ufficiali Di.Co./Di.Ri./GAS e collaudo su Safari fisico. Demo 4.0 separata con \`published=false\` fino a pubblicazione e verifica effettive.
