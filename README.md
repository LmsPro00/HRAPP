# 🎯 HR Screening Manager - Leone Master School

Gestionale HR per lo screening automatico e il contatto dei candidati, integrato con Google Sheets e Typeform.

---

## 📋 Funzionalità

### ✅ Screening Automatico
- Lettura automatica delle risposte dal Google Sheet (aggiornamento in tempo reale)
- Definizione di prerequisiti/filtri personalizzabili
- Categorizzazione automatica in **3 gruppi**: Idonei, Non Idonei, Dubbi
- Punteggio pesato con soglie configurabili

### 📧 Automazione Email
- Invio automatico email ai candidati selezionati
- Template email personalizzabili con placeholder dinamici
- Link Calendly integrato per fissare appuntamenti
- Log di tutte le email inviate

### 📂 Gestione Multi-Posizione
- Sezioni separate per diverse figure professionali
- Ogni posizione ha i propri criteri di screening e template email
- Dashboard con statistiche per posizione

---

## 🚀 Setup Rapido (Cursor)

### 1. Apri il progetto in Cursor

```bash
# Dalla root del progetto
cd hr-screening-app
```

### 2. Installa le dipendenze

```bash
npm install
```

### 3. Configura le variabili d'ambiente

```bash
cp .env.example .env.local
```

Poi modifica `.env.local` con i tuoi dati (vedi sezione Configurazione sotto).

### 4. Avvia il server di sviluppo

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) nel browser.

---

## ⚙️ Configurazione Dettagliata

### Google Sheets API

Per connettere l'app al tuo Google Sheet serve un **Service Account**:

1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuovo progetto (o usane uno esistente)
3. Abilita la **Google Sheets API**:
   - Menu laterale → API e servizi → Libreria
   - Cerca "Google Sheets API" → Abilita
4. Crea un **Service Account**:
   - API e servizi → Credenziali → Crea credenziali → Account di servizio
   - Dai un nome (es. "hr-screening-app")
   - Clicca su "Fatto"
5. Genera la chiave JSON:
   - Clicca sull'account di servizio appena creato
   - Tab "Chiavi" → Aggiungi chiave → Crea nuova chiave → JSON
   - Scarica il file JSON
6. Dal file JSON, copia:
   - `client_email` → **GOOGLE_SERVICE_ACCOUNT_EMAIL** nel `.env.local`
   - `private_key` → **GOOGLE_PRIVATE_KEY** nel `.env.local`
7. **IMPORTANTE**: Condividi il Google Sheet con l'email del service account:
   - Apri il Google Sheet
   - Clicca "Condividi"
   - Aggiungi l'email del service account (es. `hr-app@progetto.iam.gserviceaccount.com`)
   - Dai permesso di "Visualizzatore"
8. Copia l'ID dello Sheet dall'URL:
   - `https://docs.google.com/spreadsheets/d/`**{QUESTO_E_L_ID}**`/edit`
   - Incollalo in **GOOGLE_SHEET_ID**

### Email SMTP (Gmail)

Per usare Gmail come server SMTP:

1. Vai su [Google Account Security](https://myaccount.google.com/security)
2. Attiva la **verifica in due passaggi** (se non già attiva)
3. Vai su "Password per le app":
   - Seleziona "Posta" e "Altro"
   - Genera una password
4. Usa questa password come **SMTP_PASSWORD** nel `.env.local`

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tua-email@gmail.com
SMTP_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

### Calendly

Inserisci il tuo link Calendly personale o del team:

```env
CALENDLY_LINK=https://calendly.com/tuo-link-personale
```

---

## 📖 Guida all'Uso

### Dashboard Candidati
- I candidati vengono caricati in tempo reale dal Google Sheet
- Lo screening automatico li categorizza in base ai criteri impostati
- Usa i filtri e la ricerca per trovare candidati specifici
- Espandi un candidato per vedere tutti i dettagli e il risultato dello screening

### Screening Personalizzato
- Vai al tab **Criteri Screening**
- Aggiungi, modifica o rimuovi filtri
- Per ogni filtro puoi impostare:
  - **Campo**: quale dato del candidato valutare
  - **Operatore**: come confrontare (uguale, diverso, contiene, vero/falso)
  - **Peso**: importanza del filtro (1-10)
  - **Obbligatorio**: se mancante, il candidato è automaticamente "Non Idoneo"
- Imposta le soglie percentuali per Idoneo e Dubbio

### Invio Email
- Seleziona i candidati desiderati con le checkbox
- Clicca "Invia Email" per inviare l'invito con il link Calendly
- Personalizza il template nel tab **Email Templates**
- Usa i placeholder per contenuto dinamico ({{nome}}, {{posizione}}, ecc.)

### Override Manuale
- Espandi un candidato e usa i pulsanti di azione manuale
- Puoi sovrascrivere lo status automatico in qualsiasi momento

---

## 🏗️ Struttura del Progetto

```
hr-screening-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── candidates/route.ts    # API candidati
│   │   │   ├── screening/route.ts     # API criteri screening
│   │   │   ├── email/route.ts         # API email e template
│   │   │   ├── positions/route.ts     # API posizioni
│   │   │   └── settings/route.ts      # API impostazioni
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx                   # Dashboard principale
│   ├── lib/
│   │   ├── google-sheets.ts           # Integrazione Google Sheets
│   │   ├── screening-engine.ts        # Motore di screening
│   │   ├── email-service.ts           # Servizio invio email
│   │   ├── storage.ts                 # Persistenza dati (JSON)
│   │   └── utils.ts                   # Utility functions
│   └── types/
│       └── index.ts                   # TypeScript types
├── data/                              # Dati persistiti (auto-generato)
├── .env.example                       # Template variabili d'ambiente
├── .env.local                         # ← DA CREARE (le tue credenziali)
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

---

## 🔧 Tech Stack

| Tecnologia | Uso |
|---|---|
| **Next.js 14** | Framework fullstack (App Router) |
| **TypeScript** | Type safety |
| **TailwindCSS** | Styling |
| **Google Sheets API** | Lettura dati candidati |
| **Nodemailer** | Invio email SMTP |
| **JSON Storage** | Persistenza configurazioni |

---

## 📝 Note Importanti

- I dati dei candidati vengono **sempre** letti in tempo reale dal Google Sheet (non vengono copiati)
- Le configurazioni (filtri, template, posizioni) vengono salvate in file JSON nella cartella `data/`
- Gli override manuali dello status sono persistiti localmente
- Per la produzione, considera di deployare su Vercel o simili
- Il progetto è ottimizzato per funzionare in locale con Cursor

---

## 🐛 Troubleshooting

**"Impossibile leggere il Google Sheet"**
- Verifica che il Google Sheet sia condiviso con il service account
- Controlla che GOOGLE_SHEET_ID e GOOGLE_SHEET_NAME siano corretti

**"Errore invio email"**
- Per Gmail: assicurati di usare una "Password per le app" (non la password normale)
- Verifica SMTP_HOST e SMTP_PORT

**Candidati non vengono caricati**
- Vai su Impostazioni → Testa Connessione Sheets
- Verifica che le colonne nel sheet corrispondano alla mappatura
