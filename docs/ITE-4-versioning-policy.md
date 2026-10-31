# Politica versioni I.T.E. 4.0

## Regola obbligatoria
Ogni rilascio del gestionale usa un'unica versione globale `MAJOR.MINOR.PATCH.BUILD`, con BUILD strettamente crescente rispetto al rilascio precedente della stessa serie. Esempio: 4.0.0.12 → 4.0.0.13. Nessuna versione può essere riutilizzata o pubblicata due volte.

## Procedura di rilascio
1. Leggere la versione dell'ultimo rilascio effettivo, non dedurla dal nome del ramo o dai commit.
2. Calcolare la successiva versione libera; impedire la pubblicazione se il numero è già presente.
3. Prima di qualsiasi migrazione o aggiornamento dati, creare un backup verificabile con data, versione di origine e checksum.
4. Registrare data/ora, commit, modifiche, esito test, compatibilità e istruzioni di ripristino nel changelog.
5. Pubblicare solo dopo test automatici, collaudo previsto e verifica di ripristino; mantenere il rilascio precedente disponibile.
6. Se la pubblicazione fallisce, non dichiarare la nuova versione rilasciata. Registrare il tentativo fallito e non riutilizzare un numero già assegnato a un rilascio pubblicato.

## Separazione ambienti
Il ramo `sviluppo-4.0.0-base` e la demo con dati fittizi non sono rilasci di produzione. La 3.0.74 resta isolata. Un commit GitHub o un artifact ZIP non costituiscono da soli una nuova versione installata nell'app.

## Stato
Questa è la specifica della regola: il controllo automatico della numerazione e il backup/ripristino operativo devono ancora essere implementati e verificati prima dei rilasci.
