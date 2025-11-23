---
sidebar_position: 9
id: Class 8
title: Class 8
tags:
    - Study
    - Unity
    - Video Game Teaching
---

# Class 8 - Platformer Part 2: Animation & Tilemap

<video width="960" height="540" controls>
  <source src="https://pub-25034b877a7f48ba91623467da545f22.r2.dev/08_ShootingAndEnemies.mp4" />
</video>

---

在上一节课中，我们搭建了平台跳跃游戏的基础，包括玩家移动、瞄准和坠落重置。本节课我们将深入优化这些系统，解决潜在的 Bug，并引入 Tilemap（瓦片地图）系统和高级动画状态机。

## Class 8 Overview

1. 回顾与优化：OnBecameInvisible vs Trigger
2. 优化瞄准系统：准心跟随鼠标位置
3. 实现子弹发射与销毁
4. 实现二段跳与射线检测
5. 引入 Tilemap 瓦片地图系统
6. 构建角色动画状态机

---

### 1. 回顾与优化：OnBecameInvisible vs Trigger

上节课课上，在构建“位于场景底部的触发器（Trigger）来检测玩家是否掉落”的时候，我们对于“如何实现？”这个问题进行了简单的提问。

本节课录屏开头我们进行了补充说明：_为什么不使用 OnBecameInvisible() 函数（当物体离开相机视野时触发）？_

OnBecameInvisible() 看似可行，但它**并非实时触发**。为了运行的可靠性，它会有 ~0.5 秒的延迟。在游戏中，这会导致玩家掉出屏幕后，需要等待一小段时间才会重置场景，体验不佳。

因此，我们使用触发器（OnTriggerEnter2D）的“笨方法”是更优解，因为它能提供**实时的**碰撞检测。

---

### 2. 优化瞄准系统：准心跟随鼠标位置

上节课我们实现了准心绕角色旋转的效果：

- Player 物体包含一个空的子物体 AimPivot
- AimPivot 包含子物体 Reticle（准心）
- 通过旋转 AimPivot，实现 Reticle 的"公转"效果

目前的问题是：准心只能在**固定半径**的圆形范围内旋转。

#### 2.1 更新准心位置

于是这节课我们将其优化为准心**直接跟随鼠标位置**。

```csharp title="PlayerController.cs"

public Transform reticle;  // 准心对象引用

void Update()
{
	// ... 之前的代码

    reticle.position = worldMousePosition;
}

```

在 Unity 编辑器中，将 Reticle 物体拖拽到 PlayerController 组件的 reticle 槽位上。

---

#### 2.3 解决准心旋转问题

运行游戏后会发现一个问题：准心在跟随鼠标移动的同时，**自身**也在不断旋转。

**问题分析：**

- Reticle 作为 AimPivot 的子物体，会随父物体一起旋转**（公转）**
- 虽然在局部坐标系中，Reticle 的坐标系没有变化；但在世界坐标系中，Reticle 的坐标系一直在旋转

**解决方案：**

在更新位置代码后添加一行，将 Reticle 的局部旋转锁定为 0：

```csharp title="PlayerController.cs"
void Update()
{
    // ... (之前的代码)

    reticle.position = worldMousePosition;
    reticle.localRotation = Quaternion.identity;  // 重置局部旋转
}
```

:::note P.S.
虽然现在 Reticle 的位置和旋转都独立于 AimPivot，但我们仍然保留了 AimPivot 的角度计算逻辑。这个角度数据在后续实现角色抬手、武器朝向等功能时仍然有用。
:::

### 3. 完善子弹发射与目标销毁

#### 3.1 实现子弹发射

在 `PlayerController.cs` 中添加子弹发射逻辑：

```csharp title="PlayerController.cs"
public GameObject projectilePrefab;  // 子弹预制体

void Update()
{
    // ... (移动和瞄准代码)

    // --- 射击逻辑 ---
    if (Input.GetMouseButtonDown(0))  // 0 = 左键, 1 = 右键, 2 = 中键
    {
        GameObject newProjectile = Instantiate(projectilePrefab, transform.position, aimPivot.rotation);
    }
}
```

在编辑器中将 Projectile Prefab 拖拽到 projectilePrefab 槽位上。

:::info GetMouseButtonDown vs GetMouseButton

- `GetMouseButtonDown(0)`: 只在按键按下的瞬间触发一次，适合单发射击
- `GetMouseButton(0)`: 持续按住时每帧都触发，适合连发射击
  :::

#### 3.2 编写子弹移动脚本

创建新脚本 `Projectile.cs` 并挂载到 Projectile Prefab 上：

```csharp title="Projectile.cs"
using UnityEngine;

public class Projectile : MonoBehaviour
{
    Rigidbody2D rb;

    void Start()
    {
        rb = GetComponent<Rigidbody2D>();
        rb.velocity = transform.right * 10f; // 沿着物体的局部右方向移动
    }

    private void OnCollisionEnter2D(Collision2D collision)
    {
        // 暂时设定为：碰到任何物体就销毁自己
        Destroy(gameObject);
    }
}
```

:::note transform.right vs Vector3.right

- `transform.right`: 物体的局部坐标系右方向，会随物体旋转而改变
- `Vector3.right`: 世界坐标系的右方向，始终指向 (1, 0, 0)

:::

#### 3.3 编写目标销毁脚本

创建新脚本 `Target.cs` 并挂载到 Target Prefab 上：

```csharp title="Target.cs"
using UnityEngine;

public class Target : MonoBehaviour
{
    private void OnCollisionEnter2D(Collision2D collision)
    {
        // 检测是否被子弹击中
        if (collision.gameObject.GetComponent<Projectile>() != null)
        {
            Destroy(gameObject);             // 销毁目标
        }
    }
}
```

### 4. 实现二段跳与射线检测

#### 4.1 基础跳跃逻辑

在 `PlayerController.cs` 中添加跳跃相关变量和逻辑：

```csharp title="PlayerController.cs"
public int jumpsLeft = 2;  // 剩余跳跃次数

void Update()
{
    // ... (移动、瞄准、射击代码)

    // --- 跳跃逻辑 ---
    if (Input.GetKeyDown(KeyCode.Space))
    {
        if (jumpsLeft > 0)
        {
            jumpsLeft--;
			_rigidbody2D.AddForce(Vector2.up * 15f, ForceMode2D.Impulse);
        }
    }
}
```

#### 4.2 碰撞检测的问题

最直观的想法是使用 `OnCollisionStay2D` 在角色接触地面时重置跳跃次数：

```csharp title="PlayerController.cs (问题代码)"
private void OnCollisionStay2D(Collision2D collision)
{
    if (collision.gameObject.layer == LayerMask.NameToLayer("Ground"))
    {
        jumpsLeft = 2;
    }
}
```

:::danger 帧同步问题

这段代码存在严重问题：  
在按下空格执行跳跃的那一帧，OnCollisionStay2D 也会执行，导致 jumpsLeft 被立即**重置为 2**。结果就是角色可以跳三次而不是两次。

即使改用 OnCollisionEnter2D 解决了第一个问题，但当角色**头部撞到 Target**（Layer 也是 Ground）时，也会重置跳跃次数，导致可以无限跳跃。

:::

#### 4.3 使用射线检测脚下地面

为了精确判断"脚下"是否有地面，我们需要使用射线检测：

```csharp title="PlayerController.cs"
private void OnCollisionStay2D(Collision2D collision)
{
    // 从角色中心向下发射射线，长度为 0.85
    RaycastHit2D[] hits = Physics2D.RaycastAll(transform.position, Vector2.down, 0.85f);

    // 可视化调试射线（需要在 Game 视图开启 Gizmos）
    Debug.DrawRay(transform.position, Vector2.down * 0.85f, Color.red);

    // 遍历射线碰到的所有物体
    foreach (RaycastHit2D hit in hits)
    {
        if (hit.collider != null && hit.collider.gameObject.layer == LayerMask.NameToLayer("Ground"))
        {
            jumpsLeft = 2;
            break;
        }
    }
}
```

:::info Raycast vs RaycastAll

**为什么使用 RaycastAll？**

- `Physics2D.Raycast`: 只返回第一个碰撞到的物体。_由于射线从角色中心发出，第一个碰撞对象就是角色自己的碰撞体，导致无法检测到地面。_
- `Physics2D.RaycastAll`: 返回射线途经的所有碰撞物体（包括角色自身和地面），我们可以遍历数组找到 Ground 层的物体。

:::

### 5. 引入 Tilemap 瓦片地图系统

#### 5.1 Tilemap 系统基础概念

Tilemap 系统由以下几个部分组成：

1. Grid 对象：整个地图的容器，定义网格大小和坐标系统。可以包含任意数量的 Tilemap 层。
2. Tilemap 对象：实际存放瓦片数据的画布，必须包含 Tilemap Renderer 组件来渲染瓦片。
3. Tile Palette（瓦片调色板）：一个工具面板，用于管理和绘制瓦片。
4. Tiles（瓦片）：可重复使用的最小单位砖块。

#### 5.2 创建 Tile Palette

1. 在项目中创建文件夹结构：

```
   Assets/
   ├── TilePalette/
   └── Tiles/
```

2. 打开 `Window -> 2D -> Tile Palette`

3. 点击 **Create New Palette**：
    - 名称：World
    - Grid：Rectangle
    - Cell Size：`Manual`
    - 保存路径：Assets/TilePalette/

4. 将 `tiles_spritesheet` 拖拽到 Tile Palette 窗口中，选择保存路径为 `Assets/Tiles/World/`

:::note Cell Size: Manual vs Automatic
选择 Manual 模式可以固定每个格子的尺寸，避免因导入不同大小的 Sprite 而导致单位不统一的问题。
:::

#### 5.3 创建 Tilemap 并绘制地形

1. 删除场景中之前用 Ground Prefab 搭建的地形（保留 Target 物体）

2. 在 Hierarchy 中右键：`Create -> 2D Object -> Tilemap -> Rectangular`
    - Unity 会自动创建一个 Grid 父对象和一个 Tilemap 子对象

3. 选中 Grid 对象，可以在 Scene 视图中看到网格线

4. 在 Tile Palette 窗口中：
    - 选择需要的瓦片
    - 点击画笔工具
    - 在 Scene 视图中绘制地形

![TileMap Drawing](https://jcqn.oss-cn-beijing.aliyuncs.com/game_design_courseware/01_image/Class8_TilePalette.png)

#### 5.4 为 Tilemap 添加碰撞

创建完地形后，角色会直接穿过瓦片。需要添加碰撞组件：

1. 选中 Tilemap 对象
2. 添加组件：**Tilemap Collider 2D**
3. 将 Layer 设置为 **Ground**（用于跳跃检测）

### 6. 构建角色动画状态机

#### 6.1 导入新的角色素材

将马里奥的 `.gif` 素材导入到项目中，设置如下：

| 属性                  | 设置     |
| --------------------- | -------- |
| Sprite Mode           | Multiple |
| Pixels Per Unit (PPU) | 16       |
| Filter Mode           | Point    |
| Compression           | None     |

使用 `Sprite Editor -> Slice -> Automatic` 进行切片。

#### 6.2 更新角色外观

1. 将 Player 的 SpriteRenderer 的 Sprite 更改为马里奥素材的 #13
2. 调整 CapsuleCollider2D 以匹配新的角色形状
3. 检查并调整射线长度以适应**新的角色高度** (自己观察)：

```csharp title="PlayerController.cs"
RaycastHit2D[] hits = Physics2D.RaycastAll(transform.position, Vector2.down, 1.0f);
Debug.DrawRay(transform.position, Vector2.down * 1.0f, Color.red);
```

#### 6.3 实现角色翻转

角色移动时需要面向移动方向，使用**Sprite 翻转**：

```csharp title="PlayerController.cs"
SpriteRenderer spriteRenderer;

void Start()
{
	spriteRenderer = GetComponent<SpriteRenderer>();
}

void Update()
{
    // 移动逻辑
    if (Input.GetKey(KeyCode.A) || Input.GetKey(KeyCode.LeftArrow))
    {
        _rigidbody2D.AddForce(Vector2.left * 18f * Time.deltaTime, ForceMode2D.Impulse);
        spriteRenderer.flipX = true;  // 镜像翻转
    }
    if (Input.GetKey(KeyCode.D) || Input.GetKey(KeyCode.RightArrow))
    {
        _rigidbody2D.AddForce(Vector2.right * 18f * Time.deltaTime, ForceMode2D.Impulse);
        spriteRenderer.flipX = false;	// 默认向右
    }
}
```

:::tip 翻转?
使用 `SpriteRenderer.flipX` 镜像翻转**只需要一套动画**，而不是为左右两个方向分别创建跑、跳等全套动画。这大大减少了工作量。
:::

#### 6.4 创建动画剪辑

1. 为 Player 添加 **Animator** 组件

2. 打开 `Window -> Animation -> Animation`

3. 选中场景中的 Player 物体，创建以下动画剪辑，保存到 `Assets/Animations/Mario/`：

**Idle（待机动画）：**

- Sample Rate: 2
- 使用精灵：#3, #4

**Walk（行走动画）：**

- Sample Rate: 15
- 使用精灵：#13, #14, #12, #14

**Jump（跳跃动画）：**

- Sample Rate: 1
- 使用精灵：#26

#### 6.5 构建动画状态机

1. 打开 `Window -> Animation -> Animator`

2. 选中场景中的 Player 物体，Animator 窗口会显示所有动画状态

3. **创建 Idle 到 Walk 的过渡：**
    - 右键点击 Idle 状态
    - 选择 `Make Transition`
    - 点击 Walk 状态

4. **配置过渡属性：**
    - 取消勾选 `Has Exit Time`（允许随时打断动画）
    - 展开 Settings，取消勾选 `Fixed Duration`
    - 将 `Transition Duration` 设置为 0（瞬间切换）

![Idle to Walk Transition](https://jcqn.oss-cn-beijing.aliyuncs.com/game_design_courseware/01_image/Class8_IdleWalk.png)

5. **添加过渡条件：**
    - 在 Animator 窗口左侧点击 `Parameters` 标签
    - 点击 `+` 按钮，添加 Float 类型参数，命名为 `Speed`
    - 选中 Idle 到 Walk 的过渡箭头
    - 在 `Conditions` 中添加条件：`Speed Greater 0.1`

6. **创建反向过渡：**
    - 右键点击 Walk 状态，创建到 Idle 的过渡
    - 使用相同的设置（取消 Exit Time，Duration = 0）
    - 添加条件：`Speed Less 0.1`

#### 6.6 通过代码控制动画

在 `PlayerController.cs` 中添加动画控制逻辑：

```csharp title="PlayerController.cs"
private Animator _animator;

void Start()
{
    _animator = GetComponent<Animator>();
}

void FixedUpdate()
{
    // 以角色当前速度的大小（标量）更新动画器的 Speed 参数
    _animator.SetFloat("Speed", _rigidbody2D.velocity.magnitude);
}
```

:::caution 为什么在 FixedUpdate 中更新动画参数？
因为 `Rigidbody2D.linearVelocity` 是物理引擎管理的属性，在 FixedUpdate 中访问可以确保获取到**最新的物理状态数据**。如果在 Update 中访问，可能会出现数据更新不及时的问题。
:::
