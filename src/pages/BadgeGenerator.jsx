import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Printer, Download, User, Hash, Image as ImageIcon, Briefcase, FileDigit, CheckCircle2, Shield, Camera, X, Save, Search, Loader2, UserCheck, UserPlus, MapPin, Phone, School, Calendar, Percent } from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import { ExcellentiaBadge, LualabaBadge, WantashiBadge } from '../components/Badges';
import { db } from '../utils/db';
import { searchExternalStudents, registerExternalStudent } from '../services/api';

const BadgeGenerator = ({ activePrograms, onProgramChange }) => {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const badgeRef = useRef(null);
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  
  // ── Recherche API Externe ──
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedExternalId, setSelectedExternalId] = useState(null); // ID de l'étudiant sélectionné depuis l'API
  const searchTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);
  
  // ── Modale d'enregistrement nouvel étudiant ──
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const initialRegisterState = {
    fullName: '',
    idNumber: '',
    etablissement: '',
    pourcentageExetat: '',
    dateNaissance: '',
    provinceEducationnelle: '',
    telParent1: '',
    telParent2: '',
    adresse: '',
  };
  const [registerData, setRegisterData] = useState(initialRegisterState);
  
  const initialFormState = {
    program: 'excellentia',
    firstName: '',
    lastName: '',
    middleName: '',
    idNumber: '',
    badgeNumber: '',
    photo: null
  };
  
  const [formData, setFormData] = useState(initialFormState);

  // Gérer le nettoyage de la caméra si le composant est démonté
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // ── Fermer le dropdown quand on clique en dehors ──
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Recherche avec debounce (attend 400ms après la dernière frappe) ──
  const handleSearchChange = useCallback((e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    
    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchExternalStudents(query);
      setSearchResults(results);
      setShowDropdown(true);
      setIsSearching(false);
    }, 400);
  }, []);

  // ── Sélectionner un étudiant depuis les résultats ──
  const handleSelectStudent = (student) => {
    setFormData(prev => ({
      ...prev,
      lastName: student.lastName || '',
      firstName: student.firstName || '',
      middleName: student.middleName || '',
      idNumber: student.idNumber || '',
      badgeNumber: student.badgeNumber || '',
    }));
    setSelectedExternalId(student.id);
    setSearchQuery(`${student.lastName} ${student.firstName}`);
    setShowDropdown(false);
  };

  // ── Effacer la recherche et le formulaire ──
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
    setSelectedExternalId(null);
    setFormData(prev => ({
      ...initialFormState,
      program: prev.program,
    }));
  };

  // ── Ouvrir la modale d'enregistrement ──
  const handleOpenRegister = () => {
    setShowDropdown(false);
    setRegisterData({ ...initialRegisterState, fullName: searchQuery.toUpperCase() });
    setShowRegisterModal(true);
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({ ...prev, [name]: value }));
  };

  // ── Soumettre le formulaire d'enregistrement vers l'API ──
  const handleRegisterSubmit = async () => {
    if (!registerData.fullName || !registerData.idNumber) {
      alert("Le nom complet et le matricule sont obligatoires.");
      return;
    }
    setIsRegistering(true);
    try {
      const newStudent = await registerExternalStudent(registerData);
      
      // Auto-remplir le formulaire du badge avec les données retournées
      setFormData(prev => ({
        ...prev,
        lastName: newStudent.lastName || '',
        firstName: newStudent.firstName || '',
        middleName: newStudent.middleName || '',
        idNumber: newStudent.idNumber || '',
        badgeNumber: newStudent.badgeNumber || '',
      }));
      setSelectedExternalId(newStudent.id);
      setSearchQuery(newStudent.fullName || `${newStudent.lastName} ${newStudent.firstName}`);
      setShowRegisterModal(false);
      setRegisterData(initialRegisterState);
      alert(`✅ ${registerData.fullName} a été enregistré avec succès dans la base de données !`);
    } catch (err) {
      console.error('[API] Erreur enregistrement :', err);
      alert("Erreur lors de l'enregistrement. Veuillez réessayer.");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Informer le parent (App.jsx) du changement de programme pour la navbar
    if (name === 'program' && onProgramChange) {
      onProgramChange(value);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const getDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(device => device.kind === 'videoinput');
      setVideoDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des périphériques:", err);
    }
  };

  const startCamera = async (deviceIdToUse = selectedDeviceId) => {
    try {
      // Si une caméra tourne déjà, on l'arrête avant d'en lancer une nouvelle
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const constraints = {
        video: deviceIdToUse ? { deviceId: { exact: deviceIdToUse } } : { facingMode: 'user' }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setIsCameraOpen(true);
      
      // Une fois qu'on a la permission, on liste les caméras disponibles (pour avoir les vrais noms)
      await getDevices();
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error("Erreur d'accès à la caméra: ", err);
      alert("Impossible d'accéder à la caméra. Vérifiez vos permissions.");
    }
  };

  const handleDeviceChange = (e) => {
    const newDeviceId = e.target.value;
    setSelectedDeviceId(newDeviceId);
    startCamera(newDeviceId);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      
      // Fallback au cas où videoWidth n'est pas encore totalement disponible
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;
      
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      
      // Inverser l'image horizontalement pour un effet "miroir" normal
      context.translate(width, 0);
      context.scale(-1, 1);
      context.drawImage(video, 0, 0, width, height);
      
      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setFormData(prev => ({ ...prev, photo: photoDataUrl }));
      stopCamera();
    }
  };

  const availablePrograms = [
    { id: 'wantashi', name: 'Programme Wantashi', active: activePrograms.wantashi },
    { id: 'lualaba', name: 'Lualaba Bora', active: activePrograms.lualaba },
    { id: 'excellentia', name: 'Excellentia RDC', active: activePrograms.excellentia },
  ].filter(p => p.active);

  if (availablePrograms.length > 0 && !availablePrograms.find(p => p.id === formData.program)) {
    setFormData(prev => ({ ...prev, program: availablePrograms[0].id }));
  }

  const renderBadge = () => {
    switch(formData.program) {
      case 'excellentia': return <ExcellentiaBadge data={formData} />;
      case 'lualaba': return <LualabaBadge data={formData} />;
      case 'wantashi': return <WantashiBadge data={formData} />;
      default: return <div>Sélectionnez un programme</div>;
    }
  };

  const handleSave = async () => {
    if (!formData.firstName || !formData.lastName || !formData.photo) {
      alert("Veuillez remplir au moins le nom, post-nom et la photo.");
      return;
    }
    
    try {
      if (!badgeRef.current) return;

      // 0. Si c'est un nouvel étudiant (pas sélectionné depuis l'API), on l'enregistre dans la DB externe
      if (!selectedExternalId) {
        try {
          await registerExternalStudent({
            lastName: formData.lastName,
            firstName: formData.firstName,
            middleName: formData.middleName,
            idNumber: formData.idNumber,
            badgeNumber: formData.badgeNumber,
          });
          console.log('[API] Nouvel étudiant envoyé vers l\'API externe.');
        } catch (apiErr) {
          console.warn('[API] Impossible d\'enregistrer sur le serveur externe, mais le badge sera quand même généré localement.', apiErr);
        }
      }

      // 1. Prendre une capture haute résolution du composant badge
      const canvas = await html2canvas(badgeRef.current, {
        scale: 2, // Haute qualité pour impression
        useCORS: true,
        backgroundColor: null // Garder la transparence si présente
      });

      // 2. Convertir en image base64
      const badgeImageData = canvas.toDataURL('image/png');

      // 3. Sauvegarder dans la DB locale
      await db.badges.add({
        ...formData,
        externalId: selectedExternalId || null,
        badgeImageData,
        createdAt: new Date().toISOString(),
        status: 'pending'
      });

      alert(`Le badge de ${formData.firstName} ${formData.lastName} a été enregistré dans la file d'attente !`);
      
      // On garde le même programme sélectionné, mais on vide le reste
      setFormData({
        ...initialFormState,
        program: formData.program
      });
      setSearchQuery('');
      setSelectedExternalId(null);
    } catch (err) {
      console.error("Erreur lors de la sauvegarde :", err);
      alert("Erreur lors de l'enregistrement du badge : " + err.message);
    }
  };

  if (availablePrograms.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-12 text-center max-w-2xl mx-auto mt-12 transition-colors duration-200">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Aucun programme disponible</h2>
        <p className="text-slate-600 dark:text-slate-400">L'administrateur a désactivé tous les programmes. Veuillez en activer au moins un dans l'espace Administration.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 relative">
      {/* Modale de la caméra */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm print:hidden">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden max-w-xl w-full flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center gap-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2 whitespace-nowrap">
                <Camera size={20} className="text-primary-500" />
                <span className="hidden sm:inline">Prise de photo</span>
              </h3>
              
              {videoDevices.length > 1 && (
                <select 
                  value={selectedDeviceId} 
                  onChange={handleDeviceChange}
                  className="flex-1 max-w-[200px] text-sm py-1.5 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-primary-500 font-medium text-slate-900 dark:text-slate-100"
                >
                  {videoDevices.map((device, index) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Caméra ${index + 1}`}
                    </option>
                  ))}
                </select>
              )}
              
              <button onClick={stopCamera} className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors shrink-0">
                <X size={24} />
              </button>
            </div>
            <div className="bg-black relative aspect-video flex items-center justify-center">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }} // Effet miroir pour le retour vidéo
              />
              {/* Cadre de guidage */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-48 sm:w-64 sm:h-64 border-2 border-white/50 rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"></div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-900 flex justify-center border-t border-slate-200 dark:border-slate-800">
              <button 
                onClick={capturePhoto}
                className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-primary-600/30 transition-transform hover:scale-105 active:scale-95"
              >
                <Camera size={22} />
                Capturer la photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════ MODALE D'ENREGISTREMENT NOUVEL ÉTUDIANT ══════ */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm print:hidden">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden max-w-2xl w-full flex flex-col border border-slate-200 dark:border-slate-800 max-h-[90vh]">
            {/* En-tête */}
            <div className="p-5 bg-primary-50 dark:bg-primary-950/30 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-lg text-primary-900 dark:text-primary-100 flex items-center gap-2">
                <UserPlus size={22} className="text-primary-500" />
                Enregistrer un nouvel étudiant
              </h3>
              <button onClick={() => setShowRegisterModal(false)} className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                <X size={22} />
              </button>
            </div>

            {/* Corps du formulaire */}
            <div className="p-6 space-y-4 overflow-y-auto">
              {/* 1. Nom complet */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Nom complet *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-4 w-4 text-slate-400" /></div>
                  <input type="text" name="fullName" value={registerData.fullName} onChange={handleRegisterChange} placeholder="MPUNGA NTITA RUBAIN" className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 uppercase transition-all dark:text-slate-100 placeholder-slate-400 text-sm font-medium" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 2. Matricule */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Matricule *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Hash className="h-4 w-4 text-slate-400" /></div>
                    <input type="text" name="idNumber" value={registerData.idNumber} onChange={handleRegisterChange} placeholder="202200000000" className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all dark:text-slate-100 placeholder-slate-400 text-sm font-medium" />
                  </div>
                </div>

                {/* 3. Établissement */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Nom de l'établissement</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><School className="h-4 w-4 text-slate-400" /></div>
                    <input type="text" name="etablissement" value={registerData.etablissement} onChange={handleRegisterChange} placeholder="Institut Mwanga" className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all dark:text-slate-100 placeholder-slate-400 text-sm font-medium" />
                  </div>
                </div>

                {/* 4. Pourcentage Exetat */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Pourcentage Exetat</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Percent className="h-4 w-4 text-slate-400" /></div>
                    <input type="text" name="pourcentageExetat" value={registerData.pourcentageExetat} onChange={handleRegisterChange} placeholder="72%" className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all dark:text-slate-100 placeholder-slate-400 text-sm font-medium" />
                  </div>
                </div>

                {/* 5. Date de naissance */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Date de naissance</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Calendar className="h-4 w-4 text-slate-400" /></div>
                    <input type="date" name="dateNaissance" value={registerData.dateNaissance} onChange={handleRegisterChange} className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all dark:text-slate-100 placeholder-slate-400 text-sm font-medium" />
                  </div>
                </div>

                {/* 6. Province éducationnelle */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Province éducationnelle</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><MapPin className="h-4 w-4 text-slate-400" /></div>
                    <input type="text" name="provinceEducationnelle" value={registerData.provinceEducationnelle} onChange={handleRegisterChange} placeholder="Haut-Katanga" className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all dark:text-slate-100 placeholder-slate-400 text-sm font-medium" />
                  </div>
                </div>

                {/* 7. Téléphone Parent 1 */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Tél. Parent 1</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone className="h-4 w-4 text-slate-400" /></div>
                    <input type="tel" name="telParent1" value={registerData.telParent1} onChange={handleRegisterChange} placeholder="+243 990 000 001" className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all dark:text-slate-100 placeholder-slate-400 text-sm font-medium" />
                  </div>
                </div>

                {/* 8. Téléphone Parent 2 */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Tél. Parent 2</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone className="h-4 w-4 text-slate-400" /></div>
                    <input type="tel" name="telParent2" value={registerData.telParent2} onChange={handleRegisterChange} placeholder="+243 990 000 002" className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all dark:text-slate-100 placeholder-slate-400 text-sm font-medium" />
                  </div>
                </div>
              </div>

              {/* 9. Adresse complète */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Adresse complète</label>
                <div className="relative">
                  <div className="absolute top-3 left-0 pl-3 pointer-events-none"><MapPin className="h-4 w-4 text-slate-400" /></div>
                  <textarea name="adresse" value={registerData.adresse} onChange={handleRegisterChange} placeholder="12, Av. Lumumba, Lubumbashi" rows={2} className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all dark:text-slate-100 placeholder-slate-400 text-sm font-medium resize-none" />
                </div>
              </div>
            </div>

            {/* Pied de page avec actions */}
            <div className="p-5 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <button 
                onClick={() => setShowRegisterModal(false)}
                className="px-5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm"
              >
                Annuler
              </button>
              <button 
                onClick={handleRegisterSubmit}
                disabled={isRegistering}
                className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold rounded-lg shadow-md transition-all hover:-translate-y-0.5 text-sm flex items-center gap-2"
              >
                {isRegistering ? (
                  <><Loader2 size={16} className="animate-spin" /> Enregistrement...</>
                ) : (
                  <><Save size={16} /> Enregistrer dans la base</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dossier Officiel (Formulaire) */}
      <div className="flex-1 min-w-[350px]">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden print:hidden transition-colors duration-200">
          {/* En-tête du dossier */}
          <div className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center gap-3 transition-colors duration-200">
            <FileDigit className="text-primary-900 dark:text-primary-400" size={24} />
            <h2 className="text-lg font-bold text-primary-900 dark:text-primary-100 uppercase tracking-wide">Dossier d'enregistrement</h2>
          </div>
          
          <div className="p-6 space-y-6">
            {/* ── BARRE DE RECHERCHE API EXTERNE ── */}
            <div ref={dropdownRef} className="relative">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide flex items-center gap-2">
                <Search size={16} className="text-primary-500" />
                Rechercher un étudiant (Base de données)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {isSearching ? (
                    <Loader2 className="h-5 w-5 text-primary-500 animate-spin" />
                  ) : (
                    <Search className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                  )}
                </div>
                <input 
                  type="text" 
                  className="w-full pl-10 pr-10 py-3 bg-white dark:bg-slate-800 border-2 border-primary-200 dark:border-primary-800 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 font-medium" 
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                  placeholder="Tapez un nom, post-nom, matricule ou N°..."
                />
                {searchQuery && (
                  <button 
                    onClick={handleClearSearch} 
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {/* Dropdown des résultats */}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl max-h-[280px] overflow-y-auto">
                  {searchResults.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => handleSelectStudent(student)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors text-left border-b border-slate-100 dark:border-slate-700 last:border-0"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                        <UserCheck size={18} className="text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="font-bold text-slate-900 dark:text-white text-sm truncate">
                          {student.lastName} {student.firstName} {student.middleName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          ID: {student.idNumber} • N°: {student.badgeNumber}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Message "aucun résultat" + bouton enregistrer */}
              {showDropdown && searchResults.length === 0 && !isSearching && searchQuery.length >= 2 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-5 text-center">
                  <UserPlus size={28} className="mx-auto mb-2 text-amber-500" />
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Aucun étudiant trouvé pour "<strong>{searchQuery}</strong>".</p>
                  <button
                    onClick={handleOpenRegister}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-5 rounded-lg shadow-md transition-all hover:-translate-y-0.5 text-sm"
                  >
                    <UserPlus size={16} />
                    Enregistrer un nouvel étudiant
                  </button>
                </div>
              )}
            </div>

            {/* Indicateur source */}
            {selectedExternalId && (
              <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-2 rounded-lg text-sm font-medium">
                <UserCheck size={16} />
                Étudiant importé depuis la base de données externe.
              </div>
            )}

            {/* Programme */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Programme Officiel</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Briefcase className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>
                <select 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-medium text-slate-900 dark:text-slate-100 transition-all appearance-none"
                  name="program" 
                  value={formData.program} 
                  onChange={handleChange}
                >
                  {availablePrograms.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Photo */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Photographie d'identité</label>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handlePhotoUpload}
              />
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 border-2 rounded-lg transition-colors font-medium ${formData.photo ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 border-solid' : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-primary-400 dark:hover:border-primary-500 border-dashed'}`}
                  onClick={() => fileInputRef.current.click()}
                >
                  {formData.photo ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={20} />
                      <span>Photo prête</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <ImageIcon size={20} />
                      <span>Sélectionner</span>
                    </div>
                  )}
                </button>
                <button 
                  onClick={(e) => {
                    e.preventDefault(); // Prevents form submission if any
                    startCamera();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 border-2 border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-lg font-medium hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
                >
                  <Camera size={20} />
                  Prendre une photo
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nom */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Nom</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 uppercase transition-all dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500" 
                    name="lastName" 
                    value={formData.lastName} 
                    onChange={handleChange} 
                    placeholder="MPUNGA"
                  />
                </div>
              </div>

              {/* Post-nom */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Post-nom</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 uppercase transition-all dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500" 
                    name="firstName" 
                    value={formData.firstName} 
                    onChange={handleChange} 
                    placeholder="NTITA"
                  />
                </div>
              </div>

              {/* Prénom */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Prénom</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 uppercase transition-all dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500" 
                    name="middleName" 
                    value={formData.middleName} 
                    onChange={handleChange} 
                    placeholder="RUBAIN"
                  />
                </div>
              </div>

              {/* Numéro ID */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Numéro ID</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500" 
                    name="idNumber" 
                    value={formData.idNumber} 
                    onChange={handleChange} 
                    placeholder="2024023016"
                  />
                </div>
              </div>

              {/* N° Badge */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">N° (Numéro)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500" 
                    name="badgeNumber" 
                    value={formData.badgeNumber} 
                    onChange={handleChange} 
                    placeholder="00003"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
              <button 
                className="flex-1 flex items-center justify-center gap-2 bg-primary-900 dark:bg-primary-700 hover:bg-primary-800 dark:hover:bg-primary-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg shadow-primary-900/30 dark:shadow-none transition-all hover:-translate-y-0.5" 
                onClick={handleSave}
              >
                <Save size={20} />
                Enregistrer pour Impression
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Aperçu Officiel (Badge) */}
      <div className="flex-1 min-w-[450px] flex flex-col">
        <div className="bg-slate-200 dark:bg-slate-800 rounded-xl p-8 flex-1 flex flex-col items-center justify-center shadow-inner relative overflow-hidden transition-colors duration-200">
          {/* Watermark pour le style */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] dark:opacity-5 pointer-events-none text-slate-900 dark:text-white">
            <Shield size={400} />
          </div>
          
          <div className="relative z-10 transition-transform hover:scale-[1.02] duration-300">
            <div ref={badgeRef}>
              {renderBadge()}
            </div>
          </div>
        </div>
        <p className="text-center text-slate-500 dark:text-slate-400 mt-4 text-sm font-medium print:hidden">
          *Aperçu généré en temps réel pour l'impression officielle.
        </p>
      </div>
    </div>
  );
};

export default BadgeGenerator;
