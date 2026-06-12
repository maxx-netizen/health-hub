# 🩺 Health Hub — jouw persoonlijke gezondheidshub

Alle data van je **Amazfit Helio strap**, **Amazfit-weegschaal** en **LARQ-fles** automatisch in één dashboard, met AI-inzichten, een AI-coach-chat en elke maandag een weekrapport in je mail.

**Hoe het werkt:**
```
Helio strap + weegschaal ──> Zepp app ──┐
LARQ-fles ──────────────────────────────┼──> Apple Health ──> Health Auto Export (push) ──> Health Hub
                                        ┘                                                    │
                                                              dashboard · AI-chat · wekelijkse mail
```

---

## Stap 1 — Accounts aanmaken (allemaal gratis tiers)

1. **Neon** (database): ga naar [neon.tech](https://neon.tech), maak een gratis project en kopieer de **connection string** (begint met `postgresql://`).
2. **Google AI Studio** (AI): ga naar [aistudio.google.com](https://aistudio.google.com), klik "Get API key" en maak een gratis key (`AIza...`). Gratis tier is ruim voldoende.
3. **Resend** (e-mail): ga naar [resend.com](https://resend.com), maak een gratis API-key (`re_...`).
4. **Vercel** (hosting): account op [vercel.com](https://vercel.com) (gratis Hobby-plan).

## Stap 2 — Deployen op Vercel

1. Zet deze map op GitHub (nieuwe repository, upload de bestanden — **niet** `node_modules`).
2. In Vercel: **Add New → Project → importeer je repo**.
3. Voeg bij **Environment Variables** alle variabelen uit `.env.example` toe:

| Variabele | Waarde |
|---|---|
| `DATABASE_URL` | je Neon connection string |
| `ACCESS_PASSWORD` | wachtwoord om in te loggen op je hub |
| `INGEST_SECRET` | lange willekeurige string (verzin zelf, bv. 30 tekens) |
| `GEMINI_API_KEY` | je Gemini API-key (aistudio.google.com, gratis) |
| `RESEND_API_KEY` | je Resend key |
| `EMAIL_TO` | maxxherder@gmail.com |
| `EMAIL_FROM` | `Health Hub <onboarding@resend.dev>` |
| `CRON_SECRET` | nog een lange willekeurige string |
| `APP_URL` | je Vercel-URL (na de eerste deploy invullen) |

4. Klik **Deploy**. De database-tabellen worden automatisch aangemaakt bij de eerste data-push.

> De wekelijkse mail draait elke **maandag 07:00 UTC** (09:00 NL-tijd in de zomer) via Vercel Cron — staat al ingesteld in `vercel.json`.

## Stap 3 — Automatische datakoppeling (iPhone)

1. Installeer **[Health Auto Export](https://apps.apple.com/app/id1115567069)** op je iPhone en geef toegang tot alle Health-data.
2. Maak een **Automation** aan:
   - Type: **REST API**
   - URL: `https://JOUW-APP.vercel.app/api/ingest?key=JOUW_INGEST_SECRET`
   - Format: **JSON**, Aggregate: **Days** (voor slaap: laat slaapdata als aparte metric meegaan)
   - Health Metrics: **selecteer alles** (slaap, HRV, hartslag, gewicht, vet%, stappen, water, workouts, …)
   - Schedule: **Automatic / elke sync**
3. Tik op **Manual Export** om je historie direct te versturen (kies bv. de laatste 90 dagen).

> Zorg dat de Zepp app en LARQ app naar Apple Health schrijven: Zepp → Profiel → Add accounts → Apple Health, en in de LARQ-app Apple Health-sync aanzetten.

## Stap 4 — Gebruiken

- **Dashboard**: open je Vercel-URL, log in met je `ACCESS_PASSWORD`. Wissel tussen 7/30/90 dagen.
- **AI-chat**: tabblad *AI-chat* — stel vragen als "Waarom is mijn HRV gedaald?" of "Wat is het verband tussen mijn slaap en waterinname?"
- **Weekmail testen**: open `https://JOUW-APP.vercel.app/api/cron/weekly?key=JOUW_CRON_SECRET` — je ontvangt direct het rapport.

## Lokaal draaien (optioneel)

```bash
npm install
cp .env.example .env   # vul je waarden in
npm run dev            # http://localhost:3000
```

## Problemen oplossen

- **Geen data op dashboard** → doe een Manual Export in Health Auto Export en check of de response `{"ok":true,...}` is.
- **Mail komt niet aan** → check spam; met `onboarding@resend.dev` als afzender kan Resend alleen mailen naar het e-mailadres van je eigen Resend-account. Verifieer eventueel een eigen domein in Resend.
- **Chat geeft fout** → controleer `GEMINI_API_KEY` (aistudio.google.com).
