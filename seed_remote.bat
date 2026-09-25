@echo off
echo ==============================================
echo  TransitOps - Seeding MongoDB Atlas Database
echo ==============================================
cd /d "%~dp0transitops\server"
node scripts\seed_all.js
pause
