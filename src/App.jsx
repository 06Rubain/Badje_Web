import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Settings, CreditCard, Moon, Sun } from 'lucide-react';
import Admin from './pages/Admin';
import BadgeGenerator from './pages/BadgeGenerator';
import './index.css';
import AdminAuth from './components/AdminAuth';

// ── Configuration par programme ──────────────────────────────────────────────
const PROGRAM_CONFIG = {
  excellentia: {
    name: 'Excellentia RDC',
    subtitle: 'Système de Génération de Badges',
    logo: '/logo.png',
    // accent bleu marine (couleur actuelle primaire)
    navBg: 'bg-white/80 dark:bg-slate-900/80',
    navBorder: 'border-slate-200/50 dark:border-slate-800/50',
    activeLink: 'bg-primary-900 dark:bg-primary-800 text-white shadow-md shadow-primary-900/20',
    nameColor: 'text-slate-800 dark:text-slate-100',
    subtitleColor: 'text-slate-500 dark:text-slate-400',
    indicator: 'bg-blue-900',
  },
  lualaba: {
    name: 'Lualaba Bora',
    subtitle: 'Système de Génération de Badges',
    logo: '/logo.png',
    // accent violet (couleur Lualaba)
    navBg: 'bg-purple-950/90 dark:bg-purple-950/95',
    navBorder: 'border-purple-800/50',
    activeLink: 'bg-purple-600 text-white shadow-md shadow-purple-600/30',
    nameColor: 'text-purple-100',
    subtitleColor: 'text-purple-300',
    indicator: 'bg-purple-600',
  },
  wantashi: {
    name: 'Programme Wantashi',
    subtitle: 'Système de Génération de Badges',
    logo: '/logo.png',
    // accent vert foncé (couleur Wantashi)
    navBg: 'bg-green-950/90 dark:bg-green-950/95',
    navBorder: 'border-green-800/50',
    activeLink: 'bg-green-600 text-white shadow-md shadow-green-600/30',
    nameColor: 'text-green-100',
    subtitleColor: 'text-green-300',
    indicator: 'bg-green-600',
  },
};

// ── Composant Navigation ──────────────────────────────────────────────────────
const Navigation = ({ darkMode, setDarkMode, selectedProgram }) => {
  const location = useLocation();
  const cfg = PROGRAM_CONFIG[selectedProgram] || PROGRAM_CONFIG.excellentia;
  const isDefault = selectedProgram === 'excellentia';

  // Couleur des liens non-actifs selon le thème du programme
  const inactiveLink = isDefault
    ? 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary-900 dark:hover:text-primary-100'
    : selectedProgram === 'lualaba'
      ? 'text-purple-200 hover:bg-purple-800/60 hover:text-white'
      : 'text-green-200 hover:bg-green-800/60 hover:text-white';

  return (
    <nav
      className={`sticky top-0 z-50 backdrop-blur-lg ${cfg.navBg} border-b ${cfg.navBorder} shadow-sm px-6 py-3 flex justify-between items-center print:hidden transition-all duration-500`}
    >
      {/* ── Logo + Nom du Programme ── */}
      <Link
        to="/"
        className="flex items-center gap-3 hover:opacity-90 transition-opacity"
      >
        <div className="relative">
          <img
            src={cfg.logo}
            alt={`Logo ${cfg.name}`}
            className="h-14 w-auto object-contain drop-shadow-md transition-all duration-500"
          />
          {/* Pastille indicateur de programme */}
          <span
            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${cfg.indicator} transition-all duration-500`}
          />
        </div>
        <div className="flex flex-col hidden md:flex">
          <span
            className={`leading-tight font-bold text-lg tracking-tight transition-all duration-500 ${cfg.nameColor}`}
          >
            {cfg.name}
          </span>
          <span
            className={`text-[10px] font-semibold uppercase tracking-widest mt-0.5 transition-all duration-500 ${cfg.subtitleColor}`}
          >
            {cfg.subtitle}
          </span>
        </div>
      </Link>

      {/* ── Liens de Navigation ── */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          <Link
            to="/"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all duration-300 ${
              location.pathname === '/' ? cfg.activeLink : inactiveLink
            }`}
          >
            <CreditCard size={18} />
            Création de Badge
          </Link>
          <Link
            to="/admin"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all duration-300 ${
              location.pathname === '/admin' ? cfg.activeLink : inactiveLink
            }`}
          >
            <Settings size={18} />
            Administration
          </Link>
        </div>

        <div className={`w-px h-8 mx-2 ${isDefault ? 'bg-slate-200 dark:bg-slate-700' : 'bg-white/20'}`} />

        {/* Bouton mode sombre/clair */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2.5 rounded-lg transition-colors ${
            isDefault
              ? 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
          title={darkMode ? 'Passer au mode clair' : 'Passer au mode sombre'}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </nav>
  );
};

// ── Composant Principal ───────────────────────────────────────────────────────
function App() {
  // Dark mode
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true' || false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Programmes actifs (géré par l'admin)
  const [activePrograms, setActivePrograms] = useState({
    wantashi: true,
    lualaba: true,
    excellentia: true,
  });

  // Programme actuellement sélectionné dans BadgeGenerator
  const [selectedProgram, setSelectedProgram] = useState('excellentia');

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
        <Navigation
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          selectedProgram={selectedProgram}
        />
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
          <Routes>
            <Route
              path="/"
              element={
                <BadgeGenerator
                  activePrograms={activePrograms}
                  onProgramChange={setSelectedProgram}
                />
              }
            />
            <Route
              path="/admin"
              element={
                <AdminAuth>
                  <Admin
                    activePrograms={activePrograms}
                    setActivePrograms={setActivePrograms}
                  />
                </AdminAuth>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
