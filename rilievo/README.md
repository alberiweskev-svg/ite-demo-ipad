# I.T.E. Rilievo e Progettazione — prototipo 0.2.0

**Ambiente di sviluppo separato.** Questo codice non è il Gestionale I.T.E. 4.0 e non va sostituito alle sue funzioni. È un prototipo da testare con dati fittizi.

## Funzioni implementate e sottoposte a test logici

- Ambienti rettangolari quotati, aggiunta e riposizionamento, nomi e quote modificabili.
- Inserimento e spostamento di lavabo, WC, bidet, doccia, collettore, colonna scarico, caldaia, radiatore, split, unità esterna e presa.
- Percorsi con proposta automatica ortogonale, tracciato manuale a punti e disegno libero convertito in segmenti tecnici.
- Dati delle linee: tipologia, diametro, materiale, quota, note, verifica, raccordi/accessori. Distinte quantità e metri di linee **planimetriche**.
- Import DXF ASCII con LINE e LWPOLYLINE; import SVG (line/rect/polyline/polygon); immagini raster calibrabili per larghezza; PDF allegato fino a 1 MB senza conversione vettoriale.
- Esportazione DXF di linee, SVG, CSV, backup e ripristino JSON; funzione di stampa PDF dipendente dal browser.
- Foto prima/durante/dopo e note; dettatura browser **solo dove supportata** e comandi testuali locali di base.
- Vista isometrica 3D **schematica** generata dalla pianta 2D.
- Revisione geometrica con ripristino, backup manuale JSON e salvataggio automatico in localStorage.

## Limiti noti

- Nessuna scansione 3D automatica con fotocamera/ARCore ancora attiva.
- Nessun riconoscimento automatico dei tubi e dei sanitari dalle fotografie.
- Nessun calcolo progettuale normativo/dimensionamento automatico: percorsi, diametri e lunghezze vanno verificati dal tecnico; in particolare mancano salite/discese non misurate, pendenze e ostacoli.
- Import/export DWG e IFC **non** implementati.
- Dati salvati soltanto nel browser/dispositivo in uso; niente sincronizzazione cloud o archiviazione protetta per cantieri reali.
- I PDF importati non vengono trasformati in planimetrie modificabili.
- Nessuna generazione automatica della Di.Co. professionale pronta alla firma.

## Verifica eseguita

`node rilievo/smoke-test.js` esegue test logici in un DOM simulato, senza dipendenze esterne: caricamento esempio, creazione/collegamento componenti, materiali, comandi testuali, parsing DXF, conversione linea libera, revisioni e round-trip DXF. Non sostituisce i test reali sull'interfaccia Samsung/iPad.

## Sviluppo successivo

1. Collaudo manuale dell'interfaccia mobile e salvaguardia dei dati di cantiere.
2. Import planimetrie più completo, calibrazione con riferimento noto e controllo geometrico delle stanze collegate.
3. Acquisizione con fotocamera (valutazione ARCore via componente Android/WebXR quando fattibile) e validazione metrologica con distanziometro.
4. Modello impiantistico 3D parametrico con routing automatico assistito, verifiche, fotografie di posa e disegno as-built.
5. Integrazione separata verso Gestionale I.T.E. 4.0, Di.Co./Diri, archivio materiali e preventivi, solo dopo collaudo e backup.