@echo off
:: Windows環境変数のPATH再読込をシミュレート
set PATH=%SystemRoot%\system32;%SystemRoot%;%SystemRoot%\System32\Wbem;%SYSTEMROOT%\System32\WindowsPowerShell\v1.0\;C:\Program Files\nodejs\;%PATH%

cd /d "%~dp0"
echo ==========================================
echo  ぼうけんルート アプリ起動バッチ
echo ==========================================
echo.
echo Next.js の開発サーバーを起動しています...
echo ブラウザで http://localhost:3000 または http://192.168.11.4:3000 にアクセスしてください。
echo 終了するには、この黒い画面で Ctrl + C を押してください。
echo.
npm run dev -- -H 0.0.0.0
pause
