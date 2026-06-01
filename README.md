# Créer des agents IA en TypeScript

> Repo compagnon de l'ebook **« Créer des agents IA en TypeScript »**.
> De ton premier appel LLM à un assistant déployé en production — en
> construisant un vrai projet : **RDV-Pro**.

Ce dépôt contient deux choses :

- **Le texte de l'ebook**, dans [`ebook/`](./ebook) — 12 chapitres + annexes.
- **Le code du projet fil rouge RDV-Pro**, dans `src/`, versionné
  **chapitre par chapitre** : une branche et un tag par chapitre.

## RDV-Pro, c'est quoi ?

**RDV-Pro** est un assistant IA de prise de rendez-vous pour les
professionnels de services — coiffeurs, esthéticiennes, cliniques, garages —
pensé pour l'Afrique de l'Ouest francophone.

Concrètement : un client écrit *« Bonjour, je voudrais une coupe samedi
après-midi »*. L'agent comprend la demande, vérifie les créneaux libres dans
l'agenda, propose un horaire, enregistre le rendez-vous, puis envoie une
confirmation et un rappel. Le tout en français, avec des prix en FCFA et des
notifications WhatsApp.

Pourquoi ce projet plutôt qu'un énième chatbot de démo ? Parce qu'il est
assez réaliste pour rencontrer tous les vrais problèmes des agents en
production — appels d'outils, mémoire de conversation, RAG, collaboration
multi-agents, workflows durables, observabilité, sécurité — et assez cadré
pour rester pédagogique. On le construit brique par brique, du premier appel
LLM jusqu'au déploiement.

## Quick start

```bash
git clone https://github.com/africatech-africa/ebook-ai-agent
cd ebook-ai-agent
npm install
cp .env.example .env   # ajoute ta clé GOOGLE_GENERATIVE_AI_API_KEY
npm run dev            # lance le projet
```

> Le code des agents prend vie à partir du **chapitre 1**. Au démarrage, le
> dépôt contient le squelette (configuration, scripts, texte de l'ebook) ;
> les fonctionnalités arrivent chapitre après chapitre.

## Suivre l'ebook chapitre par chapitre

Chaque chapitre a sa branche et son tag. Pour récupérer le code à l'état
exact de la fin d'un chapitre :

```bash
git checkout chapitre-05-react-booking   # ou : git checkout v0.5.0
npm install
npm run dev
```

## Stack technique

| Domaine | Choix |
|---|---|
| Langage | TypeScript (Node.js 20+), ESM, exécuté avec `tsx` |
| Runtime agents | Vercel AI SDK v6 + Google Gemini (gemini-2.5-flash / gemini-2.5-pro) |
| Serveur HTTP | Hono |
| Base de données | SQLite (`better-sqlite3`), puis PostgreSQL + pgvector (RAG) |
| Validation + types | Zod (`z.infer`) |
| Orchestration durable | Inngest |
| Observabilité | Langfuse |
| Notifications | Mock, puis Twilio / WhatsApp (option) |

## Structure du dépôt

```
ebook-ai-agent/
├── ebook/        # Le texte de l'ebook (12 chapitres + annexes)
├── src/          # Le code de RDV-Pro (agents, db, routes, lib)
├── evals/        # Tests de qualité de l'agent
├── scripts/      # Scripts utilitaires
├── public/       # Page HTML de démo (optionnelle)
└── .github/      # Templates issues / PR
```

## Scripts npm

| Commande | Rôle |
|---|---|
| `npm run dev` | Lance le projet en mode watch (`tsx watch`) |
| `npm start` | Lance le projet une fois |
| `npm run seed` | Remplit la base SQLite de démo (dès le chapitre 4) |
| `npm run eval` | Lance les évals de l'agent (dès le chapitre 11) |
| `npm run typecheck` | Vérifie les types avec `tsc --noEmit` |

## Variables d'environnement

Copie `.env.example` vers `.env` et renseigne tes clés. La seule clé
indispensable pour démarrer est `GOOGLE_GENERATIVE_AI_API_KEY` (à partir du chapitre 2).
Voir [`.env.example`](./.env.example) pour la liste complète.

## L'ebook

Commence par la [préface](./ebook/00-preface.md) puis la
[table des matières détaillée](./ebook/00-toc.md).

## Roadmap

Légende : ✅ publié · 🚧 en cours · ⬜ à venir

- ✅ Chapitre 1 — Pourquoi les agents IA changent le développement
- ✅ Chapitre 2 — Comment fonctionne un LLM (sans maths)
- ✅ Chapitre 3 — Premier contact : ton premier appel à Gemini en TypeScript
- ✅ Chapitre 4 — Les tools : donner des super-pouvoirs au LLM
- ⬜ Chapitre 5 — Le pattern ReAct : ton premier vrai agent
- ⬜ Chapitre 6 — La mémoire : faire qu'un agent se souvienne
- ⬜ Chapitre 7 — RAG : connecter un agent à tes données
- ⬜ Chapitre 8 — Workflows vs agents autonomes
- ⬜ Chapitre 9 — Multi-agents : faire collaborer plusieurs IAs
- ⬜ Chapitre 10 — MCP : le standard pour brancher des outils
- ⬜ Chapitre 11 — Observabilité, évals et debugging
- ⬜ Chapitre 12 — Sécurité, coûts et déploiement

> **Progression : chapitre 1/12.** Cette branche (`chapitre-01-*`, tag `v0.1.0`) reflète le code à la fin du chapitre 1. La suite arrive chapitre après chapitre.

## Licence

[MIT](./LICENSE).
