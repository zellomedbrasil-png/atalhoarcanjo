@echo off
chcp 65001 >nul
set "EXT_PATH=%~dp0dist\chrome"
if "%EXT_PATH:~-1%"=="\" set "EXT_PATH=%EXT_PATH:~0,-1%"
echo %EXT_PATH%| clip
explorer.exe "%EXT_PATH%"
echo ============================================================================
echo   ATALHOS ARCANJO - INSTALACAO RAPIDA NO CHROME / EDGE / BRAVE
echo ============================================================================
echo.
echo   [OK] O caminho da pasta da extensao ja foi COPIADO automaticamente para
echo        o seu Ctrl+V:
echo        %EXT_PATH%
echo.
echo   AGORA NO SEU NAVEGADOR:
echo   1. Digite na barra de enderecos:  chrome://extensions  (ou edge://extensions)
echo   2. Ative a chave "Modo do desenvolvedor" (canto superior direito)
echo   3. Clique em "Carregar sem compactacao" (Load unpacked)
echo   4. Pressione Ctrl+V na barra de pasta e aperte Enter!
echo ============================================================================
pause
