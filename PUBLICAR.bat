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
echo  1/4 Optimizando fotos nuevas...
call npm run optimizar
if errorlevel 1 goto fallo

echo.
echo  2/4 Verificando y preparando la web (carpeta dist)...
call npm run publicar
if errorlevel 1 goto fallo

echo.
echo  La web esta lista para subirse a Cloudflare.
echo  Las prendas NUEVAS quedaran ocultas hasta que las actives en el panel online.
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
echo  3/4 Subiendo las fotos nuevas...
call npm run subir-imagenes
if errorlevel 1 goto fallo

echo.
echo  4/4 Subiendo la web a Cloudflare...
rem Siempre con -c wrangler.jsonc: sin el, wrangler subiria la carpeta entera del proyecto.
call npx wrangler deploy -c wrangler.jsonc
if errorlevel 1 goto fallo

echo.
echo  Listo: la web esta actualizada.
echo  Si has anadido prendas o fotos, estan OCULTAS: entra en el panel online
echo  (tu dominio, ruta /panel/) y activalas para que se vean.
pause
exit /b 0

:fallo
echo.
echo  Algo ha fallado (mira el mensaje de arriba). No se ha publicado nada nuevo.
pause
exit /b 1
