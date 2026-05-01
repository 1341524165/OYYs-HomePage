# Hermes Agent (Windows+WSL2+Docker) 本地化部署与排查全记录

## 一、 完整安装与部署全流程

此架构采用“宿主物理算力 + 虚拟网卡穿透 + 容器安全隔离”的混合部署模式，将大模型推理与 Agent 代码执行环境进行解耦。

**1. 准备物理底座与沙箱环境**

- **拉起 WSL2**：在管理员 PowerShell 执行 `wsl --install`，安装原生 Ubuntu 环境。
- **配置沙箱**：安装 Docker Desktop，在设置中开启 `Use the WSL 2 based engine`，并打开 Ubuntu 发行版的集成开关，确保隔离沙箱就绪。

**2. 部署 Ollama 推理服务**

- **安装**：下载并安装 Windows 原生版 Ollama。
- **配置 GUI 面板（关键）**：打开 Ollama 系统托盘的 Settings 面板：
    - 设置 `Model location` 为自定义大容量路径（如 `D:\OllamaModels`）。
    - 开启 `Expose Ollama to the network` 允许跨网段调用。
- **拉取工作模型**：在 PowerShell 执行 `ollama pull qwen2.5-coder:14b`（本地 Tool Calling 的最优解）。

**3. 构建隔离的 Python 运行环境 (WSL2 内)**

- **升级 Python 工具链**：引入 deadsnakes PPA (`sudo add-apt-repository ppa:deadsnakes/ppa`)，安装 Python 3.11 (`sudo apt install python3.11 python3.11-venv -y`)。
- **隔离环境**：创建并激活专属虚拟环境：
    ```bash
    python3.11 -m venv ~/hermes_env
    source ~/hermes_env/bin/activate
    ```

**4. 源码编译安装 Hermes**

- 官方未在 PyPI 注册该包，需直接从 GitHub 仓库拉取并编译底层依赖：
    ```bash
    pip install git+[https://github.com/NousResearch/hermes-agent.git](https://github.com/NousResearch/hermes-agent.git)
    ```

**5. 核心调度引擎初始化 (`hermes setup`)**
在激活的虚拟环境中，执行初始化向导并严格按照物理架构进行路由配置：

- **Provider**: 选择 `Custom endpoint (enter URL manually)`。
- **Base URL**: 填入网桥物理 IP `http://172.27.0.1:11434/v1`（绕过 DNS 解析坑）。
- **API Key**: 填入 `ollama` 占位符绕过校验。
- **Model Name**: 填入 `qwen2.5-coder:14b`。
- **Execution Backend**: 选择 `Docker`，并开启文件系统持久化 (`yes`)。
- **Context Compression**: 设置为 `0.8` 以保留更多上下文调试记忆。
- **Session Reset**: 选择 `Never auto-reset`，由开发者完全掌控生命周期。

---

## 二、 疑难杂症与底层排查记录

在系统级开发和打通跨网段通信时，我们遇到并解决了以下三大类核心问题。

### 📌 类别 1：模型协议与能力匹配

| 遭遇问题 / 现象                                                                             | 底层原因分析                                                                                                                          | 最终解决方案                                                                                            |
| :------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------ |
| **R1 工具调用报错**<br>`HTTP 400 Bad Request: model deepseek-r1:14b does not support tools` | 纯推理模型（DeepSeek-R1 蒸馏版）缺乏标准 JSON/Function Calling 微调，Ollama API 网关直接将无法解析的工具请求拦截。                    | 放弃强制修改 Agent 提示词解析框架的折腾路线，**切换底层模型**至原生精通工具调用的 `qwen2.5-coder:14b`。 |
| **模型选择困难**<br>Llama 3 跑分高但不确定是否适合，云端模型烧 Token 成本高。               | Llama 3 (8B) 代码能力深度不足；云端 API (Claude 3.5 / DeepSeek-V3) 虽然极度聪明，但在长上下文闭环测试中成本不可控且破坏本地沙箱隐私。 | 锁定本地 32GB 内存极限，选择在代码生成和系统调度上综合实力最强的 **Qwen 2.5 Coder**。                   |

### 📌 类别 2：资源分配与文件系统（幽灵数据）

| 遭遇问题 / 现象                                                                                                                 | 底层原因分析                                                                                                                           | 最终解决方案                                                                                                                     |
| :------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------- |
| **内存溢出 (OOM) 崩溃**<br>执行 `ollama run deepseek-r1:32b` 后终端抛出 `Error 500: llama runner process has terminated`。      | 32B 模型量化后强占超 20GB 内存，突破 32GB 物理机极限（需兼顾 Windows、WSL、Docker 占用），系统无法分配连续内存块直接 Kill 进程。       | **算力降级**，采用 14B 参数量级模型，为宿主系统和高并发压测沙箱预留充足内存。                                                    |
| **配置覆盖导致模型回流 C 盘**<br>已配置 Windows 环境变量迁移模型，但新模型依然下到了 C 盘，且 `ollama list` 查不到 D 盘的模型。 | Ollama 最新版 **GUI Settings 面板优先级高于系统环境变量**。开机自启进程读取 GUI 配置覆盖了底层注入，且父子进程的环境变量未能及时刷新。 | 彻底废弃命令行环境变量注入，直接在 **Ollama GUI 面板**中修改 `Model location`，并手动清理注册表/底层环境变量以防止多处配置冲突。 |
| **幽灵文件占用磁盘**<br>手动剪切模型到 D 盘后，执行 `ollama rm deepseek-r1:14b` 提示 `not found`，但磁盘空间未释放。            | 物理迁移导致 Ollama 数据账本（Manifest）与物理数据（Blobs）脱节。Ollama 账本找不到该模型故报错，但 9GB 的权重块依然留在文件系统中。    | 深入 `D:\OllamaModels\blobs`，通过比对**修改时间戳**和文件大小，手动 `Shift+Delete` 清理旧模型的超大哈希文件。                   |

### 📌 类别 3：跨网段通信与底层依赖环境

| 遭遇问题 / 现象                                                                                                                | 底层原因分析                                                                                               | 最终解决方案                                                                                                                  |
| :----------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------- |
| **环境构建失败**<br>在 Ubuntu 终端报错 `No matching distribution found for hermes-agent` 及 Python `3.10.12 not in '>=3.11'`。 | Hermes 核心库未上架 PyPI 且强制依赖 Python 3.11+ 的新语法特性，而 Ubuntu 22.04 原生环境版本过低。          | 接入 `deadsnakes PPA` 安装独立的 Python 3.11 环境，并通过 **Git 源码直连** (`pip install git+...`) 完成编译安装。             |
| **网络防线拦截**<br>配置阶段警告 `could not verify this endpoint`，或测试时触发 `ERR_UNSAFE_PORT (2049)`。                     | Ollama 默认只监听 `127.0.0.1` 物理回环，WSL2 作为虚拟局域网发起的请求被宿主机网络防线静默丢弃（Dropped）。 | 纠正错误端口为 `11434`。在 Ollama GUI 面板开启 **`Expose Ollama to the network`** 允许外部/虚拟网卡访问。                     |
| **DNS 解析穿透失败**<br>测试接口时出现严重超时 (`APITimeoutError`)，请求完全无响应。                                           | Docker 官方提供的魔法域名 `host.docker.internal` 在特定的 WSL 路由策略下 DNS 解析失效。                    | 执行 `ip route show` 抓取虚拟网桥的**真实物理 IP**（如 `172.27.0.1`），直接修改 Hermes 配置文件，绕过域名解析进行硬编码通信。 |
| **环境丢失**<br>重启终端后输入指令报错 `Command 'hermes' not found`。                                                          | 新终端脱离了 Python 虚拟环境上下文。                                                                       | 每次使用前执行 `source ~/hermes_env/bin/activate` 唤醒环境（或写入 `.bashrc`）。                                              |
