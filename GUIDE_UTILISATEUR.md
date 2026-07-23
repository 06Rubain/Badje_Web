# 📖 Guide d'Utilisation : Générateur de Badges (Badje_Web)

Ce guide explique pas à pas comment utiliser l'application pour générer vos badges avec succès. L'application est divisée en deux parties principales : la configuration via Excel, et la génération visuelle.

---

## 📌 Exemple 1 : Génération en Lot via un Fichier Excel

La force de cette application réside dans sa capacité à générer des centaines de badges automatiquement à partir d'une simple liste Excel.

### Étape 1 : Préparer votre fichier Excel
Créez un fichier `.xlsx` (ou `.csv`) contenant vos étudiants. Les colonnes peuvent être nommées comme vous le souhaitez, l'application les reconnaîtra intelligemment !

**Exemple de colonnes idéales :**
- `Nom`
- `Post-nom`
- `Prénom`
- `Matricule`
- `Établissement`
- `Pourcentage`
- `Province`

### Étape 2 : Importer le fichier
1. Lancez l'application.
2. Cliquez sur la zone **"Déposez votre fichier Excel ou CSV ici"** ou glissez-déposez votre fichier.
3. L'application va lire votre fichier et deviner automatiquement à quoi correspond chaque colonne.
4. **Vérification** : Une fenêtre d'aperçu s'affiche. Si une colonne a mal été devinée, vous pouvez utiliser les listes déroulantes pour corriger (par exemple : forcer la colonne "École" à correspondre au champ "Établissement").
5. Cliquez sur **"Importer la liste dans la base"**. Vos étudiants sont maintenant stockés de manière sécurisée et hors-ligne dans votre application !

---

## 📌 Exemple 2 : Personnalisation et Impression d'un Badge

Une fois vos données importées, vous pouvez générer les badges visuels. L'application gère plusieurs programmes (comme *Excellentia RDC* ou *Lualaba Bora*).

### Étape 1 : Choisir le Programme
1. Allez dans la section de Création de Badge (écran d'accueil).
2. Sélectionnez le programme voulu (ex: **Lualaba Bora** ou **Excellentia RDC**). L'interface changera de couleur (Violet pour Lualaba, Bleu pour Excellentia) pour s'adapter !
3. Sélectionnez le fond (le design visuel du badge) qui correspond à ce programme.

### Étape 2 : Sélectionner un Étudiant
1. Dans la liste déroulante ou la barre de recherche, choisissez l'un des étudiants que vous avez importés via Excel.
2. L'aperçu du badge se met à jour **en temps réel** avec le Nom, Post-nom, Prénom, et le Matricule positionnés exactement au bon endroit sur le fond visuel !

### Étape 3 : Ajouter une Photo
1. Cliquez sur l'emplacement de la photo (ou sur le bouton "Ajouter une photo").
2. Sélectionnez la photo de profil de l'étudiant sur votre ordinateur.
3. Vous pouvez redimensionner et ajuster la photo pour qu'elle s'intègre parfaitement.

### Étape 4 : Exporter ou Imprimer
Une fois le badge parfait :
- Cliquez sur **Télécharger en Image** pour sauvegarder un fichier PNG (idéal pour envoyer par WhatsApp ou email).
- Cliquez sur **Générer le PDF** pour préparer une feuille A4 prête à être imprimée physiquement avec votre imprimante !

---

## ⚙️ Administration (Optionnel)
L'onglet **Administration** (accessible via l'icône de rouage) vous permet de :
- Gérer les programmes actifs.
- Vider la base de données locale si vous avez terminé un événement.
- Synchroniser les données sur un Cloud Firebase (si configuré) pour retrouver vos étudiants sur un autre ordinateur.

---

## 🌐 Mode 100 PCs : Utilisation du Serveur Central (Réseau Local)

Si vous devez travailler avec plusieurs ordinateurs (jusqu'à 100) situés dans la même pièce et connectés au même réseau (Wi-Fi ou câble), vous pouvez configurer un ordinateur "Maître" qui stockera toutes les données pour les autres.

### Rôle de l'Ordinateur Maître (Serveur)
C'est le "Cerveau". Il doit rester allumé pendant toute l'opération.
1. **Trouvez son adresse IP** : Ouvrez l'invite de commande (`cmd`) et tapez `ipconfig`. Notez l'**Adresse IPv4** (ex: `192.168.1.50`).
2. **Démarrez la base de données** : Dans le dossier de l'application, ouvrez un terminal et tapez `npm run start:server`.
3. *Le serveur affichera un message confirmant qu'il écoute sur le port 3000.*

### Rôle des Ordinateurs Clients (Les 100 autres PCs)
Ce sont les ordinateurs qui vont créer les badges et chercher les étudiants.
1. Lancez l'application normalement.
2. Allez dans l'onglet **Administration** ⚙️.
3. Dans la section **Serveur Central (Réseau Local)**, saisissez l'adresse de l'ordinateur Maître sous ce format : `http://VOTRE_IP:3000/api` (ex: `http://192.168.1.50:3000/api`).
4. Cliquez sur **Enregistrer**.

Dès lors, toutes les données ajoutées ou recherchées sur un ordinateur Client seront instantanément synchronisées avec le Maître !

---

> 💡 **Message de l'entreprise OmniCom :**
> Toute l'équipe de **OmniCom** souhaite bonne chance et plein de succès à tous les développeurs et développeuses qui lisent cette documentation ou qui continuent le développement de ce projet ! 🚀✨
