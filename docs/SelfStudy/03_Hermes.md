---
sidebar_position: 3
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

:::tip 💡 小白导读：阅读路线图
本教程是一个从未接触 agent 的初学者的记录，专为从零开始的开发者设计。如果你想在 1 小时内跑通全栈，请严格按照以下线性流程进行：

1. **【阶段一：准备篇】** 完成 Windows 端的 Ollama 算力底座安装。
2. **【阶段二：决策篇】** 了解架构差异并选择路线（强烈推荐方案 A）。
3. **【阶段三：部署篇】** 根据路线指引进行操作，遇到报错直接去 **【阶段五：避坑篇】** 查对症药。
4. **【阶段四：联通篇】** 将跑通的 Hermes 后台与前端 Open-WebUI 连接。
   :::

---

## 阶段一：准备篇 —— 环境底座构建 (共通)

### 1. 软件安装与路径迁移

- 从官网下载并安装 Windows 原生版 Ollama。
- **关键配置（GUI 优先）**：
    - 打开系统托盘的 Ollama Settings 面板。
    - **模型迁移**：将 `Model location` 修改为非系统盘路径（如 `D:\OllamaModels`），彻底告别 C 盘空间焦虑。
    - **网络开放**：勾选 `Expose Ollama to the network`。这不仅是为了局域网调用，更是为了跨系统（如 WSL2 调取 Windows 算力）大动脉打通以及确保本地不同虚拟环境与进程间通信不受防火墙拦截的核心开关。

### 2. 核心模型拉取

在 PowerShell 执行以下命令，部署目前本地 Tool Calling 领域最强且适配性最好的模型：

```powershell
ollama pull qwen3:8b
# 或 14B 版本：ollama pull qwen2.5-coder:14b
```

---

## 阶段二：决策篇 —— 架构选择 (二选一)

在实际探索中，初期尝试完全在 Windows 下使用 Python 虚拟环境运行 Hermes，但遭遇了严重的系统级水土不服（例如开源 Agent 底层思维深度绑定 Bash，试图执行 `free -m` 或 `chmod` 等原生 Linux 命令时会直接触发 `Exit code 126` 报错）。

因此，针对不同的使用需求和系统条件，提供两种部署架构：

1. **方案 A (推荐)：WSL2 混合架构**。_前端 Windows (Open-WebUI) + 控制流后台 WSL2 (Hermes) + 算力引擎 Windows (Ollama)_。算力在宿主机、逻辑控制在原生 Linux 终端、可视化在 Docker，彻底规避平台兼容性问题。
2. **方案 B (备选)：Windows 原生部署**。完全在纯原生 Windows 下构建隔离沙箱，适合无法开启或不愿维护 WSL2 的用户。

---

## 阶段三：部署篇 (方案 A) —— WSL2 混合架构 (⭐强烈推荐)

:::info
👉 **行动指南**：如果你选择了方案 A，请严格执行本章。跑通后，**请直接跳过下一章（方案 B），进入“阶段四”！**
:::

### 1. WSL2 实例无损迁移至 D 盘

为了防止 WSL 虚拟磁盘吞噬系统盘，同时避免跨盘挂载（`/mnt/d`）带来的极速掉速（9P 协议瓶颈）和权限丢失，需将纯净系统物理导入 D 盘：

```powershell
# Windows PowerShell (管理员)
wsl --shutdown
mkdir D:\WSL_Backup
wsl --export Ubuntu D:\WSL_Backup\ubuntu.tar
wsl --unregister Ubuntu
mkdir D:\WSL\Ubuntu
wsl --import Ubuntu D:\WSL\Ubuntu D:\WSL_Backup\ubuntu.tar
```

### 2. 跨系统通信 (WSL2 -> Windows Ollama)

获取宿主机虚拟网关 IP，建立大动脉：

```bash
# 在 WSL2 中获取 Windows IP
cat /etc/resolv.conf | grep nameserver | awk '{print $3}'
# 假设获取到 <Your_Windows_IP>，验证打通
curl http://<Your_Windows_IP>:11434/api/tags
```

### 3. Hermes 源码编译与跨端向导配置

在完成后续提到的“网络与环境修复”后，构建 Python 3.11 沙箱并拉取源码：

```bash
mkdir -p ~/HermesWorkspace
cd ~/HermesWorkspace
python3.11 -m venv hermes_env
source hermes_env/bin/activate
pip install git+https://github.com/NousResearch/hermes-agent.git
```

执行向导命令，使用以下跨系统配置：

```bash
hermes setup
```

| 配置项         | 推荐输入值                          | 技术初衷                         |
| :------------- | :---------------------------------- | :------------------------------- |
| **Provider**   | `Custom endpoint`                   | 手动指定接口                     |
| **Base URL**   | `http://<Your_Windows_IP>:11434/v1` | **核心：指向 Windows 宿主机 IP** |
| **API Key**    | `ollama`                            | 绕过本地接口鉴权                 |
| **Model Name** | `qwen3:8b`                          | 精准匹配宿主机模型               |

:::note

其他的可以参考下面方案 B，有详细记载

:::

**突破底线拦截**：手动修改 `~/.hermes/config.yaml`，在主 `model:` 与辅助记忆 `compression:` 下均强制写入 `context_length: 64000`。

---

## 阶段三：部署篇 (方案 B) —— Windows 原生部署 (备选路线)

:::caution
👉 **行动指南**：这是没有 WSL2 环境的退路选项。如果你已经完成了方案 A，**请直接跳过本章！**
:::

### 1. 基础工具安装与环境创建

- 安装 **Python 3.11** 或更高版本（安装时务必勾选 "Add Python to PATH"）。
- 安装 **Git for Windows**。
- 建议将运行环境与代码库放在同一逻辑盘符，提高 I/O 效率并保持系统盘整洁：

```powershell
d:
mkdir D:\HermesWorkspace
cd D:\HermesWorkspace
# 创建虚拟环境
python -m venv hermes_env
# 激活环境
.\hermes_env\Scripts\activate
```

_(激活后提示符左侧应出现绿色 `(hermes_env)` 标识。)_

### 2. 源码安装与初始化向导

由于官方库更新频繁且对新语法有强依赖，建议通过 Git 直连安装：

```powershell
pip install git+https://github.com/NousResearch/hermes-agent.git
```

执行配置命令，并严格按照以下配置项进行物理直连：

```powershell
hermes setup
```

| 配置项                     | 推荐输入值                    | 技术初衷                                                                           |
| :------------------------- | :---------------------------- | :--------------------------------------------------------------------------------- |
| **Provider**               | `Custom endpoint`             | 手动指定本地推理接口                                                               |
| **Base URL**               | `http://127.0.0.1:11434/v1`   | 绕过所有虚拟网桥，实现 0 延迟本地回环通信                                          |
| **API Key**                | `ollama`                      | 绕过本地接口鉴权                                                                   |
| **Model Name**             | `qwen3:8b`                    | 锁定具备原生函数调用能力的模型                                                     |
| **Display name**           | `[直接按回车]`                | 仅仅是 Hermes 内部为了管理多个模型提供商而设置的一个展示别名，没有任何底层逻辑影响 |
| **Select TTS provider**    | `10. Keep current (Edge TTS)` | 利用 Edge 免费接口实现高质量语音。                                                 |
| **Terminal Backend**       | `7. Keep Current (Local)`     | **核心命门**：赋予 Agent 直接调用 PowerShell 和系统文件权限                        |
| **Context Length**         | `64000`                       | **必须填**：Hermes 强制要求最低 64K 窗口，留空会触发探测报错。                     |
| **Max Iterations**         | `90`                          | 设定防逻辑死循环的熔断上限                                                         |
| **Compression**            | `0.8`                         | 延迟触发记忆压缩，最大限度保留 Debug 日志堆栈                                      |
| **Session Reset**          | `4. Never auto-reset`         | 确保在处理长周期任务时 Agent 不会因超时失忆                                        |
| **Platforms**              | `[直接回车]`                  | 保持纯净本地运行，切断外部非法调用路径                                             |
| **Tools for CLI**          | `3, 4, 5` 其他自由            | 精简，剔除图像、语音、自动化点击、消息发送等易导致幻觉的臃肿工具。                 |
| **Browser Automation**     | `1. Local Browser`            | **纯本地运行**：调用本地 Headless Chromium，免费且无 API Key 依赖。                |
| **Select Search Provider** | `6. Skip`                     | duckduckgo 已经挺够用的了，还免费不会被骗钱                                        |

---

## 阶段四：进阶篇 —— Open-WebUI 接入与微服务化

在完成纯本地命令行调用后，我们可以通过 Docker 部署 Open-WebUI 并利用 Hermes 的 Gateway 模式，实现网页端图形化的高级交互体验。将 Hermes 作为微服务暴露给 Windows 上的 Docker Open-WebUI：

1. **设置全局监听与变量**：打破本地隔离。
    - 若在 **WSL2** 中，在项目运行目录（如 `HermesWorkspace`）创建 `.env` 文件并写入以下内容：
        ```env
        API_SERVER_ENABLED=true
        API_SERVER_HOST=0.0.0.0
        API_SERVER_PORT=8642
        API_SERVER_KEY=YOUR_LONG_SECURE_KEY_HERE
        GATEWAY_ALLOW_ALL_USERS=true
        ```
        _(注：代码读取的是 `API_SERVER_HOST` 而非 `HOST`。此外，当绑定 `0.0.0.0` 暴露端口时，Hermes 强制要求 `API_SERVER_KEY` 为至少 8 位以上的安全密钥，若使用类似 "ollama" 这种太短的占位符，服务会拒绝暴露。)_
    - 若在 **Windows 原生**，在 `.env` 或环境变量中设置：
        ```env
        API_SERVER_ENABLED=true
        API_SERVER_KEY=ollama
        GATEWAY_ALLOW_ALL_USERS=true
        ```
2. **启动 Gateway**：执行以下命令常驻微服务进程。
    ```bash
    hermes gateway
    ```
    _(注：启动成功不会出现 `INFO: Uvicorn running on...` 这类 FastAPI 提示。请检查日志 `tail -f ~/.hermes/logs/gateway.log`，看到类似 `[Api_Server] API server listening on http://...:8642 (model: hermes-agent)` 才是真正成功启动。)_

---

## 阶段五：避坑篇 —— 全栈遭遇问题记录 (Troubleshooting 手册)

### 1. 终端与代码环境水土不服

- **执行溃散 (Exit code 126)**：在 Windows 原生 PowerShell 中，Agent 执行系统探测命令直接报错。由于开源 Agent 底层思维深度绑定 Bash，无法理解 Windows 文件系统的执行权限与命令集，这是**促成转向 WSL2 混合架构的核心原因**。

- **终端编码崩溃 (gbk codec can't decode)**：在 Windows 下安装 Chromium 时崩溃。中文版 Windows 控制台默认编码为 GBK，当脚本打印进度条等 UTF-8 字符时会解析失败。对策：在 PowerShell 中强制开启全局 UTF-8 模式，随后运行配置：

    ```powershell
    $env:PYTHONUTF8="1"
    hermes setup
    ```

- **Windows 工具依赖安装失败 (WinError 2)**：配置 Local Browser 报错找不到文件。根因是源码中硬编码了 `"npm"` 命令而非 Windows 要求的 `npm.cmd`。对策：手动修改 `hermes_cli\tools_config.py`，将 `subprocess.run` 列表中的 `"npm"` 替换为上文已解析好的 `npm_bin` 变量。

- **幽灵版本陷阱 (Python 3.10.12 not in '>=3.11')**：Ubuntu 22.04 (WSL2) 默认 Python 锁死在 3.10，无法满足 Hermes 需求。需通过 deadsnakes PPA 补全 `python3.11`，并显式指定版本创建沙箱：
    ```bash
    python3.11 -m venv hermes_env
    ```

### 2. WSL2 迁移与网络断层

- **WSL2 实例重置后 Docker 桥接崩溃**：完成 D 盘迁移后 Docker 报 "WSL integration unexpectedly stopped"。因挂载点刷新，需在 Docker 设置的 WSL Integration 中将 Ubuntu 开关**关闭 -> Apply & restart -> 重新打开 -> Apply & restart**，强制重新下发挂载。

- **重置后 WSL 账户提权锁定 (Command not found)**：通过 `.tar` 手动导入的实例会进入 `root` 且 Windows 快捷命令失效。需在 root 终端暴力修改配置并重启：

    ```bash
    echo "[user]" >> /etc/wsl.conf
    echo "default=<Your_Username>" >> /etc/wsl.conf
    ```

- **纯净实例网络解析断层 (Connection timed out)**：纯净导入的 WSL 切断了网络映射魔法，DNS 丢失。需彻底接管 DNS 解析权限：
    ```bash
    sudo sh -c 'echo "[network]\ngenerateResolvConf = false" > /etc/wsl.conf'
    sudo rm -f /etc/resolv.conf
    sudo sh -c 'echo "nameserver 8.8.8.8" > /etc/resolv.conf'
    ```

### 3. Hermes 模型与框架底层冲突

- **上下文窗口不足 (Context window below minimum)**：报错提示模型只有 32K 窗口，Hermes 要求 64K。对策是修改 `~/.hermes/config.yaml`，在主 `model:` 与辅助 `compression:` 下均**强制覆盖写入 `context_length: 64000`**。

- **满屏 HTTP 400: model does not support tools**：使用了 DeepSeek-R1 蒸馏版等缺乏标准 JSON Schema 函数调用微调的模型，或是在 `config.yaml` 中错误地写成了 `name: qwen3:8b`。对策是切换至 Qwen3.0 系列并确保使用 `model` 键。

- **GUI 覆盖系统变量**：在环境变量中修改了模型存储路径，新模型依旧回流 C 盘。原因是 Ollama GUI 自启进程优先级高。必须统一在 **Ollama GUI 的 Settings 面板**进行路径配置。

### 4. 跨源 PPA 安装阻断与源码编译破局 (443 端口黑洞)

- **现象**：在 WSL2 中执行 `sudo apt update` 试图拉取死蛇库 (deadsnakes PPA) 的 Python 3.11 时，卡死并报错 `Could not connect to ppa.launchpadcontent.net:443 (185.125.190.80), connection timed out`。
- **根因**：
    1. 确认 `ping` 和普通 `curl` 正常，排除全局断网。
    2. `apt` 日志显示 HTTP (端口 80) 的官方源全部 Hit，唯独 HTTPS (端口 443) 的 PPA 源超时。
    3. 通过 `curl -v` 探测，发现请求在 TCP 握手阶段 (SYN 包) 直接被丢弃，甚至没有进入 SSL/TLS 层，彻底排除了 MTU (最大传输单元) 过小导致的证书包被抛弃问题。
    4. **最终定性**：当前网络环境 (ISP 或上层网关) 在底层对 Launchpad 特定 IP 的 TCP 握手进行了阻断拦截。【匿名控诉 T-Mobile 那个家庭移动WiFi是真恶心，，】
- **对策**：放弃死磕网络路由，直接利用畅通的官方 Ubuntu 源安装 C 编译环境，下载 Python 3.11 官方源码进行本地多核编译 (`make -j$(nproc)`)。

:::danger 红线原则

编译完成后，绝对不能使用 make install 覆盖系统自带的 Python 3.10，必须使用 make altinstall。Ubuntu 大量底层系统工具 (如 apt、netplan) 强依赖原生 Python 版本，强行覆盖会导致操作系统级崩溃。

:::

### 5. 前端接管与 Docker 联通问题

- **现象**：在 Open-WebUI 的 Connections 中添加接口时不知如何正确填写不同架构下的网络地址和参数。
- **对策**：根据部署模式填写 Base URL，输入对应的 API Key：
    - 若 Hermes 在 **WSL2** 中：Base URL 填写 `http://<WSL2_IP>:8642/v1` （注意 API Key 需填写你在 `.env` 中设置的长密钥）。
    - 若 Hermes 在 **Windows 原生** 中，且 Open-WebUI 在 Docker 中：Base URL 填写虚拟网桥魔法域名 `http://host.docker.internal:8642/v1` （默认端口为 8642，API Key 为 `ollama`。注意：Docker 容器内的 `127.0.0.1` 指向容器自身）。

### 6. Docker 环境导致系统盘空间吞噬综合征

- **现象**：Docker 拉取的镜像和数据卷迅速塞满系统盘。
- **根因**：WSL2 引擎将虚拟磁盘 (`.vhdx`) 默认存放在 `AppData` 深处。
- **对策**：利用 Docker Desktop GUI -> Settings -> Resources -> Virtual disk，一键将磁盘镜像无损迁移至 D 盘工作区。

---

## 附录：清理篇 —— 环境遗迹清理

若需彻底清理或切换方案，请执行以下命令保持“环境洁癖”：

- **Windows 端清理**：直接删除 `D:\HermesWorkspace` 和 `C:\Users\您的用户名\.hermes` 文件夹。

- **WSL2 端清理**：
    1. 物理删除环境：
        ```bash
        rm -rf ~/HermesWorkspace ~/.hermes
        ```
    2. 若需清理 PPA 源：
        ```bash
        sudo add-apt-repository --remove ppa:deadsnakes/ppa
        sudo rm -f /etc/apt/sources.list.d/deadsnakes*
        sudo apt update
        ```
    3. 清理 `~/.bashrc` 中的环境变量和激活脚本残留。

---

## 附录：一键启动脚本 (Windows 桌面快捷方式)

为了每次使用时免去繁琐的手动拉起环境、启动服务和等待握手过程，可以在 Windows 桌面创建一个 `Hermes一键启动.bat` 脚本（记得将 `<Your_Username>` 替换为您在 WSL 中的实际用户名）：

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
    echo [成功] Docker 引擎已满血复活！
    goto START_WSL
)
set /a RETRY_COUNT+=1
if %RETRY_COUNT% GEQ %MAX_RETRIES% (
    exit /b
)
timeout /t 2 >nul
goto CHECK_DOCKER

:START_WSL
echo [3/5] 正在后台挂载 Hermes Gateway...
powershell -NoProfile -Command "wsl.exe ~ -d Ubuntu -u <Your_Username> -e bash -c 'cd /home/<Your_Username>/HermesWorkspace && source hermes_env/bin/activate && nohup hermes gateway > gateway_auto.log 2>&1 &'"

echo [4/5] 等待微服务端口握手...
timeout /t 5 >nul

echo [5/5] 所有底座就绪，正在拉起控制面板...
start http://localhost:3000

timeout /t 3 >nul
```
