@echo off
setlocal
cd /d "%~dp0"
title I.T.E. Gestionale 4.0 - Anteprima locale
where py >nul 2>nul
if %errorlevel%==0 (
  echo Avvio anteprima I.T.E. 4.0 sul computer...
  echo Indirizzo: http://127.0.0.1:8765/
  start "" "http://127.0.0.1:8765/"
  py -3 -m http.server 8765 --bind 127.0.0.1
  goto :end
)
where python >nul 2>nul
if %errorlevel%==0 (
  echo Avvio anteprima I.T.E. 4.0 sul computer...
  echo Indirizzo: http://127.0.0.1:8765/
  start "" "http://127.0.0.1:8765/"
  python -m http.server 8765 --bind 127.0.0.1
  goto :end
)
echo.
echo Python 3 non risulta installato su questo computer.
echo Installa Python 3 e riapri questo file.
echo Nessuna modifica viene apportata alla versione pubblicata 3.0.74.
pause
:end
endlocal
