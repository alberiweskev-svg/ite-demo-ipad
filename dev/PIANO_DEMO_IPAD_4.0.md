# Pubblicazione demo 4.0 per iPad — piano di rilascio isolato

## Vincoli obbligatori

- NON modificare il ramo `main` del repository `alberiweskev-svg/ite-demo-ipad`.
- NON cambiare la configurazione GitHub Pages di quel repository: ospita la demo 3.0.74.
- NON usare dati personali reali per i test della 4.0.
- Pubblicare esclusivamente il pacchetto `ITE-4-development-preview` che ha superato il workflow di regressione.
- La demo online su hosting pubblico non deve essere descritta come privata o accessibile solo agli autorizzati. La cifratura locale non equivale ad autenticazione al sito.

## Procedura prevista

1. Predisporre un repository GitHub **separato**, ad esempio `ite-4-demo-ipad`, oppure un servizio di hosting statico isolato.
2. Scaricare l'artifact `ITE-4-development-preview` da un run di regressione completato con esito `success`.
3. Pubblicare il contenuto della cartella estratta come sito statico nella destinazione separata. Non copiare cartelle `.github` o `dev`.
4. Verificare HTTPS, apertura in Safari su iPad, creazione archivio cifrato, blocco/sblocco, calendario, clienti sintetici, revisione intervento, allegati e ripristino.
5. Comunicare il link di prova solo dopo che risponde correttamente. Non dichiarare la 4.0 pronta per dati reali prima dei test operativi.

## Stato

Pacchetto di sviluppo e collaudi disponibili. **Nessun URL della demo iPad 4.0 ancora pubblicato o verificato.**
