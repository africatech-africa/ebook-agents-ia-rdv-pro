# RDV-Pro — Starter

> Point de départ **vide** du projet RDV-Pro, repo compagnon de l'ebook
> **« Créer des agents IA en TypeScript »**.

Ce dépôt ne contient (presque) aucun code. C'est voulu : **tu vas écrire
RDV-Pro toi-même**, chapitre après chapitre, en suivant le livre. Un
assistant IA de prise de rendez-vous pour salons et professionnels de
services, en TypeScript, du premier appel LLM jusqu'au déploiement.

Tu n'as ici que la tuyauterie : configuration TypeScript, scripts npm, et
un `src/index.ts` qui tourne pour vérifier que ton environnement est prêt.

## Quick start

```bash
git clone https://github.com/africatech-africa/ebook-agents-ia-rdv-pro
cd ebook-agents-ia-rdv-pro
git checkout chapitre-00-start   # ce starter (ou : git checkout v0.0.0)
npm install
cp .env.example .env             # tu rempliras les clés au fil des chapitres
npm run dev                      # lance le placeholder
```

Tu devrais voir s'afficher `RDV-Pro — starter prêt. À toi de jouer !`.
Si oui, ton environnement TypeScript (`tsx` + `tsconfig`) fonctionne.

## Comment l'utiliser

1. Ouvre le livre au **chapitre 1** et écris le code au fur et à mesure,
   directement dans ce projet.
2. **Ajoute les dépendances quand un chapitre les introduit** — ce starter
   ne contient que le toolchain TypeScript. Par exemple, au chapitre 2 :
   ```bash
   npm install ai @ai-sdk/google dotenv
   ```
   Le livre indique à chaque fois quoi installer.
3. Crée les dossiers et fichiers au moment où le chapitre te le demande.

## En cas de blocage

Une solution de référence existe pour **chaque chapitre**, sur ce même
dépôt, sous forme de branche et de tag :

```bash
git checkout chapitre-05-react-booking   # le code à la fin du chapitre 5
# ou, de façon équivalente :
git checkout v0.5.0
```

Compare avec ta version, puis reviens sur ta branche de travail. L'idée
reste d'écrire le code toi-même — la référence est un filet, pas un
raccourci.

## Arborescence cible

Tu construiras progressivement quelque chose comme ceci (les dossiers
vides présents ici t'indiquent où va le code des premiers chapitres) :

```
src/
├── index.ts        # point d'entrée (serveur Hono dès le ch. 3)
├── routes/         # endpoints HTTP : /chat, /health (ch. 3)
├── db/             # base de données : client, schéma, seed (ch. 4)
├── agents/
│   ├── tools/      # les tools de l'agent : getSlots, bookSlot... (ch. 4)
│   └── ...         # agents spécialisés, router... (ch. 9)
└── lib/            # wrappers : llm, embeddings, trace... (ch. 2+)
```

Les dossiers introduits plus tard — `inngest/` (ch. 8), `mcp/` (ch. 10),
`agents/logic/` (ch. 10), ainsi que `knowledge/` (ch. 7) et `evals/`
(ch. 11) — tu les créeras toi-même quand le chapitre concerné arrivera.

## Variables d'environnement

Copie `.env.example` vers `.env` et renseigne les clés au fil de ta
progression. La première utile est `GOOGLE_GENERATIVE_AI_API_KEY` (dès le
chapitre 2). Voir [`.env.example`](./.env.example) pour la liste complète.

## Scripts npm

| Commande | Rôle |
|---|---|
| `npm run dev` | Lance le projet en mode watch (`tsx watch`) |
| `npm start` | Lance le projet une fois |
| `npm run typecheck` | Vérifie les types avec `tsc --noEmit` |

Tu ajouteras d'autres scripts (`seed`, `eval`…) quand les chapitres les
introduiront.

## Licence

[MIT](./LICENSE).
