@echo off
chcp 65001 >nul
title Next.js Dev Server Restart

echo ==^> Stopping dev server on port 3000...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo     Killing PID: %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo ==^> Cleaning .next cache...
if exist .next rmdir /s /q .next

echo ==^> Starting dev server at http://localhost:3000
call npm.cmd run dev
