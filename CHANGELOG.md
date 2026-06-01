# Changelog

Toutes les évolutions notables de RDV-Pro sont consignées ici.

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et le
projet suit le [versionnage sémantique](https://semver.org/lang/fr/). **Chaque
chapitre de l'ebook correspond à une version** : `v0.1.0` = fin du chapitre 1,
`v1.0.0` = fin du chapitre 12.

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
