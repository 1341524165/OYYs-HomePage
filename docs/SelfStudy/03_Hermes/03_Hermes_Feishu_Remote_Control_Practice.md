---
sidebar_position: 3
id: hermes-feishu-remote-control-practice
title: Hermes - Feishu Remote
tags:
    - Work
    - Hermes Agent
    - Feishu
    - Gateway
    - Remote Control
    - Troubleshooting
---

# Hermes 接入飞书远程控制实战教程

:::tip 本篇目标

把运行在 WSL2 里的 Hermes Agent 接入飞书机器人，最终实现 `飞书私聊 -> Hermes Gateway -> Hermes Agent -> OpenAI Codex / gpt-5.5 -> 飞书回复`。

本篇按照“能复现”的教程方式整理。主线只保留必要操作；本次实操遇到的网络、权限、飞书事件投递等问题，放在[后面的排错章节](#排错websocket-已连接但没有消息入站)。

:::

---

## 一、最终效果

本次跑通后的形态如下：

| 项目          | 结果                       |
| :------------ | :------------------------- |
| Hermes 版本   | `v0.12.0`                  |
| 模型 provider | `openai-codex`             |
| 模型          | `gpt-5.5`                  |
| 飞书连接方式  | `websocket`                |
| 飞书入口      | 机器人私聊                 |
| 群聊          | 暂时禁用                   |
| 访问控制      | 只允许自己的飞书 `open_id` |
| Home channel  | 当前飞书私聊会话           |

最终消息测试：

| 场景               | 内容                                      |
| :----------------- | :---------------------------------------- |
| 用户在飞书私聊发送 | `你好，请只回复：Hermes 飞书通道已接通。` |
| 机器人回复         | `Hermes 飞书通道已接通。`                 |

---

## 二、开始前确认

先确认你已经完成前两篇教程（[本地部署](./01_Hermes_Local_Deployment.md) 和 [Codex 鉴权迁移](./02_Hermes_Codex_OAuth_Migration.md)）：

| 前置条件                      | 为什么需要                         |
| :---------------------------- | :--------------------------------- |
| Hermes 已在 WSL2 中安装       | 飞书 Gateway 会在这个环境里运行    |
| Hermes 已登录 `openai-codex`  | 飞书消息最终要交给 Codex 模型处理  |
| `~/.hermes/config.yaml` 存在  | 保存 Hermes 模型和通用配置         |
| `~/.hermes/.env` 存在或可创建 | 保存飞书 App ID、Secret 等敏感配置 |

检查 Hermes 版本：

```bash
~/HermesWorkspace/hermes_env/bin/hermes --version
```

期望看到类似 `Hermes Agent v0.12.0 (2026.4.30)`。

检查 Codex OAuth 状态：

```bash
~/HermesWorkspace/hermes_env/bin/hermes auth status openai-codex
```

期望看到：

```text
openai-codex: logged in
```

检查当前模型配置：

```bash
~/HermesWorkspace/hermes_env/bin/hermes config show
```

本次实操使用的是 `provider: openai-codex` 和 `model: gpt-5.5`。

:::note

`hermes doctor` 里可能会出现 Telegram、Discord、Browser tools、OpenRouter 等 warning。只要 Codex OAuth 和 Feishu Gateway 所需依赖正常，这些 warning 不影响本篇的飞书私聊入口。

:::

---

## 三、理解 Gateway 命令

当前 Hermes 版本的 Gateway 使用子命令。

常用命令如下：

| 目的             | 命令                     |
| :--------------- | :----------------------- |
| 配置平台         | `hermes gateway setup`   |
| 前台运行 Gateway | `hermes gateway run`     |
| 查看状态         | `hermes gateway status`  |
| 停止 Gateway     | `hermes gateway stop`    |
| 安装后台服务     | `hermes gateway install` |

因此不要再使用旧写法：

```bash
hermes gateway
```

应该使用：

```bash
hermes gateway run
```

---

## 四、安装飞书依赖

飞书平台需要 Python SDK `lark-oapi`。先检查依赖：

```bash
~/HermesWorkspace/hermes_env/bin/python -c "import importlib.util; mods=['lark_oapi','websockets','aiohttp']; [print(m + '=' + ('installed' if importlib.util.find_spec(m) else 'missing')) for m in mods]"
```

如果看到：

```text
lark_oapi=missing
```

安装它：

```bash
~/HermesWorkspace/hermes_env/bin/pip install -U lark-oapi
```

安装完成后再次检查，期望看到：

```text
lark_oapi=installed
websockets=installed
aiohttp=installed
```

:::warning 网络问题

如果安装时报：

```text
Name or service not known
Could not find a version that satisfies the requirement lark-oapi
```

这通常不是包名写错，而是当前环境无法访问 PyPI。给 pip 命令放行网络权限后，重新执行同一条安装命令即可。

:::

---

## 五、备份 Hermes 配置

接入飞书前，先备份配置。这样即使向导写错了 `.env`，也可以回滚。

```bash
mkdir -p ~/.hermes/backups
cp ~/.hermes/config.yaml ~/.hermes/backups/config.yaml.before-feishu.$(date +%Y%m%d_%H%M%S)
if [ -f ~/.hermes/.env ]; then
  cp ~/.hermes/.env ~/.hermes/backups/dotenv.before-feishu.$(date +%Y%m%d_%H%M%S)
fi
ls -lh ~/.hermes/backups | tail
```

本次实操生成过这样的备份：

```text
config.yaml.before-feishu.20260504_045452
dotenv.before-feishu.20260504_045452
```

---

## 六、创建飞书机器人

运行 Hermes Gateway 配置向导：

```bash
~/HermesWorkspace/hermes_env/bin/hermes gateway setup
```

在平台列表中选择：

```text
Feishu / Lark
```

向导会生成一个飞书开放平台链接，形态类似：

```text
https://open.feishu.cn/page/launcher?user_code=...&from=hermes&tp=hermes
```

用飞书打开链接，按页面提示创建机器人。本次实操创建出的机器人名为：

```text
XX's AI Assistant
```

创建完成后，向导会把飞书核心凭据写入：

```bash
~/.hermes/.env
```

核心凭据形态如下：

```env
FEISHU_APP_ID=cli_xxx
FEISHU_APP_SECRET=xxx
FEISHU_DOMAIN=feishu
FEISHU_CONNECTION_MODE=websocket
```

:::danger

`FEISHU_APP_SECRET` 是敏感值，不要提交到 GitHub，也不要截图公开。

:::

如果向导后续安全选项显示不完整，不要盲选。可以先中断向导，然后按[下一节](#七补写安全配置)手动补写安全配置。

---

## 七、补写安全配置

这一节的目的不是“让它能连上”，而是限制谁可以远程控制你的 Hermes。

推荐先采用最保守配置：

| 配置项                   | 建议值     | 含义                            |
| :----------------------- | :--------- | :------------------------------ |
| `FEISHU_ALLOW_ALL_USERS` | `false`    | 不允许所有飞书用户直接使用      |
| `FEISHU_ALLOWED_USERS`   | 先留空     | 等拿到自己的 `open_id` 后再填写 |
| `FEISHU_GROUP_POLICY`    | `disabled` | 先禁用群聊                      |
| `FEISHU_REQUIRE_MENTION` | `true`     | 以后开放群聊时必须 `@` 机器人   |
| `FEISHU_ALLOW_BOTS`      | `none`     | 不响应其他机器人，避免循环      |

打开配置文件：

```bash
nano ~/.hermes/.env
```

保留已经存在的飞书核心凭据：

```env
FEISHU_APP_ID=cli_xxx
FEISHU_APP_SECRET=xxx
FEISHU_DOMAIN=feishu
FEISHU_CONNECTION_MODE=websocket
```

然后在文件末尾追加：

```env
FEISHU_ALLOW_ALL_USERS=false
FEISHU_ALLOWED_USERS=
FEISHU_GROUP_POLICY=disabled
FEISHU_REQUIRE_MENTION=true
FEISHU_ALLOW_BOTS=none

HERMES_FEISHU_TEXT_BATCH_DELAY_SECONDS=0.6
HERMES_FEISHU_TEXT_BATCH_MAX_MESSAGES=8
HERMES_FEISHU_TEXT_BATCH_MAX_CHARS=4000
HERMES_FEISHU_MEDIA_BATCH_DELAY_SECONDS=0.8
```

保存后设置权限：

```bash
chmod 600 ~/.hermes/.env
```

检查非敏感项：

```bash
awk -F= '$1 ~ /^(FEISHU_ALLOW_ALL_USERS|FEISHU_ALLOWED_USERS|FEISHU_GROUP_POLICY|FEISHU_REQUIRE_MENTION|FEISHU_ALLOW_BOTS|FEISHU_CONNECTION_MODE|FEISHU_DOMAIN)$/ { if ($2 == "") print $1"=<empty>"; else print }' ~/.hermes/.env
```

第一轮期望结果：

```text
FEISHU_DOMAIN=feishu
FEISHU_CONNECTION_MODE=websocket
FEISHU_ALLOW_ALL_USERS=false
FEISHU_ALLOWED_USERS=<empty>
FEISHU_GROUP_POLICY=disabled
FEISHU_REQUIRE_MENTION=true
FEISHU_ALLOW_BOTS=none
```

:::note 为什么一开始 `FEISHU_ALLOWED_USERS` 留空？

刚创建机器人时，还不知道自己的飞书 `open_id`。先留空可以避免开放给所有人。等第一次消息进入日志后，从日志里取出自己的 `ou_xxx`，再写回 allowlist。

:::

---

## 八、启动 Gateway

先停掉旧 Gateway：

```bash
~/HermesWorkspace/hermes_env/bin/hermes gateway stop
```

启动飞书 Gateway：

```bash
cd ~/HermesWorkspace
nohup ~/HermesWorkspace/hermes_env/bin/hermes gateway run > ~/HermesWorkspace/gateway_feishu.log 2>&1 &
```

等待几秒后查看状态：

```bash
~/HermesWorkspace/hermes_env/bin/hermes gateway status
tail -n 80 ~/HermesWorkspace/gateway_feishu.log
```

看到下面两行，说明本地 Hermes 已经连上飞书 WebSocket：

```text
[Feishu] Connected in websocket mode (feishu)
Gateway running with 2 platform(s)
```

:::note

`WebSocket connected` 只代表 Hermes 和飞书开放平台之间的长连接建立成功。它不等于“飞书客户端已经能给机器人发消息”。如果后面私聊无响应，请看 [排错：WebSocket 已连接但没有消息入站](#排错websocket-已连接但没有消息入站)。

:::

---

## 九、在飞书客户端打开机器人

飞书开放平台里完成发布后，还要确认客户端里真的能看到这个机器人。

检查顺序：

1. 飞书开放平台中，应用已经发布。
2. 应用安装范围包含自己所在组织或自己这个测试用户。
3. 飞书客户端能搜索或打开机器人私聊。
4. 私聊窗口标题显示机器人名，例如 `XX's AI Assistant`。

如果你在群聊的“添加成员”里找不到机器人，先不要纠结群聊。本篇先跑通私聊，群聊保持禁用。

---

## 十、发送第一条测试消息

在飞书机器人私聊里发送 `你好，请只回复：Hermes 飞书通道已接通。`。

然后看 Gateway 日志：

```bash
tail -n 260 ~/.hermes/logs/gateway.log | rg "Feishu|Inbound|Received raw|sender=|ou_|chat_id|Unauthorized|pair"
```

如果消息进入 Hermes，会看到类似：

```text
[Feishu] Received raw message type=text message_id=om_xxx
[Feishu] Inbound dm message received:
  chat_id=oc_xxx
  sender=user:ou_xxx
  text='你好，请只回复：Hermes 飞书通道已接通。'
response ready: platform=feishu chat=oc_xxx
[Feishu] Sending response
```

这里有两个重要值：

| 值       | 用途                                   |
| :------- | :------------------------------------- |
| `ou_xxx` | 你的飞书用户 `open_id`，用于 allowlist |
| `oc_xxx` | 当前机器人私聊会话，作为 home channel  |

---

## 十一、收口 allowlist 和 home channel

拿到自己的 `ou_xxx` 和私聊 `oc_xxx` 后，回到：

```bash
nano ~/.hermes/.env
```

把这两行补上：

```env
FEISHU_ALLOWED_USERS=ou_xxx
FEISHU_HOME_CHANNEL=oc_xxx
```

同时保持：

```env
FEISHU_ALLOW_ALL_USERS=false
FEISHU_GROUP_POLICY=disabled
FEISHU_REQUIRE_MENTION=true
FEISHU_ALLOW_BOTS=none
```

重启 Gateway：

```bash
~/HermesWorkspace/hermes_env/bin/hermes gateway stop
cd ~/HermesWorkspace
nohup ~/HermesWorkspace/hermes_env/bin/hermes gateway run --accept-hooks > ~/HermesWorkspace/gateway_feishu.log 2>&1 &
```

确认配置已经生效：

```bash
awk -F= '$1 ~ /^(FEISHU_ALLOWED_USERS|FEISHU_HOME_CHANNEL|FEISHU_ALLOW_ALL_USERS|FEISHU_GROUP_POLICY|FEISHU_REQUIRE_MENTION|FEISHU_ALLOW_BOTS)$/ {print}' ~/.hermes/.env
tail -n 80 ~/.hermes/logs/gateway.log | rg 'Feishu|feishu|Gateway running|connected|Channel directory'
```

期望看到：

```text
FEISHU_ALLOWED_USERS=ou_xxx
FEISHU_HOME_CHANNEL=oc_xxx
FEISHU_ALLOW_ALL_USERS=false
FEISHU_GROUP_POLICY=disabled
FEISHU_REQUIRE_MENTION=true
FEISHU_ALLOW_BOTS=none
[Feishu] Connected in websocket mode (feishu)
Gateway running with 2 platform(s)
Channel directory built: 1 target(s)
```

**_到这里，飞书私聊远程控制入口已经完成。_**

---

## 排错：WebSocket 已连接但没有消息入站

这个问题是本次实操里最容易误判的地方。

现象：

```text
[Feishu] Connected in websocket mode (feishu)
Gateway running with 2 platform(s)
```

但是飞书私聊发送消息后，日志里没有：

```text
[Feishu] Received raw message
```

这种情况说明本地 Gateway 已连上飞书，但飞书没有把消息事件投递进来。

优先检查[飞书开放平台](https://open.feishu.cn)：

| 检查点       | 正常状态                         |
| :----------- | :------------------------------- |
| 事件订阅     | 已添加 `im.message.receive_v1`   |
| 权限         | 接收单聊、群聊消息相关权限已开通 |
| 应用发布     | 当前修改已发布                   |
| 应用可见范围 | 包含自己                         |
| 飞书客户端   | 能打开机器人私聊窗口             |

再看飞书开放平台日志检索：

| 日志情况                                    | 判断                                  |
| :------------------------------------------ | :------------------------------------ |
| 只有 `tenant_access_token` 和 `bot/v3/info` | 只是本地 API 验证成功，还没有消息事件 |
| 出现 `im.message.receive_v1`                | 飞书已经投递消息事件                  |

本次最终定位：

```text
机器人在开放平台已创建，但飞书客户端一开始还不能真正打开机器人私聊，也不能从群聊添加机器人。
```

解决方式：不知道，没动，自己解决了。总之记住上述检查方法总没错。

当客户端能进入 `XX's AI Assistant` 私聊后，消息事件立刻进入 Hermes。

---

## 排错：临时放开 allow-all

如果你不确定是不是 allowlist 拦住了自己，可以临时改成：

```env
FEISHU_ALLOW_ALL_USERS=true
```

然后重启 Gateway 测试。

如果打开 allow-all 后仍然没有 `Received raw message`，说明问题不在 Hermes allowlist，而在飞书事件是否投递。

:::warning

测试结束后要改回：

```env
FEISHU_ALLOW_ALL_USERS=false
```

远程控制入口不要长期对所有用户开放。

:::

---

## 日常运维

查看 Gateway 状态：

```bash
~/HermesWorkspace/hermes_env/bin/hermes gateway status
```

查看日志：

```bash
tail -n 120 ~/.hermes/logs/gateway.log
tail -n 120 ~/HermesWorkspace/gateway_feishu.log
tail -n 120 ~/.hermes/logs/agent.log
```

重启 Gateway：

```bash
~/HermesWorkspace/hermes_env/bin/hermes gateway stop
cd ~/HermesWorkspace
nohup ~/HermesWorkspace/hermes_env/bin/hermes gateway run --accept-hooks > ~/HermesWorkspace/gateway_feishu.log 2>&1 &
```

检查飞书配置时，不要直接打印 Secret。可以用：

```bash
awk -F= '$1 ~ /^FEISHU_/ { if ($1 ~ /SECRET/) print $1"=<redacted>"; else print }' ~/.hermes/.env
```

确认 Codex OAuth 和模型：

```bash
~/HermesWorkspace/hermes_env/bin/hermes auth status openai-codex
~/HermesWorkspace/hermes_env/bin/hermes config show
```

---

## 十六、回滚

如果飞书接入后想恢复到接入前状态，使用前面备份的文件。

先停止 Gateway：

```bash
~/HermesWorkspace/hermes_env/bin/hermes gateway stop
```

恢复配置：

```bash
cp ~/.hermes/backups/config.yaml.before-feishu.YYYYMMDD_HHMMSS ~/.hermes/config.yaml
cp ~/.hermes/backups/dotenv.before-feishu.YYYYMMDD_HHMMSS ~/.hermes/.env
chmod 600 ~/.hermes/.env
```

如需重新启动 Gateway：

```bash
cd ~/HermesWorkspace
nohup ~/HermesWorkspace/hermes_env/bin/hermes gateway run --accept-hooks > ~/HermesWorkspace/gateway_auto.log 2>&1 &
```

---

## 当前建议

当前已经跑通飞书私聊远程控制入口。建议先保持：

```env
FEISHU_GROUP_POLICY=disabled
FEISHU_ALLOW_ALL_USERS=false
FEISHU_ALLOWED_USERS=ou_xxx
```

稳定使用一段时间后，再考虑是否开放群聊。即使开放群聊，也建议保持：

```env
FEISHU_REQUIRE_MENTION=true
FEISHU_ALLOW_BOTS=none
```

不要启用群聊免 `@`，也不要长期开放给所有用户。
