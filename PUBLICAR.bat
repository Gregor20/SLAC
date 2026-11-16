@echo off
chcp 65001 >nul
cd /d "%~dp0"
title SLAC - Publicar la web

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Necesitas instalar Node.js, version LTS, desde https://nodejs.org
  pause
  exit /b 1
)

if not exist node_modules (
  echo.
  echo  Primera vez: instalando herramientas, un momento...
  call npm install
  if errorlevel 1 (
    echo  No se pudo instalar. Revisa tu conexion a internet.
    pause
    exit /b 1
  )
)

echo.
echo  1/3 Optimizando fotos nuevas...
call npm run optimizar
if errorlevel 1 goto fallo

echo.
echo  2/3 Verificando y preparando la web (carpeta dist)...
call npm run publicar
if errorlevel 1 goto fallo

echo.
echo  La web esta lista para subirse a Cloudflare.
set /p CONFIRMA= Escribe SI y pulsa Enter para publicarla ahora: 
if /i not "%CONFIRMA%"=="SI" (
  echo  No se ha publicado nada.
  pause
  exit /b 0
)

call npx wrangler whoami >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Hay que iniciar sesion en Cloudflare, se abrira el navegador...
  call npx wrangler login
  if errorlevel 1 goto fallo
)

echo.
echo  3/3 Subiendo a Cloudflare...
call npx wrangler deploy --assets dist --name slac --compatibility-date 2026-11-16
if errorlevel 1 goto fallo

echo.
echo  Listo: la web esta actualizada.
pause
exit /b 0

:fallo
echo.
echo  Algo ha fallado (mira el mensaje de arriba). No se ha publicado nada nuevo.
pause
exit /b 1
