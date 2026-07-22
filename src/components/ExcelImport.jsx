import React, { useState, useRef, useCallback } from 'react';
import { FileUp, FileCheck2, Loader2, X, AlertTriangle, CheckCircle2, UserPlus, ChevronDown, ChevronUp, Table2, Settings } from 'lucide-react';
import * as XLSX from 'xlsx';

// Mappage de détection automatique des colonnes
const COLUMN_MAPPINGS = {
  lastName: ['nom', 'last name', 'famille', 'nom de famille'],
  firstName: ['postnom', 'post-nom', 'post nom', 'post'],
  middleName: ['prenom', 'prénom', 'prenoms', 'prénoms', 'first name', 'given name', 'middle name'],
  idNumber: ['matricule', 'id', 'code', 'numero', 'numéro', 'student id', 'reg no'],
  badgeNumber: ['badge', 'carte', 'card number', 'no badge'],
  etablissement: ['etablissement', 'établissement', 'ecole', 'école', 'school', 'institution'],
  pourcentageExetat: ['pourcentage', 'exetat', '%', 'percentage'],
  dateNaissance: ['date de naissance', 'naissance', 'date of birth', 'dob', 'né le', 'ne le'],
  provinceEducationnelle: ['province', 'educationnelle', 'éducationnelle', 'province éducationnelle'],
  telParent1: ['tel parent', 'téléphone parent', 'tel 1', 'telephone 1', 'parent 1', 'contact 1', 'telephone'],
  telParent2: ['tel parent 2', 'téléphone parent 2', 'tel 2', 'telephone 2', 'parent 2', 'contact 2'],
  adresse: ['adresse', 'address', 'residence', 'résidence']
};

// Fonction pour deviner la colonne
const guessColumnIndex = (headers, targetField) => {
  const synonyms = COLUMN_MAPPINGS[targetField] || [];
  
  // 1. Correspondance exacte
  let idx = headers.findIndex(h => {
    if (!h) return false;
    return synonyms.includes(h.toString().toLowerCase().trim());
  });
  if (idx !== -1) return idx;

  // 2. Correspondance par mot exact (pour éviter que "postnom" matche "nom")
  return headers.findIndex(h => {
    if (!h) return false;
    const cleanHeader = h.toString().toLowerCase().trim();
    // Découper par espaces ou tirets
    const words = cleanHeader.split(/[\s\-_'"]+/);
    return synonyms.some(syn => words.includes(syn) || cleanHeader.startsWith(syn + ' ') || cleanHeader.endsWith(' ' + syn));
  });
};

const ExcelImport = ({ onImportStudents }) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [students, setStudents] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [fileName, setFileName] = useState('');
  const [importDone, setImportDone] = useState(false);

  // Mappage des indices de colonnes sélectionnés
  const [colMapping, setColMapping] = useState({
    lastName: -1,
    firstName: -1,
    middleName: -1,
    idNumber: -1,
    badgeNumber: -1,
    etablissement: -1,
    pourcentageExetat: -1,
    dateNaissance: -1,
    provinceEducationnelle: -1,
    telParent1: -1,
    telParent2: -1,
    adresse: -1,
  });

  const processExcel = async (file) => {
    if (!file || !(/\.(xlsx|xls|csv)$/i.test(file.name))) {
      setError('Veuillez sélectionner un fichier Excel (.xlsx, .xls) ou CSV valide.');
      return;
    }

    setError(null);
    setIsProcessing(true);
    setImportDone(false);
    setFileName(file.name);

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Récupérer les lignes sous forme de tableau de tableaux
          const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (rows.length < 2) {
            throw new Error("Le fichier Excel semble vide ou ne contient pas assez de données.");
          }

          // Première ligne = En-têtes
          const fileHeaders = rows[0].map(h => h ? h.toString().trim() : '');
          setHeaders(fileHeaders);

          // Deviner les correspondances
          const guessedMapping = {};
          Object.keys(colMapping).forEach(field => {
            guessedMapping[field] = guessColumnIndex(fileHeaders, field);
          });
          setColMapping(guessedMapping);

          // Extraire les lignes de données
          const parsedStudents = [];
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.length === 0 || row.every(cell => cell === null || cell === undefined || cell === '')) {
              continue; // Ignorer les lignes vides
            }

            // Générer l'objet étudiant en fonction du mappage deviné initialement
            const student = {
              lastName: '',
              firstName: '',
              middleName: '',
              idNumber: '',
              badgeNumber: '',
              etablissement: '',
              pourcentageExetat: '',
              dateNaissance: '',
              provinceEducationnelle: '',
              telParent1: '',
              telParent2: '',
              adresse: '',
              rawRow: row
            };

            parsedStudents.push(student);
          }

          setStudents(parsedStudents);

        } catch (err) {
          setError(`Erreur de lecture de l'Excel : ${err.message}`);
        } finally {
          setIsProcessing(false);
        }
      };
      
      reader.readAsArrayBuffer(file);
    } catch (err) {
      setError(`Erreur lors du chargement du fichier : ${err.message}`);
      setIsProcessing(false);
    }
  };

  // Mettre à jour les données des étudiants lorsqu'un mappage change
  const applyMappingAndGetStudents = () => {
    return students.map(student => {
      const row = student.rawRow;
      const getVal = (colIdx) => {
        if (colIdx === -1 || colIdx === undefined || colIdx >= row.length) return '';
        const val = row[colIdx];
        return val !== null && val !== undefined ? val.toString().trim() : '';
      };

      // Si le prénom et postnom sont regroupés ou que d'autres champs doivent être ajustés
      return {
        ...student,
        lastName: getVal(colMapping.lastName),
        firstName: getVal(colMapping.firstName),
        middleName: getVal(colMapping.middleName),
        idNumber: getVal(colMapping.idNumber),
        badgeNumber: getVal(colMapping.badgeNumber),
        etablissement: getVal(colMapping.etablissement),
        pourcentageExetat: getVal(colMapping.pourcentageExetat),
        dateNaissance: getVal(colMapping.dateNaissance),
        provinceEducationnelle: getVal(colMapping.provinceEducationnelle),
        telParent1: getVal(colMapping.telParent1),
        telParent2: getVal(colMapping.telParent2),
        adresse: getVal(colMapping.adresse),
      };
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) processExcel(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processExcel(file);
  }, []);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const handleMappingChange = (field, value) => {
    setColMapping(prev => ({ ...prev, [field]: parseInt(value) }));
  };

  const handleImport = () => {
    const finalizedStudents = applyMappingAndGetStudents();
    
    // Filtrer les étudiants valides (au moins un nom ou matricule)
    const validStudents = finalizedStudents.filter(s => s.lastName || s.firstName || s.idNumber);
    
    if (validStudents.length === 0) {
      setError("Aucun étudiant valide à importer. Vérifiez les correspondances de vos colonnes.");
      return;
    }
    
    onImportStudents(validStudents);
    setImportDone(true);
  };

  const handleReset = () => {
    setStudents([]);
    setHeaders([]);
    setError(null);
    setFileName('');
    setImportDone(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const mappedStudentsPreview = applyMappingAndGetStudents();

  return (
    <div className="p-8 space-y-6">
      {/* Zone de dépôt du fichier Excel */}
      {students.length === 0 && !isProcessing && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`relative cursor-pointer border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
            isDragging
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-[1.01] shadow-xl'
              : 'border-slate-300 dark:border-slate-700 hover:border-primary-400 dark:hover:border-primary-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <FileUp
            size={52}
            className={`mx-auto mb-4 transition-colors ${isDragging ? 'text-primary-500' : 'text-slate-300 dark:text-slate-600'}`}
          />
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">
            Déposez votre fichier Excel ou CSV ici
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            ou <span className="text-primary-600 dark:text-primary-400 font-semibold">cliquez pour parcourir</span> · Fichiers .xlsx, .xls, .csv acceptés
          </p>
          <div className="mt-6 flex justify-center gap-6 text-xs text-slate-400 dark:text-slate-600">
            <span className="flex items-center gap-1"><Table2 size={14} /> Import automatique des colonnes</span>
          </div>
        </div>
      )}

      {/* En cours de traitement */}
      {isProcessing && (
        <div className="text-center py-20">
          <Loader2 size={48} className="mx-auto mb-4 text-primary-500 animate-spin" />
          <p className="text-slate-600 dark:text-slate-400 font-medium text-lg">Lecture du fichier Excel en cours…</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">{fileName}</p>
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-5 py-4 rounded-xl">
          <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold mb-1">Erreur</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Succès d'import */}
      {importDone && (
        <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-5 py-4 rounded-xl">
          <CheckCircle2 size={20} className="flex-shrink-0" />
          <div className="flex-1">
            <p className="font-bold">Importation terminée !</p>
            <p className="text-sm">{students.length} étudiant(s) envoyés dans la base de données.</p>
          </div>
          <button onClick={handleReset} className="px-4 py-2 bg-white dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg text-sm font-bold hover:bg-green-50 transition-colors">
            Nouveau Fichier
          </button>
        </div>
      )}

      {/* Configuration du Mappage & Aperçu */}
      {students.length > 0 && !importDone && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-4">
            <div className="flex-1">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <FileCheck2 className="text-primary-500" size={18} />
                {fileName}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Configurez la correspondance entre les colonnes de votre fichier et les champs de l'étudiant.
              </p>
            </div>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              Changer de fichier
            </button>
          </div>

          {/* Configuration des colonnes */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-4 uppercase tracking-wider flex items-center gap-2">
              <Settings size={16} className="text-primary-500" />
              Correspondance des colonnes
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { field: 'lastName', label: 'Nom de famille' },
                { field: 'firstName', label: 'Post-nom' },
                { field: 'middleName', label: 'Prénom' },
                { field: 'idNumber', label: 'Matricule / ID' },
                { field: 'badgeNumber', label: 'N° de Badge' },
                { field: 'etablissement', label: 'Établissement' },
                { field: 'pourcentageExetat', label: 'Pourcentage' },
                { field: 'dateNaissance', label: 'Date de Naissance' },
                { field: 'provinceEducationnelle', label: 'Province éducationnelle' },
                { field: 'telParent1', label: 'Tél Parent 1' },
                { field: 'telParent2', label: 'Tél Parent 2' },
                { field: 'adresse', label: 'Adresse Complète' },
              ].map(({ field, label }) => (
                <div key={field} className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">{label}</label>
                  <select
                    value={colMapping[field]}
                    onChange={(e) => handleMappingChange(field, e.target.value)}
                    className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100 font-medium"
                  >
                    <option value="-1">-- Ignorer ou Non spécifié --</option>
                    {headers.map((h, idx) => (
                      <option key={idx} value={idx}>{h || `Colonne ${idx + 1}`}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Aperçu sous forme de tableau */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 dark:bg-slate-950/30 px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                Aperçu des données à importer ({students.length} lignes)
              </h5>
            </div>
            <div className="overflow-x-auto max-h-[300px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">
                    <th className="p-3 w-12 text-center">N°</th>
                    <th className="p-3">Nom complet</th>
                    <th className="p-3">Matricule</th>
                    <th className="p-3">Établissement</th>
                    <th className="p-3">Pourcentage</th>
                    <th className="p-3">Province</th>
                    <th className="p-3">Téléphone Parent 1</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 text-xs">
                  {mappedStudentsPreview.slice(0, 10).map((student, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                      <td className="p-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                      <td className="p-3 font-bold uppercase">
                        {[student.lastName, student.firstName, student.middleName].reduce((acc, part) => {
                          const p = (part || '').trim();
                          return (p && !acc.includes(p)) ? `${acc} ${p}` : acc;
                        }, '').trim() || '—'}
                      </td>
                      <td className="p-3 font-mono">{student.idNumber || '—'}</td>
                      <td className="p-3">{student.etablissement || '—'}</td>
                      <td className="p-3">{student.pourcentageExetat || '—'}</td>
                      <td className="p-3">{student.provinceEducationnelle || '—'}</td>
                      <td className="p-3">{student.telParent1 || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {students.length > 10 && (
                <div className="text-center py-3 bg-slate-50 dark:bg-slate-950/20 text-slate-500 dark:text-slate-400 text-xs font-medium border-t border-slate-100 dark:border-slate-800">
                  Et {students.length - 10} autres lignes non affichées dans l'aperçu...
                </div>
              )}
            </div>
          </div>

          {/* Bouton d'import */}
          <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Prêt à importer <strong>{students.length}</strong> ligne(s) d'étudiants.
            </p>
            <button
              onClick={handleImport}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-primary-600/30 transition-all hover:-translate-y-0.5"
            >
              <UserPlus size={20} />
              Importer la liste dans la base
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelImport;
