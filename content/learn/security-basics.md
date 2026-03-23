---
title: "Sicherheit verstehen"
description: "CORS, JWT und wie du deine App sicher machst, ohne Krypto-Experte zu sein."
category: "Sicherheit"
order: 4
---

## CORS – Der nervigste Fehler für Anfänger

Du baust ein neues Frontend (auf `localhost:3000`), versuchst Daten von deiner neuen API (auf `localhost:8000`) abzufragen, und der Browser blockt den Versuch komplett ab mit einer roten "CORS Policy" Fehlermeldung. Was ist passiert?

**CORS (Cross-Origin Resource Sharing)** ist ein Sicherheitsmechanismus in deinem Browser. 
Wenn dein Frontend auf `meine-app.com` liegt und versucht, Daten von `fremde-seite.com/api` zu laden, fragt der Browser zuerst `fremde-seite.com`: *"Hey, darf meine-app.com hier überhaupt Daten holen?"* Wenn die API dort nicht "Ja" sagt, wird der Blockiert. 

Das schützt Nutzer, aber beim Bauen ärgert es uns Entwickler.
**Die Lösung:** Du musst in deinem Backend-Code einstellen, dass dein Frontend-Port (z. B. `localhost:3000`) erlaubt ist.

## Wie "Einloggen" technisch funktioniert

Wenn du dich bei einer App anmeldest, merkst sich der Server, wer du bist. Meist geschieht das über eines von zwei Konzepten:

### 1. Sessions & Cookies (Der Klassiker)
Du loggst dich ein. Der Server erstellt einen Ausweis auf seinem eigenen Rechner (in der Datenbank) mit der Aufschrift: "ID 456 ist Anna". Er gibt dir die `ID 456` in Form eines **Cookies** mit. Jedes Mal, wenn du ab jetzt etwas klickst, schickt der Browser unauffällig dieses Cookie mit, und der Server weiß: "Ah, das ist Anna!"

### 2. JWT (JSON Web Tokens)
Du loggst dich ein. Der Server nimmt deine Daten (z.B. "Name: Anna"), berechnet mit einem streng geheimen Passwort eine kryptografische Signatur und schreibt das auf einen Ausweis. Der Server speichert *nichts*. Er gibt dir einfach den fertigen Token.
Wenn du später etwas abfragst, schickst du den Token mit. Der Server checkt kurz, ob die Signatur gültig ist – wenn ja, darfst du rein.

## Umgebungsvariablen (Environment Variables)

Wenn du APIs (wie z.B. Stripe für Zahlungen oder OpenAI für KI) nutzt, kriegst du einen geheimen API-Key. 
**Dieser Key darf niemals in deinem Frontend-Code landen!** Wenn er dort ist, kann ihn jeder Besucher deiner Website über die Entwickler-Tools (F12) klauen.

**Die Lösung:** `.env` Dateien.
*   Frontend-Umgebungsvariablen beginnen bei Next.js mit `NEXT_PUBLIC_...` (diese sind sicher für den Browser).
*   Alle anderen (wie ein Datenbank-Passwort) sind "secret", laufen nur auf dem Backend/Server und bleiben im `.env` versteckt.
