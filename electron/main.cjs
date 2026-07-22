const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV !== 'production';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false, // Ne pas afficher tant que ce n'est pas prêt
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // Permettre le chargement local
    }
  });

  // Afficher la fenêtre en plein écran et maximisée
  mainWindow.maximize();

  if (isDev) {
    // En développement, on charge l'URL du serveur Vite
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // En production, on charge le fichier HTML compilé
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Montrer la fenêtre élégamment une fois prête
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}

// Empêcher l'accélération matérielle si ça pose des soucis graphiques sur vieux PC
// app.disableHardwareAcceleration();

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
