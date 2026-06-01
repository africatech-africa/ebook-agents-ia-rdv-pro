# Changelog

Toutes les évolutions notables de RDV-Pro sont consignées ici.

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et le
projet suit le [versionnage sémantique](https://semver.org/lang/fr/). **Chaque
chapitre de l'ebook correspond à une version** : `v0.1.0` = fin du chapitre 1,
`v1.0.0` = fin du chapitre 12.

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
