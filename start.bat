@echo off
echo ========================================
echo 虚拟职场共享办公 - 本地启动脚本
echo ========================================
echo.

echo [1/3] 检查Python环境...
python --version
if %errorlevel% neq 0 (
    echo 错误：未找到Python，请先安装Python 3.8+
    pause
    exit /b 1
)

echo.
echo [2/3] 安装依赖...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo 警告：依赖安装可能有问题，请检查网络连接
)

echo.
echo [3/3] 启动服务器...
echo.
echo 服务启动后，请在浏览器中访问: http://127.0.0.1:8000
echo 按 Ctrl+C 停止服务器
echo.

python -m uvicorn api.index:app --host 127.0.0.1 --port 8000

pause
