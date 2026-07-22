/**
 * Service API - Simulateur de la Base de Données Externe des Étudiants
 * 
 * Ce fichier simule une API REST pour chercher/enregistrer des étudiants.
 * 
 * ====================================================================
 * 🔧 POUR CONNECTER LA VRAIE API :
 * Remplacez simplement l'URL `API_BASE_URL` par l'adresse de votre serveur
 * et adaptez les champs si nécessaire. Le reste de l'application n'a pas
 * besoin d'être modifié.
 * ====================================================================
 */

// 🔧 Remplacez cette URL par celle de votre API réelle
const API_BASE_URL = null; // Ex: 'https://votre-serveur.com/api'

// ─── Données fictives pour le simulateur avec persistance localStorage ────
const getInitialStudents = () => {
  const saved = localStorage.getItem('MOCK_STUDENTS');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('[API Simulateur] Erreur de lecture localStorage :', e);
    }
  }
  return [
    { id: 'ext-001', fullName: 'MPUNGA NTITA RUBAIN', lastName: 'MPUNGA', firstName: 'NTITA', middleName: 'RUBAIN', idNumber: '202200000001', badgeNumber: '0001', etablissement: 'Institut Mwanga', pourcentageExetat: '72%', dateNaissance: '2000-03-15', provinceEducationnelle: 'Haut-Katanga', telParent1: '+243 990 000 001', telParent2: '+243 990 000 002', adresse: '12, Av. Lumumba, Lubumbashi' },
    { id: 'ext-002', fullName: 'KABEMBA MUSHIMI VERONICA', lastName: 'KABEMBA', firstName: 'MUSHIMI', middleName: 'VERONICA', idNumber: '202200000002', badgeNumber: '0002', etablissement: 'Lycée Tuendeleye', pourcentageExetat: '68%', dateNaissance: '2001-07-22', provinceEducationnelle: 'Lualaba', telParent1: '+243 990 000 003', telParent2: '', adresse: '5, Av. Moïse Tshombe, Kolwezi' },
    { id: 'ext-003', fullName: 'KASONGO MWAMBA JEAN', lastName: 'KASONGO', firstName: 'MWAMBA', middleName: 'JEAN', idNumber: '202200000003', badgeNumber: '0003', etablissement: 'Collège Saint-François', pourcentageExetat: '81%', dateNaissance: '1999-11-05', provinceEducationnelle: 'Haut-Katanga', telParent1: '+243 990 000 004', telParent2: '+243 990 000 005', adresse: '8, Av. Kasavubu, Likasi' },
    { id: 'ext-004', fullName: 'MUTOMBO KALALA PATRICK', lastName: 'MUTOMBO', firstName: 'KALALA', middleName: 'PATRICK', idNumber: '202200000004', badgeNumber: '0004', etablissement: 'Institut Technique Industriel', pourcentageExetat: '75%', dateNaissance: '2000-06-18', provinceEducationnelle: 'Haut-Lomami', telParent1: '+243 990 000 006', telParent2: '', adresse: '3, Av. du Commerce, Kamina' },
    { id: 'ext-005', fullName: 'ILUNGA KABILA MARIE', lastName: 'ILUNGA', firstName: 'KABILA', middleName: 'MARIE', idNumber: '202200000005', badgeNumber: '0005', etablissement: 'Lycée Wema', pourcentageExetat: '89%', dateNaissance: '2001-01-30', provinceEducationnelle: 'Lualaba', telParent1: '+243 990 000 007', telParent2: '+243 990 000 008', adresse: '20, Av. de la Paix, Kolwezi' },
    { id: 'ext-006', fullName: 'TSHISEKEDI MULUMBA FELIX', lastName: 'TSHISEKEDI', firstName: 'MULUMBA', middleName: 'FELIX', idNumber: '202200000006', badgeNumber: '0006', etablissement: 'Institut Imara', pourcentageExetat: '63%', dateNaissance: '2000-09-12', provinceEducationnelle: 'Haut-Katanga', telParent1: '+243 990 000 009', telParent2: '', adresse: '15, Av. Sendwe, Lubumbashi' },
    { id: 'ext-007', fullName: 'KANYINDA TSHIBOLA GRACE', lastName: 'KANYINDA', firstName: 'TSHIBOLA', middleName: 'GRACE', idNumber: '202200000007', badgeNumber: '0007', etablissement: 'Collège Maisha', pourcentageExetat: '77%', dateNaissance: '1999-04-25', provinceEducationnelle: 'Tanganyika', telParent1: '+243 990 000 010', telParent2: '+243 990 000 011', adresse: '7, Av. Kabalo, Kalemie' },
    { id: 'ext-008', fullName: 'NGANDU KAPEND DANIEL', lastName: 'NGANDU', firstName: 'KAPEND', middleName: 'DANIEL', idNumber: '202200000008', badgeNumber: '0008', etablissement: 'Institut Mapendo', pourcentageExetat: '70%', dateNaissance: '2002-02-14', provinceEducationnelle: 'Haut-Katanga', telParent1: '+243 990 000 012', telParent2: '', adresse: '1, Av. de la Révolution, Lubumbashi' },
    { id: 'ext-009', fullName: 'MBUYI KABEYA SARAH', lastName: 'MBUYI', firstName: 'KABEYA', middleName: 'SARAH', idNumber: '202200000009', badgeNumber: '0009', etablissement: 'Lycée Bonne Espérance', pourcentageExetat: '85%', dateNaissance: '2001-08-08', provinceEducationnelle: 'Lualaba', telParent1: '+243 990 000 013', telParent2: '+243 990 000 014', adresse: '9, Av. Katanga, Likasi' },
    { id: 'ext-010', fullName: 'NKONGOLO MWENZE DAVID', lastName: 'NKONGOLO', firstName: 'MWENZE', middleName: 'DAVID', idNumber: '202200000010', badgeNumber: '0010', etablissement: 'Institut Salama', pourcentageExetat: '60%', dateNaissance: '2000-12-01', provinceEducationnelle: 'Haut-Lomami', telParent1: '+243 990 000 015', telParent2: '', adresse: '4, Av. de l\'Indépendance, Kamina' },
  ];
};

let MOCK_STUDENTS = getInitialStudents();

const saveStudentsToLocalStorage = () => {
  localStorage.setItem('MOCK_STUDENTS', JSON.stringify(MOCK_STUDENTS));
};

// ─── Recherche d'étudiants ──────────────────────────────────────────────

/**
 * Recherche des étudiants dans la base de données externe.
 * @param {string} query - Le terme de recherche (nom, matricule, N°...)
 * @returns {Promise<Array>} - Liste des étudiants correspondants
 */
export async function searchExternalStudents(query) {
  if (!query || query.trim().length < 2) return [];

  if (API_BASE_URL) {
    try {
      const response = await fetch(`${API_BASE_URL}/students/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Erreur réseau');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[API] Erreur lors de la recherche :', error);
      return [];
    }
  }

  await new Promise(resolve => setTimeout(resolve, 300)); // Simuler la latence réseau

  const term = query.toLowerCase();
  return MOCK_STUDENTS.filter(student => {
    const searchable = `${student.lastName} ${student.firstName} ${student.middleName} ${student.idNumber} ${student.badgeNumber} ${student.fullName}`.toLowerCase();
    return searchable.includes(term);
  });
}

// ─── Enregistrement d'un nouvel étudiant ────────────────────────────────

/**
 * Enregistre un nouvel étudiant dans la base de données externe.
 * @param {Object} studentData - Les données de l'étudiant à enregistrer
 * @returns {Promise<Object>} - L'étudiant enregistré (avec un ID serveur)
 */
export async function registerExternalStudent(studentData) {
  if (API_BASE_URL) {
    try {
      const response = await fetch(`${API_BASE_URL}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData),
      });
      if (!response.ok) throw new Error("Erreur lors de l'enregistrement");
      return await response.json();
    } catch (error) {
      console.error('[API] Erreur lors de l\'enregistrement :', error);
      throw error;
    }
  }

  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Fonction pour éviter la duplication des noms
  const buildFullName = (last, first, middle) => {
    let full = (last || '').trim();
    const f = (first || '').trim();
    const m = (middle || '').trim();
    
    if (f && !full.includes(f)) full += ' ' + f;
    if (m && !full.includes(m)) full += ' ' + m;
    
    return full.toUpperCase();
  };

  const nameParts = (studentData.fullName || '').trim().split(/\s+/);
  const finalFullName = studentData.fullName ? studentData.fullName.toUpperCase() : buildFullName(studentData.lastName, studentData.firstName, studentData.middleName);

  const newStudent = {
    id: `ext-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    fullName: finalFullName,
    lastName: studentData.lastName || nameParts[0] || '',
    firstName: studentData.firstName || nameParts[1] || '',
    middleName: studentData.middleName || nameParts.slice(2).join(' ') || '',
    idNumber: studentData.idNumber || '',
    badgeNumber: studentData.badgeNumber || `${String(MOCK_STUDENTS.length + 1).padStart(4, '0')}`,
    etablissement: studentData.etablissement || '',
    pourcentageExetat: studentData.pourcentageExetat || '',
    dateNaissance: studentData.dateNaissance || '',
    provinceEducationnelle: studentData.provinceEducationnelle || '',
    telParent1: studentData.telParent1 || '',
    telParent2: studentData.telParent2 || '',
    adresse: studentData.adresse || '',
  };
  
  MOCK_STUDENTS.push(newStudent);
  saveStudentsToLocalStorage();
  console.log('[SIMULATEUR API] Nouvel étudiant enregistré :', newStudent);
  return newStudent;
}

// ─── Récupérer tous les étudiants ──────────────────────────────────────

/**
 * Récupère tous les étudiants (avec option de pagination côté serveur si API)
 * @returns {Promise<Array>}
 */
export async function getExternalStudents() {
  if (API_BASE_URL) {
    try {
      const response = await fetch(`${API_BASE_URL}/students`);
      if (!response.ok) throw new Error('Erreur réseau');
      return await response.json();
    } catch (error) {
      console.error('[API] Erreur de récupération des étudiants :', error);
      return [];
    }
  }

  await new Promise(resolve => setTimeout(resolve, 200));
  return MOCK_STUDENTS;
}

// ─── Supprimer un étudiant ─────────────────────────────────────────────

/**
 * Supprime un étudiant de la base de données externe
 * @param {string} id - L'ID de l'étudiant
 */
export async function deleteExternalStudent(id) {
  if (API_BASE_URL) {
    try {
      const response = await fetch(`${API_BASE_URL}/students/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erreur réseau');
      return true;
    } catch (error) {
      console.error('[API] Erreur de suppression de l\'étudiant :', error);
      return false;
    }
  }

  MOCK_STUDENTS = MOCK_STUDENTS.filter(s => s.id !== id);
  saveStudentsToLocalStorage();
  return true;
}

// ─── Vider la base de données ──────────────────────────────────────────

/**
 * Vide complètement la base de données externe
 */
export async function clearExternalStudents() {
  if (API_BASE_URL) {
    try {
      // Si API réelle, il faudrait une route spécifique ou itérer
      const response = await fetch(`${API_BASE_URL}/students/clear`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erreur réseau');
      return true;
    } catch (error) {
      console.error('[API] Erreur de réinitialisation de la base :', error);
      return false;
    }
  }

  MOCK_STUDENTS = [];
  saveStudentsToLocalStorage();
  return true;
}
