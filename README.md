# 🎵✨ Vinco Eventi — Capstone Project

> **Piattaforma Web Full-Stack per la Gestione di Eventi, Musica dal Vivo, Spettacoli e Preventivi Personalizzati**  
> *Realizzato da Antonio Schettini per Vincenzo Colaluca (Vinco Eventi)*

---

## 📸 Anteprima & Visione del Progetto

**Vinco Eventi** è un'applicazione web moderna e performante progettata per offrire un'esperienza visiva ed interattiva di altissimo livello nel settore dell'intrattenimento musicale per **matrimoni, feste private ed eventi aziendali**.

L'applicativo unisce un **frontend raffinato ed elegante** in React a un **backend robusto e sicuro** in Spring Boot, offrendo sia un'esperienza utente immersiva per i clienti sia un'area riservata completa per la gestione amministrativa (CRUD) delle richieste di preventivo, dei pacchetti offerti e della galleria multimediale.

---

## 🌟 Funzionalità Principali (Lato Utente 👤)

### 🎼 1. Esplorazione Servizi & Pacchetti Musica
- **Pacchetti Trasparenti & Dettagliati:** Visualizzazione dei pacchetti di intrattenimento (*BASIC BOX, PLUS BOX, FULL BOX, SPECIAL BOX*) con dettagli sui servizi inclusi (Service Audio/Luci, DJ Set, Sax Live, Band Completa).
- **Player Musicale Integrato:** Ascolto in tempo reale dei brani musicali demo e remix ufficiali firmati *Vincenzo Colaluca*, con controlli play/pause e visualizzatore di traccia.

### 🖼️ 2. Galleria Multimediale Dinamica (Foto & Video)
- **Filtri Categoria:** Filtraggio immediato per *Tutti i Media, Matrimoni, Eventi Aziendali, Feste Private, Live Performance*.
- **Media Modal Interattivo:** Ingrandimento a tutto schermo per foto e video con navigazione mediante frecce o tastiera.
- **Audio/Video Smart Management:** Silenziamento/pausa automatica dell'audio di sottofondo quando l'utente riproduce un video nella galleria, e ripresa automatica alla chiusura della modale.

### 📝 3. Form Richiesta Preventivo Intelligente
- **Campi Dettagliati:** Selezione della tipologia di evento, data futura, momento della giornata (Pranzo/Cena), tipo di cerimonia, numero ospiti e fascia di budget.
- **Validazioni Avanzate:** 
  - Controllo in tempo reale sul formato del luogo (richiesta di Luogo e Località separati da virgola, es. *Masseria Coccaro, Monopoli*).
  - Selettore di prefisso telefonico mondiale con **bandiera del paese e ricerca istantanea**.
- **Invio Notifiche Email Automatiche:** Invio di 2 email trasparenti (notifica al team *Vinco Eventi* e conferma immediata al cliente).
- **Modale Scelta Email (`EmailChoiceModal`):** Permette all'utente di inviare la richiesta tramite il proprio client preferito (App di posta predefinita, Gmail Web, Outlook Web, o copia rapida negli appunti).

### 🌐 4. Supporto Multilingua Sincronizzato (IT / EN)
- Switcher della lingua istantaneo (Italiano 🇮🇹 / Inglese 🇬🇧) con traduzione completa di tutte le pagine, form, modali ed avvisi senza ricaricare la pagina.

---

## 🔐 Funzionalità Riservate (Lato Admin 🛡️)

### 📊 1. Dashboard Amministrativa Preventivi (`AdminQuotes`)
- **Visualizzazione KPI & Statistiche:** Contatori in tempo reale delle pratiche *Totali, Da Leggere (Pending), Lette (Read) e Lavorate (Processed)*.
- **Filtri & Ricerca Live:** Ricerca istantanea per nome cliente, email, telefono, luogo o tipo evento.
- **Gestione Stato Pratiche:** Aggiornamento rapido dello stato e possibilità di eliminazione/archiviazione.
- **Traduzione Automatica dei Messaggi (AI / MyMemory API):** Pulsante di traduzione automatica in tempo reale per le richieste ricevute in lingua straniera.

### 🖼️ 2. Gestione CRUD Galleria & Servizi
- **Upload Diretto su Cloudinary:** Caricamento di immagini e video direttamente sul cloud storage ottimizzato.
- **Aggiunta, Modifica ed Eliminazione:** Modifica immediata dei contenuti mostrati sul sito con aggiornamento del database PostgreSQL.

---

## 📖 Documentazione API & Specifiche OpenAPI 3.0 (Swagger Docs 📘)

Base URL: `http://localhost:8080` *(Sviluppo)* | `https://api.vincoeventi.com` *(Produzione)*  
Autenticazione: **Bearer JWT** su header `Authorization: Bearer <token>` per tutte le rotte `/api/admin/**`.

### 🔓 1. Autenticazione (`/api/auth`)

#### `POST /api/auth/login`
- **Descrizione:** Autentica un utente amministratore e restituisce il token JWT.
- **Accesso:** Pubblico (protetto da blocco Brute-Force dopo 5 tentativi).
- **Request Body (`application/json`):**
  ```json
  {
    "email": "vincoeventi@gmail.com",
    "password": "PasswordAdminSicura123!"
  }
  ```
- **Response 200 OK:**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "email": "vincoeventi@gmail.com",
    "role": "ROLE_ADMIN"
  }
  ```
- **Errori:** `401 Unauthorized` *(Credenziali errate)*, `429 Too Many Requests` *(Account bloccato per 15 min)*.

---

### 📩 2. Preventivi & Richieste (`/api/quotes` & `/api/admin/quotes`)

#### `POST /api/quotes`
- **Descrizione:** Invia una nuova richiesta di preventivo da parte di un cliente.
- **Accesso:** Pubblico.
- **Request Body (`application/json`):**
  ```json
  {
    "nome": "Mario",
    "cognome": "Rossi",
    "email": "mario.rossi@example.com",
    "telefono": "+39 3331234567",
    "dataEvento": "2026-09-15",
    "tipoEvento": "Matrimonio",
    "location": "Masseria Coccaro, Monopoli",
    "numeroOspiti": "120",
    "orarioGiornata": "Cena",
    "tipoCerimonia": "Civile / Simbolico",
    "messaggio": "Vorremmo un intrattenimento con DJ Set e Sax Live per l'aperitivo.",
    "budget": "3.000€-5.000€",
    "lingua": "it"
  }
  ```
- **Response 201 Created:** Oggetto `QuoteRequest` salvato a DB. Dispatta 2 notifiche email asincrone.

#### `GET /api/admin/quotes`
- **Descrizione:** Recupera l'elenco di tutte le richieste di preventivo.
- **Accesso:** Riservato Admin (`Bearer JWT`).
- **Query Params:** `status` *(Opzionale: `PENDING`, `READ`, `PROCESSED`)*.
- **Response 200 OK:** Lista ordinata per data di richiesta decrescente.

#### `PUT /api/admin/quotes/{id}/status`
- **Descrizione:** Aggiorna lo stato di una pratica preventivo.
- **Accesso:** Riservato Admin (`Bearer JWT`).
- **Request Body (`application/json`):** `{"stato": "PROCESSED"}`
- **Response 200 OK:** Oggetto `QuoteRequest` aggiornato.

#### `DELETE /api/admin/quotes/{id}`
- **Descrizione:** Elimina una richiesta di preventivo dal database.
- **Accesso:** Riservato Admin (`Bearer JWT`).
- **Response 204 No Content**.

#### `POST /api/admin/quotes/translate`
- **Descrizione:** Traduce il messaggio di una richiesta inoltrata in lingua straniera.
- **Accesso:** Riservato Admin (`Bearer JWT`).
- **Request Body (`application/json`):**
  ```json
  {
    "text": "We would love to book a wedding DJ set for September.",
    "sourceLang": "en",
    "targetLang": "it"
  }
  ```
- **Response 200 OK:** `{"translatedText": "Ci piacerebbe prenotare un DJ set per il matrimonio a settembre."}`

---

### 🎺 3. Servizi Offered (`/api/services` & `/api/admin/services`)

#### `GET /api/services`
- **Descrizione:** Recupera l'elenco pubblico dei pacchetti e servizi offerti.
- **Accesso:** Pubblico.
- **Response 200 OK:** Lista di `ServiceEntity`.

#### `POST /api/admin/services`
- **Descrizione:** Crea un nuovo pacchetto servizio.
- **Accesso:** Riservato Admin (`Bearer JWT`).
- **Request Body (`application/json`):** `ServiceDTO`
- **Response 201 Created**.

#### `POST /api/admin/services/upload-image`
- **Descrizione:** Carica la copertina di un servizio su Cloudinary.
- **Accesso:** Riservato Admin (`Bearer JWT`).
- **Content-Type:** `multipart/form-data` *(campo: `file`)*.
- **Response 200 OK:** `{"url": "https://res.cloudinary.com/.../image.jpg"}`

---

### 🖼️ 4. Galleria Multimediale (`/api/gallery` & `/api/admin/gallery`)

#### `GET /api/gallery`
- **Descrizione:** Recupera tutti gli elementi multimediali (foto e video) della galleria.
- **Accesso:** Pubblico.
- **Response 200 OK:** Lista di `GalleryItem`.

#### `POST /api/admin/gallery`
- **Descrizione:** Aggiunge un nuovo elemento alla galleria.
- **Accesso:** Riservato Admin (`Bearer JWT`).
- **Request Body (`application/json`):** `GalleryDTO`
- **Response 201 Created**.

#### `POST /api/admin/gallery/upload-media`
- **Descrizione:** Carica una foto o video della galleria su Cloudinary con estrazione metadata.
- **Accesso:** Riservato Admin (`Bearer JWT`).
- **Content-Type:** `multipart/form-data` *(campo: `file`)*.
- **Response 200 OK:**
  ```json
  {
    "url": "https://res.cloudinary.com/.../video.mp4",
    "public_id": "vinco_gallery/12345",
    "resource_type": "video"
  }
  ```

---

## ⚙️ Architettura Tecnologica & Stack (Lato Sviluppatore 💻)

```
                       +-----------------------------------+
                       |    CLIENT UTENTE / ADMIN (React)  |
                       +-----------------------------------+
                                         |
                                  HTTPS  | JWT Bearer Token
                                         v
                       +-----------------------------------+
                       |    BACKEND SERVER (Spring Boot)   |
                       +-----------------------------------+
                         /               |               \
                        /                |                \
                       v                 v                 v
            +--------------------+ +-----------+ +--------------------+
            | PostgreSQL Database| | Cloudinary| | MyMemory API (i18n)|
            +--------------------+ +-----------+ +--------------------+
```

### 🎨 Frontend Stack
- **Framework:** React 19 + Vite (Build ultra-rapida e modulare)
- **State Management:** Redux Toolkit (`authSlice`, `audioSlice`, `uiSlice`)
- **Stili & UI Components:** React Bootstrap, Bootstrap 5, Vanilla CSS tokenizzato con supporto Light/Dark Mode.
- **Icone & Typography:** Bootstrap Icons, Google Fonts (*Outfit*, *Cinzel*, *Montserrat*).
- **Client HTTP Centralizzato:** `apiClient.js` per il parsing degli errori backend e l'auto-logout su token JWT scaduto (HTTP 401).

### 🛠️ Backend Stack
- **Linguaggio & Framework:** Java 25 + Spring Boot 4
- **Sicurezza:** Spring Security 6 (Autenticazione Stateless JWT + BCrypt Password Encoding)
- **Persistenza Dati:** Spring Data JPA + Hibernate 7 + PostgreSQL
- **Storage Mediale:** Cloudinary Java SDK (Upload con estrazione automatica dei metadata per immagini e video)
- **Invio Email:** JavaMailSender con SMTP Gmail e modelli HTML personalizzati
- **Integrazioni Esterne:** RestTemplate per la traduzione automatica tramite MyMemory API

---

## 🛡️ Best Practices & Pattern Adottati

1. **Nessun Placeholder (Regola di Progetto `AGENTS.md`):**  
   Tutti i testi, i dati, le immagini e le descrizioni presenti nel sistema sono reali, veritieri e definitivi per la produzione.
2. **Gestione Centralizzata degli Errori:**  
   - Backend: `@RestControllerAdvice` con `GlobalExceptionHandler` che converte le eccezioni in risposte JSON standardizzate (`ErrorPayload`).
   - Frontend: Classe personalizzata `ApiError` e componente `ErrorBanner` per notificare l'utente senza bloccare l'interfaccia.
3. **Protezione Brute-Force:**  
   `LoginAttemptService` registra i tentativi di accesso errati e blocca l'IP/Account per 15 minuti al raggiungimento del 5° tentativo fallito.
4. **Sicurezza Stateless & CORS Dinamico:**  
   - Header `Authorization: Bearer <token>` richiesto su tutte le rotte `/api/admin/**`.
   - Origini CORS configurabili via variabile d'ambiente (`CORS_ALLOWED_ORIGINS`).
5. **Codice Pulito & Validato:**  
   - **0 Errori / 0 Warning ESLint** sul frontend.
   - **100% Test di Compilazione e Test Unitari superati** nel backend.

---

## 📂 Struttura del Progetto

```
Vinco Eventi Capstone/
├── backend/                             # Applicazione Spring Boot Java
│   ├── src/main/java/antonioschettini/backend/
│   │   ├── configuration/               # Configurazione Cloudinary e Async
│   │   ├── controllers/                 # Rest Controllers (Admin & Public)
│   │   ├── entities/                    # Entità JPA (User, QuoteRequest, ServiceEntity, GalleryItem)
│   │   ├── enums/                       # Enum (Role, QuoteStatus, MediaType)
│   │   ├── exceptions/                  # GlobalExceptionHandler ed Eccezioni Custom
│   │   ├── recordsDTO/                  # Record Java DTO per richiesta/risposta
│   │   ├── repositories/                # Repository Spring Data JPA
│   │   ├── security/                    # JWTFilter, JWTTools, SecurityConfig
│   │   └── services/                    # Logic di business (Auth, Email, Cloudinary, Translation, Quote)
│   └── src/main/resources/
│       ├── application.properties       # Proprietà di configurazione Spring
│       └── templates/                   # Modelli Email HTML
│
└── frontend/                            # Applicazione React Vite
    ├── src/
    │   ├── assets/                      # Immagini, Loghi e File Audio MP3
    │   ├── components/                  # Componenti Reutilizzabili (ContactForm, EmailModal, GallerySection, Navbar, Footer...)
    │   ├── config/                      # Configurazione API centralizzata
    │   ├── data/                        # Dati locali sincronizzati
    │   ├── pages/                       # Pagine principali (Home, About, Services, Gallery, AdminQuotes, AdminLogin)
    │   ├── redux/                       # Redux Store e Slices (auth, audio, ui)
    │   └── utils/                       # Client HTTPApiClient, Cloudinary Helpers, Translations (i18n)
    └── index.html                       # Entry point HTML5
```

---

## 🚀 Guida all'Installazione e Avvio Locale

### 📋 Prerequisiti
- **Java JDK 21 / 25**
- **Node.js v18+** e `npm`
- **PostgreSQL Database** (attivo in locale o su server remoto)

---

### 🖥️ 1. Configurazione ed Avvio Backend (Spring Boot)

1. **Clona il repository ed entra nella cartella backend:**
   ```bash
   cd backend
   ```

2. **Crea il file `env.properties` nella cartella `backend/`:**
   ```properties
   PORT=8080
   DB_URL=jdbc:postgresql://localhost:5432/vincoeventi
   DB_USERNAME=postgres
   DB_PASSWORD=il_tuo_password
   JWT_SECRET=una_chiave_segreta_molto_lunga_e_sicura_per_il_jwt
   CLOUDINARY_NAME=tuo_cloud_name
   CLOUDINARY_API_KEY=tua_api_key
   CLOUDINARY_SECRET=tuo_api_secret
   MAIL_HOST=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USERNAME=vincoeventi@gmail.com
   MAIL_PASSWORD=tua_password_app_gmail
   CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
   ADMIN_PASSWORD=PasswordAdminSicura123!
   ```

3. **Compila ed avvia il server:**
   ```bash
   ./mvnw clean compile
   ./mvnw spring-boot:run
   ```
   *Il server si avvierà su `http://localhost:8080`.*

4. **Esegui i test unitari:**
   ```bash
   ./mvnw clean test
   ```

---

### 💻 2. Configurazione ed Avvio Frontend (React Vite)

1. **Entra nella cartella frontend ed installa le dipendenze:**
   ```bash
   cd frontend
   npm install
   ```

2. **Avvia il server di sviluppo:**
   ```bash
   npm run dev
   ```
   *L'applicazione sarà accessibile su `http://localhost:5173`.*

3. **Esegui il Linter ed la Build di Produzione:**
   ```bash
   npx eslint src
   npm run build
   ```

---

## 🏷️ Crediti & Autore

- **Sviluppatore:** Antonio Schettini  
- **Progetto:** Epicode Capstone Project  
- **Cliente / Brand:** Vincenzo Colaluca — *Vinco Eventi* 🎷🎵  

---

## 🌍 Deploy in Produzione

- **Frontend:** Vercel — [vinco-eventi-capstone.vercel.app](https://vinco-eventi-capstone.vercel.app)  
- **Backend:** Railway / Render  
- **Dominio Personalizzato:** `www.vincoeventi.com` *(collegamento da WordPress in fase di configurazione)*  
- **CORS:** Configurato per `*.vercel.app`, `vincoeventi.com`, `www.vincoeventi.com`  

---
*Pronto per il deploy online in produzione!* 🚀✨
