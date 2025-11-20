---
sidebar_position: 10
id: Class 9
title: Class 9
tags:
	- Study
	- Unity
	- Video Game Teaching
---

# Class 9 - Platformer Part 3: Audio, UI & Data Persistence

<video width="960" height="540" controls>
  <source src="https://pub-25034b877a7f48ba91623467da545f22.r2.dev/09_AudioUIData.mp4" />
</video>

---

本节课我们将完成 Platformer 游戏的收尾工作，包括：修复子弹碰撞问题、完善跳跃动画状态机、引入音效系统、实现积分与数据持久化，以及构建完整的暂停菜单系统。

## Class 9 Overview

1. 修复子弹与玩家的碰撞问题
2. 完善跳跃动画过渡
3. 实现音效系统 (Audio System)
4. 添加积分系统与数据持久化 (PlayerPrefs)
5. 构建暂停菜单与子菜单
6. 实现游戏暂停机制

---

### 1. 修复子弹与玩家的碰撞问题

#### 1.1 问题回顾

上节课遗留了一个问题：子弹发射后会立即与玩家发生碰撞，导致子弹被销毁或推开玩家。

**问题原因：**  
虽然在 **Edit -> Project Settings -> Physics 2D** 中设置了碰撞矩阵，禁用了 Player 和 PlayerProjectile 之间的碰撞，但 Player 物体的 Layer 没有正确设置为 `Player`。

#### 1.2 解决方案

1. 选中场景中的 Player 物体
2. 在 Inspector 窗口将 Layer 设置为 `Player`
3. 如果有提示，选择 **Yes, change children** 将设置应用到所有子物体

现在可以取消注释 `Projectile.cs` 中的销毁代码，测试子弹发射功能。

:::tip Debug 经验总结
当遇到 bug 时，应该按照逻辑顺序逐步检查：

1. 确认问题的具体表现
2. 分析问题的可能成因
3. 按照数据流向逐一排查相关设置

:::

### 2. 完善跳跃动画过渡

#### 2.1 上节课内容回顾

上节课我们实现了 Idle 和 Walk 之间的动画过渡，使用 Speed 参数控制切换。本节课需要添加 Jump 动画的过渡逻辑。

**射线检测逻辑补充说明：**  
使用射线检测脚下地面的方案同时解决了两个问题：

1. 头顶接触到 Ground 层也会重置跳跃次数
2. OnCollisionStay 与 Update 在同一帧的执行顺序问题

当玩家起跳时，即使 OnCollisionStay2D 仍被调用（物理系统认为玩家还在地面上），但由于射线长度（0.85f）只有角色身高的一半，当 Update 执行起跳后，玩家脚底已经离地，射线无法触及地面，因此不会进入 if 判断重置 jumpsLeft。

#### 2.2 创建跳跃动画过渡

1. 打开 **Window -> Animation -> Animator**

2. 创建从 **Any State** 到 **Jump** 的过渡：
    - 右键点击 **Any State**
    - 选择 **Make Transition**
    - 点击 **Jump** 状态

3. 配置过渡属性：
    - 取消勾选 **Has Exit Time**
    - 取消勾选 **Fixed Duration**
    - 将 **Transition Duration** 设置为 0

4. 在 Parameters 中添加新参数：
    - 类型：**Int**
    - 名称：**JumpsLeft**

5. 设置过渡条件：
    - 在 Any State -> Jump 的过渡中添加条件：**JumpsLeft Less 2**

:::note Can Transition To Self?
在 Jump 状态的设置中，有一个选项叫 **Can Transition To Self**（可以过渡到自己），默认是勾选的。

这个选项的作用：当执行，如二段跳等动作时，即使已经在 Jump 动画状态中，也可以重新播放 Jump 动画。如果 Jump 动画包含“下蹲蓄力”的过程，这个选项可以让二段跳也播放完整的起跳动作。

本教程中 Jump 动画只有一帧，所以勾不勾选都没有影响。
:::

#### 2.3 创建落地过渡

创建从 **Jump** 到 **Idle** 的过渡：

- 右键点击 Jump 状态，创建到 Idle 的过渡
- 取消 **Has Exit Time** 和 **Fixed Duration**
- **Transition Duration** 设置为 0
- 添加条件：**JumpsLeft Greater 1**（表示已经落地）

:::info 为什么不创建 Jump 到 Walk 的过渡？
因为我们已经有了 Idle 到 Walk 的过渡（通过 Speed 参数判断）。当角色落地变为 Idle 后，如果正在移动，会立即切换到 Walk，视觉效果与直接从 Jump 切换到 Walk 基本一致。
:::

#### 2.4 在代码中同步动画参数

在 `PlayerController.cs` 的 **Update 函数**中同步 JumpsLeft 参数：

```csharp title="PlayerController.cs"

if(Input.GetKeyDown(KeyCode.Space))
{
	if(jumpsLeft > 0)
	{
		jumpsLeft--;
		_rigidbody2D.AddForce(Vector2.up * 15f, ForceMode.Impulse);
	}
}
animator.SetInteger("JumpsLeft", jumpsLeft);

```

:::caution 为什么这次在 Update 而不是 FixedUpdate 中更新参数？

上节课我们在 FixedUpdate 中更新 `Speed` 参数，是因为需要获取 `Rigidbody2D.linearVelocity`（物理引擎管理的属性）。

而 `jumpsLeft` 是我们自己声明的变量，在 Update 中更新，**不涉及物理系统**，因此没有必要放在 FixedUpdate 中。
:::


#### 2.5 匹配动画播放速度与移动速度

为了避免"滑步"现象（移动速度与动画播放速度不匹配），可以根据实际速度调整动画播放速度：
```csharp title="PlayerController.cs"
void FixedUpdate()
{
    animator.SetFloat("Speed", _rigidbody2D.velocity.magnitude);

	if(_rigidbody2D.velocity.magnitude > 0)
	{
		animator.speed = _rigidbody2D.velocity.magnitude / 3f;
	} else {
		animator.speed = 1f;
	}
}
```


### 3. 实现音效系统 (Audio System)

#### 3.1 导入音频素材

将三个 `.wav` 音频文件导入到 `Assets/Audio/` 文件夹：
- `shoot.wav` - 发射子弹音效
- `hit.wav` - 击中目标音效
- `miss.wav` - 未击中目标音效

![Audio Files](https://jcqn.oss-cn-beijing.aliyuncs.com/game_design_courseware/01_image/Class9_AudioFiles.png)

#### 3.2 Unity 音频系统基础概念

Unity 的音频系统包含三个主要组件：

1. **Audio Clip（音频资源）**：导入的音频文件素材
2. **Audio Source（音频源）**：用于播放声音的组件
3. **Audio Listener（音频监听器）**：用于接收声音的组件，相当于玩家的"耳朵"

:::caution Audio Listener 的重要规则
- 每个场景中**同一时间只能有一个激活的 Audio Listener**
- 通常挂载在 Main Camera 上
- 如果场景中有多个 Listener 被激活，Unity 会报错
- 如果需要切换 Listener，必须先禁用当前的再启用新的
:::

#### 3.3 为子弹添加发射音效

1. 选中 Projectile Prefab，添加 **Audio Source** 组件

2. 配置 Audio Source 属性：
   - 勾选 **Play On Awake**（子弹生成时立即播放）
   - Audio Clip：拖拽 `shoot.wav` 到此槽位
   - Spatial Blend：设置为 **0 (2D)**

:::info Spatial Blend: 2D vs 3D
- 2D (值为 0)：声音不受距离影响，音量恒定，适合 2D 游戏
- 3D (值为 1)：声音根据 Audio Listener 与 Audio Source 的距离变化，产生立体声效果

**为什么 2D 游戏就得用 2D 模式？**
- 2D 游戏没有 Z 轴深度，但摄像机的 Z 坐标通常是 -10
- 使用 3D 模式可能导致`距离计算错误`，产生意外的音量变化
- _如果需要在 2D 中模拟距离效果，应通过代码控制 `audioSource.volume`_
:::

#### 3.4 创建 SoundManager 管理全局音效

**问题分析：**  
hit 和 miss 音效需要在子弹碰撞时播放，但子弹碰撞后会立即被销毁（包括其上的所有组件）。在这种实现情况下，子弹永远无法播放完整的音效。

**解决方案：**  
创建一个独立的 `SoundManager` 物体来管理全局音效。

1. 在场景中创建一个空物体，命名为 SoundManager

2. 为其添加两个 **Audio Source** 组件

3. 创建新脚本 `SoundManager.cs` 并挂载到 SoundManager 物体上：

```csharp title="SoundManager.cs"
namespace Platformer
{
    public class SoundManager : MonoBehaviour
    {
        public static SoundManager instance;	// 跨类访问用的单例

        AudioSource audioSource;
		public AudioClip missSound;
		public AudioClip hitSound;

        void Awake()
        {
            instance = this;
        }

        void Start()
        {
            audioSource = GetComponent<AudioSource>();
        }

		// 播放击中音效
		public void PlaySoundHit()
		{
			audioSource.PlayOneShot(hitSound);
		}

		// 播放未击中音效
		public void PlaySoundMiss()
		{
			audioSource.PlayOneShot(missSound);
		}
    }
}
```

:::info PlayOneShot vs Play
- `Play()`: 会停止当前正在播放的音效，然后播放新音效
- `PlayOneShot(AudioClip)`: 不会打断当前音效，可以同时播放多个音效，适合短促的游戏音效
:::

4. 在 Unity 编辑器中：
   - 将 `hit.wav` 拖拽到 hitSound 槽位
   - 将 `miss.wav` 拖拽到 missSound 槽位

#### 3.5 在碰撞时触发音效

在 `Projectile.cs` 中调用 SoundManager 的方法：

```csharp title="Projectile.cs"
private void OnCollisionEnter2D(Collision2D other)
{
    // 检测是否击中目标
    if (other.gameObject.GetComponent<Target>() != null)
    {
        SoundManager.instance.PlaySoundHit();
    }
    else if (other.gamObject.layer == LayerMask.NameToLayer("Ground"))
    {
        SoundManager.instance.PlaySoundMiss();
    }
    
    Destroy(gameObject);
}
```

---

### 4. 添加积分系统与数据持久化

#### 4.1 实现积分系统

在 `PlayerController.cs` 中添加积分相关代码：

```csharp title="PlayerController.cs"
using TMPro;

namespace Platformer
{
    public class PlayerController : MonoBehaviour
    {
        public static PlayerController instance;

		// .. previous outlets

		// new outlets
        public TMP_Text score_UI;

		// state tracking
		public int jumpsLeft;
		public int score;

		void Awake()
		{
			instance = this;
		}

		void Update() {
			// update UI
			score_UI.text = score.ToString();
		}
    }
}
```

在 `Target.cs` 中，击中目标时增加分数：
```csharp title="Target.cs"
private void OnCollisionEnter2D(Collision2D other)
{
    if (other.gameObject.GetComponent<Projectile>() != null)
    {
        // 增加分数
        PlayerController.instance.score++;
        Destroy(gameObject);
    }
}
```

#### 4.2 创建积分 UI

1. 在 Hierarchy 中右键：`UI -> Text - TextMeshPro`

2. 配置 Text 属性：
   - 设置锚点为顶部中心
   - 调整位置和大小
   - 设置字体大小和颜色
   - 文本内容：`Score: 0`

3. 选中 Canvas，设置 Canvas Scaler：
   - UI Scale Mode: Scale With Screen Size
   - Reference Resolution: 1920 x 1080

4. 将 Text 对象拖拽到 Player 的 scoreUI 槽位

#### 4.3 使用 PlayerPrefs 实现数据持久化

**PlayerPrefs** 是 Unity 提供的简单本地存储系统，可以保存少量的键值对数据。

**存储机制：**
- Windows：写入注册表
- macOS：创建 `.plist` 文件存储在用户目录下
- 数据在游戏关闭后依然保留

在 `Target.cs` 中，每次更新分数时保存：

```csharp title="Target.cs"
private void OnCollisionEnter2D(Collision2D collision)
{
    if (collision.gameObject.GetComponent() != null)
    {
        // 增加分数
        PlayerController.instance.score += 10;
        
        // 新增代码在这一行：保存分数到本地
        PlayerPrefs.SetInt("Score", PlayerController.instance.score);
        
        Destroy(gameObject);
    }
}
```

在 `PlayerController.cs` 的 Start 函数中读取保存的分数：

```csharp title="PlayerController.cs"
void Start()
{
    _rigidbody2D = GetComponent<Rigidbody2D>();
	sprite = GetComponent<SpriteRenderer>();
    _animator = GetComponent<Animator>();
    
    // 新增代码在这一行：从本地读取保存的分数，如果不存在则默认为 0
    score = PlayerPrefs.GetInt("Score", 0);
}
```

:::note PlayerPrefs 常用方法
- SetInt(string key, int value): 保存整数
- SetFloat(string key, float value): 保存浮点数
- SetString(string key, string value): 保存字符串
- GetInt(string key, int defaultValue): 读取整数，不存在则返回默认值
- GetFloat(string key, float defaultValue): 读取浮点数
- GetString(string key, string defaultValue): 读取字符串
- DeleteKey(string key): 删除指定键值对
- DeleteAll(): 删除所有保存的数据
:::

### 5. 构建暂停菜单与子菜单

#### 5.1 创建菜单 UI 结构

1. 在 Hierarchy 中右键：**UI -> Panel**，重命名为 `Panel - Menu`

2. 配置 Panel 属性：
   - 重置锚点和位置
   - 设置大小：640 x 480
   - （可选）在 Image 组件中调整颜色透明度

3. 在 Panel - Menu 下创建三个空物体作为子菜单容器：
   - `Main Menu`（主菜单）
   - `Options`（选项菜单）
   - `Level Select`（关卡选择菜单）

4. 在每个子菜单中添加按钮（**UI -> Button - TextMeshPro**）：

**Main Menu 按钮：**
- Resume（继续游戏）
- Options（选项）
- Levels（关卡选择）

**Options 按钮：**
- Back（返回）
- Reset Score（重置分数）

**Level Select 按钮：**
- Back（返回）
- Level 1（关卡 1）

![Menu Structure](https://jcqn.oss-cn-beijing.aliyuncs.com/game_design_courseware/01_image/Class9_MenuStructure.png)

5. 禁用 Options 和 Level Select 物体，使游戏开始时只显示`主菜单`

#### 5.2 编写菜单控制脚本

创建新脚本 `MenuController.cs` 并挂载到 Panel - Menu 上。

:::caution 静态实例的**执行时机**问题
MenuController 在 Awake 中调用 `gameObject.SetActive(false)` 隐藏自己后，挂载在其上的脚本也会被禁用。

但通过**静态实例**，其他脚本仍然可以调用 MenuController 的方法，这正是静态实例的重要优势之一。
:::


```csharp title="MenuController.cs"
namespace Platformer
{
    public class MenuController : MonoBehaviour
    {
        public static MenuController instance;	// 跨类访问用的单例

        void Awake()
        {
            instance = this;
			Hide();
        }

		public void Show()
		{
			ShowMainMenu();
			gameObject.SetActive(true);
		}

		public void Hide()
		{
			gameObject.SetActive(false);
		}

		// outlets
		public GameObject mainMenu;
		public GameObject optionsMenu;
		public GameObject levelSelectMenu;

        void SwitchMenu(GameObject someMenu)
        {
            mainMenu.SetActive(false);
            optionsMenu.SetActive(false);
            levelSelectMenu.SetActive(false);

			// turn on the requested menu
            someMenu.SetActive(true);
        }

		public void ShowMainMenu() { SwitchMenu(mainMenu); }
		public void ShowOptionsMenu() { SwitchMenu(optionsMenu); }
		public void ShowLevelSelectMenu() { SwitchMenu(levelSelectMenu); }
    }
}
```

#### 5.3 添加 ESC 键打开菜单

在 `PlayerController.cs` 的 Update 函数中添加：

```csharp title="PlayerController.cs"
void Update()
{
    // 按 ESC 键显示菜单
    if (Input.GetKeyDown(KeyCode.Escape))
    {
        MenuController.instance.Show();
    }
    
    // ... (其他代码)
}
```

#### 5.4 绑定按钮事件

选中每个按钮，在 Inspector 的 **Button -> On Click ()** 中添加事件 (下图为示例)：

![Menu Button Binding](https://jcqn.oss-cn-beijing.aliyuncs.com/game_design_courseware/01_image/Class9_MenuButtonBinding.png)

**Main Menu 按钮绑定：**
- **Resume**：拖拽 `Panel - Menu` → 选择 `MenuController.Hide`
- **Options**：拖拽 `Panel - Menu` → 选择 `MenuController.ShowOptionsMenu`
- **Levels**：拖拽 `Panel - Menu` → 选择 `MenuController.ShowLevelSelectMenu`

**Options 按钮绑定：**
- **Back**：拖拽 `Panel - Menu` → 选择 `MenuController.ShowMainMenu`
- **Reset Score**：需要先在 PlayerController 中添加函数

在 `PlayerController.cs` 中添加重置分数的方法：
```csharp title="PlayerController.cs"
public void ResetScore()
{
    score = 0;
    PlayerPrefs.SetInt("Score", 0);
}
```

---

然后绑定 Reset Score 按钮：拖拽 **Player 物体** → 选择 `PlayerController.ResetScore`

**Level Select 按钮绑定：**
- **Back**：拖拽 `Panel - Menu` → 选择 `MenuController.ShowMainMenu`
- **Level 1**：需要先添加加载关卡的函数。

在 `MenuController.cs` 中添加：
```csharp title="MenuController.cs"
using UnityEngine.SceneManagement;  // 添加场景管理命名空间

public class MenuController : MonoBehaviour
{
    // ... (之前的代码)
    
    public void LoadLevel()
    {
        SceneManager.LoadScene(SceneManager.GetActiveScene().name);
    }
}
```

然后绑定 Level 1 按钮：拖拽 `Panel - Menu` → 选择 `MenuController.LoadLevel`


### 6. 实现游戏暂停机制

#### 6.1 阻止玩家输入

在 `PlayerController.cs` 中添加暂停标志：
```csharp title="PlayerController.cs"
public bool isPaused = false;

void Update()
{
    // 在Update函数的最开始就做判定：如果游戏暂停，直接返回，跳过所有输入检测
    if (isPaused) return;
    
    // ... (ESC呼出Menu、移动、瞄准、射击、跳跃代码)
}
```

#### 6.2 在菜单显示/隐藏时控制暂停状态

修改 `MenuController.cs` 的 Show 和 Hide 方法，控制暂停状态(刚创建的isPaused变量)：
```csharp title="MenuController.cs"
public void Show()
{
    ShowMainMenu();
    gameObject.SetActive(true);

    // 暂停游戏
    Time.timeScale = 0;
	PlayerController.instance.isPaused = true;
}

public void Hide()
{
    gameObject.SetActive(false);
    
    // 继续游戏
    Time.timeScale = 1;
    if(PlayerController.instance != null)
    {
        PlayerController.instance.isPaused = false;
    }
}
```

:::caution Awake 执行顺序问题

在 Hide() 中添加了 `PlayerController.instance != null` 的判断，这是因为：

1. MenuController 和 PlayerController 的 Awake 执行顺序不确定
2. 如果 MenuController 的 Awake 先执行，会调用 Hide()
3. 此时 PlayerController 的 Awake 可能还没执行，instance 还未设置
4. 直接访问会导致空引用错误

**添加 null 检查**可以避免这个问题。

:::
