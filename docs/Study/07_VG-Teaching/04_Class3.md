---
sidebar_position: 4
id: Class3
title: Class 3
tags:
  - Study
  - Unity
  - Video Game Teaching
---

# Class 3 - Animations & Inter-class Access

<video width="960" height="540" controls>
  <source src="https://pub-25034b877a7f48ba91623467da545f22.r2.dev/03_Animations.mp4" />
</video>

---

本节课的重点是引入动画系统，学习如何制作动画，包括飞船尾焰、炮弹运动，以及更多序列帧的爆炸动画。


## Class 3 Overview

1. 导入与整理素材，以及Prefab（预制体）概念的引入
2. 使用动画窗口制作序列帧动画


### 1. 导入与整理素材，以及Prefab（预制体）概念的引入

导入素材包中`3-`作为前缀的素材（飞船的两种状态）

1. 按照规范的参数设置流程：PPU（每单位像素，48） -> Filter Mode（过滤模式，点） -> Compression（压缩，无）
2. 选中主角飞船 `ship0` 并完成以下 Inspector 设置：  
    | 属性 | 设置值 |
    |------|--------|
    | Layer（图层） | Player |
    | Transform.position | (0, 0, 0) |
    | Rigidbody2D.BodyType（身体类型） | Kinematic |
    | Use Full Kinematic Contacts（使用完全运动学联系） | True（勾选） |
    | Animator | (添加 Animator 组件) |
3. 创建 **Projectile**（炮弹）：  
    | 属性 | 设置值 |
    |------|--------|
    | Layer（图层） | PlayerProjectile |
    | Sprite Renderer.Sprite（精灵） | (任选两个炮弹中的一个，作为初始状态精灵) |
    | Rigidbody2D.Gravity（重力） | 0 |
    | BoxCollider2D | (添加 BoxCollider2D 组件) |
    | Animator | (添加 Animator 组件) |

    接下来，将场景中的Projectile对象拖入 `Assets/Prefabs/SpaceShooter/`，这样我们就会得到一个**炮弹的预制体**

    > **预制体（Prefab）**是Unity中非常重要的概念，指的是可以重复使用的游戏对象模板。通过预制体，我们可以方便地在场景中实例化多个相同的对象，并且可以统一管理和修改它们的属性和组件。
4. 创建 **Asteroid**（陨石/小行星）：  
    对 6 种陨石，我们分别设置：  
    | 属性 | 设置值 |
    |------|--------|
    | Rigidbody2D.Gravity（重力） | 0 |
    | PolygonCollider2D | (添加 PolygonCollider2D 组件) |

    而后同样的，拖入`Assets/Prefabs/SpaceShooter/` 生成各自的 **Prefab**
5. 创建 **Explosion**（爆炸）动画的场景对象：
    创建一个空的 GameObject，命名为 `Explosion`：  
    | 属性 | 设置值 |
    |------|--------|
    | Sprite Renderer.Sprite（精灵） | (选择`spaaaaace_3`作为初始精灵) |
    | Animator | (添加 Animator 组件) |

:::caution 层级碰撞设置
找到Unity左上角的选项，**Edit（编辑） > Project Settings（项目设置） > Physics 2D（2D物理）**，**图层碰撞矩阵** 一栏下取消 `PlayerProjectile` 与 `Player`，`Player`与 `Player` 的碰撞勾选，避免自伤。

![Collision Matrix](https://jcqn.oss-cn-beijing.aliyuncs.com/game_design_courseware/01_image/Class3_CollisionMatrix.png)
:::

### 2. 使用动画窗口制作序列帧动画


