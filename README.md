# 🏷️ Générateur de Badges Web & Desktop (Badje_Web)

Un système professionnel de génération de badges conçu pour fonctionner à la fois comme une application web et une application de bureau hors-ligne (grâce à Electron). 

## ✨ Fonctionnalités Principales

- **Génération Automatisée** : Création visuelle de badges à partir de modèles personnalisés.
- **Importation de Données** : Import facile des participants depuis des fichiers Excel (`.xlsx`).
- **Fonctionnement Hors-Ligne** : Base de données locale intégrée (`Dexie.js` / IndexedDB) pour fonctionner sans connexion internet, idéal pour les événements sur le terrain.
- **Synchronisation Cloud** : Sauvegarde et synchronisation optionnelle des données via Firebase.
- **Exportation** : Export des badges en format image/PDF via `html2canvas` et `pdf.js`.
- **Espace Administrateur** : Interface sécurisée pour gérer la base de données et les accès.

## 🛠️ Technologies Utilisées

- **Frontend** : React 19, Vite, Tailwind CSS, Lucide React (Icônes)
- **Desktop (Application Bureau)** : Electron, Electron-Builder
- **Base de données** : Dexie (Locale), Firebase (Cloud)
- **Traitement de fichiers** : SheetJS (xlsx), HTML2Canvas, PDF.js

## 🚀 Installation & Démarrage

### Prérequis
- Node.js (version 18+ recommandée)
- npm ou yarn

### 1. Cloner le projet et installer les dépendances
```bash
git clone https://github.com/06Rubain/Badje_Web.git
cd Badje_Web
npm install
```

### 2. Démarrer en mode Web (Développement)
Pour travailler uniquement sur l'interface web dans votre navigateur :
```bash
npm run dev
```

### 3. Démarrer en mode Bureau (Electron)
Pour lancer l'application locale comme un vrai logiciel de bureau en mode développement :
```bash
npm run app:dev
```

## 📦 Compilation / Création de l'Exécutable (.exe)

Pour générer la version finale du logiciel prête à être installée sur Windows (fichier `.exe`) :
```bash
npm run app:build
```
L'exécutable final sera généré dans le dossier `build-out/`.

> **Note importante concernant GitHub** : Le fichier `.exe` étant très lourd, il n'est pas envoyé sur le dépôt Git. Pour partager une nouvelle version du logiciel, il est recommandé de créer une "Release" sur GitHub et d'y attacher manuellement le `.exe`.

## 🤝 Contribution

1. Créez une nouvelle branche pour vos modifications : `git checkout -b nom-de-la-fonctionnalite`
2. Faites vos modifications : `git add .`
3. Commitez avec un message descriptif : `git commit -m "Ajout de la fonctionnalité X"`
4. Poussez sur GitHub : `git push origin nom-de-la-fonctionnalite`
