# Claude Code Prompt: Venator Dashboard Prototyp

📋 **Kontext & Ziel:**
Du bist ein erfahrener Frontend- und Full-Stack-Entwickler. Deine Aufgabe ist es, einen Prototyp für das "Venator Dashboard" zu bauen. Die Seite soll extrem nutzerfreundlich, "Start-First"-orientiert und visuell ansprechend sein (Inspiration: ChatGPT, Claude & OpusClip). 
Es soll vorerst **nur die Basic-Seite (MVP)** gebaut werden. Reale Graphen-Generierung oder Gamification können vorerst ausgelassen oder durch Platzhalter ersetzt werden.

Da du **Zugriff auf die Firebase-Datenbank** hast, nutze diese direkt, um Daten dynamisch abzurufen, zu speichern oder zu löschen.

---

## 🎨 UI/UX Bausteine & Layout

### 1. Das zentrale "Start-First" Layout (Hero)
Rücke die Erstellung eines neuen Projekts in die absolute Mitte des sichtbaren Bereichs.
*   **Der Hook:** Eine große, einladende Überschrift: *"Was möchtest du heute bauen, [Name]?"* (Den Namen dynamisch über Firebase Auth laden, falls vorhanden).
*   **Die Prompt-Box:** Ein großes, prominentes Eingabefeld in der Mitte. Es soll einen Glow-Effekt haben, wenn es im Fokus ist.
    *   *Placeholder:* "Beschreibe deine App-Idee (z.B. Ein Marktplatz für gebrauchte Fahrräder)..."
*   **Prompt-Starter (Vorlagen):** Direkt darunter 4 schicke Badges/Pills: `🛒 E-Commerce Plattform`, `📱 Social Media App MVP`, `🤖 KI-SaaS Wrapper`, `🏢 Internal Admin Dashboard`.
    *   *Interaktion:* Klickt der Nutzer auf ein Badge, füllt sich die Prompt-Box automatisch mit einem passenden Platzhaltertext.
    *   *Aktion:* Wird "Enter" gedrückt oder das Formular abgeschickt, soll ein neues Projekt-Dokument in Firebase angelegt werden und das Dashboard aktualisiert werden.

### 2. Die Sidebar (Historie & Kontext)
Die Projekt-Historie soll links am Rand liegen, um den Hauptbereich aufgeräumt zu halten.
*   **Navigation:** Einklappbare linke Sidebar (auf Mobile als Drawer).
*   **Gruppierte Zeitleiste:** Lade alle existierenden Projekte des Nutzers aus Firebase und grupiere sie visuell nach Zeit:
    *   Heute
    *   Letzte 7 Tage
    *   Letzter Monat
*   **Schnellsuche (UI):** Eine Suchleiste oben in der Sidebar (visuell, Suche nach Projektname oder Tech-Stack ("Supabase")).

### 3. Visuell reiche Projekt-Karten (Grid)
Unterhalb des Hero-Bereichs befindet sich ein Grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) mit den bestehenden Projekten des Nutzers.
*   **Mini-Graph Preview:** Integriere im oberen Bereich der Karte einen Platzhalter für ein Hintergrundbild (abstrakte SVG oder verschwommenes Vorschaubild).
*   **Tech-Stack Avatare:** Zeige die verwendeten Technologien des Projekts (aus Firebase geladen) als kleine Icons (z.B. React, Tailwind, Supabase) übereinanderlappend an, nicht nur als Text.
*   **Metriken & Status:** Nutze farbige Badges für den Status (z.B. `Grün: Abgeschlossen`, `Gelb: Entwurf`) und zeige kleine Metriken wie `Komponenten: 6`.
*   **Hover-Actions:** Beim Hovern über die Karte sollen Quick-Actions einblenden (z.B. "Graph öffnen" und "Löschen"). 
    *   *Aktion:* Ein Klick auf "Löschen" entfernt das Dokument direkt aus Firebase.

---

## ⚙️ Technische Anforderungen (Firebase Integration)

Bitte implementiere direkt die Firebase-Logik für diesen Basic-Prototyp:

1.  **Datanbank-Schema:** Erstelle eine saubere Typisierung/Struktur für die `projects`-Collection in Firestore (Felder wie z.B. `id`, `userId`, `title`, `prompt`, `createdAt`, `status`, `techStackArray`).
2.  **Laden (Read):** Binde einen Listener oder Fetch ein, um die Sidebar-Historie und das Projekt-Grid mit den echten Dokumenten zu befüllen. Lege dir zur Not ein paar Mock-Dokumente im Code an, lade sie 1x in Firebase hoch und lies sie dann aus.
3.  **Hinzufügen (Create):** Wenn ein neuer Prompt eingegeben wird, schreibe ihn mit Status "Entwurf" sofort als neues Dokument in die Datenbank.
4.  **Löschen (Delete):** Implementiere die Lösch-Logik für die Hover-Karten-Action.

**Stack & Styling:** Nutze das bestehende Frontend-Framework und TailwindCSS. Achte auf ein premium Feel (Border-Radius, softe Schatten, saubere Transitions). Beginne jetzt mit dem Code für das Layout und die Firebase-Hooks!
