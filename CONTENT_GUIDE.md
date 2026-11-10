# Guide de rédaction du contenu — Savoir+ (appli « 1 sujet par jour »)

Ce guide sert à toute personne (ou agent Claude) qui écrit un sujet pour l'appli.
Lecteur cible : un adulte français curieux, niveau bac+3/5, qui veut **apprendre pour de vrai** en ~15 minutes par jour sur son téléphone.

## Principes

1. **Exactitude avant tout.** Chaque chiffre, date, nom ou citation doit être vérifié par une recherche web au moment de la rédaction. Si un fait n'est pas vérifiable, on le retire.
2. **Sources fiables, françaises de préférence** : institutions publiques (INSEE, Banque de France, Agreste, INRAE, FranceAgriMer, Légifrance, vie-publique.fr, Conseil constitutionnel, Cour des comptes, AMF, ministères), BnF/Gallica, Persée, OpenEdition, musées nationaux, CNRS, Inserm, Institut Pasteur, universités. International : Eurostat, OCDE, Banque mondiale, FAO, OMC, Our World in Data, Britannica. Wikipédia peut servir de point de départ, jamais de source unique.
3. **Faits ≠ interprétations.** Sur un sujet débattu, présenter les positions principales sans trancher. Signaler les mythes et citations apocryphes (« on attribue souvent à… mais… »).
4. **Pas d'actualité brûlante** : privilégier ce qui reste vrai dans 5 ans. Si un chiffre date, donner l'année (« en 2023 »).
5. **Concret et mémorable** : un exemple, une anecdote, un ordre de grandeur par carte. On explique les mécanismes (le « pourquoi » et le « comment »), pas seulement des faits.
6. **Ton** : clair, vivant, tutoiement interdit, pas de jargon non expliqué. Français correct avec accents.
7. **Pas de conseil personnalisé** en finance/santé/droit : rester pédagogique.

## Format d'un sujet (≈15 min)

Fichier : `content/days/day-XX.json` (XX = numéro sur 2 chiffres), encodé UTF-8, JSON valide.

```json
{
  "day": 1,
  "domain": "Agriculture",
  "title": "Le blé, du champ à la baguette",
  "subtitle": "Comment la céréale la plus cultivée de France nourrit le monde",
  "emoji": "🌾",
  "cards": [
    { "type": "hook", "title": "…", "body": "…" },
    { "type": "text", "title": "…", "body": "…" },
    { "type": "figure", "value": "35 Mt", "label": "…", "body": "…" },
    { "type": "quote", "quote": "…", "author": "…", "body": "…" },
    { "type": "france", "title": "Et en France ?", "body": "…" },
    { "type": "takeaways", "items": ["…", "…", "…"] }
  ],
  "quiz": [
    { "q": "…", "choices": ["…", "…", "…", "…"], "answer": 0, "explain": "…" }
  ],
  "sources": [
    { "label": "Agreste — Statistique agricole annuelle", "url": "https://…" }
  ],
  "further": [
    { "kind": "livre", "label": "Titre — Auteur (année)" }
  ]
}
```

### Règles des cartes
- **11 à 13 cartes** au total, dans cet ordre : 1 `hook` → 8 à 10 cartes de fond (`text`, `figure`, `quote`, mélangées, au moins 2 `figure`) → 1 `france` (ou titre « Et ailleurs ? » si le sujet est déjà français) → 1 `takeaways` (exactement 3 items, une phrase chacun).
- `hook` : une accroche surprenante (fait étonnant ou question), 30–60 mots.
- `text` : `title` court (≤ 6 mots) + `body` de 70–120 mots. Paragraphes séparés par `\n\n`. On peut mettre **un ou deux** passages en gras avec `**…**`.
- `figure` : `value` très court (ex. « 1 sur 3 », « 1956 », « 90 % »), `label` ≤ 12 mots, `body` 30–70 mots qui explique le chiffre.
- `quote` : citation **vérifiée** avec auteur exact (et œuvre/année si possible) ; `body` optionnel ≤ 50 mots de contexte.
- Les cartes doivent former une **progression logique** (contexte → mécanisme → conséquences → aujourd'hui).

### Quiz
- **4 questions** QCM à 4 choix, `answer` = index (0–3) de la bonne réponse. Varier la position de la bonne réponse.
- Les questions testent la compréhension et les points clés vus dans les cartes (pas des détails obscurs).
- `explain` : 1–2 phrases qui justifient la réponse.
- Les questions doivent rester compréhensibles **hors contexte** (elles reviennent en révision des jours plus tard) : rappeler le sujet dans la question si besoin.

### Sources
- 3 à 6 sources, avec des **URL réelles vérifiées** (ouvertes pendant la rédaction). Libellé = « Organisme — titre de la page ».
- `further` : 1 à 3 suggestions pour aller plus loin (livre, podcast, documentaire, site) qui existent réellement. `kind` ∈ livre | podcast | vidéo | site. `url` optionnel.

## Domaines

Agriculture · Supply chain · Économie · Finance · Droit · Art · Villes · Livres · Philosophie · Anecdotes · Culture française · Culture du monde · Sciences · Histoire · Géopolitique · Psychologie · Santé · Technologie · Environnement

## Index

`content/index.json` liste les sujets disponibles. Ne pas éditer à la main : il est régénéré par `node tools/build-index.js`.
