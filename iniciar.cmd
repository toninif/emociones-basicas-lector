@echo off
cd /d "%~dp0"
echo Abri http://localhost:8765 en Edge o Chrome.
echo Deja esta ventana abierta durante la clase. Ctrl+C para cerrar.
python -m http.server 8765 --bind 127.0.0.1
pause
