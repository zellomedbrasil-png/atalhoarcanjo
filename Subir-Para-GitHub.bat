@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================================================
echo   ENVIANDO ATALHOS ARCANJO PARA O GITHUB (zellomedbrasil-png/atalhoarcanjo)
echo ============================================================================
echo.
echo Se abrir uma janela do GitHub pedindo login, entre com a conta:
echo   zellomedbrasil-png (zellomedbrasil@gmail.com)
echo.
git remote set-url origin https://zellomedbrasil-png@github.com/zellomedbrasil-png/atalhoarcanjo.git
git add -A
git commit -m "feat: Atalhos Arcanjo v3 (Redesign Clinica Serena)" 2>nul
git push -u origin main --force
echo.
echo ============================================================================
echo   PROCESSO FINALIZADO! Confira em:
echo   https://github.com/zellomedbrasil-png/atalhoarcanjo
echo ============================================================================
pause
