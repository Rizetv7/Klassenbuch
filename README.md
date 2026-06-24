# 📖 Klassenbuch — Matura Memory Hub

Ein **soziales Sammelalbum für die Maturazeitung**. Die ganze Klasse trägt
Bilder, Zitate, Insider, Lehrer-Momente, Reisen, Memes, Sticker und Ideen
zusammen — sortiert, likebar, kommentierbar, gemeinsam kuratierbar.

> Die Seite **erstellt die Zeitung nicht selbst** und macht kein Layout/PDF.
> Sie ist die Sammel-, Sortier- und Kreativplattform davor: alles an einem Ort.

Verspielt wie ein Scrapbook, aber übersichtlich — keine Kachelwand, sondern
eine lebendige **Memory Wall** im Zentrum.

---

## Features

- **Zugang per Einladungs-Code** (z. B. `MATURA26`) + leichtgewichtiges Profil
  (Name, Profilbild, Spitzname). Optionales Passwort zur Wiederanmeldung auf
  neuen Geräten.
- **Memory Wall (Home):** Scrapbook-Collage aus Polaroids & Zitatkarten,
  Spotlight-Zitat, „Highlights der Woche“, Raum-Inseln, „Wer fehlt noch?“-
  Portrait-Fortschritt.
- **Matura Campus / Räume:** Klassenraum · Reisezimmer · Meme-Keller ·
  Redaktionsraum — bündeln die ~10 Kategorien in 4 ruhige Welten.
- **Beitragen (mehrstufig):** Typ → Bilder (Stapel-Upload, mehrere auf einmal)
  → Beschreibung & Kategorie → Personen & Tags → Sichtbarkeit. Bilder werden
  client-seitig verkleinert.
- **TikTok-Editor:** Text-Bubbles (weiss mit schwarzem Rand, einfarbig,
  Bubble-, Meme-, Handschrift-Stil …) und Sticker frei auf Bildern platzieren,
  drehen, skalieren. Overlays bleiben **editierbar** (Original unangetastet).
- **Sichtbarkeit pro Beitrag:** öffentlich mit Name · anonym · nur Redaktion.
- **Interaktion:** Likes, Emoji-Reaktionen, Kommentare (mit Antworten, anonym
  möglich), „Soll das ins Heft?“-Nominierung, Melden.
- **Sammlungen:** Beiträge bündeln (z. B. „Lehrer-Doppelseite“), öffentlich
  oder kollaborativ, mit Status-Labels (Favorit / fast sicher / braucht
  Kontext / zu privat?).
- **Profile** als Mini-Yearbook: beste Zitate, „typisch“-Tags, Über/Von.
- **Zeitstrahl** (1. Klasse … Abschlussjahr), **Suche & Filter** (Kategorie,
  Typ, Person, Tag, Event, Jahr), **Mitteilungen**.
- **Admin/Redaktion:** nichts muss freigegeben werden — alles ist sofort
  sichtbar. Admin kann löschen, anpinnen, Codes erstellen/sperren, gemeldete
  Beiträge sehen (inkl. Autor bei anonymen Posts).

---

## Schnellstart (lokal)

```bash
npm install
npm run dev
# http://localhost:3000
```

Beim ersten Start wird automatisch eine **Demo-Klasse** angelegt (Personen,
Zitate, Bilder, Sammlungen) unter `data/db.json`.

**Demo-Logins** (Tab auf der Join-Seite):
- Beitreten mit Code **`MATURA26`** + beliebigem Namen.
- Admin: Tab „Schon dabei?“ → Name **`Frau Redaktion`**, Passwort
  **`matura-admin`**.

> Zurücksetzen: `data/db.json` und `public/uploads/` löschen.

---

## Tech-Stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **Tailwind CSS v4** (Design-Tokens im CSS, Scrapbook-Theme)
- **lucide-react** Icons · **browser-image-compression** (Client-Resize)
- **bcryptjs** (Passwort-Hash) · **zod** (Validierung) · **nanoid** (IDs)
- Persistenz: **JSON-Datei-Store** (`src/lib/db.ts`) — pure JS, keine nativen
  Abhängigkeiten, läuft sofort lokal.

### Architektur

```
src/
  lib/          db (JSON store + seed), repo/collections (queries+rules),
                session (cookie auth), constants, utils, image client
  app/
    join/                 Einladungs-Code + Profil
    (main)/               geschützter Bereich (Shell mit Nav)
      page.tsx            Memory Wall
      explore, rooms/[room], timeline, post/[id],
      profile/[id], collections, upload, admin
    api/                  REST-Endpunkte (posts, react, comments, upload,
                          collections, notifications, auth, admin, avatar, ph)
  components/   PostCard, PostDetail, UploadFlow, ImageEditor, Shell, …
```

Sichtbarkeits- und Anonymitäts-Regeln leben zentral in
`src/lib/repo.ts` (`canView`, `toPostView`).

---

## Deployment (Free-Tier) — Hinweise

Lokal nutzt die App einen JSON-Datei-Store und speichert Bilder unter
`public/uploads`. Auf **serverless** Hostern (z. B. Vercel) ist das Dateisystem
**ephemer** und über mehrere Instanzen nicht geteilt. Für einen echten Deploy
zwei Stellen tauschen (beide bewusst gekapselt):

1. **Daten** → Postgres (Supabase/Neon, Gratis-Tier). Nur die internen
   Lese/Schreib-Funktionen in `src/lib/db.ts` ersetzen; die Repository-API
   (`repo.ts`, `collections.ts`) bleibt gleich.
2. **Bilder** → Object Storage (Supabase Storage / Cloudflare R2). Nur
   `src/app/api/upload/route.ts` anpassen.

Schriften werden per `<link>` von Google Fonts geladen (kein Build-Zeit-Fetch).
