#!/usr/bin/env bash

set -euo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ID="$(printf '%s' "$PROJECT_DIR" | cksum | cut -d' ' -f1)"
PID_FILE="${TMPDIR:-/tmp}/ethan-blog-${PROJECT_ID}.pid"
LOG_FILE="${TMPDIR:-/tmp}/ethan-blog-${PROJECT_ID}.log"
HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-3000}"

cd "$PROJECT_DIR"

if [[ -f "$PID_FILE" ]]; then
  OLD_PID="$(cat "$PID_FILE")"

  if [[ "$OLD_PID" =~ ^[0-9]+$ ]] && kill -0 "$OLD_PID" 2>/dev/null; then
    echo "正在停止旧服务（PID: $OLD_PID）..."
    kill -- "-$OLD_PID" 2>/dev/null || kill "$OLD_PID" 2>/dev/null || true

    for _ in {1..20}; do
      kill -0 "$OLD_PID" 2>/dev/null || break
      sleep 0.5
    done

    if kill -0 "$OLD_PID" 2>/dev/null; then
      echo "旧服务未正常退出，正在强制停止..."
      kill -KILL -- "-$OLD_PID" 2>/dev/null || kill -KILL "$OLD_PID" 2>/dev/null || true
    fi
  fi

  rm -f "$PID_FILE"
fi

if [[ ! -d node_modules ]]; then
  echo "未检测到依赖，正在执行 npm ci..."
  npm ci
fi

echo "正在启动开发服务：http://$HOST:$PORT"
setsid npm run dev -- --hostname "$HOST" --port "$PORT" >>"$LOG_FILE" 2>&1 &
NEW_PID=$!
echo "$NEW_PID" >"$PID_FILE"

sleep 2
if kill -0 "$NEW_PID" 2>/dev/null; then
  echo "启动成功（PID: $NEW_PID）"
  echo "本地浏览地址（请复制到外部浏览器打开）: http://localhost:$PORT"
  echo "提示：在 Trae 中直接点击链接可能会打开高度较小的内置预览窗口。"
  echo "日志文件：$LOG_FILE"
else
  rm -f "$PID_FILE"
  echo "启动失败，最近日志如下：" >&2
  tail -n 30 "$LOG_FILE" >&2
  exit 1
fi
