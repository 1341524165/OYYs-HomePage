---
sidebar_position: 10
id: Class 10
title: Class 10
tags:
    - Study
    - Unity
    - Video Game Teaching
---

# Class 10 - Split Screen & Camera System Part 1

<video width="960" height="540" controls>
  <source src="https://pub-25034b877a7f48ba91623467da545f22.r2.dev/10_SplitScreenCamera.mp4" />
</video>

---

本节课我们将开始制作 2D 系列的最后一个项目：俯视角冒险游戏。重点内容包括：实现双人分屏效果、学习两种相机跟随方式（SmoothDamp 和 Cinemachine）、以及为多方向动画系统做准备。

## Class 10 Overview

1. 场景与素材准备
2. 创建玩家与障碍物
3. 实现基础玩家控制
4. 使用 SmoothDamp 实现相机跟随
5. 实现双人分屏效果
6. 引入 Cinemachine 虚拟相机系统
7. 为多方向动画系统做准备

---

### 1. 场景与素材准备

#### 1.1 创建新场景

在项目中创建新场景，命名为 `SplitScreen`。这是我们第三个游戏项目，知识点较多，将分为**两个场景**讲解。

#### 1.2 导入并配置素材

1. 将 `zelda1.gif` 素材导入到 `Assets/Textures/Adventure/` 文件夹

2. 在 Inspector 中配置素材属性：

| 属性                  | 设置     |
| --------------------- | -------- |
| Sprite Mode           | Multiple |
| Pixels Per Unit (PPU) | 16       |
| Filter Mode           | Point    |
| Compression           | None     |

3. 使用 `Sprite Editor -> Slice -> Automatic -> Apply` 进行切片

#### 1.3 关闭重力系统

由于是俯视角游戏，角色在平面上移动，**不需要重力**：

1. 打开 `Edit -> Project Settings -> Physics 2D`
2. 将 Gravity X 和 Gravity Y 都设置为 0

### 2. 创建玩家与障碍物

#### 2.1 创建玩家

1. 在场景中创建空物体，命名为 `Player`

2. 添加 **SpriteRenderer** 组件，选择 zelda1 素材中的 #4 作为精灵

3. 添加物理组件：
    - **Rigidbody2D**：配置如下
        - Linear Drag: 5（提高阻尼，防止角色像冰球一样滑溜溜的奇怪表现）
        - Freeze Rotation Z: 勾选（冻结 Z 轴旋转，防止角色倾倒）
    - **CircleCollider2D**：用于碰撞检测

:::note Linear Drag（线性阻尼）的作用
线性阻尼控制物体受到的空气阻力。设置较高的值可以让角色停止时更加干脆，不会滑行。

在 Platformer 游戏中我们不需要设置阻尼，因为角色与地面的摩擦力（Physics Material）会自动提供这种效果。但在俯视角游戏中，角色在平面上移动没有地面摩擦，所以需要手动设置阻尼。
:::

#### 2.2 创建障碍物

1. 创建新的空物体，添加 SpriteRenderer 组件
2. 选择 #48 精灵（火堆）
3. 添加 **BoxCollider2D** 组件，使玩家无法穿过障碍物

### 3. 实现基础玩家控制

#### 3.1 创建玩家控制脚本

创建新脚本 `PlayerController.cs`，保存到 `Assets/Code/SplitScreen/` 文件夹：

```csharp title="PlayerController.cs"

namespace SplitScreen
{
    public class PlayerController : MonoBehaviour
    {
		// outlets
        private Rigidbody2D _rigidbody2D;

		// configurations
		public KeyCode keyUp;
		public KeyCode keyDown;
		public KeyCode keyLeft;
		public KeyCode keyRight;
		public float movespeed = 150f;

		private void Start()
		{
			_rigidbody2D = GetComponent<Rigidbody2D>();
		}

		void FixedUpdate()
        {
            // 检测按键并施加力
            if (Input.GetKey(upKey))
            {
                _rigidbody2D.AddForce(Vector2.up * moveSpeed);
            }
            if (Input.GetKey(downKey))
            {
                _rigidbody2D.AddForce(Vector2.down * moveSpeed);
            }
            if (Input.GetKey(leftKey))
            {
                _rigidbody2D.AddForce(Vector2.left * moveSpeed);
            }
            if (Input.GetKey(rightKey))
            {
                _rigidbody2D.AddForce(Vector2.right * moveSpeed);
            }
		}
	}
}
```

:::caution FixedUpdate + ForceMode2D.Force

在 FixedUpdate 中使用 AddForce 时：

- 使用默认的 `ForceMode2D.Force`即可
- **不需要**乘以 `Time.deltaTime`（这是因为 FixedUpdate 以固定时间间隔执行，物理引擎会自动处理时间缩放）

:::

#### 3.2 配置按键和速度

在 Unity 编辑器中：

1. 将脚本挂载到 Player 物体上
2. 在 Inspector 中设置移动按键为 W、A、S、D

测试游戏，确认角色可以使用 WASD 移动，并且会被火堆挡住。

#### 3.3 创建玩家预制体

将 Player 物体拖拽到 `Assets/Prefabs/SplitScreen/` 文件夹，创建预制体，方便创建第二个玩家。

### 4. 使用 `SmoothDamp` 实现相机跟随

#### 4.1 相机跟随的必要性

当角色移动时会跑出屏幕，因此需要让相机跟随玩家。我们首先学习一种经典的实现方法：**平滑阻尼（SmoothDamp）**。

#### 4.2 创建相机控制脚本

创建新脚本 `CameraController.cs` 并挂载到 Main Camera 上：

```csharp title="CameraController.cs"

namespace SplitScreen
{
    public class CameraController : MonoBehaviour
    {
		// outlets
        public Transform target;

		// configurations
		public Vector3 offset;
		public float smoothness;

		// state tracking
		Vector3 _velocity;

		void Start()
        {
			if(target) {
				// 计算初始偏移量
				offset = transform.position - target.position;
        	}
		}

		void FixedUpdate() {
			if(target) {
				transform.position = Vector3.SmoothDamp(
					transform.position,
					target.position + offset,
					ref _velocity,
					smoothness
				);
			}
		}
    }
}

```

#### 4.3 理解 ref 关键字和引用传递

**值传递 vs 引用传递：**

C# 和 Java 默认使用**值传递（Pass by Value）**：

```csharp
// 值传递示例
public void Main()
{
    int x = 5;
    ChangeValue(x);
    Debug.Log(x);  // 输出: 5（x 没有改变）
}

public void ChangeValue(int x)
{
    x = 10;  // 只改变了副本
}
```

在值传递中，函数接收的是参数的**副本**，修改副本不会影响原始变量。

**使用 ref 关键字进行引用传递：**

```csharp
// 引用传递示例
public void Main()
{
    int x = 5;
    ChangeValue(ref x);
    Debug.Log(x);  // 输出: 10（x 被改变了）
}

public void ChangeValue(ref int x)
{
    x = 10;  // 直接修改原始变量
}
```

使用 `ref` 关键字后，函数接收的是变量的**引用（内存地址）**，可以直接修改原始变量。

**SmoothDamp 中的 ref velocity：**

```csharp
Vector3.SmoothDamp(
    transform.position,
    targetPosition,
    ref velocity,      // 引用传递
    smoothness
);
```

SmoothDamp 需要记录上一帧的速度信息来计算平滑运动。通过 `ref velocity`：

1. SmoothDamp 可以读取上一帧的速度
2. SmoothDamp 可以将新计算的速度写回 velocity
3. 下一帧调用时，velocity 保留了最新的速度数据，保持运动的连续性

:::info 全局变量 vs 局部变量
在之前的课程中（如 SpaceShooter 的 score），我们没有使用 ref 关键字，因为那些变量是**全局变量**（在类的最外层声明），所有函数都可以直接访问。

而函数参数是**局部变量**，只在函数内部可见，因此需要使用 ref 进行引用传递。
:::

#### 4.4 配置相机跟随

在 Unity 编辑器中进行最后的设置：

1. 将 Player 拖拽到 Main Camera 的 target 槽位
2. 设置 Smoothness 为 0.5
3. 确保相机初始位置在玩家正上方（XY 相同，Z = -10）

运行游戏，相机应该平滑地跟随玩家移动。

---

### 5. 实现双人分屏效果

#### 5.1 创建第二个玩家

1. 在场景中复制 Player Prefab，命名为 `Player2`
2. 两个 Player 都显示为蓝色，表示它们关联同一个预制体

为了区分两个玩家：

1. 选中 Player2，在 SpriteRenderer 组件中将 Color 调暗（如灰色）
2. 在 PlayerController 组件中，将移动按键改为 **I、J、K、L**

测试游戏，确认两个玩家可以使用不同按键独立移动。

#### 5.2 创建第二个相机

1. 在场景中创建新相机，命名为 `Camera2`
2. 将其位置设置在 Player2 正上方（Z = -10）

:::caution Audio Listener 限制

场景中同一时间**只能有一个激活的 Audio Listener**。

- Main Camera 已经有 Audio Listener（默认创建）
- **不要**给 Camera2 添加 Audio Listener
- 否则 Unity 会报错

:::

#### 5.3 配置视口分屏

选中 Camera2，在 Camera 组件中找到 **Viewport Rect（视口矩形）**：

**屏幕坐标系：**

- 左下角：(0, 0)
- 右上角：(1, 1)

**Camera2 配置（下半屏）：**

- X: 0（从左边开始）
- Y: 0（从底部开始）
- W: 1（宽度占满）
- H: 0.5（高度占一半）

**Main Camera 配置（上半屏）：**

- X: 0
- Y: 0.5（从中间开始）
- W: 1
- H: 0.5

#### 5.4 调整相机大小

由于每个相机的显示区域缩小了一半，需要调整相机的 **Size** 来保持角色大小合适：

1. 选中两个相机
2. 将 Size 从 5 改为 2.5

:::info Camera Size 的含义

Camera 的 Size 表示**从相机中心到上下边界的距离**，即视野高度的一半。

- Size = 2.5 时，整个视野高度 = 5
- Size = 5 时，整个视野高度 = 10

:::

#### 5.5 为 Camera2 添加跟随脚本

同样的步骤：

1. 将 `CameraController.cs` 脚本添加到 Camera2
2. 将 Player2 拖拽到 target 槽位
3. 设置 Smoothness 为 0.5

运行游戏，测试分屏效果是否正常。

### 6. 引入 Cinemachine 虚拟相机系统

#### 6.1 边界问题 - Cinemachine

当前实现存在一个问题：相机始终将角色保持在中心，导致角色移动到地图边界时，**相机会显示大量边界外的空白区域**。

对于`地下城等限定范围`的游戏，这种效果不太合适。接下来我们将使用 **Cinemachine** 虚拟相机系统来解决这个问题。

:::note 对比学习

为了更直观地对比两种方法：

- **上半屏（Main Camera）**：保留 SmoothDamp 方法
- **下半屏（Camera2）**：使用 Cinemachine 方法

:::

#### 6.2 安装 Cinemachine

1. 打开 `Window -> Package Manager`
2. 右上角选择 **Unity Registry**
3. 搜索 Cinemachine 并点击 Install

#### 6.3 创建虚拟相机

1. 移除 Camera2 上的 CameraController 脚本

2. 在 Hierarchy 中右键：`Cinemachine -> Create 2D Camera`

3. Unity 会创建两个对象：
    - **CM vcam1**：虚拟相机（"摄影师"）
    - **CinemachineBrain** 组件会自动添加到 Camera2（"摄像机"）

:::info Cinemachine 的工作原理

- **虚拟相机（Virtual Camera）**：决定如何拍摄、镜头如何移动的"摄影师"
- **CinemachineBrain**：渲染虚拟相机画面的真实相机组件

如果 CinemachineBrain 被错误添加到 `Main Camera`，记得移除它，然后手动添加到 `Camera2`。
:::

#### 6.4 配置虚拟相机

选中 `CM vcam1`，配置以下属性：

1. **Follow**：拖拽 `Player2` 到此槽位，跟随 Player2

2. `Lens -> Orthographic Size`：设置为 2.5（与上半屏保持一致）

:::note Orthographic vs Perspective

- **Orthographic（正交）**：没有近大远小的透视关系，适合 2D 游戏
- **Perspective（透视）**：有深度感，适合 3D 游戏

:::

3. **Body**：展开查看 Dead Zone 和 Soft Zone 设置

#### 6.5 理解 Dead Zone 和 Soft Zone

切换到 Game 视图，可以看到场景中的彩色框：

**三个区域：**

1. **Dead Zone（死区，蓝色内框）**：
    - 玩家在此区域内移动时，相机`完全不动`
    - 适合减少不必要的相机移动

2. **Soft Zone（软区，蓝色和红色之间）**：
    - 玩家进入此区域时，相机开始`平滑跟随`
    - 越接近红色边界，跟随速度越快
    - 提供缓冲过渡效果

3. **Hard Limit（硬限制，红色外框）**：
    - 玩家`绝对不会超出`这个范围
    - 相机会强制跟随以保持玩家在此区域内

可以在 Body 设置中调整这些区域的大小，比 SmoothDamp 的单一 smoothness 参数灵活得多。

#### 6.6 设置关卡边界

Cinemachine 可以感知关卡边界，限制相机移动范围：

1. 创建空物体，命名为 `LevelBounds`

2. 添加 **PolygonCollider2D** 组件：
    - 点击线上任意位置添加新点
    - 按住 `Ctrl` 并点击线段可移除点
    - 沿着火墙外围绘制边界形状

3. **勾选 Is Trigger**（非常重要）
    - 作为不可见的边界范围
    - 如果不勾选，实体碰撞体会把角色挤出地图

4. 在 CM vcam1 中添加扩展：
    - 点击 **Add Extension**
    - 选择 **CinemachineConfiner2D**
    - 将 LevelBounds 拖拽到 **Bounding Shape 2D** 槽位

现在下半屏的相机会被限制在 `LevelBounds` 范围内，不会显示边界外的区域。

### 7. 为多方向动画系统做准备

#### 7.1 清理场景

为了不破坏分屏场景，我们创建新场景用于深入学习动画系统：

1. 在 Project 窗口右键点击 SplitScreen 场景
2. 选择 **Duplicate**
3. 将副本重命名为 `Adventure`

#### 7.2 调整 Adventure 场景

在新的 Adventure 场景中进行以下调整：

**1. 移除玩家一号和 Main Camera：**

- 删除 Player 和 Main Camera（保留 Player2 和 Camera2）

**2. 调整 Camera2 为全屏：**

- 选中 Camera2
- 在 Camera 组件的 Viewport Rect 中：
    - Y: 0（改回底部）
    - H: 1（改回全屏）

:::caution 视野变小的原因
将 Viewport 从 (0, 0.5, 1, 0.5) 改为 (0, 0, 1, 1) 后，视野反而变小了。这是为什么？

**原因：**

- Camera 的 `Size` 决定了**垂直视野的一半高度**
- 当屏幕比例从 2:1 变为 1:1 时，水平视野会相应缩小
- 垂直视野保持不变（**由 Size 决定**），而水平视野由垂直视野及屏幕宽高比决定，于是水平视野被压缩了

**公式：**

- 垂直视野 = Size × 2
- 水平视野 = 垂直视野 × 屏幕宽高比

:::

**3. 调整相机 Size：**

- 选中 CM vcam1
- 将 Orthographic Size 从 2.5 改回 5

**4. 移除关卡边界限制：**

- 在 CM vcam1 的 Extensions 中移除 CinemachineConfiner2D

**5. 清理 Player2：**

- 重命名为 `Player`
- SpriteRenderer 的 Color 改回纯白色
- 移除旧的 PlayerController 脚本

**6. 解包预制体：**

- 右键点击 Player
- 选择 `Prefab -> Unpack Completely`
- 切断与 SplitScreen 预制体的联系，使其成为`独立物体`

#### 7.3 创建新的 PlayerController

1. 在 `Assets/Code/` 下创建 `Adventure` 文件夹

2. 创建新脚本 `PlayerController.cs`：

```csharp title="PlayerController.cs (Adventure)"

namespace Adventure
{
	// ..余下代码直接复制自 namespace SplitScreen 下的 PlayerController.cs
}

```

3. 将脚本挂载到 Player 上，记得设置移动按键和速度

运行游戏，测试单人玩家移动和 Cinemachine 相机跟随是否正常。

#### 7.4 准备多方向动画

俯视角游戏需要上、下、左、右四个方向的动画，每个方向需要三种状态：

- Idle（站立）：4 个动画
- Walk（行走）：4 个动画
- Attack（攻击）：4 个动画

_总计 12 个动画片段。_

**创建动画：**

1. 为 Player 添加 **Animator** 组件

2. 打开 `Window -> Animation -> Animation`

3. 创建以下动画并保存到 `Assets/Animations/Link/` 文件夹：

**站立系列（Sample Rate: 1 fps）：**

- IdleUp：使用精灵 #8
- IdleDown：使用精灵 #4
- IdleLeft：使用精灵 #10
- IdleRight：使用精灵 #6

**行走系列（Sample Rate: 5 fps）：**

- WalkUp：使用精灵 #8, #9
- WalkDown：使用精灵 #4, #5
- WalkLeft：使用精灵 #10, #11
- WalkRight：使用精灵 #6, #7

**攻击系列（Sample Rate: 1 fps）：**

- AttackUp：使用精灵 #30
- AttackDown：使用精灵 #26
- AttackLeft：使用精灵 #35
- AttackRight：使用精灵 #28

#### 7.5 动画状态机的挑战

打开 `Window -> Animation -> Animator`，会看到 12 个动画状态堆在一起。

![Animator 窗口中的 12 个动画状态](https://jcqn.oss-cn-beijing.aliyuncs.com/game_design_courseware/01_image/Class10_Animator.png)

如果使用传统方法（像 Platformer 那样手动连线），需要在这 12 个状态之间创建大量过渡连接，几乎无法维护。

:::caution 动画“蜘蛛网”问题

随着动画状态数量增加，状态机会变成复杂的"蜘蛛网"：

- 12 个状态之间可能需要数十条过渡连接
- 难以管理和调试
- 修改逻辑时容易出错

下节课我们将学习**更高级的解决方案**来优雅地管理这个复杂的动画系统。

:::
