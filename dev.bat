@echo off
title UNCLICK - Ambiente Local

echo.
echo  ==========================================
echo   UNCLICK - Dev Environment
echo  ==========================================
echo.

:: -- Verificar Node -----------------------------------------------------------
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js no encontrado. Instalar desde https://nodejs.org
    pause
    exit /b 1
)
for /f %%v in ('node --version') do echo  Node.js %%v detectado

:: -- Verificar MariaDB en 3308 -----------------------------------------------
echo  Verificando MariaDB en 127.0.0.1:3308 ...
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -h 127.0.0.1 -P 3308 -e "SELECT 1" >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  [AVISO] MariaDB no responde en el puerto 3308.
    echo          Abre XAMPP y asegurate de que MySQL este corriendo.
    echo.
    pause
) else (
    echo  MariaDB OK
)

:: -- Verificar node_modules --------------------------------------------------
if not exist "%~dp0node_modules\" (
    echo  Instalando dependencias del frontend...
    cd /d "%~dp0" && npm install
)
if not exist "%~dp0backend\node_modules\" (
    echo  Instalando dependencias del backend...
    cd /d "%~dp0backend" && npm install
)

:: -- Levantar Backend --------------------------------------------------------
echo.
echo  Levantando backend  ^>  http://localhost:3002
start "UNCLICK Backend" cmd /k "cd /d %~dp0backend && npm run dev"

:: Esperar hasta 10s a que el backend este listo
set intentos=0
:wait_backend
timeout /t 1 /nobreak >nul
curl -s http://localhost:3002/api/v1/health >nul 2>&1
if %errorlevel% neq 0 (
    set /a intentos+=1
    if %intentos% lss 10 goto wait_backend
    echo  [AVISO] Backend no respondio en 10s. Revisa la ventana del backend.
) else (
    echo  Backend OK
)

:: -- Levantar Frontend -------------------------------------------------------
echo  Levantando frontend ^>  http://localhost:5173
start "UNCLICK Frontend" cmd /k "cd /d %~dp0 && npm run dev"

:: -- Resumen -----------------------------------------------------------------
echo.
echo  ==========================================
echo   Frontend  ^>  http://localhost:5173
echo   Backend   ^>  http://localhost:3002
echo   BD        ^>  127.0.0.1:3308  (unclik)
echo  ==========================================
echo.
echo  Presiona cualquier tecla para cerrar esta ventana.
echo  (Las ventanas de backend y frontend siguen corriendo)
pause >nul
