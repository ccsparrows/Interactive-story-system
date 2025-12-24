@echo off
echo Starting Interactive Story System...

start cmd /k "cd backend && npm install && npm run dev"
start cmd /k "cd frontend && npm install && npm start"

echo System starting... Please wait for browser to open.
