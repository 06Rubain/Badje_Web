import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

/**
 * ========================================================
 * 🔧 CONFIGURATION FIREBASE (À REMPLIR PAR L'UTILISATEUR)
 * ========================================================
 * Allez sur la console Firebase (console.firebase.google.com)
 * Créez un projet -> Ajoutez une app Web -> Copiez le code ci-dessous.
 */
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_PROJET.firebaseapp.com",
  projectId: "VOTRE_PROJET_ID",
  storageBucket: "VOTRE_PROJET.appspot.com",
  messagingSenderId: "VOTRE_SENDER_ID",
  appId: "VOTRE_APP_ID"
};

let app, db;

try {
  // N'initialiser que si une vraie clé a été insérée
  if (firebaseConfig.apiKey !== "VOTRE_API_KEY") {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("🔥 [Firebase] Connecté avec succès !");
  } else {
    console.warn("⚠️ [Firebase] Mode démo. Les clés n'ont pas encore été configurées.");
  }
} catch (error) {
  console.error("❌ [Firebase] Erreur d'initialisation :", error);
}

export { db };
