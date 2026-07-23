/**
 * Helper de hachage de mot de passe utilisant l'API Web Crypto native (SHA-256)
 */

// Hash SHA-256 par défaut pour le mot de passe "admin2026"
export const DEFAULT_ADMIN_HASH = '6051fc84a7a0d74c225fb18a496b09952da5642e60723ecae543298edd7d82d6';

/**
 * Génère le hash SHA-256 d'une chaîne de caractères
 * @param {string} text - Le mot de passe en clair
 * @returns {Promise<string>} - Le hash SHA-256 en hexadécimal
 */
export async function hashPassword(text) {
  if (!text) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Récupère le hash du mot de passe stocké ou la valeur par défaut
 * @returns {string}
 */
export function getStoredAdminHash() {
  return localStorage.getItem('ADMIN_PASSWORD_HASH') || DEFAULT_ADMIN_HASH;
}

/**
 * Vérifie si le mot de passe fourni correspond au hash stocké
 * @param {string} inputPassword - Le mot de passe saisi par l'utilisateur
 * @returns {Promise<boolean>}
 */
export async function verifyAdminPassword(inputPassword) {
  const inputHash = await hashPassword(inputPassword);
  const currentHash = getStoredAdminHash();
  return inputHash === currentHash;
}

/**
 * Enregistre un nouveau mot de passe haché
 * @param {string} newPassword - Le nouveau mot de passe en clair
 * @returns {Promise<boolean>}
 */
export async function updateAdminPassword(newPassword) {
  if (!newPassword || newPassword.trim().length < 4) {
    throw new Error('Le mot de passe doit contenir au moins 4 caractères.');
  }
  const newHash = await hashPassword(newPassword.trim());
  localStorage.setItem('ADMIN_PASSWORD_HASH', newHash);
  return true;
}
