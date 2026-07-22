const { contextBridge, ipcRenderer } = require('electron');

// Exposer des API sécurisées pour React si nécessaire
contextBridge.exposeInMainWorld('electron', {
  // Par exemple, pour récupérer des informations système ou communiquer avec le backend Node.js
  platform: process.platform,
});
