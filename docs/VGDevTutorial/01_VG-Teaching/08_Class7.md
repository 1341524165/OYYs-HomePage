---
sidebar_position: 8
id: Class 7
title: Class 7
tags:
    - Study
    - Unity
    - Video Game Teaching
---

# Class 7 - Platformer Part 1: Advanced Physics

<video width="960" height="540" controls>
  <source src="https://pub-25034b877a7f48ba91623467da545f22.r2.dev/07_AdvancedPhysics.mp4" />
</video>

---

本节课我们将开始一个新的项目：2D 平台跳跃游戏（Platformer），类似于经典的《超级马里奥》。我们将从零开始，完成项目的基本设置、角色 Prefab 的创建，并编写核心的角色移动与瞄准脚本。

## Class 7 Overview

1. 项目与素材设置
2. 核心游戏对象（Prefabs）的创建
3. 基础关卡布局
4. 编写玩家移动脚本 (Update vs FixedUpdate)
5. 实现坠落重玩机制 (Trigger)
6. 实现鼠标瞄准系统

---

### 1. 项目与素材设置

#### 1.1 场景与素材导入

1. 创建新场景：在项目中新建一个场景，命名为 `Q2`

2. 导入素材：将本节课所需素材 (items_spritesheet、tiles_spritesheet、p1_walk、target) 导入到 Assests/Textures/Platformer/ 路径下

3. 选中 items_spritesheet、tiles_spritesheet、p1_walk，在 Inspector 中进行如下统一设置：

| 属性                  | 设置     |
| --------------------- | -------- |
| Sprite Mode           | Multiple |
| Pixels Per Unit (PPU) | 69       |
| Filter Mode           | Bilinear |
| Compression           | None     |

然后点击 `Sprite Editor -> Slice -> Type: Automatic -> Apply`

4. 选中 target（准心），设置如下：

| 属性                  | 设置     |
| --------------------- | -------- |
| Sprite Mode           | Single   |
| Pixels Per Unit (PPU) | 980      |
| Filter Mode           | Bilinear |
| Compression           | None     |

#### 1.2 图层与物理设置

1. 添加图层 (Layers)：  
   在Inspector窗口中，点击`Layers -> Edit Layers`，新增三个图层 `Ground`、`PlayerProjectile`、`Player`。

2. 设置碰撞矩阵：  
   前往 `Edit -> Project Settings -> Physics 2D`，修改碰撞矩阵，取消 `PlayerProjectile` 与 `Player`、以及 `PlayerProjectile` 与其自身的碰撞交互。

### 2. 核心游戏对象（Prefabs）的创建

#### 2.1 地面 (Ground) Prefab

1. 在场景中创建一个空物体。
2. 添加 SpriteRenderer 组件，并赋予一张地块贴图。
3. 添加 BoxCollider2D 组件，用于物理碰撞。
4. 将其 Layer 设置为 `Ground`。
5. 在 Assets/ 下新建 Prefabs/Platformer/ 文件夹，将该物体从 Hierarchy 拖入，制成 Prefab。

#### 2.2 玩家 (Player) Prefab

重复上述流程，将`锁状`贴图的物体制作成名为 Target 的 Prefab。

#### 2.3 玩家炮弹 (PlayerProjectile) Prefab

1. 创建空物体，添加 SpriteRenderer 组件，赋予主角贴图，并将其 Layer 设置为 Player。
2. 添加 CapsuleCollider2D 组件。
3. 添加 Rigidbody2D 组件，并展开 Constraints 选项，勾选 Freeze Rotation Z，以防止角色在碰撞后翻倒。
4. 将其制作为 Player Prefab。

:::tip 为什么使用胶囊碰撞体 (CapsuleCollider2D)？
胶囊体的底部是圆弧形的，这使得角色在平台边缘移动时不容易被卡住，可以获得更平滑的移动体验。  
相比之下，盒状碰撞体（BoxCollider2D）的尖角更容易在移动中与地形的边角发生不期望的卡顿。
:::

#### 2.4 子弹 (Projectile) Prefab

1. 创建空物体，添加 SpriteRenderer 组件，赋予钥匙贴图（作为子弹），并将其 Layer 设置为 PlayerProjectile。
2. 添加 CapsuleCollider2D 组件，并将其 **Direction** 设置为 `Horizontal`。
3. 添加 Rigidbody2D 组件，并将其 Gravity Scale 设置为 0，让子弹沿直线飞行。
4. 将其制作为 Projectile Prefab，并从场景中删除。

:::note 关于胶囊碰撞体的 `Direction`
**Direction** 属性决定了胶囊体的**长轴**方向。由于我们的子弹是水平飞行的，将其设置为 `Horizontal` 可以让碰撞体的形状正确匹配贴图，从而实现更精确的碰撞检测。  
如果保持默认的 `Vertical`，碰撞体将是一个圆形。

$ \frac{x^2}{a^2} + \frac{y^2}{b^2} = 1 $

:::

### 3. 基础关卡布局

将制作好的 Ground Prefab 拖入场景，搭建一个简单的地形，中间留有间隙。再将 Target Prefab 放置在合适的位置，如下所示可供参考：

![Basic Level Design](https://jcqn.oss-cn-beijing.aliyuncs.com/game_design_courseware/01_image/Class7_LevelDesign.png)

### 4. 编写玩家移动脚本

新建一个 C# 脚本 `PlayerController.cs` 并挂载到 Player Prefab 上：

```csharp title="PlayerController.cs"
using UnityEngine;

public class PlayerController : MonoBehaviour
{
    // 移动速度
    public float moveSpeed = 18f;
    // 刚体组件的引用
    private Rigidbody2D _rigidbody2D;

    void Start()
    {
        // 获取并存储 Rigidbody2D 组件
        _rigidbody2D = GetComponent<Rigidbody2D>();
    }

    void Update()
    {
        // 检测 'A' 键或左箭头键
        if (Input.GetKey(KeyCode.A) || Input.GetKey(KeyCode.LeftArrow))
        {
            // 向左施加【冲量】
            _rigidbody2D.AddForce(Vector2.left * moveSpeed * Time.deltaTime, ForceMode2D.Impulse);
        }
        // 检测 'D' 键或右箭头键
        if (Input.GetKey(KeyCode.D) || Input.GetKey(KeyCode.RightArrow))
        {
            // 向右施加【冲量】
            _rigidbody2D.AddForce(Vector2.right * moveSpeed * Time.deltaTime, ForceMode2D.Impulse);
        }
    }
}

```

#### 4.1 Update vs FixedUpdate & Force vs Impulse

这是一个非常重要的物理概念。

- Update(): 每帧执行一次。其执行频率受设备性能影响，因此在处理物理移动时需要乘以 Time.deltaTime 来抹平帧率差异。
- FixedUpdate(): 以固定的时间间隔（默认为 0.02s）执行一次，不受帧率影响。所有物理相关的计算都推荐放在这里。

接下来是 AddForce 函数：  
AddForce 函数接收两个参数：力和力的模式 (ForceMode2D)。

- ForceMode2D.Force (默认): 此模式会模拟一个`持续的力`，其内部计算会**自动乘以 Time.fixedDeltaTime**。如果在 Update 中使用，就会导致 moveSpeed _ Time.deltaTime _ Time.fixedDeltaTime 的双重时间缩放，使得最终作用力极小。

- ForceMode2D.Impulse: 此模式会模拟一个`瞬时冲量`，它**不会再额外乘以时间**。这使得我们可以在 Update 中手动乘以 Time.deltaTime，从而精确地控制每帧施加的冲量大小，避免了双重时间缩放的问题。

:::caution 最佳实践

- `输入检测`最好可以始终放在 `Update()` 中，因为它能最快地响应玩家的每帧操作。
- `物理计算`（如 AddForce）理论上应放在 `FixedUpdate()` 中，这样可以省略 Time.deltaTime 并且使用默认的 ForceMode2D.Force 模式。

为何本课选择在 Update 中处理物理？  
主要为了代码的统一性和简洁性，我们将输入检测和物理响应都放在 Update 中，并且更好的引入这个新概念。然而，为了在这种情况下正确地施加力，我们必须：

1. 乘以 `Time.deltaTime` 来保证帧率无关性。
2. 使用 `ForceMode2D.Impulse` 来避免物理引擎内部多余的时间缩放。

:::

### 5. 实现坠落重玩机制 (Trigger)

当玩家掉出平台时，我们需要重新加载当前场景。

#### 5.1 创建死亡区域 (Death Zone)

1. 在场景底部创建一个大的空物体。
2. 为其添加一个 BoxCollider2D 组件，调整大小以覆盖整个掉落区域。
3. 在 BoxCollider2D 组件中，勾选 Is Trigger 选项。

:::note Collider vs Trigger

- `Collider (碰撞器)`：是一个实体障碍物，会产生物理碰撞效果。检测碰撞使用 OnCollisionEnter2D(Collision2D collision)。

- `Trigger (触发器)`：不是一个实体，物体可以穿过它。它只用于检测是否有物体进入其范围，而不产生物理碰撞。检测触发使用 OnTriggerEnter2D(Collider2D other)。

:::

#### 5.2 编写触发代码

```csharp title="LevelBound.cs"
using UnityEngine;
using UnityEngine.SceneManagement;

namespace Platformer
{
    public class LevelBound : MonoBehaviour
    {
        private void OnTriggerEnter2D(Collider2D other)
        {
			if(other.gameObject.GetComponent<PlayerController>() != null)
			{
				SceneManager.LoadScene(SceneManager.GetActiveScene().name);
			}
        }
    }
}

```

#### 5.3 添加场景到生成设置

为了让 LoadScene 函数能够找到要加载的场景，我们必须：

1. 前往 `File -> Build Settings`
2. 点击 **Add Open Scenes** 将当前场景（Q2）添加到列表中。

### 6. 实现鼠标瞄准系统

#### 6.1 创建瞄准系统

1. 在 Player 物体下创建一个空的子物体，命名为 `AimPivot`。确保它的轴心（Pivot）与 Player 的中心重合。
2. 在 AimPivot 下再创建一个空的子物体，命名为 `Reticle（准心）`。
3. 为 Reticle 添加 SpriteRenderer 组件并赋予准心贴图。

这种 Player -> AimPivot -> Reticle 的层级结构非常有用。  
我们只需要旋转中间的 AimPivot，其子物体 Reticle 就会围绕 Player 的中心进行“公转”，实现了瞄准效果。  
未来，角色的手臂、武器等也可以作为 AimPivot 的子物体，复用这套旋转逻辑。

#### 6.2 编写瞄准代码

```csharp title="PlayerController.cs"
// ... (之前的代码)

public Transform aimPivot;

void Update()
{
	// ... (移动代码)

	// --- 瞄准逻辑 ---
	// 1. 获取鼠标在屏幕上的二维坐标
	Vector3 mousePosition = Input.mousePosition;

	// 2. 将屏幕坐标转换为游戏世界坐标
	Vector3 worldMousePosition = Camera.main.ScreenToWorldPoint(mousePosition);

	// 3. 计算从角色指向鼠标的向量
	Vector2 directionFromPlayerToMouse = worldMousePosition - transform.position;

	// 4. 使用 Atan2 计算该向量与x轴正方向的夹角（弧度），再转换为角度
	float radiansToMouse = Mathf.Atan2(directionFromPlayerToMouse.y, directionFromPlayerToMouse.x);

	// 5. 将弧度转换为角度
	float angleToMouse = radiansToMouse * Mathf.Rad2Deg;

	// 6. 将计算出的角度应用到 aimPivot 的旋转上
	aimPivot.rotation = Quaternion.Euler(0, 0, angleToMouse);
}

// ... (触发器代码)

```

:::info Atan2 函数
Mathf.Atan2(y, x) 是一个`反正切`函数，它接收一个向量的 y 和 x 分量，并返回该向量与 X 轴正方向之间的夹角（以**弧度**为单位）。这个函数非常适合用于处理2D旋转。

返回的弧度值需要乘以 `Mathf.Rad2Deg` (一个常量，约等于 57.2958) 来转换为我们更熟悉的**角度**。
:::

最后，回到 Unity 编辑器，将场景中的 AimPivot 物体拖拽到 PlayerController 组件对应的 aimPivot 槽位上即可。
