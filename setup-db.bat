@echo off
echo Installing PostgreSQL completed!
echo.
echo Checking if the database exists...
"C:\Program Files\PostgreSQL\16\bin\psql" -U postgres -c "\l aibest_persey" 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Creating database aibest_persey...
    "C:\Program Files\PostgreSQL\16\bin\psql" -U postgres -c "CREATE DATABASE aibest_persey;"
)
echo.
echo Database setup complete!
echo.
echo Note: You will be prompted for the postgres password.
echo The default password is usually "postgres" unless you changed it during install.
echo.
pause