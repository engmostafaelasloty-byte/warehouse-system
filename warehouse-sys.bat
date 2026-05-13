@echo off
cd /d "D:\New folder\warehouse-system"

start cmd /k npm start

timeout /t 3 > nul

start http://localhost:3000