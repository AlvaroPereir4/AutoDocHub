@echo off
cd /d "c:\Users\alvar\PycharmProjects\AutodocHub"
echo Iniciando AutodocHub...
start "" http://localhost:5000
python -m src.app
pause