# Changelog

Toutes les évolutions notables de RDV-Pro sont consignées ici.

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et le
projet suit le [versionnage sémantique](https://semver.org/lang/fr/). **Chaque
chapitre de l'ebook correspond à une version** : `v0.1.0` = fin du chapitre 1,
`v1.0.0` = fin du chapitre 12.

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
