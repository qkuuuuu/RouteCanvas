#!/usr/bin/env python3
"""RouteCanvas 开发服务器启动脚本"""

import subprocess
import sys
import os
from pathlib import Path

# 切换到脚本所在目录
os.chdir(Path(__file__).parent)

BANNER = """
╔══════════════════════════════════════╗
║   RouteCanvas - 开发服务器启动脚本   ║
╚══════════════════════════════════════╝
"""


def check_node():
    """检查 Node.js 是否安装"""
    try:
        ver = subprocess.check_output(["node", "-v"], text=True).strip()
        print(f"[✓] Node.js 版本: {ver}")
        return True
    except FileNotFoundError:
        print("[✗] 未检测到 Node.js，请先安装 Node.js 20+")
        print("    下载地址: https://nodejs.org/")
        return False


def install_deps():
    """安装依赖"""
    if Path("node_modules").exists():
        print("[✓] 依赖已安装")
        return True

    print("[*] 首次运行，正在安装依赖...")
    result = subprocess.run(["npm", "install"], shell=True)
    if result.returncode != 0:
        print("[✗] 依赖安装失败，请检查网络连接")
        return False
    print("[✓] 依赖安装成功")
    return True


def start_dev():
    """启动开发服务器"""
    print("\n[→] 正在启动开发服务器...")
    print("[i] 启动后访问 http://localhost:3000")
    print("[i] 按 Ctrl+C 停止服务器\n")
    try:
        subprocess.run(["npm", "run", "dev"], shell=True)
    except KeyboardInterrupt:
        print("\n[✓] 服务器已停止")


def main():
    print(BANNER)

    if not check_node():
        sys.exit(1)

    if not install_deps():
        sys.exit(1)

    start_dev()


if __name__ == "__main__":
    main()
