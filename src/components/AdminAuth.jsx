import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight, ShieldAlert } from 'lucide-react';
import { verifyAdminPassword } from '../utils/crypto';

const AdminAuth = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const auth = sessionStorage.getItem('adminAuth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) return;
    setIsSubmitting(true);
    try {
      const isValid = await verifyAdminPassword(password);
      if (isValid) {
        sessionStorage.setItem('adminAuth', 'true');
        setIsAuthenticated(true);
        setError(false);
      } else {
        setError(true);
        setPassword('');
      }
    } catch (err) {
      console.error('Erreur d\'authentification:', err);
      setError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth');
    setIsAuthenticated(false);
  };

  if (isAuthenticated) {
    return (
      <>
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, { onLogout: handleLogout });
          }
          return child;
        })}
      </>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 max-w-md w-full relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-primary-500 to-purple-500"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-6 transform rotate-3">
            <Lock className="text-white transform -rotate-3" size={32} />
          </div>
          
          <h2 className="text-2xl font-black text-center text-slate-800 dark:text-white mb-2">
            Zone Sécurisée
          </h2>
          <p className="text-center text-slate-500 dark:text-slate-400 text-sm mb-8">
            Veuillez entrer le mot de passe administrateur pour accéder à ce module.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="relative">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mot de passe"
                  className={`w-full pl-4 pr-12 py-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 border ${error ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200 dark:border-slate-700'} focus:border-primary-500 focus:ring-2 focus:ring-primary-500 outline-none text-slate-800 dark:text-white font-medium transition-all`}
                  autoFocus
                />
                <button 
                  type="submit"
                  className="absolute right-2 top-2 bottom-2 bg-primary-600 hover:bg-primary-700 text-white w-10 rounded-lg flex items-center justify-center transition-colors"
                >
                  <ArrowRight size={18} />
                </button>
              </div>
              {error && (
                <div className="mt-3 flex items-center gap-2 text-red-500 text-sm font-bold bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                  <ShieldAlert size={16} /> Mot de passe incorrect
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminAuth;
