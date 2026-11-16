@echo off
chcp 65001 >nul
cd /d "%~dp0"
title SLAC - Servidor local

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Necesitas instalar Node.js, version LTS, desde https://nodejs.org
  echo  Despues vuelve a abrir este archivo.
  echo.
  pause
  exit /b 1
)

if not exist node_modules (
  echo.
  echo  Primera vez: instalando herramientas, un momento...
  call npm install
  if errorlevel 1 (
    echo.
    echo  No se pudo instalar. Revisa tu conexion a internet.
    pause
    exit /b 1
  )
)

echo.
echo  Comprobando imagenes optimizadas, solo procesa lo nuevo o cambiado...
call npm run optimizar

node scripts\servidor.js
pause
