# Milestone 20 — pacchetto tecnico con originali verificati (29/10/2026)

## Obiettivo
Passare da un fascicolo che elenca soltanto i riferimenti agli allegati a un **pacchetto locale effettivamente contenente gli originali tecnici**, senza fingere di generare i modelli ufficiali Di.Co., Di.Ri., GAS o POS.

## Funzionalità implementate
- Nella stessa scheda **Pratiche tecniche**, dopo aver filtrato un cliente specifico, pulsante **Pacchetto ZIP con originali verificati (non cifrato)**.
- Selezione delle pratiche già visualizzate e dei soli documenti originali esplicitamente collegati alle pratiche. Validazione dei collegamenti cliente, sede, impianto e documento prima della lettura.
- Lettura delle copie originali dall'archivio locale cifrato (senza rete); verifica integrale **SHA-256** di ogni file prima dell'esportazione. Se il file manca, è corrotto, ha un hash/ID incoerente o un PDF non ha intestazione valida, il pacchetto viene bloccato.
- ZIP contenente `FASCICOLO_BOZZA.html`, `REGISTRO_VERIFICHE.csv`, `PIANO_COMPLETAMENTO_BOZZA.html`, `ATTIVITA_DA_VERIFICARE.csv`, `manifest.json`, `LEGGIMI_PRIMA.txt` e gli originali nella sottocartella `ORIGINALI/`.
- `manifest.json`: riferimenti a pratica e documento, nomi originali, percorso sicuro, dimensione e impronta SHA-256. Copie identiche riutilizzate una sola volta nel file ZIP. I nomi degli originali non vengono mai utilizzati come percorsi ZIP (protezione path traversal).
- Conferma esplicita prima dell'esportazione, pulsante disabilitato durante la preparazione, messaggio di esito. Nessun aggiornamento automatico del database, nessun cambio di stato o firma.
- Limiti: 30 documenti collegati, 15 MB per originale, 30 MB cumulativi di riferimenti, 60 MB ZIP; oltre questi limiti si interrompe in sicurezza.

## Sicurezza e limiti
Il file ZIP **non è cifrato**, come i precedenti HTML/CSV di stampa. Va custodito in una cartella protetta. Il programma non lo invia online, non lo pubblica su GitHub e non include documenti non collegati o di altri clienti. I test usano esclusivamente file PDF sintetici.

Questo pacchetto è una **bozza preparatoria**: non sostituisce il modello ufficiale, non compila né firma i moduli ministeriali o del distributore, non certifica prove e non equivale a un invio. La presenza di un originale è solo tracciata, non ne prova l'idoneità normativa.

## Test e verifica
- `node dev/test_400_original_bundle.cjs`: SHA-256, duplicati, file mancanti, PDF fittizio, limiti, manifest, isolamento cliente, sicurezza dei percorsi, immutabilità.
- `dev/test_400_structured_docs_browser.cjs`: esportazione ZIP con originale PDF sintetico da archivio locale, lettura con JSZip, controllo manifest, A4 e WebKit/Chromium.
- Test aggiunto alla regressione `.github/workflows/ite-4-regression.yml`.

## Da completare
Modelli originali e campi ufficiali Di.Co./Di.Ri./GAS, firme reali e autorizzazioni, controlli normativi e versioni, parità con Windows 2.7.5, stampa definitiva e prova su iPad Safari fisico. `main` 3.0.74 e i moduli Windows restano invariati.
