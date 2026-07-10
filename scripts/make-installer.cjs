/**
 * Builds the Windows installer directly with NSIS (makensis), packaging the
 * already-built Electron app in release/win-unpacked/. This deliberately
 * bypasses electron-builder's installer step, which fails on this machine
 * because its code-signing cache contains macOS symlinks that Windows won't
 * extract without Developer Mode / admin. NSIS needs none of that.
 *
 *   npm run installer   (after `npm run dist` has produced win-unpacked/)
 */
const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const version = require(path.join(root, 'package.json')).version
const appDir = path.join(root, 'release', 'win-unpacked')
const icon = path.join(root, 'electron', 'icon.ico')
const outExe = path.join(root, 'release', `TheGarbageCollector-Setup-${version}.exe`)
const EXE = 'The Garbage Collector.exe'

if (!fs.existsSync(path.join(appDir, EXE))) {
  console.error(`missing ${path.join(appDir, EXE)} — run "npm run dist" (or app:renderer + electron-builder --dir) first`)
  process.exit(1)
}

// Find a usable makensis.exe (the NSIS root copy, sibling to Stubs/).
function findMakensis() {
  const cache = path.join(process.env.LOCALAPPDATA || '', 'electron-builder', 'Cache')
  const stack = [cache]
  while (stack.length) {
    const d = stack.pop()
    let entries = []
    try { entries = fs.readdirSync(d, { withFileTypes: true }) } catch { continue }
    for (const e of entries) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) stack.push(p)
      else if (e.name.toLowerCase() === 'makensis.exe' && fs.existsSync(path.join(d, 'Stubs'))) return p
    }
  }
  return null
}
const makensis = findMakensis()
if (!makensis) {
  console.error('makensis.exe not found in the electron-builder NSIS cache — run "npm run dist" once so NSIS is downloaded')
  process.exit(1)
}

const w = (p) => p.replace(/\//g, '\\') // NSIS prefers backslashes
const nsi = `Unicode true
!include "MUI2.nsh"

!define APPNAME "The Garbage Collector"
!define SLUG "TheGarbageCollector"
!define VERSION "${version}"

Name "\${APPNAME}"
OutFile "${w(outExe)}"
InstallDir "$LOCALAPPDATA\\Programs\\\${SLUG}"
RequestExecutionLevel user
SetCompressor /SOLID lzma

!define MUI_ICON "${w(icon)}"
!define MUI_UNICON "${w(icon)}"
!define MUI_FINISHPAGE_RUN "$INSTDIR\\${EXE}"
!define MUI_FINISHPAGE_RUN_TEXT "Play The Garbage Collector now"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"

Section "Install"
  SetOutPath "$INSTDIR"
  File /r "${w(appDir)}\\*"
  CreateShortCut "$SMPROGRAMS\\\${APPNAME}.lnk" "$INSTDIR\\${EXE}" "" "$INSTDIR\\${EXE}" 0
  CreateShortCut "$DESKTOP\\\${APPNAME}.lnk" "$INSTDIR\\${EXE}" "" "$INSTDIR\\${EXE}" 0
  WriteUninstaller "$INSTDIR\\Uninstall.exe"
  !define UNKEY "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\\${SLUG}"
  WriteRegStr HKCU "\${UNKEY}" "DisplayName" "\${APPNAME}"
  WriteRegStr HKCU "\${UNKEY}" "DisplayVersion" "\${VERSION}"
  WriteRegStr HKCU "\${UNKEY}" "Publisher" "MKultra-608"
  WriteRegStr HKCU "\${UNKEY}" "DisplayIcon" "$INSTDIR\\${EXE}"
  WriteRegStr HKCU "\${UNKEY}" "UninstallString" "$INSTDIR\\Uninstall.exe"
  WriteRegDWORD HKCU "\${UNKEY}" "NoModify" 1
  WriteRegDWORD HKCU "\${UNKEY}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  Delete "$SMPROGRAMS\\\${APPNAME}.lnk"
  Delete "$DESKTOP\\\${APPNAME}.lnk"
  RMDir /r "$INSTDIR"
  DeleteRegKey HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\\${SLUG}"
SectionEnd
`

const nsiPath = path.join(root, 'release', 'installer.nsi')
fs.writeFileSync(nsiPath, nsi)
console.log(`compiling installer with ${path.basename(makensis)} ...`)
execFileSync(makensis, [nsiPath], { stdio: 'inherit' })
const kb = (fs.statSync(outExe).size / (1024 * 1024)).toFixed(1)
console.log(`\nInstaller ready: ${path.relative(root, outExe)} (${kb} MB)`)
