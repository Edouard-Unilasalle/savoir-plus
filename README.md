# Savoir+ — un sujet par jour

Appli web installable (PWA) pour apprendre ~15 minutes par jour : un sujet en cartes à faire défiler, un quiz, puis des révisions espacées (J+1, J+3, J+7, J+21, J+60).

## Comment ça marche

- **Défilement vertical** : révisions du jour → sujet du jour → bilan → sujets déjà lus.
- **Défilement horizontal** : les cartes d'un sujet (on peut aussi toucher le bord droit/gauche de la carte).
- **Un nouveau sujet par jour** : le suivant se débloque le lendemain du jour où tu as validé le précédent. Pas d'accumulation si tu sautes un jour. Le menu ☰ permet d'en lire un de plus si tu en as envie.
- **Un sujet est validé** quand tu as répondu aux 4 questions du quiz. Ces questions reviennent ensuite en révision.
- La progression est enregistrée **sur le téléphone uniquement** (stockage du navigateur).

## Tester sur l'ordinateur

```bash
node tools/serve.js
```

Puis ouvrir http://localhost:8080 (en vue mobile dans les outils de développement du navigateur).

## Installer sur Android

Une PWA doit être servie en HTTPS pour s'installer. Deux options gratuites :

1. **GitHub Pages** (recommandé, permet la mise à jour automatique du contenu plus tard) : mettre ce dossier dans un dépôt GitHub, puis Settings → Pages → Deploy from branch `main` / racine.
2. **Netlify Drop** : glisser le dossier sur https://app.netlify.com/drop (à refaire à chaque nouveau contenu).

Sur le téléphone, ouvrir l'adresse dans **Chrome** → menu ⋮ → **Ajouter à l'écran d'accueil** / **Installer l'application**.

## Ajouter du contenu

1. Écrire de nouveaux fichiers `content/days/day-22.json`, `day-23.json`… en suivant [CONTENT_GUIDE.md](CONTENT_GUIDE.md).
2. Lancer `node tools/build-index.js` (régénère l'index et vérifie le format).
3. Republier. L'appli récupère les nouveaux sujets à la prochaine ouverture.

Quand il reste 5 sujets ou moins, l'appli affiche un rappel pour demander à Claude d'en générer d'autres.
