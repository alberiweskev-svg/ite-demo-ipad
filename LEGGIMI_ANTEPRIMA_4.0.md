# I.T.E. Gestionale 4.0 — Anteprima di sviluppo

Questa è una **versione di prova separata** dalla versione 3.0.74 pubblicata. Non utilizzare dati reali dei clienti finché sicurezza, backup e recupero non saranno verificati per l'uso operativo.

## Avvio su Windows

1. Scarica l'archivio `ITE-4-development-preview` dalla sezione **Artifacts** della pagina del collaudo GitHub e decomprimilo in una cartella dedicata.
2. Se sul PC è installato **Python 3**, fai doppio clic su `AVVIA_ANTEPRIMA_WINDOWS.bat`.
3. Si apre il browser all'indirizzo `http://127.0.0.1:8765/`. Al primo avvio, crea la password dell'archivio di prova e conservala.
4. Per arrestare il server, chiudi la finestra nera del comando.

Se il browser si apre prima che il server sia pronto, attendi qualche secondo e aggiorna la pagina.

## Attenzione

- L'anteprima funziona **in locale**, non pubblica automaticamente dati su Internet. Il server Python è limitato all'indirizzo `127.0.0.1`.
- L'archivio di prova resta nel profilo del browser utilizzato. Non è condiviso automaticamente tra PC, browser o dispositivi.
- Non dimenticare la password: l'archivio cifrato non è recuperabile senza la password o un backup valido.
- Non aprire direttamente `index.html` con doppio clic: usa l'avviatore e l'indirizzo locale.
- Il file di avvio richiede Python 3. Non installa software né modifica la versione 3.0.74.
- Non usare il pacchetto di sviluppo per il lavoro definitivo prima del collaudo operativo.
