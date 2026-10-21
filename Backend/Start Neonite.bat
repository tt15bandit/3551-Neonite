@echo off
setlocal
pushd "%~dp0"
if errorlevel 1 exit /b 1
title NeoniteV2 - Port 3551

if not exist "runtime\node.exe" (
    echo Missing bundled runtime\node.exe. Copy the complete portable folder.
    goto failed
)
if not exist "node_modules\sails\package.json" (
    echo Missing dependencies. Copy the complete portable folder including node_modules.
    goto failed
)

set "NODE_ENV=production"
"%~dp0runtime\node.exe" "%~dp0app.js"
if errorlevel 1 goto failed
popd
exit /b 0

:failed
echo Neonite could not start. See the error above.
pause
popd
exit /b 1
