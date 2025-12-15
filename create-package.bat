REM this creates a new base package by copying the _template folder

@echo off
cls
set /p "package_name=package name:"
xcopy "_template" "base-%package_name%" /E /I /Y
cd "base-%package_name%"
pause