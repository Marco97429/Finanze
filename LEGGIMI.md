# Le mie finanze: guida per la versione installabile (PWA)

Questa cartella contiene l'app pronta da pubblicare. Non serve installare nulla sul computer.

## 1. Pubblica la cartella su un sito statico con HTTPS
Qualsiasi servizio gratuito per siti statici va bene (per esempio GitHub Pages, Netlify o Cloudflare Pages: controlla le condizioni attuali di quello che scegli).
Carica TUTTO il contenuto della cartella `spese-pwa`, mantenendo le sottocartelle `icons` e `fonts`.
L'indirizzo deve iniziare con https:// (i servizi sopra lo fanno da soli).

## 2. (Facoltativo) Font Poppins
Segui le istruzioni nel file `fonts/LEGGIMI.txt`.

## 3. Installa l'app sul telefono
- **Android (Chrome):** apri l'indirizzo, menu a tre puntini, "Installa app" (o "Aggiungi a schermata Home").
- **iPhone (Safari):** apri l'indirizzo, tasto Condividi, "Aggiungi alla schermata Home".
Apri poi l'app dall'icona: da quel momento va a tutto schermo e funziona anche senza connessione.

## 4. Porta con te i dati che hai già inserito
I dati vivono nel browser del dispositivo, quindi nella nuova app si parte da zero.
1. Nella versione attuale, in fondo alla pagina: "Esporta backup", poi "Copia".
2. Incolla il testo in un posto sicuro (per esempio le note del telefono).
3. Nella nuova app, in fondo alla pagina: "Importa backup", incolla il testo e conferma.
Fai un backup ogni tanto: se si cancellano i dati del browser, i dati dell'app si perdono.

## 5. Aggiornare l'app
Quando cambi i file, apri `sw.js` e aumenta il numero di versione (per esempio da `finanze-v2` a `finanze-v3`), poi ricarica la cartella.

## Privacy: cosa garantisce questa versione
- I dati inseriti restano solo nella memoria del dispositivo. L'app non ha server, account, statistiche, cookie di tracciamento né collegamenti a servizi esterni.
- Il codice lo impedisce anche tecnicamente: nell'intestazione di `index.html` c'è una regola (Content-Security-Policy) che vieta qualsiasi connessione verso l'esterno, e `app.js` non contiene richieste di rete.
- Il sito che ospita i file vede soltanto che qualcuno ha scaricato l'app (come ogni sito), mai ciò che l'utente scrive.
- I file contengono solo il programma, senza spese o stipendi di nessuno. Non caricare mai sul sito un backup con dati personali.
- Resta fuori dal controllo dell'app ciò che fa il telefono: per esempio i backup di iCloud o Google possono includere i dati dell'app, secondo le impostazioni dell'utente. E un backup esportato è un file nelle mani di chi lo ha creato.
