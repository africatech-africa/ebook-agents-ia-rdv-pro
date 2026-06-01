# Changelog

Toutes les évolutions notables de RDV-Pro sont consignées ici.

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et le
projet suit le [versionnage sémantique](https://semver.org/lang/fr/). **Chaque
chapitre de l'ebook correspond à une version** : `v0.1.0` = fin du chapitre 1,
`v1.0.0` = fin du chapitre 12.

## [0.10.0] - Chapitre 10 — MCP : le standard pour brancher des outils

### Added

- Chapitre 10 (`ebook/10-mcp.md`) — architecture client/serveur,
  transports stdio vs HTTP/SSE, trois primitives (tools, resources,
  prompts), capabilities, négociation, le piège n°1 de
  `NODE_EXTRA_CA_CERTS` qui ne traverse pas le sandbox stdio.
- Serveur MCP `src/mcp/server.ts` — `McpServer` + `StdioServerTransport`,
  expose `get_slots` et `search_knowledge` en read-only. Aucun tool
  d'écriture (pas de `bookSlot` / `cancelBooking` sur MCP tant qu'il
  n'y a pas d'auth).
- Logique pure extraite dans `src/agents/logic/find-slots.ts` et
  `src/agents/logic/find-knowledge.ts` — framework-free, partagée
  entre les wrappers Vercel AI SDK et MCP.
- Client de probe `scripts/probe-mcp.ts` — spawn le serveur, liste
  les tools, appelle les deux, prouve que stdio + JSON-RPC + DB +
  embeddings marchent bout-en-bout.
- Scripts npm `mcp:server` et `mcp:probe`.

### Changed

- `src/agents/tools/get-slots.ts` et `src/agents/tools/search-knowledge.ts`
  deviennent de **fins wrappers** au-dessus des fonctions de logique
  pure — zéro duplication entre le tool Vercel et le tool MCP.

### Dependencies

- `@modelcontextprotocol/sdk@^1.29.0`.

## [0.9.0] - Chapitre 9 — Multi-agents : faire collaborer plusieurs IAs

### Added

- Chapitre 9 (`ebook/09-multi-agents.md`) — patron router +
  spécialistes, handoff implicite, sticky routing, supervisor en
  variation, garde-fous des couloirs (un tool dans un seul agent).
- Trois agents spécialisés :
  - `src/agents/booking-agent.ts` (getSlots, bookSlot,
    searchKnowledge).
  - `src/agents/support-agent.ts` (cancelBooking, searchKnowledge).
  - `src/agents/marketing-agent.ts` (searchKnowledge only).
- Router `src/agents/router.ts` — `generateObject` + Zod enum,
  Gemini Flash thinking-off à température 0.
- Nouveau tool d'écriture `src/agents/tools/cancel-booking.ts` —
  UPDATE sur (date, time, status='booked', client_name) avec
  RETURNING, puis `inngest.send('booking/cancelled')`.
- Événement Inngest typé `bookingCancelled` dans
  `src/inngest/events.ts` (symétrique de `bookingCreated`).

### Changed

- `src/routes/chat.ts` — appelle `routeIntent`, dispatche vers
  l'agent désigné, expose le choix dans l'en-tête `X-Agent`. La
  mémoire de conversation reste partagée entre agents.

## [0.8.0] - Chapitre 8 — Workflows vs agents autonomes

### Added

- Chapitre 8 (`ebook/08-workflows.md`) — agent vs workflow, événement
  pub/sub, `step.run` atomique, `step.sleepUntil` longue durée,
  retries automatiques, idempotence, quand NE PAS utiliser un
  workflow.
- Couche Inngest : client unique (`src/inngest/client.ts`), événement
  typé `bookingCreated` (`src/inngest/events.ts`), deux workflows :
  - `confirmBooking` (`src/inngest/functions/confirm-booking.ts`)
    fire immédiatement sur `booking/created`.
  - `remindBooking` (`src/inngest/functions/remind-booking.ts`)
    `sleepUntil` la veille à 18 h UTC, puis envoie le rappel.
- Mock de notification `src/lib/notify.ts` (`sendWhatsApp`) — sera
  remplacé par Twilio/WhatsApp Business en variation.

### Changed

- `src/index.ts` — monte le handler Inngest sur `/api/inngest` via
  `inngest/hono`.
- `src/agents/tools/book-slot.ts` — `await inngest.send` après la
  réservation réussie. Le tool ne sait rien des workflows ; il
  publie un événement.
- `.env.example` — variable `INNGEST_DEV=1` documentée (dev local).

### Dependencies

- `inngest@^4.4.0`.

## [0.7.0] - Chapitre 7 — RAG : connecter un agent à tes données

### Added

- Chapitre 7 (`ebook/07-rag.md`) — pourquoi un agent doit s'ancrer,
  chunks, embeddings, distance cosinus, `taskType`, retrieve-then-
  generate, pgvector et tour d'horizon des variations (reranking,
  hybrid search, chunking avancé).
- Corpus d'exemple `knowledge/{about,faq,policies,services}.md` —
  19 chunks couvrant services, prix, politiques, FAQ et infos
  pratiques du salon Élégance.
- Wrapper d'embeddings `src/lib/embeddings.ts` —
  `gemini-embedding-001` à 768 dimensions, avec `taskType` correct
  par cas d'usage (`RETRIEVAL_DOCUMENT` à l'ingestion,
  `RETRIEVAL_QUERY` à la recherche).
- Pipeline d'ingestion `src/db/seed-knowledge.ts` — découpage des
  markdowns par section H2, embed batché, insertion vectorielle.
- Tool RAG `src/agents/tools/search-knowledge.ts` — recherche
  cosine top-3 via pgvector, renvoie source + contenu + similarité.
- Schéma TypeScript idempotent `src/db/schema.ts` — remplace le
  `schema.sql` SQLite ; déclare la table `knowledge_chunks` avec
  `VECTOR(768)`.
- Script npm `seed:knowledge`.

### Changed

- **Migration SQLite → Postgres (Neon).** `src/db/client.ts` passe
  de `better-sqlite3` à `@neondatabase/serverless` (driver HTTP),
  `sql` devient une fonction tagged-template asynchrone.
- `src/db/messages.ts`, `src/db/seed.ts`, les tools `get-slots` et
  `book-slot` passent en async/await ; `book-slot` détecte la
  collision via `RETURNING id` au lieu de `.changes`.
- `src/routes/chat.ts` — branche `searchKnowledge`, durcit le
  system prompt pour interdire les réponses factuelles non
  sourcées, ajoute les `await` sur la couche DB.
- `.env.example` — `DATABASE_URL` ajoutée comme variable
  obligatoire à partir de ce chapitre.

### Removed

- `src/db/schema.sql` — remplacé par `src/db/schema.ts`.
- `better-sqlite3` et `@types/better-sqlite3` — désinstallés.

### Dependencies

- `@neondatabase/serverless@^1.1.0`.

## [0.6.0] - Chapitre 6 — La mémoire : faire qu'un agent se souvienne

### Added

- Chapitre 6 (`ebook/06-la-memoire.md`) — endpoint stateless,
  conversation ID, `messages` array, context window growth et
  stratégies de mémoire (fenêtre glissante, résumé glissant).
- Table SQL `messages` (`src/db/schema.sql`) avec index par
  conversation.
- Module `src/db/messages.ts` : `newConversationId`,
  `loadHistory`, `saveMessage`.

### Changed

- `src/routes/chat.ts` — accepte un `conversationId` optionnel,
  charge l'historique depuis la base, passe `messages: [...]` au
  SDK au lieu de `prompt`, renvoie l'identifiant dans l'en-tête
  `X-Conversation-Id`, persiste la réponse finale.
- `src/db/seed.ts` — drop des deux tables au reseed pour repartir
  propre.

## [0.5.0] - Chapitre 5 — Le pattern ReAct : ton premier vrai agent

### Added

- Chapitre 5 (`ebook/05-pattern-react.md`) — pattern ReAct,
  durcissement des tools en écriture, gestion de race condition au
  niveau SQL.
- Tool d'écriture `bookSlot(date, time, clientName)`
  (`src/agents/tools/book-slot.ts`), avec `UPDATE … WHERE
  status='free'` pour une écriture atomique anti-double-booking.

### Changed

- `src/routes/chat.ts` — branche `bookSlot`, system prompt durci
  contre les confirmations hallucinées, `stopWhen` passé à 5
  étapes pour permettre le chemin de récupération.

## [0.4.0] - Chapitre 4 — Les tools : donner des super-pouvoirs au LLM

### Added

- Chapitre 4 (`ebook/04-les-tools.md`) — anatomie d'un tool, Zod et
  `z.infer`, boucle multi-étapes (`stopWhen` / `stepCountIs`),
  SQLite avec `better-sqlite3`.
- Couche de base de données : schéma (`src/db/schema.sql`), client
  partagé (`src/db/client.ts`), seed (`src/db/seed.ts`) qui génère
  48 créneaux sur 6 jours dont 3 réservés.
- Premier tool de RDV-Pro : `getSlots(date)`
  (`src/agents/tools/get-slots.ts`).
- Branchement du tool sur `POST /chat` (`src/routes/chat.ts`) avec
  un system prompt directif pour forcer l'appel à `getSlots`.

### Dependencies

- `zod@^4`, `better-sqlite3@^12`.
- `@types/better-sqlite3@^7` (dev).

## [0.3.0] - Chapitre 3 — Premier contact : ton premier appel à Gemini en TypeScript

### Added

- Chapitre 3 (`ebook/03-premier-contact.md`) — `tsconfig.json` en
  profondeur, ESM vs CommonJS, mise en place du serveur HTTP avec
  Hono, et streaming HTTP token par token.
- Serveur Hono dans `src/index.ts` (bascule depuis le script de
  catalogue du chapitre 1).
- Endpoint `GET /health` (`src/routes/health.ts`) et endpoint
  streaming `POST /chat` (`src/routes/chat.ts`).

### Dependencies

- `hono@^4.12.22`, `@hono/node-server@^2.0.3`.

## [0.2.0] - Chapitre 2 — Comment fonctionne un LLM (sans maths)

### Added

- Chapitre 2 (`ebook/02-comment-fonctionne-un-llm.md`) — anatomie d'un
  LLM (token, prompt, system prompt, context window, temperature,
  hallucination) et premier vrai appel à Gemini depuis RDV-Pro.
- Wrapper Vercel AI SDK (`src/lib/llm.ts`) — provider Google
  partagé par tous les scripts, avec `baseURL` épinglé et constantes
  de modèles (`FLASH`, `PRO`).
- Script de génération de descriptions commerciales
  (`src/generate-descriptions.ts`) — premier appel LLM réel sur le
  catalogue du salon.
- Script npm `generate-descriptions`.

### Dependencies

- `ai@^6.0.190`, `@ai-sdk/google@^3.0.79`, `dotenv@^17.4.2`.

## [0.1.0] - Chapitre 1 — Pourquoi les agents IA changent le développement

### Added

- Initialisation du dépôt : `package.json` (ESM), `tsconfig.json` (strict),
  `.env.example`, `.gitignore`, licence MIT.
- Squelette de l'ebook : préface (`ebook/00-preface.md`) et table des
  matières détaillée (`ebook/00-toc.md`).
- Templates GitHub : modèle d'issue « Chapitre » et modèle de pull request.
- Chapitre 1 (`ebook/01-pourquoi-les-agents.md`) — agent vs script
  classique, anatomie d'un agent, pourquoi TypeScript.
- Premier script TypeScript : le catalogue des prestations du salon
  (`src/index.ts`) — introduit `type`, annotations de type, `tsx`.

<!--
Modèle d'entrée pour chaque chapitre, à recopier :

## [0.5.0] - Chapitre 5 — Le pattern ReAct
### Added
- Booking agent ReAct (`src/agents/booking-agent.ts`)
- Tools `getSlots` et `bookSlot` (`src/agents/tools/`)
- Route `POST /chat` branchée sur l'agent (`src/routes/chat.ts`)
### Changed
- Schéma SQLite : ajout du statut "pending" sur les rendez-vous
-->
