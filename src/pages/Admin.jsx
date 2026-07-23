import React, { useState, useEffect } from 'react';
import { ShieldCheck, ToggleLeft, ToggleRight, CheckCircle2, XCircle, Printer, Trash2, Search, RotateCcw, History, CheckSquare, Square, FileUp, Users, ChevronLeft, ChevronRight, GraduationCap, Loader2, Lock, Cloud, UploadCloud, Settings, AlertCircle } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../utils/db';
import { ExcellentiaBadge, LualabaBadge, WantashiBadge } from '../components/Badges';
import ExcelImport from '../components/ExcelImport';
import { registerExternalStudent, getExternalStudents, deleteExternalStudent, clearExternalStudents, getApiBaseUrl, setApiBaseUrl } from '../services/api';
import { pushToCloud } from '../services/cloudSync';
import { updateAdminPassword } from '../utils/crypto';

const Admin = ({ activePrograms, setActivePrograms, onLogout }) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Onglets & sélection d'historique
  const [activeTab, setActiveTab] = useState('queue'); // 'queue', 'history', 'students', 'import', 'settings'
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [selectedBadgeIds, setSelectedBadgeIds] = useState([]);

  // États pour la liste des étudiants importés
  const [externalStudents, setExternalStudents] = useState([]);
  const [studentsSearchTerm, setStudentsSearchTerm] = useState('');
  const [studentsCurrentPage, setStudentsCurrentPage] = useState(1);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // État pour la synchronisation
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
  const [syncMessage, setSyncMessage] = useState('');
  const [apiBaseUrl, setApiBaseUrlState] = useState(getApiBaseUrl());
  const [newAdminPassword, setNewAdminPassword] = useState('');

  // Pagination historique
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);

  const loadExternalStudentsList = async () => {
    setStudentsLoading(true);
    try {
      const data = await getExternalStudents();
      setExternalStudents(data || []);
    } catch (e) {
      console.error('[Admin] Erreur lors du chargement des étudiants :', e);
    } finally {
      setStudentsLoading(false);
    }
  };

  useEffect(() => {
    loadExternalStudentsList();
  }, [activeTab]);

  const pendingBadges = useLiveQuery(
    () => db.badges.where('status').equals('pending').toArray(),
    []
  );

  const printedBadges = useLiveQuery(
    () => db.badges.where('status').equals('printed').toArray(),
    []
  );

  // Requête en temps réel pour la recherche
  const searchResults = useLiveQuery(
    () => {
      if (!searchTerm || searchTerm.trim().length === 0) return [];
      const term = searchTerm.toLowerCase();
      return db.badges.filter(badge => {
        const fullString = `${badge.firstName || ''} ${badge.lastName || ''} ${badge.middleName || ''} ${badge.idNumber || ''} ${badge.badgeNumber || ''}`.toLowerCase();
        return fullString.includes(term);
      }).toArray();
    },
    [searchTerm]
  );

  const handleCloudSync = async () => {
    if (!window.confirm("Voulez-vous lancer la synchronisation de toutes les données locales vers le Cloud ?")) {
      return;
    }

    setSyncStatus('syncing');
    setSyncMessage('Démarrage de la synchronisation...');

    try {
      await pushToCloud((progressMsg) => {
        setSyncMessage(progressMsg);
      });
      setSyncStatus('success');
      setSyncMessage('Synchronisation terminée avec succès !');
      setTimeout(() => setSyncStatus('idle'), 5000);
    } catch (error) {
      console.error(error);
      setSyncStatus('error');
      setSyncMessage(error.message || "Erreur de connexion avec le Cloud.");
    }
  };

  const handleReprint = async (id) => {
    if (window.confirm("Voulez-vous renvoyer ce badge dans la file d'attente pour réimpression ?")) {
      await db.badges.update(id, { status: 'pending' });
    }
  };

  const handleBulkReprint = async () => {
    if (selectedBadgeIds.length === 0) return;
    if (window.confirm(`Voulez-vous renvoyer les ${selectedBadgeIds.length} badges sélectionnés dans la file d'attente ?`)) {
      await db.transaction('rw', db.badges, async () => {
        for (const id of selectedBadgeIds) {
          await db.badges.update(id, { status: 'pending' });
        }
      });
      setSelectedBadgeIds([]);
      setActiveTab('queue'); // Retour à la file d'attente pour voir le résultat
      alert("Les badges sélectionnés ont été ajoutés à la file d'impression !");
    }
  };

  const handleImportStudents = async (studentsList) => {
    let success = 0;
    let errors = 0;
    for (const student of studentsList) {
      try {
        await registerExternalStudent({
          lastName: student.lastName || '',
          firstName: student.firstName || '',
          middleName: student.middleName || '',
          fullName: `${student.lastName || ''} ${student.firstName || ''} ${student.middleName || ''}`.trim(),
          idNumber: student.idNumber || '',
          badgeNumber: student.badgeNumber || '',
          etablissement: student.etablissement || '',
          pourcentageExetat: student.pourcentageExetat || '',
          dateNaissance: student.dateNaissance || '',
          provinceEducationnelle: student.provinceEducationnelle || '',
          telParent1: student.telParent1 || '',
          telParent2: student.telParent2 || '',
          adresse: student.adresse || '',
        });
        success++;
      } catch (err) {
        console.warn('[Import Excel] Erreur pour', student.lastName, ':', err.message);
        errors++;
      }
    }
    const msg = errors === 0
      ? `✅ ${success} étudiant(s) importé(s) avec succès dans la base externe !`
      : `⚠️ ${success} importé(s), ${errors} erreur(s). Consultez la console pour les détails.`;
    alert(msg);
    loadExternalStudentsList();
    setActiveTab('students'); // Rediriger automatiquement vers l'onglet des étudiants
  };

  const handleDeleteExternalStudent = async (id, name) => {
    if (window.confirm(`Voulez-vous vraiment supprimer l'étudiant "${name}" de la base externe ?`)) {
      const success = await deleteExternalStudent(id);
      if (success) {
        alert("Étudiant supprimé de la base de données externe.");
        loadExternalStudentsList();
      } else {
        alert("Erreur lors de la suppression.");
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedBadgeIds.length === 0) return;
    if (window.confirm(`Voulez-vous définitivement supprimer les ${selectedBadgeIds.length} badges sélectionnés de l'historique ?`)) {
      await db.transaction('rw', db.badges, async () => {
        for (const id of selectedBadgeIds) {
          await db.badges.delete(id);
        }
      });
      setSelectedBadgeIds([]);
    }
  };

  const handleClearDatabase = async () => {
    const confirmation1 = window.confirm("⚠️ ATTENTION : Vous êtes sur le point d'effacer TOUTE la base de données (badges en attente, historique imprimé, et liste d'étudiants importés). Continuer ?");
    if (!confirmation1) return;
    
    const confirmation2 = window.prompt("Pour confirmer la suppression TOTALE, tapez 'SUPPRIMER' dans le champ ci-dessous :");
    if (confirmation2 === 'SUPPRIMER') {
      try {
        await db.badges.clear();
        await clearExternalStudents();
        alert("✅ Base de données effacée avec succès.");
        loadExternalStudentsList();
      } catch (err) {
        alert("❌ Une erreur est survenue lors de la suppression.");
        console.error(err);
      }
    } else {
      alert("Suppression annulée.");
    }
  };

  const handleToggleSelectAll = (filtered) => {
    if (selectedBadgeIds.length === filtered.length) {
      setSelectedBadgeIds([]);
    } else {
      setSelectedBadgeIds(filtered.map(b => b.id));
    }
  };

  const handleToggleSelectOne = (id) => {
    setSelectedBadgeIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggle = (program) => {
    setActivePrograms((prev) => ({
      ...prev,
      [program]: !prev[program],
    }));
  };

  const handleDelete = async (id) => {
    if (window.confirm("Voulez-vous vraiment supprimer ce badge de la file d'attente ?")) {
      await db.badges.delete(id);
    }
  };

  const handleOpenPreview = () => {
    if (!pendingBadges || pendingBadges.length === 0) return;
    setIsPreviewMode(true);
  };

  const handlePrintQueue = async () => {
    // Imprimer
    window.print();
    
    // Demander si l'impression a réussi
    setTimeout(async () => {
      if (window.confirm("L'impression s'est-elle bien déroulée ? Cliquer sur OK supprimera les badges de la file d'attente.")) {
        await db.transaction('rw', db.badges, async () => {
          // Ne marquer que les 4 premiers badges (ceux qui étaient sur la page A4)
          const printedBadges = pendingBadges.slice(0, 4);
          for (const badge of printedBadges) {
            await db.badges.update(badge.id, { status: 'printed' });
          }
        });
        setIsPreviewMode(false); // Fermer l'aperçu si réussi
      }
    }, 1000);
  };

  const renderBadgeComponent = (badge) => {
    // Méthode image plate (html2canvas)
    if (badge.badgeImageData) {
      return (
        <img 
          src={badge.badgeImageData} 
          alt={`Badge de ${badge.firstName}`} 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'fill',
            display: 'block'
          }} 
        />
      );
    }
    // Fallback : rendu composant React
    switch(badge.program) {
      case 'excellentia': return <ExcellentiaBadge data={badge} />;
      case 'lualaba': return <LualabaBadge data={badge} />;
      case 'wantashi': return <WantashiBadge data={badge} />;
      default: return null;
    }
  };

  const programs = [
    { id: 'wantashi', name: 'Programme Wantashi', bgLight: 'bg-indigo-50', borderLight: 'border-indigo-200', textLight: 'text-indigo-700', bgDark: 'dark:bg-indigo-900/20', borderDark: 'dark:border-indigo-800', textDark: 'dark:text-indigo-400' },
    { id: 'lualaba', name: 'Lualaba Bora', bgLight: 'bg-rose-50', borderLight: 'border-rose-200', textLight: 'text-rose-700', bgDark: 'dark:bg-rose-900/20', borderDark: 'dark:border-rose-800', textDark: 'dark:text-rose-400' },
    { id: 'excellentia', name: 'Excellentia RDC', bgLight: 'bg-sky-50', borderLight: 'border-sky-200', textLight: 'text-sky-700', bgDark: 'dark:bg-sky-900/20', borderDark: 'dark:border-sky-800', textDark: 'dark:text-sky-400' },
  ];

  return (
    <>
      {/* Conteneur d'impression / Aperçu A4 */}
      {isPreviewMode && (
        <div className="flex fixed inset-0 z-50 bg-slate-900/95 items-center justify-center print:hidden">
          
          {/* Barre d'actions */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-4 print:hidden z-50">
            <button 
              onClick={() => setIsPreviewMode(false)}
              className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 px-5 rounded-lg shadow-lg flex items-center gap-2 text-sm"
            >
              <XCircle size={18} />
              Fermer
            </button>
            <button 
              onClick={handlePrintQueue}
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg shadow-primary-600/30 flex items-center gap-2 text-sm"
            >
              <Printer size={18} />
              Imprimer cette page
            </button>
          </div>

          {/* Info compteur */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs print:hidden">
            {pendingBadges && pendingBadges.length > 4 
              ? `Page 1/4 — ${pendingBadges.length - 4} badge(s) restant(s) après impression`
              : `${pendingBadges?.length || 0} badge(s) sur cette page`
            }
          </div>

          {/* Feuille A4 - 794px × 1123px = taille réelle à 96dpi */}
          <div 
            className="bg-white shadow-2xl"
            style={{
              width: '794px',
              height: '1123px',
              display: 'grid',
              gridTemplateColumns: '397px 397px',
              gridTemplateRows: '561.5px 561.5px',
              transform: 'scale(0.72)',
              transformOrigin: 'center center',
            }}
          >
            {[0, 1, 2, 3].map(index => {
              const badge = pendingBadges?.[index];
              return (
                <div 
                  key={index} 
                  style={{ 
                    border: '1px dashed #94a3b8',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '397px',
                    height: '561.5px',
                    overflow: 'hidden',
                    backgroundColor: badge ? 'transparent' : '#f8fafc'
                  }}
                >
                  {badge ? (
                    renderBadgeComponent(badge)
                  ) : (
                    <div style={{ textAlign: 'center', color: '#cbd5e1' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>✦</div>
                      <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase' }}>Emplacement Vide</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Zone d'impression - UNIQUEMENT visible lors de window.print() */}
      <style>{`
        @media print {
          /* Rendre invisible tout le reste de la page */
          body * {
            visibility: hidden;
          }
          /* Rendre uniquement visible la zone A4 et ses enfants */
          .print-a4-zone, .print-a4-zone * {
            visibility: visible;
          }
          .print-a4-zone {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            display: grid !important;
            width: 794px !important;
            height: 1123px !important;
          }
        }
        @media screen {
          .print-a4-zone { display: none !important; }
        }
      `}</style>
      {pendingBadges && pendingBadges.length > 0 && (
        <div 
          className="print-a4-zone"
          style={{
            width: '794px',
            height: '1123px',
            gridTemplateColumns: '397px 397px',
            gridTemplateRows: '561.5px 561.5px',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        >
          {[0, 1, 2, 3].map(index => {
            const badge = pendingBadges?.[index];
            return (
              <div 
                key={index} 
                style={{
                  width: '397px',
                  height: '561.5px',
                  overflow: 'hidden',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {badge && renderBadgeComponent(badge)}
              </div>
            );
          })}
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-8 print:hidden transition-all duration-300">
        
        {/* Header & Stats Dashboard */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/50 dark:border-slate-700/50 p-6 md:p-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -z-10"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-lg text-white">
                <ShieldCheck size={36} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Espace Administration</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Gérez la production, l'historique et la base de données étudiante.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleClearDatabase}
                className="flex items-center gap-2 bg-red-100 hover:bg-red-600 text-red-600 hover:text-white dark:bg-red-900/30 dark:hover:bg-red-600 dark:text-red-400 dark:hover:text-white px-4 py-2 rounded-xl font-bold transition-colors shadow-sm text-sm"
                title="Vider toute la base de données"
              >
                <Trash2 size={16} /> Vider la base
              </button>
              
              {onLogout && (
                <button 
                  onClick={onLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-sm font-bold shadow-sm transition-colors"
                >
                  <Lock size={16} /> Déconnexion
                </button>
              )}
            </div>
          </div>

          {/* Widgets Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                <Printer size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">File d'attente</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white">{pendingBadges?.length || 0}</p>
              </div>
            </div>
            
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl">
                <History size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Badges Imprimés</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white">{printedBadges?.length || 0}</p>
              </div>
            </div>
            
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Base Étudiante</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white">{externalStudents?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu Principal (Onglets + Vues) */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/50 dark:border-slate-700/50 overflow-hidden">
          
          {/* Navigation par Onglets (Pills) */}
          <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-950/20 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {[
                { id: 'queue', icon: Printer, label: "Impression & Production" },
                { id: 'history', icon: History, label: "Historique" },
                { id: 'students', icon: Users, label: "Liste Étudiants" },
                { id: 'import', icon: FileUp, label: "Import Excel" },
                { id: 'settings', icon: Settings, label: "Paramètres Systèmes" },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                    activeTab === tab.id 
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30 -translate-y-0.5' 
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 hover:-translate-y-0.5 shadow-sm'
                  }`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

        {activeTab === 'queue' ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
              {/* Colonne de Gauche : Gestion des programmes */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider flex items-center gap-2">
                  Programmes Actifs
                </h2>
                {programs.map((prog) => {
                  const isActive = activePrograms[prog.id];
                  return (
                    <div 
                      key={prog.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 border rounded-xl transition-all duration-300 ${isActive ? `${prog.bgLight} ${prog.bgDark} ${prog.borderLight} ${prog.borderDark}` : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-75 grayscale'}`}
                    >
                      <div className="flex items-center gap-4 mb-4 sm:mb-0">
                        <div className={`p-3 rounded-full ${isActive ? 'bg-white dark:bg-slate-800 shadow-sm' : 'bg-slate-100 dark:bg-slate-700'}`}>
                          {isActive ? <CheckCircle2 className={isActive ? prog.textLight + ' ' + prog.textDark : 'text-slate-400 dark:text-slate-500'} size={24} /> : <XCircle className="text-slate-400 dark:text-slate-500" size={24} />}
                        </div>
                        <div>
                          <h3 className={`text-lg font-bold mb-1 ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                            {prog.name}
                          </h3>
                          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                            {isActive ? 'Actif' : 'Désactivé'}
                          </p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleToggle(prog.id)}
                        className={`flex items-center hover:scale-110 active:scale-95 transition-transform ${isActive ? prog.textLight + ' ' + prog.textDark : 'text-slate-400 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-500'}`}
                        title={isActive ? "Désactiver ce programme" : "Activer ce programme"}
                      >
                        {isActive ? <ToggleRight size={50} strokeWidth={1.5} /> : <ToggleLeft size={50} strokeWidth={1.5} />}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Colonne de Droite : File d'attente d'impression */}
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <span>File d'impression</span>
                    {pendingBadges && pendingBadges.length > 0 && (
                      <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded-full">{pendingBadges.length}</span>
                    )}
                  </h2>
                </div>

                {!pendingBadges || pendingBadges.length === 0 ? (
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center text-slate-500 dark:text-slate-400">
                    <Printer className="mx-auto mb-3 opacity-50" size={32} />
                    <p>Aucun badge en attente.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-400 p-4 rounded-xl text-sm mb-4">
                      <strong>Rappel :</strong> <span>La mise en page A4 est optimisée pour imprimer par blocs de 4 badges. L'impression actuelle lancera les {Math.min(pendingBadges.length, 4)} premiers badges de la liste.</span>
                    </div>
                    
                    <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2">
                      {pendingBadges.map((badge, index) => (
                        <div key={badge.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-400 dark:text-slate-500 w-4">{index + 1}.</span>
                            {badge.photo && (
                              <img src={badge.photo} alt="Student" className="w-10 h-10 rounded-full object-cover shadow-sm border border-slate-200 dark:border-slate-600" />
                            )}
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-200">{`${badge.firstName} ${badge.lastName}`}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 uppercase">{`${badge.program} - ID: ${badge.idNumber}`}</div>
                            </div>
                          </div>
                          <button onClick={() => handleDelete(badge.id)} className="text-red-500 hover:text-red-600 dark:hover:text-red-400 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button 
                      onClick={handleOpenPreview}
                      className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg shadow-primary-600/30 transition-transform hover:-translate-y-0.5 mt-4"
                    >
                      <Printer size={20} />
                      Aperçu de la Planche A4
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Section de Recherche (Générale) */}
            <div className="p-8 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Search size={22} className="text-primary-600 dark:text-primary-400" />
                  Rechercher un Badge
                </h2>
                <div className="relative flex-1 max-w-md">
                  <input 
                    type="text" 
                    placeholder="Nom, Post-nom, Matricule..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                  />
                  <Search className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" size={18} />
                </div>
              </div>

              {searchTerm && (
                <div className="space-y-4">
                  {!searchResults || searchResults.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      Aucun badge trouvé pour "<strong>{searchTerm}</strong>".
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {searchResults.map(badge => (
                        <div key={badge.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex gap-4 items-center shadow-sm">
                          {badge.photo ? (
                            <img src={badge.photo} alt="Student" className="w-14 h-14 rounded-full object-cover shadow-sm border-2 border-slate-100 dark:border-slate-700 flex-shrink-0" />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                              <span className="text-slate-400 text-xs">Sans photo</span>
                            </div>
                          )}
                          <div className="flex-1 overflow-hidden">
                            <div className="font-bold text-slate-900 dark:text-white truncate">
                              <span>
                                {badge.fullName || [badge.lastName, badge.firstName, badge.middleName].reduce((acc, part) => {
                                  const p = (part || '').trim();
                                  return (p && !acc.includes(p)) ? `${acc} ${p}` : acc;
                                }, '').trim()}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mb-2">
                              ID: {badge.idNumber || 'N/A'} • {badge.program}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold ${badge.status === 'printed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                                {badge.status === 'printed' ? 'Imprimé' : 'En attente'}
                              </span>
                              <button 
                                onClick={() => handleReprint(badge.id)}
                                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1 text-xs font-bold transition-colors"
                                title="Renvoyer vers la file d'impression"
                              >
                                <RotateCcw size={14} /> Réimprimer
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
            ) : activeTab === 'import' ? (
              /* Onglet Import Excel */
              <ExcelImport onImportStudents={handleImportStudents} />
        ) : activeTab === 'students' ? (
          /* Onglet Liste des Étudiants Importés */
          <div className="p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <input 
                  type="text" 
                  placeholder="Rechercher un étudiant..." 
                  value={studentsSearchTerm}
                  onChange={(e) => {
                    setStudentsSearchTerm(e.target.value);
                    setStudentsCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400"
                />
                <Search className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" size={18} />
              </div>
            </div>

            {studentsLoading ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <Loader2 className="mx-auto mb-3 animate-spin text-primary-500" size={32} />
                <p>Chargement de la liste des étudiants...</p>
              </div>
            ) : (() => {
              const ITEMS_PER_PAGE = 10;
              const filtered = externalStudents.filter(student => {
                if (!studentsSearchTerm) return true;
                const term = studentsSearchTerm.toLowerCase();
                const searchable = `${student.lastName || ''} ${student.firstName || ''} ${student.middleName || ''} ${student.idNumber || ''} ${student.etablissement || ''} ${student.provinceEducationnelle || ''}`.toLowerCase();
                return searchable.includes(term);
              });

              const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
              const paginated = filtered.slice(
                (studentsCurrentPage - 1) * ITEMS_PER_PAGE,
                studentsCurrentPage * ITEMS_PER_PAGE
              );

              return filtered.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400">
                  <GraduationCap className="mx-auto mb-3 opacity-30" size={40} />
                  <p>Aucun étudiant trouvé dans la base.</p>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-900">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">
                          <th className="p-4 w-12 text-center">N°</th>
                          <th className="p-4">Nom Complet</th>
                          <th className="p-4">Matricule (ID)</th>
                          <th className="p-4">Établissement</th>
                          <th className="p-4">Pourcentage</th>
                          <th className="p-4">Province éducationnelle</th>
                          <th className="p-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 text-sm">
                        {paginated.map((student, idx) => (
                          <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                            <td className="p-4 text-center text-slate-400 font-bold">
                              {(studentsCurrentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                            </td>
                            <td className="p-4 font-bold uppercase">
                              {student.fullName || [student.lastName, student.firstName, student.middleName].reduce((acc, part) => {
                                const p = (part || '').trim();
                                return (p && !acc.includes(p)) ? `${acc} ${p}` : acc;
                              }, '').trim() || '—'}
                            </td>
                            <td className="p-4 font-mono text-xs">{student.idNumber || '—'}</td>
                            <td className="p-4">{student.etablissement || '—'}</td>
                            <td className="p-4">{student.pourcentageExetat || '—'}</td>
                            <td className="p-4">{student.provinceEducationnelle || '—'}</td>
                            <td className="p-4 text-center">
                              <button 
                                onClick={() => handleDeleteExternalStudent(student.id, `${student.lastName} ${student.firstName}`)}
                                className="text-red-500 hover:text-red-600 dark:hover:text-red-400 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title="Supprimer de la base"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/20 px-6 py-4 border-t border-slate-200 dark:border-slate-800">
                      <button
                        onClick={() => setStudentsCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={studentsCurrentPage === 1}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                      >
                        <ChevronLeft size={14} /> Précédent
                      </button>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                        Page {studentsCurrentPage} sur {totalPages} (sur {filtered.length} étudiants)
                      </span>
                      <button
                        onClick={() => setStudentsCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={studentsCurrentPage === totalPages}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                      >
                        Suivant <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        ) : activeTab === 'history' ? (
          /* Onglet Historique & Regroupement A4 */
          <div className="p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <input 
                  type="text" 
                  placeholder="Rechercher dans l'historique..." 
                  value={historySearchTerm}
                  onChange={(e) => {
                    setHistorySearchTerm(e.target.value);
                    setHistoryCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400"
                />
                <Search className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" size={18} />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleBulkReprint}
                  disabled={selectedBadgeIds.length === 0}
                  className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-bold py-2.5 px-5 rounded-lg shadow-md transition-all hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <RotateCcw size={16} />
                  Réimprimer et grouper en A4 ({selectedBadgeIds.length})
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={selectedBadgeIds.length === 0}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold py-2.5 px-5 rounded-lg shadow-md transition-all hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Supprimer
                </button>
              </div>
            </div>
 
            {(() => {
              const ITEMS_PER_PAGE = 10;
              const filtered = printedBadges ? printedBadges.filter(badge => {
                if (!historySearchTerm) return true;
                const term = historySearchTerm.toLowerCase();
                const fullString = `${badge.firstName || ''} ${badge.lastName || ''} ${badge.middleName || ''} ${badge.idNumber || ''} ${badge.badgeNumber || ''}`.toLowerCase();
                return fullString.includes(term);
              }) : [];

              const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
              const paginated = filtered.slice(
                (historyCurrentPage - 1) * ITEMS_PER_PAGE,
                historyCurrentPage * ITEMS_PER_PAGE
              );
 
              return filtered.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400">
                  <History className="mx-auto mb-3 opacity-30" size={40} />
                  <p>Aucun badge trouvé dans l'historique.</p>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-900">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">
                          <th className="p-4 w-12 text-center">
                            <button 
                              onClick={() => handleToggleSelectAll(filtered)}
                              className="text-slate-400 hover:text-primary-500 transition-colors"
                            >
                              {selectedBadgeIds.length === filtered.length ? <CheckSquare size={18} className="text-primary-500" /> : <Square size={18} />}
                            </button>
                          </th>
                          <th className="p-4">Éleve / Étudiant</th>
                          <th className="p-4">Programme</th>
                          <th className="p-4">Matricule (ID)</th>
                          <th className="p-4">N° Badge</th>
                          <th className="p-4">Date d'impression</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 text-sm">
                        {paginated.map(badge => (
                          <tr key={badge.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                            <td className="p-4 text-center">
                              <button 
                                onClick={() => handleToggleSelectOne(badge.id)}
                                className="text-slate-400 hover:text-primary-500 transition-colors"
                              >
                                {selectedBadgeIds.includes(badge.id) ? <CheckSquare size={18} className="text-primary-500" /> : <Square size={18} />}
                              </button>
                            </td>
                            <td className="p-4 font-bold flex items-center gap-3">
                              {badge.photo && (
                                <img src={badge.photo} alt="Student" className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                              )}
                              <div>
                                <div>{`${badge.firstName} ${badge.lastName}`}</div>
                                {badge.middleName && <div className="text-xs font-normal text-slate-400">{badge.middleName}</div>}
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="capitalize font-semibold text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{badge.program}</span>
                            </td>
                            <td className="p-4 font-mono text-xs">{badge.idNumber}</td>
                            <td className="p-4 font-mono text-xs">{badge.badgeNumber}</td>
                            <td className="p-4 text-xs text-slate-500 dark:text-slate-400">
                              {new Date(badge.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/20 px-6 py-4 border-t border-slate-200 dark:border-slate-800">
                      <button
                        onClick={() => setHistoryCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={historyCurrentPage === 1}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                      >
                        <ChevronLeft size={14} /> Précédent
                      </button>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                        Page {historyCurrentPage} sur {totalPages} (sur {filtered.length} badges)
                      </span>
                      <button
                        onClick={() => setHistoryCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={historyCurrentPage === totalPages}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                      >
                        Suivant <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        ) : activeTab === 'settings' ? (
          <div className="p-8 space-y-8">
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white mb-1">Paramètres du Système</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Configurez le réseau local, le chiffrement de la sécurité et la synchronisation Cloud.</p>
            </div>

            {/* 1. Configuration Réseau Local */}
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                    <Cloud size={26} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">1. Serveur Central (Réseau Local 100 PCs)</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Adresse IP du PC Maître (ex: http://192.168.1.100:3000/api)</p>
                  </div>
                </div>
                <div className="flex w-full lg:w-auto items-center gap-2">
                  <input
                    type="text"
                    placeholder="Ex: http://192.168.1.100:3000/api"
                    value={apiBaseUrl}
                    onChange={(e) => setApiBaseUrlState(e.target.value)}
                    className="flex-1 w-full lg:w-80 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                  />
                  <button
                    onClick={() => {
                      setApiBaseUrl(apiBaseUrl);
                      alert("✅ L'adresse du serveur local a été sauvegardée !");
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm whitespace-nowrap text-sm"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Sécurité Mot de passe SHA-256 */}
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
                    <Lock size={26} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">2. Sécurité Accès Admin (Mot de passe Chiffré SHA-256)</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Définissez un nouveau mot de passe d'accès admin. Haché en SHA-256 cryptographique.</p>
                  </div>
                </div>
                <div className="flex w-full lg:w-auto items-center gap-2">
                  <input
                    type="password"
                    placeholder="Nouveau mot de passe"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    className="flex-1 w-full lg:w-80 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500 outline-none text-sm font-medium"
                  />
                  <button
                    onClick={async () => {
                      try {
                        await updateAdminPassword(newAdminPassword);
                        setNewAdminPassword('');
                        alert("🔒 Le mot de passe administrateur a été chiffré (SHA-256) et mis à jour avec succès !");
                      } catch (err) {
                        alert(err.message || "Erreur lors de la modification.");
                      }
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm whitespace-nowrap text-sm"
                  >
                    Changer
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Synchronisation Cloud */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-md">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-white/20 rounded-xl backdrop-blur-sm">
                    <UploadCloud size={28} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">3. Synchronisation Cloud (Firebase)</h3>
                    <p className="text-blue-100 text-sm">Sauvegardez l'ensemble des données locales sur la base de données centrale Cloud.</p>
                  </div>
                </div>
                <button
                  onClick={handleCloudSync}
                  disabled={syncStatus === 'syncing'}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg text-sm ${
                    syncStatus === 'syncing' 
                      ? 'bg-blue-400/50 text-white cursor-not-allowed' 
                      : syncStatus === 'success'
                        ? 'bg-green-500 text-white hover:bg-green-400'
                        : syncStatus === 'error'
                          ? 'bg-red-500 text-white hover:bg-red-400'
                          : 'bg-white text-blue-700 hover:bg-blue-50 hover:scale-105'
                  }`}
                >
                  {syncStatus === 'syncing' ? (
                    <><Loader2 size={18} className="animate-spin" /> Synchronisation...</>
                  ) : syncStatus === 'success' ? (
                    <><CheckCircle2 size={18} /> Synchronisé !</>
                  ) : syncStatus === 'error' ? (
                    <><AlertCircle size={18} /> Échec de la Synchro</>
                  ) : (
                    <><UploadCloud size={18} /> Pousser vers le Cloud</>
                  )}
                </button>
              </div>
              {syncMessage && (
                <p className={`mt-3 text-xs font-medium ${
                  syncStatus === 'error' ? 'text-red-200' : 'text-blue-100'
                }`}>
                  {syncMessage}
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>
      </div>
    </>
  );
};

export default Admin;
