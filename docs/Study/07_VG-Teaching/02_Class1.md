---
sidebar_position: 2
id: Class1
title: Class 1
tags:
  - Study
  - Unity
  - Video Game Teaching
---

# Class 1 - Intro & Movement

<video width="960" height="540" controls>
  <source src="https://pub-25034b877a7f48ba91623467da545f22.r2.dev/01_Intro%26Movement.mp4" />
</video>


---

这节课将手把手指导你从零开始配置 Unity 开发环境，并完成第一个 2D 项目的基础设置与角色移动功能实现。适合**初次接触 Unity** 或希望建立完整开发流程认知的开发者。

素材包下载链接：
> [https://github.com/1341524165/Game_Design_Courseware](https://github.com/1341524165/Game_Design_Courseware)

## Class 1 Overview

1. 安装 Unity Hub 与编辑器  
2. 创建 Unity 项目  
3. 理解 Unity 编辑器界面与基本概念  
4. 设置第一个游戏场景与角色贴图  
5. 编写并绑定控制脚本，实现角色移动  

### 1. 安装 Unity Hub 与编辑器  

前往 [Unity 官网](https://unity.com/)，点击右上角注册账号，获取你的 Unity ID，用于登录 Unity Hub 以及使用云端服务等功能。

下一步是跟着官网的引导下载 Unity Hub. Unity Hub 是 Unity 官方提供的**项目管理器与编辑器启动器**，你可以在其中：  
- 安装/卸载 Unity 编辑器版本  
- 创建/打开项目  
- 管理插件和模块  

接下来，我们需要安装 Unity 编辑器：  
1. 打开 Unity Hub，进入「安装」标签页  
2. 点击「安装编辑器」，选择 **正式发行版**。为了我们保证我们今后合作开发的稳定性，推荐使用与我一致的版本：  
   `2022.3.45f1 (LTS)`

> **说明：**  
> - `f1` 表示 Final Release  
> - LTS 表示官方会对该版本进行长期维护和兼容性保障，便于团队协作

![Unity 安装界面](https://jcqn.oss-cn-beijing.aliyuncs.com/game_design_courseware/01_image/unity_install_1.png)  
![Unity 官网版本选择](https://jcqn.oss-cn-beijing.aliyuncs.com/game_design_courseware/01_image/unity_install_2.png)

---

以上便是 Unity Hub 和 Unity 编辑器的安装过程。接下来是**代码编辑器**。

个人推荐使用 **Visual Studio Code** (VS Code)：  
- 社区插件丰富，自由度高  
- 由于插件丰富，几乎支持所有编程语言

### 2. 创建 Unity 项目并导入资源

1. 打开 Unity Hub → 「项目」 → 新建项目  
2. 选择「2D Core」模板

:::note 设置中文界面（可选）

Unity 启动后为英文界面，可回到 Unity Hub：  
`安装 → 添加模块（Add Module）→ 简体中文`
:::

### 3. 理解 Unity 编辑器界面及基本概念

Unity 编辑器分为多个面板，主要包括下面三个大块：
- `Project`：项目资源管理器，显示项目中的所有资源文件
- `Hierarchy`：层级管理器，显示当前场景中的所有 GameObject 对象
- `Inspector`：属性检查器，显示选中对象的详细属性

![Unity UI](https://jcqn.oss-cn-beijing.aliyuncs.com/game_design_courseware/01_image/UI_intro.png)

首先是`Project` 面板，显示项目的文件结构。Unity 项目通常包含以下几个重要文件夹：
- `Assets`：所有资源的根目录  
- `Scenes`：存放所有场景文件的文件夹  
- `Packages`：Unity 内置或导入的插件库（可忽略）  

我们可以在 `Assets` 下新建子文件夹：  
`Assets/Q1/` 用于存放本节课相关的资源。

---

将我提供的素材包导入 `Q1` 文件夹后，选中 **ship0**，设置如下属性：  
- `Pixels Per Unit (PPU)` 每单位像素 → 48  
- `Compression` 压缩 → None（无损压缩）  
- `Filter Mode` 过滤模式 → Point（无过滤器，马赛克风格像素风推荐）  

:::tip Sprite
在 `Texture Type` 纹理类型属性中，我们会看到 2D 图片的初始类型被设置为 `Sprite (2D and UI)`，这表示该图片将作为 2D 精灵使用。  
Sprite 是 2D 游戏中的“精灵对象”，可代表角色、地形、粒子特效等。
:::

:::info `Sprite Mode` Sprite模式属性
- Single：单张图片（角色、物体）
- Multiple：多张图片（图集，Sprite Atlas）
- Polygon：使用不规则多边形减少透明像素渲染（高级优化），基本只在工业级游戏中使用
:::


### 4. 设置第一个游戏场景与角色贴图  

1. 在 `Assets/Q1/Scenes/` 中重命名当前场景为 `Q1`.
2. 在 `层级` 下点击鼠标右键 `创建空物体`
3. 在 `检查器` 添加组件：  
   - `Sprite Renderer`  
4. 在 `Sprite` 属性中选择我们导入的 **ship0** 精灵，或是直接将 **ship0** 精灵拖入 `Sprite` 属性中，即可显示角色图像

:::note 相机 Main Camera 与 Z轴概念
默认场景中已有 `Main Camera`，它相当于是**玩家的视角**。
- 在 2D 游戏中，Z 轴用于区分前后层级。Main Camera 的 Z 值通常为 -10，表示它*脱离于2D游戏平面之外*，以玩家的视角拍摄游戏画面。
- 如果物体 Z 值错误，可能出现相机拍不到、画面错位等问题  
:::


### 5. 编写并绑定控制脚本，实现角色移动  

1. 在 `Assets/Q1/Code/` 中创建脚本 `UFOController.cs`  
2. ***文件名必须与类名一致***  
3. 推荐添加命名空间（namespace）进行模块管理  

```csharp
namespace Q1 {
    public class UFOController : MonoBehaviour {
        void Start() {
          // 初始化代码。仅在游戏对象被激活那一瞬间调用一次
        }

        void Update() {
          // 每帧更新逻辑。每帧都会调用，用于控制动画、输入、移动等

          // Move Up
          if (Input.GetKey(KeyCode.UpArrow)) {
              transform.position += new Vector3(0, 0.1f, 0);
          }
          // Move Down
          if (Input.GetKey(KeyCode.DownArrow)) {
              transform.position += new Vector3(0, -0.1f, 0);
          }
          // Move Left
          if (Input.GetKey(KeyCode.LeftArrow)) {
              transform.position += new Vector3(-0.1f, 0, 0);
          }
          // Move Right
          if (Input.GetKey(KeyCode.RightArrow)) {
              transform.position += new Vector3(0.1f, 0, 0);
          }
        }
    }
}
```
:::caution 代码重点解释
1. Input.GetKey(...)：监听按键是否按下。括号内接受的参数即为按键代码，如 `KeyCode.UpArrow` 表示上方向键。
2. transform.position：在`Inspector`面板可以找到的 -> `Transform`组件下的 -> `position`位置属性，表示物体在世界坐标系中的位置，i.e.他的三维坐标。
3. new Vector3(x, y, z)：创建一个新的三维向量。（注：这里的 new 不是在 new 一个类对象，而是打包一个新的 Vector3 实例.. 可忽略，用多了就记得了）
4. 不使用 else if 是为了支持多键同时按下
:::

---

最后补充一下 Unity 编辑器内的操作：  
- 鼠标中键按住并拖动：移动物体/视角
- Q/W/E/R 键切换工具（查看/移动/旋转/缩放）

