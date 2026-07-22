import { db } from './firebase';
import { collection, writeBatch, doc, getDoc } from 'firebase/firestore';
import { getExternalStudents } from './api';
import { getBadges } from '../utils/db';

/**
 * Pousse les étudiants locaux et les badges locaux vers Firebase
 * Utilise des "Batches" (Lots) pour ne pas saturer le réseau
 */
export const pushToCloud = async (onProgress) => {
  if (!db) {
    throw new Error("Firebase n'est pas configuré. Veuillez ajouter vos clés dans src/services/firebase.js");
  }

  try {
    // 1. Récupérer les données locales
    onProgress("Récupération des données locales...");
    const localStudents = await getExternalStudents();
    const localBadges = await getBadges();

    // 2. Préparer les lots (Batches de 500 opérations max pour Firebase)
    onProgress("Préparation de l'envoi...");
    
    // Pour ne pas envoyer 5000 données d'un coup, on découpe par morceaux (chunks) de 400
    const chunkArray = (array, size) => {
      const chunked_arr = [];
      let index = 0;
      while (index < array.length) {
        chunked_arr.push(array.slice(index, size + index));
        index += size;
      }
      return chunked_arr;
    };

    const studentsChunks = chunkArray(localStudents, 400);
    let currentChunk = 0;
    const totalChunks = studentsChunks.length;

    // 3. Envoyer les étudiants
    for (const chunk of studentsChunks) {
      currentChunk++;
      onProgress(`Envoi des étudiants... (Lot ${currentChunk}/${totalChunks})`);
      
      const batch = writeBatch(db);
      for (const student of chunk) {
        // On utilise l'ID local comme ID du document pour éviter les doublons 
        // si on relance la synchronisation plusieurs fois
        const studentRef = doc(db, 'students', student.id);
        batch.set(studentRef, student, { merge: true });
      }
      await batch.commit();
    }

    // 4. Envoyer les Badges
    if (localBadges && localBadges.length > 0) {
      onProgress("Envoi de l'historique des badges...");
      const badgesChunks = chunkArray(localBadges, 400);
      
      for (const chunk of badgesChunks) {
        const batch = writeBatch(db);
        for (const badge of chunk) {
          const badgeRef = doc(db, 'badges_history', badge.id.toString()); // Convertir l'ID Dexie en string
          batch.set(badgeRef, badge, { merge: true });
        }
        await batch.commit();
      }
    }

    onProgress("Synchronisation terminée avec succès !");
    return true;

  } catch (error) {
    console.error("Erreur lors de la synchronisation Firebase:", error);
    throw error;
  }
};
