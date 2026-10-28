#!/bin/bash
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "未检测到 Node.js，请先安装 Node.js 18 或以上版本。"
  read -r -p "按回车键退出..."
  exit 1
fi
if [ ! -d node_modules ]; then
  echo "首次启动，正在安装依赖..."
  npm install --no-audit --no-fund
fi
echo "正在构建两江新区数智健康管理服务平台（Next.js）..."
npm run build || { echo "构建失败，请查看上方日志。"; read -r -p "按回车键退出..."; exit 1; }
echo "正在启动 PGlite 数据库与演示服务..."
nohup npm start > /tmp/liangjiang-demo.log 2>&1 &
for i in $(seq 1 80); do
  curl -sf http://127.0.0.1:5188/api/health >/dev/null 2>&1 && break
  sleep 0.5
done
open "http://127.0.0.1:5188/bid/home"
echo "演示地址：http://127.0.0.1:5188/bid/home"
echo "关闭此窗口不会停止服务；如需停止，请执行：pkill -f 'server/index.js'"
