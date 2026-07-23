import express from 'express';
import cors from 'cors';
import { getDbConnection } from './database.js';

const app = express();
const PORT = 3000;

// Configuration CORS pour accepter les requêtes de tous les PCs du réseau local
app.use(cors());
app.use(express.json());

// Génération d'ID unique robuste
const generateId = () => `ext-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

// Initialisation asynchrone de la base
let db;
getDbConnection().then(database => {
  db = database;
  
  // Lancement du serveur (0.0.0.0 permet d'écouter toutes les interfaces réseau, essentiel pour les 100 PCs)
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n=============================================================`);
    console.log(`🚀 SERVEUR CENTRAL DÉMARRÉ AVEC SUCCÈS !`);
    console.log(`📡 Le serveur écoute sur le port ${PORT}`);
    console.log(`=============================================================\n`);
  });
}).catch(err => {
  console.error("Impossible de démarrer la base de données :", err);
  process.exit(1);
});


// --- ROUTES API ---

// 1. Récupérer tous les étudiants
app.get('/api/students', async (req, res) => {
  try {
    const students = await db.all('SELECT * FROM students ORDER BY createdAt DESC');
    res.json(students || []);
  } catch (error) {
    console.error('[API] Erreur GET /students:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des étudiants.' });
  }
});

// 2. Rechercher un étudiant
app.get('/api/students/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    if (query.trim().length < 2) return res.json([]);

    const searchTerm = `%${query}%`;
    const results = await db.all(`
      SELECT * FROM students 
      WHERE fullName LIKE ? 
         OR lastName LIKE ? 
         OR firstName LIKE ? 
         OR idNumber LIKE ? 
         OR badgeNumber LIKE ?
    `, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]);
    
    res.json(results || []);
  } catch (error) {
    console.error('[API] Erreur GET /students/search:', error);
    res.status(500).json({ error: 'Erreur lors de la recherche.' });
  }
});

// 3. Ajouter un nouvel étudiant
app.post('/api/students', async (req, res) => {
  try {
    const data = req.body;
    
    // Si badgeNumber n'est pas fourni, on génère un séquentiel
    let badgeNum = data.badgeNumber;
    if (!badgeNum) {
      const result = await db.get('SELECT COUNT(*) as count FROM students');
      badgeNum = String((result?.count || 0) + 1).padStart(4, '0');
    }

    const buildFullName = (last, first, middle) => {
      let full = (last || '').trim();
      const f = (first || '').trim();
      const m = (middle || '').trim();
      if (f && !full.includes(f)) full += ' ' + f;
      if (m && !full.includes(m)) full += ' ' + m;
      return full.toUpperCase();
    };

    const finalFullName = data.fullName ? data.fullName.toUpperCase() : buildFullName(data.lastName, data.firstName, data.middleName);
    
    const newStudent = {
      id: generateId(),
      fullName: finalFullName,
      lastName: data.lastName || '',
      firstName: data.firstName || '',
      middleName: data.middleName || '',
      idNumber: data.idNumber || '',
      badgeNumber: badgeNum,
      etablissement: data.etablissement || '',
      pourcentageExetat: data.pourcentageExetat || '',
      dateNaissance: data.dateNaissance || '',
      provinceEducationnelle: data.provinceEducationnelle || '',
      telParent1: data.telParent1 || '',
      telParent2: data.telParent2 || '',
      adresse: data.adresse || ''
    };

    await db.run(`
      INSERT INTO students (
        id, fullName, lastName, firstName, middleName, idNumber, badgeNumber,
        etablissement, pourcentageExetat, dateNaissance, provinceEducationnelle,
        telParent1, telParent2, adresse
      ) VALUES (
        :id, :fullName, :lastName, :firstName, :middleName, :idNumber, :badgeNumber,
        :etablissement, :pourcentageExetat, :dateNaissance, :provinceEducationnelle,
        :telParent1, :telParent2, :adresse
      )
    `, {
      ':id': newStudent.id,
      ':fullName': newStudent.fullName,
      ':lastName': newStudent.lastName,
      ':firstName': newStudent.firstName,
      ':middleName': newStudent.middleName,
      ':idNumber': newStudent.idNumber,
      ':badgeNumber': newStudent.badgeNumber,
      ':etablissement': newStudent.etablissement,
      ':pourcentageExetat': newStudent.pourcentageExetat,
      ':dateNaissance': newStudent.dateNaissance,
      ':provinceEducationnelle': newStudent.provinceEducationnelle,
      ':telParent1': newStudent.telParent1,
      ':telParent2': newStudent.telParent2,
      ':adresse': newStudent.adresse
    });
    
    res.status(201).json(newStudent);
  } catch (error) {
    console.error('[API] Erreur POST /students:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'étudiant.' });
  }
});

// 4. Supprimer un étudiant
app.delete('/api/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.run('DELETE FROM students WHERE id = ?', [id]);
    
    if (result.changes > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Étudiant introuvable.' });
    }
  } catch (error) {
    console.error('[API] Erreur DELETE /students/:id:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression.' });
  }
});

// 5. Vider toute la base de données
app.delete('/api/students/clear', async (req, res) => {
  try {
    await db.run('DELETE FROM students');
    res.json({ success: true });
  } catch (error) {
    console.error('[API] Erreur DELETE /students/clear:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la base.' });
  }
});
