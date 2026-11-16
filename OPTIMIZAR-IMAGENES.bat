@echo off
chcp 65001 >nul
cd /d "%~dp0"
title SLAC - Optimizar imagenes

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Necesitas instalar Node.js, version LTS, desde https://nodejs.org
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

call npm run optimizar
echo.
echo  Abre revision-por-modelo.html para comprobar las fotos de cada modelo.
pause
