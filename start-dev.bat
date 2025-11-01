@echo off
chcp 65001 >nul
cls

echo ================================================================
echo   SISTEMA DE AGENDAMENTOS - INICIANDO AMBIENTE DE DEV
echo ================================================================
echo.

REM ====================================
REM 1. MATAR PROCESSOS NODE.JS NA PORTA 3000 E 5173
REM ====================================
echo [1/5] Matando processos Node.js nas portas 3000 e 5173...

REM Matar processos na porta 3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    if not "%%a"=="0" (
        taskkill /F /PID %%a >nul 2>&1
    )
)

REM Matar processos na porta 5173
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do (
    if not "%%a"=="0" (
        taskkill /F /PID %%a >nul 2>&1
    )
)

REM Matar todos os processos node.exe e nodemon (seguranca extra)
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM nodemon.exe >nul 2>&1

echo     Portas liberadas!
timeout /t 2 /nobreak >nul
echo.

REM ====================================
REM 2. LIMPAR CACHES E ARQUIVOS TEMPORARIOS
REM ====================================
echo [2/5] Limpando caches e arquivos temporarios...

REM Backend - Limpar cache do node_modules
if exist "backend\.cache" (
    rmdir /s /q "backend\.cache" >nul 2>&1
)

REM Frontend - Limpar cache do Vite
if exist "frontend\node_modules\.vite" (
    rmdir /s /q "frontend\node_modules\.vite" >nul 2>&1
)
if exist "frontend\dist" (
    rmdir /s /q "frontend\dist" >nul 2>&1
)

echo     Caches limpos!
echo.

REM ====================================
REM 3. VERIFICAR DEPENDENCIAS
REM ====================================
echo [3/5] Verificando dependencias...

REM Verificar se node_modules existe no backend
if not exist "backend\node_modules" (
    echo    Dependencias do backend nao encontradas!
    echo    Instalando dependencias do backend...
    cd backend
    call npm install
    cd ..
    echo     Dependencias do backend instaladas!
) else (
    echo     Dependencias do backend OK!
)

REM Verificar se node_modules existe no frontend
if not exist "frontend\node_modules" (
    echo    Dependencias do frontend nao encontradas!
    echo    Instalando dependencias do frontend...
    cd frontend
    call npm install
    cd ..
    echo     Dependencias do frontend instaladas!
) else (
    echo     Dependencias do frontend OK!
)

echo.

REM ====================================
REM 4. VERIFICAR ARQUIVOS .ENV
REM ====================================
echo [4/5] Verificando arquivos de configuracao...

REM Verificar .env do backend
if not exist "backend\.env" (
    echo    Arquivo backend\.env nao encontrado!
    if exist "backend\.env.example" (
        echo    Copiando .env.example para .env...
        copy "backend\.env.example" "backend\.env" >nul
        echo.
        echo    IMPORTANTE: Configure as credenciais do Mercado Pago no arquivo backend\.env
        echo               E defina um TUNNEL_SUBDOMAIN fixo para o webhook!
        echo.
    ) else (
        echo    ERRO: backend\.env.example nao encontrado!
        pause
        exit /b 1
    )
) else (
    echo     backend\.env encontrado!
)

REM Verificar .env do frontend
if not exist "frontend\.env" (
    echo    Arquivo frontend\.env nao encontrado!
    if exist "frontend\.env.example" (
        echo    Copiando .env.example para .env...
        copy "frontend\.env.example" "frontend\.env" >nul
        echo.
        echo    IMPORTANTE: Configure a Public Key do Mercado Pago no arquivo frontend\.env
        echo.
    ) else (
        echo    ERRO: frontend\.env.example nao encontrado!
        pause
        exit /b 1
    )
) else (
    echo     frontend\.env encontrado!
)

echo.

REM ====================================
REM 5. INICIAR SERVIDORES
REM ====================================
echo [5/5] Iniciando servidores...
echo.
echo ================================================================
echo   DICA: Para fechar tudo, apenas feche esta janela
echo ================================================================
echo.

REM Criar logs
if not exist "logs" mkdir logs

REM Iniciar Backend com Tunnel em uma nova janela
echo    Iniciando Backend com LocalTunnel (Porta 3000)...
start "BACKEND - Sistema de Agendamentos" cmd /k "cd /d %~dp0backend && npm run dev:tunnel"

REM Aguardar 5 segundos para o backend iniciar
timeout /t 5 /nobreak >nul

REM Iniciar Frontend em uma nova janela
echo    Iniciando Frontend (Porta 5173)...
start "FRONTEND - Sistema de Agendamentos" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ================================================================
echo    SERVIDORES INICIADOS COM SUCESSO!
echo ================================================================
echo.
echo   Backend (API):       http://localhost:3000/api
echo   Frontend (App):      http://localhost:5173
echo   Admin Panel:         http://localhost:5173/admin
echo.
echo ================================================================
echo   WEBHOOK DO MERCADO PAGO - CONFIGURACAO IMPORTANTE!
echo ================================================================
echo.
echo   A URL publica do LocalTunnel aparecera na janela do Backend.
echo   Com TUNNEL_SUBDOMAIN configurado no .env, a URL sera SEMPRE a mesma!
echo.
echo   Formato da URL do webhook:
echo   https://[seu-subdominio].loca.lt/api/webhook/mercadopago
echo.
echo   PASSOS PARA CONFIGURAR NO MERCADO PAGO:
echo   1. Veja a URL completa na janela do Backend
echo   2. Acesse: https://www.mercadopago.com.br/developers/panel
echo   3. Suas aplicacoes ^> [Sua App] ^> Webhooks
echo   4. Cole a URL do webhook
echo   5. Marque apenas "Pagamentos"
echo   6. Salve
echo.
echo   Guia completo: WEBHOOK_LOCAL_SETUP.md
echo.
echo ================================================================
echo.
echo   Documentacao:
echo      - MERCADOPAGO_SETUP.md    (Setup completo do Mercado Pago)
echo      - WEBHOOK_LOCAL_SETUP.md  (Configuracao do webhook local)
echo      - QUICK_START.md          (Guia rapido)
echo.
echo ================================================================
echo.
echo   Para parar os servidores, feche as janelas ou pressione
echo   CTRL+C em cada uma delas.
echo.
echo   Aguarde alguns segundos para os servidores iniciarem...
echo.

REM Aguardar mais 3 segundos
timeout /t 3 /nobreak >nul

REM Abrir o navegador automaticamente
echo   Abrindo navegador...
start http://localhost:5173

echo.
echo   Ambiente pronto! Bom trabalho!
echo.
echo ================================================================
echo.

REM Manter a janela aberta para mostrar as informacoes
pause
