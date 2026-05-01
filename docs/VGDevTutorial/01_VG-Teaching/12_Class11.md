---
sidebar_position: 12
id: Class 11
title: Class 11
tags:
    - Study
    - Unity
    - Video Game Teaching
---

# Class 11 - Adventure Game: Blend Trees & Attack System

<video width="960" height="540" controls>
  <source src="https://pub-25034b877a7f48ba91623467da545f22.r2.dev/11_BlendTreesAttack.mp4" />
</video>

---

本节课我们将深入学习动画混合树系统，解决多方向动画管理的复杂问题，并实现完整的定向攻击系统。这是从基础功能向专业系统设计迈进的重要一课。

## Class 11 Overview

1. 使用 Blend Tree 管理多方向动画
2. 实现动画状态过渡
3. 修复攻击动画的轴心偏移问题
4. 创建可破坏环境物体
5. 使用枚举判断玩家朝向
6. 实现定向攻击系统

---

### 1. 使用 Blend Tree 管理多方向动画

#### 1.1 动画混合树的必要性

上节课我们创建了 12 个动画状态，如果使用传统方法手动连线，Animator 会变成一张无法维护的"蜘蛛网"。

**混合树（Blend Tree）** 是 Unity 提供的强大工具，专门解决多状态、多方向的动画混合问题。我们可以将 12 个动画归纳为：

- **3 种状态**：站立（Idle）、行走（Walk）、攻击（Attack）
- **4 个方向**：上（Up）、下（Down）、左（Left）、右（Right）

#### 1.2 创建混合树

1. 打开 `Window -> Animation -> Animator`

2. **删除所有现有动画状态**：
    - 选中 Animator 窗口中的 12 个动画状态，全部删除
    - 这只是从流程图中删除，.anim 文件仍保存在项目中

3. **创建第一个混合树（Idle）**：
    - 在 Animator 空白处右键
    - 选择 `Create State -> From New Blend Tree`
    - 将新状态重命名为 `Idle`

4. **配置混合树**：
    - 双击 Idle 进入编辑模式
    - 在 Inspector 中，将 **Blend Type** 从 `1D` 改为 `2D Simple Directional`

:::info 1D vs 2D Blend Tree

- **1D**：使用一个变量控制动画切换，适合简单的状态变化（如速度）
- **2D**：使用两个变量共同控制，构建二维混合空间，适合俯视角游戏的方向控制

:::

5. **添加混合参数**：
    - 在 Animator 窗口左上角切换到 **Parameters** 标签
    - 添加两个 **Float** 类型参数：
        - `movementX`（水平移动）
        - `movementY`（垂直移动）

6. **配置混合树参数**：
    - 回到 Idle 混合树的 Inspector
    - 将 Parameters 的两栏分别设置为 `movementX` 和 `movementY`

7. **添加动画片段**：
    - 点击 Motion 旁边的 **+** 号
    - 添加 4 个 Motion Field
    - 将 IdleUp、IdleDown、IdleLeft、IdleRight 分别拖入

8. **设置方向坐标**（关键步骤）：

| 动画      | Position X | Position Y |
| --------- | ---------- | ---------- |
| IdleUp    | 0          | 1          |
| IdleDown  | 0          | -1         |
| IdleLeft  | -1         | 0          |
| IdleRight | 1          | 0          |

:::tip 坐标系统
这些坐标定义了每个动画在 2D 混合空间中的位置：

- 当 movementX = 1, movementY = 0 时，播放 IdleRight
- 当 movementX = 0, movementY = 1 时，播放 IdleUp
- 混合树会根据参数值自动选择最接近的动画

:::

![Blend Tree 配置示意图](https://jcqn.oss-cn-beijing.aliyuncs.com/game_design_courseware/01_image/Class11_BlendTree.png)

#### 1.3 复制混合树创建其他状态

1. 回到 Animator 的 **Base Layer**

2. 复制 Idle 混合树两次：
    - 右键点击 Idle -> **Duplicate**
    - 将副本分别重命名为 `Walk` 和 `Attack`

3. 分别进入 Walk 和 Attack 混合树，将 Motion 替换为对应的动画：
    - **Walk**：WalkUp、WalkDown、WalkLeft、WalkRight
    - **Attack**：AttackUp、AttackDown、AttackLeft、AttackRight

现在 Animator 窗口只有 3 个状态，清爽多了！

### 2. 实现动画状态过渡

#### 2.1 添加控制参数

在 Animator 的 Parameters 中添加：

- **Float** 类型：`speed`（用于判断是否在移动）
- **Trigger** 类型：`attack`（用于触发攻击）

:::info Trigger vs Bool
**为什么使用 Trigger 而不是 Bool？**

Trigger 类型会自动从 true 变回 false，适合`一次性触发`的事件。如果使用 Bool：

1. 需要手动在攻击结束时将其设为 false
2. 需要额外的逻辑判断攻击动画是否结束
3. 需要添加锁定机制防止连续触发

使用 Trigger 可以避免这些复杂性。
:::

#### 2.2 创建状态过渡

1. 右键点击 Idle，选择 **Set as Layer Default State**

2. 创建以下过渡连接（共 6 条）：

**Idle ↔ Walk：**

- Idle -> Walk
- Walk -> Idle

**Idle ↔ Attack：**

- Idle -> Attack
- Attack -> Idle

**Walk ↔ Attack：**

- Walk -> Attack
- Attack -> Walk

#### 2.3 配置过渡条件

为每条过渡设置以下属性：

`Idle -> Walk`：

- Conditions: `speed` Greater 0.1
- Has Exit Time: 取消勾选
- Fixed Duration: 取消勾选
- Transition Duration: 0

`Walk -> Idle`：

- Conditions: `speed` Less 0.1
- Has Exit Time: 取消勾选
- Fixed Duration: 取消勾选
- Transition Duration: 0

`Idle -> Attack`：

- Conditions: `attack`（Trigger）
- Has Exit Time: 取消勾选
- Fixed Duration: 取消勾选
- Transition Duration: 0

`Attack -> Idle`：

- **Has Exit Time: 勾选**
- **Exit Time: 0.25**
- 无其他条件

:::note 为什么 `Attack -> Idle` 需要 Exit Time？
攻击动画**需要播放完整**才能返回 Idle 状态。即使 attack 触发器已经变回 false，动画也会继续播放到 Exit Time 后才能过渡。
:::

`Walk -> Attack`：

- Conditions: `attack`
- Has Exit Time: 取消勾选
- Fixed Duration: 取消勾选
- Transition Duration: 0

`Attack -> Walk`：

- **Has Exit Time: 勾选**
- **Exit Time: 0.25**

#### 2.4 编写动画控制代码

打开 `PlayerController.cs`，添加动画控制部分：

```csharp title="PlayerController.cs"
namespace Adventure
{
    public class PlayerController : MonoBehaviour
    {
        // 动画组件引用
        Animator animator;

        void Start()
        {
            animator = GetComponent<Animator>();
        }

        void FixedUpdate()
        {
            // ...先前的移动逻辑

			float movementSpeed = _rigidbody2D.velocity.sqrMagnitude;
			animator.SetFloat("speed", movementSpeed);

            if(movementSpeed > 0.1f)
			{
				animator.SetFloat("movementX", _rigidbody2D.velocity.x);
				animator.SetFloat("movementY", _rigidbody2D.velocity.y);
			}
        }

        void Update()
        {
            // 攻击逻辑
            if (Input.GetKeyDown(KeyCode.Space))
            {
                animator.SetTrigger("attack");
            }
        }
    }
}
```

#### 2.5 Trigger 与 Bool 的对比实现

如果使用 Bool 类型实现攻击，需要额外的逻辑：

```csharp title="在 PlayerController.cs 中使用 Bool 的复杂实现（仅供参考）"
// 在 Parameters 中添加 Bool 类型的 isAttacking

bool canAttack = true;  // 攻击锁

void Update()
{
    if (Input.GetKey(KeyCode.Space) && canAttack)
    {
        animator.SetBool("isAttacking", true);
        canAttack = false;
    }
}

// 在动画结束时调用此函数（通过 Animation Event）
public void AttackAnimationFinished()
{
    animator.SetBool("isAttacking", false);
    canAttack = true;
}
```

**Animation Event 设置：**

1. 打开 Animation 窗口
2. 选中 AttackDown 等攻击动画
3. 将时间轴拖到最后一帧 (也就是`1:0`位置)
4. 点击 **Add Event**
5. 选择函数 `AttackAnimationFinished`

**_显然，使用 Trigger 要简单得多。_**

### 3. 修复攻击动画的轴心偏移问题

#### 3.1 问题描述

运行游戏测试攻击时，会发现角色在攻击时被向后推，好像被反作用力推开了。

**问题原因：**

所有精灵的轴心（Pivot）默认设置在图片的几何中心。

- 站立和行走动画的轴心在角色中心，没有问题；
- 但在攻击动画中，角色伸出剑，图片变长，几何中心向剑的方向偏移；然而同时，角色的 Transform 位置不应该改变。
    - 为了保持轴心在原位置，整个图片只能向后移动

#### 3.2 修复步骤

1. 在 Project 窗口找到 `Assets/Textures/Adventure/zelda1.gif`

2. 点击 Inspector 中的 **Sprite Editor** 按钮

3. 找到用作攻击的四个精灵（#26、#28、#30、#35）

4. 对每个攻击精灵进行以下设置：
    - 将 **Pivot** 从 `Center` 改为 `Custom`
    - 手动调整 Pivot 的 X 和 Y 值

**推荐的 Pivot 值：**

| 精灵      | 方向        | Pivot X | Pivot Y |
| --------- | ----------- | ------- | ------- |
| zelda1_30 | AttackUp    | 0.5     | 0.285   |
| zelda1_26 | AttackDown  | 0.5     | 0.705   |
| zelda1_35 | AttackLeft  | 0.68    | 0.5     |
| zelda1_28 | AttackRight | 0.3     | 0.5     |

5. 点击右上角的 **Apply** 应用修改

再次测试游戏，攻击动画应该原地挥剑，不会再后退了。

### 4. 创建可破坏环境物体

#### 4.1 导入并配置环境素材

1. 将 `zelda_world.png` 导入到项目中

2. 配置素材属性：

| 属性            | 设置     |
| --------------- | -------- |
| Sprite Mode     | Multiple |
| Pixels Per Unit | 16       |
| Filter Mode     | Point    |
| Compression     | None     |

3. 打开 Sprite Editor，使用新的切片方式：
    - 点击 **Slice**
    - Type 选择 **Grid by Cell Size**（按单元格大小切片）
    - Pixel Size: X = 16, Y = 16
    - 点击 **Slice**，然后 **Apply**

:::info Grid by Cell Size
当素材中的每个图块大小严格统一（如 16×16 像素）时，使用此模式可以像切豆腐一样精准地切分图片，比 Automatic 模式更可控。
:::

#### 4.2 创建可破坏物体

1. 在场景中创建空物体，命名为 `Breakable`

2. 添加 **SpriteRenderer** 组件：
    - 拖入 zelda_world 素材的 #31（小树）
    - 将 **Order in Layer** 设置为 **-1**（使其显示在玩家后面）

3. 添加 **BoxCollider2D** 组件

4. 创建新脚本 `Breakable.cs`：

```csharp title="Breakable.cs"
using UnityEngine;

namespace Adventure
{
    public class Breakable : MonoBehaviour
    {
        public void Break()
        {
            Destroy(gameObject);
        }
    }
}
```

5. 将脚本挂载到 Breakable 物体上

6. 将 Breakable 制作成 Prefab，保存到 `Assets/Prefabs/Adventure/`

7. 在场景中放置多个 Breakable 实例

### 5. 使用枚举判断玩家朝向

#### 5.1 攻击系统的核心问题

要实现正确的攻击判定，必须先知道：**玩家当前面朝哪个方向？**

虽然可以根据按键（WASD）判断，但这种方法不够可靠（如使用手柄摇杆时）。我们需要一个更专业的方法：**检查当前播放的动画精灵**。

#### 5.2 引入枚举（Enum）

在 `PlayerController.cs` 文件的 namespace 外部定义枚举：

```csharp title="PlayerController.cs"
using UnityEngine;

namespace Adventure
{
    // 在 namespace 外部定义枚举
    public enum Direction
    {
        Up = 0,
        Down = 1,
        Left = 2,
        Right = 3
    }

    public class PlayerController : MonoBehaviour
    {
        // ... (之前的代码)

        // 当前朝向
        public Direction facingDirection;

        // SpriteRenderer 引用
        private SpriteRenderer spriteRenderer;

        // 四个方向的站立精灵（严格按照枚举顺序）
        public Sprite[] sprites;

        void Start()
        {
            spriteRenderer = GetComponent<SpriteRenderer>();
        }

        // ... (其他代码)
    }
}
```

:::caution 数组顺序至关重要
sprites 数组的顺序必须与枚举定义严格一致：

- sprites[0] = 向上的精灵（对应 Direction.Up = 0）
- sprites[1] = 向下的精灵（对应 Direction.Down = 1）
- sprites[2] = 向左的精灵（对应 Direction.Left = 2）
- sprites[3] = 向右的精灵（对应 Direction.Right = 3）

:::

#### 5.3 在 Inspector 中配置精灵数组

1. 选中 Player 物体
2. 在 PlayerController 组件中找到 Idle Sprites
3. 将 Size 设置为 4
4. 按顺序拖入四个方向的站立精灵：
    - Element 0: IdleUp 的精灵
    - Element 1: IdleDown 的精灵
    - Element 2: IdleLeft 的精灵
    - Element 3: IdleRight 的精灵

![枚举与数组顺序示意图](https://jcqn.oss-cn-beijing.aliyuncs.com/game_design_courseware/01_image/Class11_AttackSpritesArray.png)

#### 5.4 使用 LateUpdate 检测朝向

```csharp title="PlayerController.cs"
void LateUpdate()
{
    // 遍历四个方向的精灵
    for (int i = 0; i < sprites.Length; i++)
    {
        // 如果当前显示的精灵与数组中的某个精灵匹配
        if (spriteRenderer.sprite == sprites[i])
        {
            // 将索引转换为对应的方向枚举
            facingDirection = (Direction)i;
            break;
        }
    }
}
```

:::info 为什么使用 `LateUpdate()`？
Unity 的执行顺序：

1. Update（输入检测和逻辑）
2. Animator 更新（动画系统根据参数更新）
3. **LateUpdate**
4. 渲染

如果在 Update 中检查精灵，可能获取到`上一帧的旧精灵`。LateUpdate 在动画更新完成后执行，可以获取到`最新的`精灵状态。
:::

运行游戏，选中 Player，观察 Inspector 中的 Facing Direction 是否随移动方向实时变化。

### 6. 实现定向攻击系统

#### 6.1 创建攻击区域

1. 在 Player 下创建空物体 `AttackZones`，位置设为 (0, 0, 0)

2. 在 AttackZones 下创建四个空物体：`Up`、`Down`、`Left`、`Right`

3. 为了在场景中可视化这些空物体：
    - 点击物体名称左侧的图标
    - 选择红色圆点图标

4. 将这四个点拖到玩家模型的上下左右对应位置，代表攻击判定的中心点

![攻击区域示意图](https://jcqn.oss-cn-beijing.aliyuncs.com/game_design_courseware/01_image/Class11_AttackPointsVisual.png)

#### 6.2 配置攻击区域数组

在 `PlayerController.cs` 中添加：

```csharp title="PlayerController.cs"
public class PlayerController : MonoBehaviour
{
    // ... (之前的代码)

    // 四个方向的攻击区域（严格按照枚举顺序）
    public Transform[] attackZones;

    // ... (其他代码)
}
```

同样的，在 Unity 编辑器中，按顺序将攻击区域拖入数组：

- Element 0: Up
- Element 1: Down
- Element 2: Left
- Element 3: Right

#### 6.3 使用 OverlapCircleAll 实现攻击判定

在 `PlayerController.cs` 的 Update 函数中添加攻击逻辑：

```csharp title="PlayerController.cs"
void Update()
{
	// ...之前的movement更新animator部分

    // 攻击逻辑
    if (Input.GetKeyDown(KeyCode.Space))
    {
        animator.SetTrigger("attack");

		// 将enumeration转换为整数索引
		int facingDirectionIndex = (int)facingDirection;

        // 获取当前朝向的攻击点
        Transform attackPoint = attackZones[facingDirectionIndex];

        // 使用 OverlapCircleAll 检测攻击范围内的所有碰撞体
        Collider2D[] hits = Physics2D.OverlapCircleAll(
            attackPoint.position,  // 圆心位置
            0.1f           // 圆的半径
        );

        // 遍历所有被检测到的碰撞体
        foreach (Collider2D hit in hits)
        {
            // 尝试获取 Breakable 组件
            Breakable breakableObject = hit.GetComponent<Breakable>();

            // 如果存在 Breakable 组件，调用 Break 方法
            if (breakableObject != null)
            {
                breakableObject.Break();
            }
        }
    }
}
```

:::info Physics2D.OverlapCircleAll

`OverlapCircleAll` 这个函数在指定位置绘制一个圆形区域，返回该区域内所有的 Collider2D 组件。

**参数：**

- `Vector2 point`：圆心位置
- `float radius`：圆的半径

**返回值：**

- `Collider2D[]`：区域内所有碰撞体的数组

:::

#### 6.4 理解实例访问的两种方式

**GetComponent 返回的实例 vs 静态实例：**

```csharp
// 方式 1: GetComponent 获取实例（本例使用）
Breakable breakableObject = hitCollider.GetComponent<Breakable>();
breakableObject.Break();  // 调用特定物体的 Break 方法

// 方式 2: 静态实例（单例模式）
Breakable.instance.Break();  // 调用唯一实例的 Break 方法
```

**为什么不能使用静态实例？**

静态实例采用**单例模式**，全场景只有一个实例：

- 4 个 Breakable 预制体都有相同的 `instance` 引用
- Awake 执行顺序不确定，最后一个执行的会覆盖 instance
- 调用 `Breakable.instance.Break()` 会销毁随机的一个物体，而不是被攻击的那个

**GetComponent 的优势：**

- 每次调用返回**特定物体**的组件实例
- 可以精确控制要操作的对象
- 适合需要操作多个同类型对象的场景
