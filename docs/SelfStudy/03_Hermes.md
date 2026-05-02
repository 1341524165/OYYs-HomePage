---
sidebar_position: 3
id: Hermes Agent Windows Native Deployment
title: Hermes Agent (Windows Native) Deployment
tags:
    - Work
    - Hermes Agent
    - Deployment
    - Troubleshooting
---

# Hermes Agent (Windows Native) 零起点部署与实战排查全手册

---

## 一、 环境底座：Ollama 推理服务部署

### 1. 软件安装与路径迁移

- 从官网下载并安装 Windows 原生版 Ollama。
- **关键配置（GUI 优先）**：
    - 打开系统托盘的 Ollama Settings 面板。
    - **模型迁移**：将 `Model location` 修改为非系统盘路径（如 `D:\OllamaModels`），彻底告别 C 盘空间焦虑。
    - **网络开放**：勾选 `Expose Ollama to the network`。这不仅是为了局域网调用，更是为了确保本地不同虚拟环境与进程间通信不受防火墙拦截。

### 2. 核心模型拉取

在 PowerShell 执行以下命令，部署目前本地 Tool Calling 领域最强且适配性最好的模型：

```powershell
ollama pull qwen2.5-coder:14b
```

---

## 二、 运行环境：Windows 原生 Python 隔离沙箱

### 1. 基础工具安装

- 安装 **Python 3.11** 或更高版本（安装时务必勾选 "Add Python to PATH"）。
- 安装 **Git for Windows**。

### 2. 创建并激活 D 盘虚拟环境

建议将运行环境与代码库放在同一逻辑盘符，提高 I/O 效率并保持系统盘整洁：

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

---

## 三、 核心部署：Hermes Agent 源码编译与向导配置

### 1. 源码安装

由于官方库更新频繁且对新语法有强依赖，建议通过 Git 直连安装以获取最新特性：

```powershell
pip install git+[https://github.com/NousResearch/hermes-agent.git](https://github.com/NousResearch/hermes-agent.git)
```

### 2. “上帝模式”初始化向导

执行 `hermes setup` 命令，并严格按照以下配置项进行物理直连：

| 配置项                   | 推荐输入值                    | 技术初衷                                                            |
| :----------------------- | :---------------------------- | :------------------------------------------------------------------ |
| **Provider**             | `Custom endpoint`             | 手动指定本地推理接口                                                |
| **Base URL**             | `http://127.0.0.1:11434/v1`   | 绕过所有虚拟网桥，实现 0 延迟本地回环通信                           |
| **API Key**              | `ollama`                      | 绕过本地接口鉴权                                                    |
| **Model Name**           | `qwen2.5-coder:14b`           | 锁定具备原生函数调用能力的模型                                      |
| **Select TTS provider**  | `10. Keep current (Edge TTS)` | 利用 Edge 免费接口实现高质量语音，还不用搞本地 TTS 模型抢显存。     |
| **Terminal Backend**     | `7. Keep Current (Local)`     | **核心命门**：赋予 Agent 直接调用 PowerShell 和系统文件权限         |
| **Context Length**       | `64000`                       | **必须填**：Hermes 强制要求最低 64K 窗口，留空会触发 32K 探测报错。 |
| **Max Iterations**       | `90`                          | 设定防逻辑死循环的熔断上限                                          |
| **Compression**          | `0.8`                         | 延迟触发记忆压缩，最大限度保留 Debug 日志堆栈                       |
| **Session Reset**        | `4. Never auto-reset`         | 确保在处理长周期任务时 Agent 不会因超时失忆                         |
| **Platforms**            | `[直接回车]`                  | 保持纯净本地运行，切断外部非法调用路径                              |
| **Tools for CLI**        | `3, 4, 5` 其他自由            | 精简，剔除图像、语音、自动化点击、消息发送等易导致幻觉的臃肿工具。  |
| **Browser Automation**   | `1. Local Browser`            | **纯本地运行**：调用本地 Headless Chromium，免费且无 API Key 依赖。 |
| **Web Search & Extract** | `6. Skip`                     | 免费的duckduckgo也不错                                              |

---

## 四、 进阶集成：Open-WebUI 接入与 Gateway 微服务架构

在完成纯本地命令行调用后，我们可以通过 Docker 部署 Open-WebUI 并利用 Hermes 的 Gateway 模式，实现网页端图形化的高级交互体验。

### 1. Open-WebUI 无法连接本地 Ollama

- **现象**：在 WebUI 中填写 `https://127.0.0.1:11434` 无法打通本地大模型。
- **根因**：Docker 容器内的 `127.0.0.1` 指向容器自身的内部隔离网段，且本地推理服务通常不支持 HTTPS。
- **对策**：使用 Docker 虚拟网桥的魔法域名，将接口地址改为 `http://host.docker.internal:11434`。

### 2. Docker 环境导致 C 盘空间吞噬综合征

- **现象**：Docker 拉取的镜像和数据卷迅速塞满系统盘。
- **根因**：WSL2 引擎将虚拟磁盘 (`.vhdx`) 默认存放在 `AppData` 深处。
- **对策**：利用 Docker Desktop GUI -> Settings -> Resources -> Virtual disk，一键将磁盘镜像无损迁移至 D 盘工作区。

### 3. Hermes Agent 服务化失败 (API 拒绝访问)

- **现象**：试图让 Open-WebUI 像调用 OpenAI 接口一样调用 Hermes 时，连接失败。
- **根因**：Hermes 默认是客户端工具，不监听外部端口。
- **对策**：在环境变量或 `.env` 中追加 `API_SERVER_ENABLED=true` 和 `API_SERVER_KEY=xxx`，使用 `hermes gateway` 启动常驻微服务。

### 4. 满屏 HTTP 400: model does not support tools

- **现象**：打通 Gateway 后，一发消息 PowerShell 端就疯狂报错 400，前端毫无响应。
- **根因**：Hermes 的 `config.yaml` 中，模型字段错误地写成了 `name: qwen3:8b`，而框架要求使用 `model` 键。
- **对策**：将 `name` 改成 `model: qwen3:8b`（根据实际使用的模型名称修改），并重启 Gateway 微服务进程。

---

## 五、 遭遇问题记录与系统级洞察

### 1. 模型逻辑冲突：DeepSeek-R1 报错

- **现象**：提示 `HTTP 400: model does not support tools`。
- **根因**：最早用的 R1 蒸馏版模型侧重推理思维，缺乏标准的 JSON Schema 函数调用微调。
- **对策**：切换至 **Qwen3.0** 系列，这是目前本地 Tool Calling Agent 比较稳定的驱动核心。

### 2. 进程权限冲突：GUI 覆盖系统变量

- **现象**：在 `.bashrc` 或`系统环境变量`里改了模型存储路径后，新模型依然回流 C 盘。
- **根因**：Ollama GUI 版开机自启进程具有更高优先级，会忽略系统级环境变量。
- **对策**：统一使用 **Ollama GUI 的 Settings 面板**进行配置，并重启进程。

### 3. Windows 平台工具依赖安装失败 (WinError 2)

- **现象**：配置 Local Browser 等工具时，打印 `Installing Node.js dependencies...` 后瞬间崩溃，报错 `FileNotFoundError: [WinError 2] 系统找不到指定的文件。`
- **根因**：Node.js 在 Windows 下的真实可执行文件是 `npm.cmd`。虽然 Hermes 的源码在函数顶部已经利用 `shutil.which("npm")` 获取到了绝对路径并赋值给 `npm_bin` 变量，但在下方调用 `subprocess.run` 时却硬编码传入了字符串 `"npm"`。这种疏忽导致 Windows 无法直接识别命令。
- **对策**：
  最优雅且不破坏原意的解法，是直接修改报错信息中指向的源码文件（例如 `D:\HermesWorkspace\hermes_env\Lib\site-packages\hermes_cli\tools_config.py`，约在 485 行附近）：
  将 `subprocess.run` 列表中硬编码的 `"npm"` 替换为变量 `npm_bin`。

    ```python
    # 修改前：
    result = subprocess.run(["npm", "install", "--silent"], capture_output=True, text=True, cwd=str(PROJECT_ROOT))
    # 修改后：
    result = subprocess.run([npm_bin, "install", "--silent"], capture_output=True, text=True, cwd=str(PROJECT_ROOT))
    ```

    修改保存后，回到 PowerShell 重新执行 `hermes setup` 即可。

### 4. 终端编码崩溃 (gbk codec can't decode)

- **现象**：在下载 Chromium 等带有进度条或特殊符号的依赖时，提示 `Installing Chromium` 后瞬间崩溃报错 `UnicodeDecodeError: 'gbk' codec can't decode byte...`。
- **根因**：中文版 Windows 的控制台默认编码是 GBK。原作者在使用 `subprocess.run(..., text=True)` 捕获终端输出时，没有明确指定 `encoding="utf-8"`。当安装脚本在控制台打印进度条或特殊符号（如 `✔`、`━`）时，Python 试图用 GBK 强行解码这些 UTF-8 字符，导致致命异常。这也是很多跨平台工具的通病。
- **对策**：
  不需要逐个去改源码里的 `encoding` 参数。我们可以利用 Python 的环境变量直接“降维打击”。
  在执行配置前，先在 PowerShell 中强制开启 Python 的全局 UTF-8 模式：
    ```powershell
    $env:PYTHONUTF8="1"
    hermes setup
    ```
    这会让 Python 在本次运行的整个生命周期内全面接管终端，默认使用 UTF-8 进行所有文本流读写，不仅杜绝崩溃，还能完美显示华丽的进度条和状态字符！

### 5. 上下文窗口不足报错 (Context window below minimum)

- **现象**：刚进入对话界面或执行 `hermes`，立马报错 `Model qwen2.5-coder:14b has a context window of 32,768 tokens, which is below the minimum 64,000 required`。
- **根因**：Hermes 框架对上下文长度有**硬性底线要求（至少 64K）**，因为它需要极大的空间来存储浏览器的网页源码（DOM Tree）以及 Agent 的“内心思考过程”。如果我们在之前的向导中 `Context Length` 直接敲回车留空，系统会自动探测 Qwen2.5 的默认上报值（通常是 32K），从而触发这个安全拦截。
- **对策**：
  打开 Hermes 的全局配置文件 `~/.hermes/config.yaml`（或 `C:\Users\您的用户名\.hermes\config.yaml`）：
    1. 找到顶部 `model:` 下的 `context_length` 这一行，将其强制修改为 `64000`（或 `65536`）。
    2. **（重点）** 向下翻找，定位到 `auxiliary:` -> `compression:` 模块。因为辅助记忆压缩也会默认使用主模型，系统会再次检测出 32K/40K 的限制，所以我们需要在该模块内也手动添加一行 `context_length: 64000` （或您设置的同样长度）来强制覆盖。
       修改保存后，再次执行 `hermes` 即可顺利越过拦截，进入对话界面！

---

## 六、 环境遗迹清理 (WSL2 发行版还原)

若此前尝试过 WSL 部署，请执行以下命令确保系统无冲突且保持“环境洁癖”：

1.  **物理删除环境**：`rm -rf ~/hermes_env ~/.hermes`。
2.  **清理第三方源 (PPA)**：
    ```bash
    # 彻底移除 deadsnakes PPA
    sudo add-apt-repository --remove ppa:deadsnakes/ppa
    # 若命令卡死，执行以下底层物理删除
    sudo rm -f /etc/apt/sources.list.d/deadsnakes*
    # 刷新软件列表
    sudo apt update
    ```
3.  **启动项清理**：从 `~/.bashrc` 中手动删除 `source ~/hermes_env/bin/activate` 相关行。
