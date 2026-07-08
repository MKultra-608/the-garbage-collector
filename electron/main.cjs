// Desktop shell for The Garbage Collector. Electron ships its own Chromium, so
// the game runs as a standalone windowed app — no browser, no server, offline.
const { app, BrowserWindow, Menu, globalShortcut } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 960,
    height: 540, // 3x the game's 320x180 internal resolution
    useContentSize: true,
    minWidth: 640,
    minHeight: 360,
    backgroundColor: '#0d0d10',
    title: 'The Garbage Collector',
    icon: path.join(__dirname, 'icon.ico'),
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      // integer-scaled pixel art; let the game own all rendering
      backgroundThrottling: false,
    },
  })

  // No application menu — this is a game, not a document editor.
  Menu.setApplicationMenu(null)
  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))

  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return
    if (input.key === 'F11') {
      win.setFullScreen(!win.isFullScreen())
      event.preventDefault()
    }
  })
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => globalShortcut.unregisterAll())
