@echo off
echo ==============================================
echo  TransitOps - Seeding MongoDB Atlas Database
echo ==============================================
cd /d "%~dp0transitops\server"

if not exist "node_modules\" (
    echo Installing backend dependencies first...
    call npm install
)

echo.
echo Seeding data to MongoDB Atlas...
node scripts\seed_all.js
echo.
pause
