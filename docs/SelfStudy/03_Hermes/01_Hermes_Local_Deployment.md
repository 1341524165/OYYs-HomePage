---
sidebar_position: 1
id: hermes-agent-hybrid-deployment
title: Hermes Agent 零起点部署与全栈排查全手册 (原生与混合架构)
tags:
    - Work
    - Hermes Agent
    - Deployment
    - WSL2
    - Troubleshooting
---

# Hermes Agent 零起点部署与实战排查全手册

:::tip 阅读路线

本篇是从零部署 Hermes Agent 的实战记录，适合第一次接触本地 agent 的读者。建议按下面顺序阅读：

1. 阶段一：安装 Windows 端 Ollama，准备本地模型底座。
2. 阶段二：理解 Windows 原生与 WSL2 混合架构的差异。
3. 阶段三：按选定路线部署 Hermes，推荐优先走 **方案 A**。
4. 阶段四：将 Hermes 接入 Open-WebUI。
5. 阶段五：遇到问题时按报错查 troubleshooting。

:::

---

## 阶段一：准备篇 —— 环境底座构建

### 1. 安装 Ollama 并迁移模型路径

从官网下载并安装 Windows 原生版 Ollama。安装完成后，打开系统托盘里的 Ollama Settings 面板，重点检查两项：

| 配置项                       | 建议                                       |
| :--------------------------- | :----------------------------------------- |
| **Model location**           | 修改为非系统盘路径，例如 `D:\OllamaModels` |
| **Expose Ollama to the network** | 勾选，方便 WSL2 和其他本地进程访问     |

:::note

`Expose Ollama to the network` 不只是为了局域网访问。对于 WSL2 混合架构，它也是 **WSL2 调用 Windows 宿主机算力的关键开关**。

:::

### 2. 拉取核心模型

在 PowerShell 执行：

```powershell
ollama pull qwen3:8b
# 或 14B 版本：
ollama pull qwen2.5-coder:14b
```

`qwen3:8b` 是本次教程使用的基础模型，重点是能跑通 Hermes 的本地 tool calling 流程。

---

## 阶段二：决策篇 —— 架构选择

初期尝试完全在 Windows 下运行 Hermes，但遇到了明显的平台不适配：Agent 会调用 `free -m`、`chmod` 等 Linux 命令，在原生 Windows PowerShell 中容易触发 `Exit code 126` 等错误。

因此这里保留两条路线：

| 方案                     | 适用场景                                            | 推荐程度 |
| :----------------------- | :-------------------------------------------------- | :------- |
| **方案 A：WSL2 混合架构** | Windows 提供 Ollama 算力，WSL2 运行 Hermes 控制逻辑 | **推荐** |
| 方案 B：Windows 原生部署 | 无法启用 WSL2，或只想验证最小本地流程               | 备选     |

方案 A 的结构是：

```text
Windows Ollama -> WSL2 Hermes -> Docker / Open-WebUI
```

算力留在宿主机，控制逻辑放在 Linux 环境，能避开大部分 **Windows 命令兼容问题**。

---

## 阶段三：部署篇 (方案 A) —— WSL2 混合架构

:::info

如果你选择方案 A，请执行本章。跑通后可以 **直接跳到阶段四**。

:::

### 1. 将 WSL2 实例迁移到 D 盘

为了避免 WSL 虚拟磁盘持续占用系统盘，同时减少跨盘挂载带来的 I/O 与权限问题，可以将 WSL 实例导出后重新导入到 D 盘。

在管理员 PowerShell 中执行：

```powershell
wsl --shutdown
mkdir D:\WSL_Backup
wsl --export Ubuntu D:\WSL_Backup\ubuntu.tar
wsl --unregister Ubuntu
mkdir D:\WSL\Ubuntu
wsl --import Ubuntu D:\WSL\Ubuntu D:\WSL_Backup\ubuntu.tar
```

### 2. 打通 WSL2 到 Windows Ollama

在 WSL2 中获取 Windows 宿主机 IP：

```bash
cat /etc/resolv.conf | grep nameserver | awk '{print $3}'
```

假设结果为 `<Your_Windows_IP>`，验证 Ollama 能访问：

```bash
curl http://<Your_Windows_IP>:11434/api/tags
```

### 3. 安装 Hermes

创建 Python 3.11 虚拟环境，并安装 Hermes：

```bash
mkdir -p ~/HermesWorkspace
cd ~/HermesWorkspace
python3.11 -m venv hermes_env
source hermes_env/bin/activate
pip install git+https://github.com/NousResearch/hermes-agent.git
```

执行初始化向导：

```bash
hermes setup
```

推荐填写：

| 配置项     | 输入值                              | 说明                       |
| :--------- | :---------------------------------- | :------------------------- |
| Provider   | `Custom endpoint`                   | 手动指定推理接口           |
| **Base URL** | `http://<Your_Windows_IP>:11434/v1` | 指向 Windows 宿主机 Ollama |
| API Key    | `ollama`                            | 本地接口占位鉴权           |
| Model Name | `qwen3:8b`                          | 匹配宿主机模型             |

:::note

方案 A 的向导记录较短，其他细节可以参考下面的方案 B 表格。

:::

### 4. 手动补充 context_length

如果 Hermes 探测到本地模型上下文过小，可手动修改 `~/.hermes/config.yaml`，在 **主模型** 和 **辅助压缩模型** 中补充：

```yaml
context_length: 64000
```

对应位置通常是：

```yaml
model:
    context_length: 64000

auxiliary:
    compression:
        context_length: 64000
```

---

## 阶段三：部署篇 (方案 B) —— Windows 原生部署

:::caution

这是没有 WSL2 环境时的备选路线。如果 **方案 A 已经跑通**，可以跳过本章。

:::

### 1. 准备 Python 和 Git

安装 Python 3.11 或更高版本，并安装 Git for Windows。建议把运行环境放在非系统盘：

```powershell
d:
mkdir D:\HermesWorkspace
cd D:\HermesWorkspace
python -m venv hermes_env
.\hermes_env\Scripts\activate
```

激活后，终端左侧应出现 `(hermes_env)`。

### 2. 安装 Hermes 并执行 setup

```powershell
pip install git+https://github.com/NousResearch/hermes-agent.git
hermes setup
```

推荐填写：

| 配置项                 | 输入值                        | 说明                         |
| :--------------------- | :---------------------------- | :--------------------------- |
| Provider               | `Custom endpoint`             | 手动指定本地推理接口         |
| Base URL               | `http://127.0.0.1:11434/v1`   | Windows 本地回环地址         |
| API Key                | `ollama`                      | 本地占位鉴权                 |
| Model Name             | `qwen3:8b`                    | 使用具备函数调用能力的模型   |
| Display name           | 直接回车                      | 仅作为 Hermes 内部展示名     |
| Select TTS provider    | `10. Keep current (Edge TTS)` | 使用 Edge TTS                |
| Terminal Backend       | `7. Keep Current (Local)`     | 允许 Agent 调用本机终端      |
| **Context Length**     | `64000`                       | 避免低于 Hermes 最小窗口要求 |
| Max Iterations         | `90`                          | 防止长任务无限循环           |
| Compression            | `0.8`                         | 延迟触发压缩，保留更多上下文 |
| Session Reset          | `4. Never auto-reset`         | 长周期任务不自动重置         |
| Platforms              | 直接回车                      | 保持纯本地运行               |
| Tools for CLI          | `3, 4, 5` 等按需选择          | 精简工具集，减少噪声         |
| Browser Automation     | `1. Local Browser`            | 使用本地浏览器自动化         |
| Select Search Provider | `6. Skip`                     | 暂不配置外部搜索             |

---

## 阶段四：进阶篇 —— 接入 Open-WebUI

完成 Hermes 命令行调用后，可以通过 gateway 将 Hermes 暴露为微服务，再接入 Open-WebUI。

### 1. 配置 API Server

如果 Hermes 运行在 WSL2 中，在项目运行目录创建 `.env`：

```env
API_SERVER_ENABLED=true
API_SERVER_HOST=0.0.0.0
API_SERVER_PORT=8642
API_SERVER_KEY=YOUR_LONG_SECURE_KEY_HERE
GATEWAY_ALLOW_ALL_USERS=true
```

如果 Hermes 运行在 Windows 原生环境，可以使用：

```env
API_SERVER_ENABLED=true
API_SERVER_KEY=ollama
GATEWAY_ALLOW_ALL_USERS=true
```

:::note

代码读取的是 `API_SERVER_HOST`，不是 `HOST`。当监听 `0.0.0.0` 时，`API_SERVER_KEY` 需要足够长，**不能使用过短占位符**。

:::

### 2. 启动 Gateway

```bash
hermes gateway
```

启动成功不一定会直接显示 FastAPI 风格的 `Uvicorn running`。建议查看日志：

```bash
tail -f ~/.hermes/logs/gateway.log
```

看到类似下面的内容，才说明 API Server 真正启动：

```text
[Api_Server] API server listening on http://...:8642 (model: hermes-agent)
```

---

## 阶段五：避坑篇 —— Troubleshooting

### 1. 终端与代码环境问题

| 现象                             | 原因                                  | 对策                                 |
| :------------------------------- | :------------------------------------ | :----------------------------------- |
| `Exit code 126`                  | Windows 原生环境不兼容部分 Linux 命令 | 优先切换到 **WSL2 混合架构**         |
| `gbk codec can't decode`         | 中文 Windows 控制台默认编码为 GBK     | 在 PowerShell 中启用 UTF-8           |
| `WinError 2`                     | Windows 下 `npm` / `npm.cmd` 解析差异 | 修改相关脚本，使用解析后的 `npm_bin` |
| `Python 3.10.12 not in '>=3.11'` | Ubuntu 22.04 默认 Python 版本过低     | 显式安装并使用 Python 3.11           |

PowerShell UTF-8 设置：

```powershell
$env:PYTHONUTF8="1"
hermes setup
```

Python 3.11 虚拟环境：

```bash
python3.11 -m venv hermes_env
```

### 2. WSL2 迁移与网络问题

| 现象                              | 对策                                                         |
| :-------------------------------- | :----------------------------------------------------------- |
| Docker 报 WSL integration stopped | 在 Docker Desktop 的 WSL Integration 中关闭再重新开启 Ubuntu |
| 导入后的 WSL 默认进入 root        | 在 `/etc/wsl.conf` 中设置默认用户                            |
| DNS 解析失败                      | 关闭自动生成 resolv.conf，并手动写入 DNS                     |

设置默认用户：

```bash
echo "[user]" >> /etc/wsl.conf
echo "default=<Your_Username>" >> /etc/wsl.conf
```

修复 DNS：

```bash
sudo sh -c 'echo "[network]\ngenerateResolvConf = false" > /etc/wsl.conf'
sudo rm -f /etc/resolv.conf
sudo sh -c 'echo "nameserver 8.8.8.8" > /etc/resolv.conf'
```

### 3. Hermes 模型与配置问题

| 现象                                   | 对策                                                                 |
| :------------------------------------- | :------------------------------------------------------------------- |
| Context window below minimum           | 在 `model` 与 `auxiliary.compression` 下写入 **`context_length: 64000`** |
| HTTP 400: model does not support tools | 换成支持 tool calling 的模型，例如 Qwen3 系列                        |
| Ollama 模型仍写入 C 盘                 | 在 Ollama GUI Settings 中统一修改模型路径                            |

:::note

如果 `config.yaml` 里把模型写成了 `name: qwen3:8b`，需要改成 Hermes 识别的 **`model` 字段**。

:::

### 4. deadsnakes PPA 443 端口超时

现象：

```text
Could not connect to ppa.launchpadcontent.net:443
connection timed out
```

排查结论是当前网络对 Launchpad 特定 IP 的 TCP 握手存在阻断。若官方 Ubuntu 源仍可访问，可以跳过 PPA，直接安装编译依赖后从 Python 官方源码编译 Python 3.11。

:::danger 红线原则

编译 Python 时 **不要使用 `make install` 覆盖系统 Python**。应使用 `make altinstall`，避免破坏 Ubuntu 的系统工具链。

:::

### 5. Open-WebUI 与 Docker 联通问题

根据部署位置填写 Base URL：

| Hermes 位置                           | Open-WebUI Base URL                   |
| :------------------------------------ | :------------------------------------ |
| WSL2                                  | `http://<WSL2_IP>:8642/v1`            |
| Windows 原生，Open-WebUI 在 Docker 中 | `http://host.docker.internal:8642/v1` |

Docker 容器里的 **`127.0.0.1` 指向容器自己**，不是 Windows 宿主机。

### 6. Docker 占用系统盘

Docker 镜像和数据卷默认可能落在系统盘。可以通过 Docker Desktop：

```text
Settings -> Resources -> Virtual disk
```

将虚拟磁盘迁移到 D 盘。

---

## 附录：环境清理

Windows 端清理：

```text
D:\HermesWorkspace
C:\Users\<Your_Username>\.hermes
```

WSL2 端清理：

```bash
rm -rf ~/HermesWorkspace ~/.hermes
sudo add-apt-repository --remove ppa:deadsnakes/ppa
sudo rm -f /etc/apt/sources.list.d/deadsnakes*
sudo apt update
```

最后检查 `~/.bashrc`，删除不再需要的环境变量或自动激活脚本。

---

## 附录：Windows 一键启动脚本

可以在 Windows 桌面创建 `Hermes一键启动.bat`，将 `<Your_Username>` 替换为自己的 WSL 用户名：

```bat
@echo off
chcp 65001 >nul

echo [1/5] 正在唤醒 Docker Desktop...
set DOCKER_PATH="C:\Program Files\Docker\Docker\Docker Desktop.exe"
if exist %DOCKER_PATH% (
    start "" %DOCKER_PATH%
) else (
    exit /b
)

echo [2/5] 等待 Docker 引擎就绪...
set RETRY_COUNT=0
set MAX_RETRIES=30

:CHECK_DOCKER
docker ps >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [成功] Docker 引擎已就绪
    goto START_WSL
)
set /a RETRY_COUNT+=1
if %RETRY_COUNT% GEQ %MAX_RETRIES% (
    exit /b
)
timeout /t 2 >nul
goto CHECK_DOCKER

:START_WSL
echo [3/5] 正在后台启动 Hermes Gateway...
powershell -NoProfile -Command "wsl.exe ~ -d Ubuntu -u <Your_Username> -e bash -c 'cd /home/<Your_Username>/HermesWorkspace && source hermes_env/bin/activate && nohup hermes gateway > gateway_auto.log 2>&1 &'"

echo [4/5] 等待微服务端口握手...
timeout /t 5 >nul

echo [5/5] 打开控制面板...
start http://localhost:3000

timeout /t 3 >nul
```
