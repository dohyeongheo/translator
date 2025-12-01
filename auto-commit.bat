@echo off
REM Auto-commit script for Windows
REM This script automatically commits changes with detailed messages

echo Checking for changes...

REM Check if there are any changes
git diff --quiet && git diff --cached --quiet
if %errorlevel% equ 0 (
    echo No changes to commit.
    exit /b 0
)

echo Staging all changes...
git add -A

REM Get changed files
for /f "delims=" %%f in ('git diff --cached --name-only') do (
    set CHANGED_FILES=%%f
)

REM Count changes
set ADDED_COUNT=0
set DELETED_COUNT=0
set MODIFIED_COUNT=0

for /f "delims=" %%f in ('git diff --cached --diff-filter=A --name-only') do (
    set /a ADDED_COUNT+=1
)

for /f "delims=" %%f in ('git diff --cached --diff-filter=D --name-only') do (
    set /a DELETED_COUNT+=1
)

for /f "delims=" %%f in ('git diff --cached --diff-filter=M --name-only') do (
    set /a MODIFIED_COUNT+=1
)

REM Build commit message
set COMMIT_MSG=Update: 

if %ADDED_COUNT% gtr 0 (
    set COMMIT_MSG=%COMMIT_MSG%Added %ADDED_COUNT% file(s). 
)

if %DELETED_COUNT% gtr 0 (
    set COMMIT_MSG=%COMMIT_MSG%Deleted %DELETED_COUNT% file(s). 
)

if %MODIFIED_COUNT% gtr 0 (
    set COMMIT_MSG=%COMMIT_MSG%Modified %MODIFIED_COUNT% file(s). 
)

REM Get file list (first 5 files)
set FILE_LIST=
set COUNT=0
for /f "delims=" %%f in ('git diff --cached --name-only') do (
    if !COUNT! lss 5 (
        if defined FILE_LIST (
            set FILE_LIST=!FILE_LIST!, %%f
        ) else (
            set FILE_LIST=%%f
        )
        set /a COUNT+=1
    )
)

set COMMIT_MSG=%COMMIT_MSG%Files: %FILE_LIST%

echo.
echo Commit message: %COMMIT_MSG%
echo.
echo Committing changes...
git commit -m "%COMMIT_MSG%"

if %errorlevel% equ 0 (
    echo.
    echo Changes committed successfully!
    echo.
    echo Push to remote? (y/n)
    set /p PUSH_CHOICE=
    if /i "%PUSH_CHOICE%"=="y" (
        echo Pushing to remote...
        git push origin main
    )
) else (
    echo Failed to commit changes.
    exit /b 1
)

