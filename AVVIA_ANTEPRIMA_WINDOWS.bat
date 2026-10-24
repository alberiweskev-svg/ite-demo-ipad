@echo off
setlocal
cd /d "%~dp0"
title I.T.E. Gestionale 4.0 - Anteprima locale
where powershell.exe >nul 2>nul
if errorlevel 1 (
  echo PowerShell non disponibile su questo computer.
  pause
  exit /b 1
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0AVVIA_ANTEPRIMA_WINDOWS.ps1"
if errorlevel 1 pause
endlocal
