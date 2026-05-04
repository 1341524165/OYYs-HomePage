---
sidebar_position: 2
id: hermes-codex-oauth-migration
title: Hermes 从本地 Ollama/Qwen 迁移到 OpenAI Codex OAuth
tags:
    - Work
    - Hermes Agent
    - Codex
    - OAuth
    - Troubleshooting
---

# Hermes 从本地大模型迁移到 OpenAI Codex OAuth

:::tip 💡 本篇目标

把 Hermes 的主模型从本地 Ollama `qwen3:8b` 切换到 Hermes 自带的 `openai-codex` provider，并最终跑通：

```text
provider=openai-codex, model=gpt-5.5
```

关键点：**不需要先登录 Codex CLI**。Hermes 自己就有独立的 Codex OAuth 登录流程。

:::

---

## 字段说明

本文命令里的占位字段需要替换成自己的环境值：

| 字段 | 含义 |
| :--- | :--- |
| `<WSL_USER>` | WSL/Linux 用户名 |
| `<WINDOWS_HOST_IP>` | Windows 宿主机在 WSL2 中可访问的 IP |

---

## 一、迁移前确认

先确认 Hermes 能正常运行：

```bash
/home/<WSL_USER>/HermesWorkspace/hermes_env/bin/hermes --version
/home/<WSL_USER>/HermesWorkspace/hermes_env/bin/hermes config path
```

确认当前 Codex 还没登录：

```bash
/home/<WSL_USER>/HermesWorkspace/hermes_env/bin/hermes auth status openai-codex
```

如果显示：

```text
openai-codex: logged out
```

说明 Hermes 已经认识 `openai-codex`，只是还没有 OAuth 凭据。

再看当前主模型：

```bash
sed -n '1,12p' ~/.hermes/config.yaml
```

迁移前通常类似：

```yaml
model:
    default: qwen3:8b
    provider: custom
    base_url: http://<WINDOWS_HOST_IP>:11434/v1
    api_key: ollama
    context_length: 64000
```

---

## 二、备份

配置迁移前先留回滚点：

```bash
cp ~/.hermes/config.yaml ~/.hermes/config.yaml.bak.$(date +%Y%m%d_%H%M%S)
cp ~/.hermes/auth.json ~/.hermes/auth.json.bak.$(date +%Y%m%d_%H%M%S)
```

确认备份：

```bash
ls -lh ~/.hermes/config.yaml.bak.* ~/.hermes/auth.json.bak.*
```

---

## 三、登录 Codex OAuth

在 WSL2 / 远程终端里，建议使用 `--no-browser`：

```bash
/home/<WSL_USER>/HermesWorkspace/hermes_env/bin/hermes auth add openai-codex --type oauth --no-browser
```

终端会给出一个链接和一次性 code：

```text
https://auth.openai.com/codex/device
XXXX-XXXXX
```

打开链接，输入 code，完成 ChatGPT/OpenAI 授权。

:::warning

不要保存真实 code，也不要把 token、授权链接中的敏感内容写进文档。code 过期就重新运行登录命令。

:::

成功后应看到：

```text
Added openai-codex OAuth credential #1: "openai-codex-oauth-1"
```

检查登录结果：

```bash
/home/<WSL_USER>/HermesWorkspace/hermes_env/bin/hermes auth status openai-codex
/home/<WSL_USER>/HermesWorkspace/hermes_env/bin/hermes auth list openai-codex
```

期望：

```text
openai-codex: logged in
```

---

## 四、切换主模型

打开模型选择器：

```bash
/home/<WSL_USER>/HermesWorkspace/hermes_env/bin/hermes model
```

按菜单选择：

```text
OpenAI Codex
```

如果提示：

```text
1. Use existing credentials
2. Reauthenticate (new OAuth login)
3. Cancel
```

选择：

```text
1. Use existing credentials
```

模型选择：

```text
gpt-5.5
```

如果账号里暂时没有 `gpt-5.5`，就先选 `gpt-5.4`。

成功提示：

```text
Default model set to: gpt-5.5 (via OpenAI Codex)
```

---

## 五、清理本地模型遗留限制

`context_length: 64000` 是之前给本地 `qwen3:8b` 设置的限制。换到 Codex 后，应该交给 Hermes 自动识别。

编辑：

```bash
vim ~/.hermes/config.yaml
```

删除主模型下的：

```yaml
context_length: 64000
```

也删除辅助压缩里的：

```yaml
auxiliary:
    compression:
        context_length: 64000
```

最终主模型应类似：

```yaml
model:
    default: gpt-5.5
    provider: openai-codex
    base_url: https://chatgpt.com/backend-api/codex
```

检查：

```bash
/home/<WSL_USER>/HermesWorkspace/hermes_env/bin/hermes config show
```

期望看到：

```text
Model: {'default': 'gpt-5.5', 'provider': 'openai-codex', 'base_url': 'https://chatgpt.com/backend-api/codex'}
Context Compression:
  Model: (auto)
```

:::note

`custom_providers` 里保留 `qwen3:8b` 没关系。它只是 Hermes 记住的本地 Ollama 备用入口，不影响当前 `openai-codex` 主模型。

:::

---

## 六、最终验证

先跑 doctor：

```bash
/home/<WSL_USER>/HermesWorkspace/hermes_env/bin/hermes doctor
```

关键结果应该包含：

```text
OpenAI Codex auth (logged in)
```

再做一次真实调用：

```bash
/home/<WSL_USER>/HermesWorkspace/hermes_env/bin/hermes -z '请只回答当前使用的 provider 和 model。格式：provider=<...>, model=<...>'
```

成功结果：

```text
provider=openai-codex, model=gpt-5.5
```

至此迁移完成。

---

## 七、回滚到本地 Ollama

如果 Codex 暂时不可用，可以恢复备份：

```bash
cp ~/.hermes/config.yaml.bak.YYYYMMDD_HHMMSS ~/.hermes/config.yaml
```

也可以重新走模型选择器：

```bash
/home/<WSL_USER>/HermesWorkspace/hermes_env/bin/hermes model
```

选择保存过的本地 provider：

```text
<WINDOWS_HOST_IP>:11434 (...) — qwen3:8b
```

---

## Issues

### Issue 1：OAuth 命令报 DNS / 网络错误

- **现象**：

```text
Temporary failure in name resolution
Failed to request device code
```

- **原因**：当前终端环境不能访问 OpenAI OAuth 端点。

- **处理**：给 OAuth 命令放行网络权限，然后重新执行：

```bash
/home/<WSL_USER>/HermesWorkspace/hermes_env/bin/hermes auth add openai-codex --type oauth --no-browser
```

### Issue 2：浏览器提示没有开启 Codex device code

- **现象**：

```text
Enable device code authorization for Codex in ChatGPT Security Settings
```

- **处理**：

1. 打开 ChatGPT 网页端。
2. 进入 `Settings -> Security`。
3. 开启 Codex device-code authorization。
4. 回到终端重新执行 OAuth 登录命令。
