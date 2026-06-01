## Chapitre concerné

Chapitre XX — <titre> · Branche `chapitre-XX-slug` · Tag prévu `vX.Y.0`

Closes #<numéro de l'issue>

## Ce que cette PR apporte

<Résumé en 2-3 phrases : ce que RDV-Pro sait faire en plus après ce chapitre.>

## Changements côté code

- <fichier ajouté/modifié + rôle>

## Changements côté ebook

- `ebook/XX-titre-court.md` — <titre du chapitre>

## Vérifications

- [ ] `npm run typecheck` passe
- [ ] Code exécuté avec `tsx` — fonctionne réellement
- [ ] `CHANGELOG.md` à jour
- [ ] Imports valides depuis la branche du chapitre précédent
- [ ] Convention de commits respectée (`type(scope): description`)
- [ ] Tout terme technique (IA / TS / Node) expliqué à sa 1re apparition

## Pour tester

```bash
git checkout chapitre-XX-slug
npm install
npm run dev
```
