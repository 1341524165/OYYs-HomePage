---
sidebar_position: 3
id: Class2
title: Class 2
tags:
  - Study
  - Unity
  - Video Game Teaching
---

# Class 2 - Physics

<video width="960" height="540" controls>
  <source src="https://pub-25034b877a7f48ba91623467da545f22.r2.dev/02_Physics.mp4" />
</video>

---

本节课将继续构建飞船控制逻辑，从静态移动升级为**基于物理引擎的旋转与推进**控制。  

## Class 2 Overview

1. 理解 Rigidbody2D 与 Collider2D 的作用
2. 掌握 AddTorque 与 AddForce 的用法
3. 实现使用箭头控制飞船旋转、空格推进的控制逻辑
4. 设置 Polygon Collider 精确贴合精灵形状
5. 理解物体休眠机制（Sleeping Mode）对物理模拟的影响

---

### 1. 理解 Rigidbody2D 与 Collider2D 的作用

为飞船 GameObject 添加组件：

- `Rigidbody2D`
- `Polygon Collider 2D`

在 `Rigidbody2D` 中设置以下属性：

| 属性 | 推荐设置 | 说明 |
|------|----------|------|
| 身体类型 | Dynamic | 允许受力及移动 |
| 重力 | 0 | 取消重力影响（在太空中） |
| 休眠模式 | 开始唤醒 | 确保游戏一开始就参与模拟 |
| 碰撞检测 | 离散的 | 默认即可，防止穿透需改为 连续的 |

:::note 休眠模式

Unity 的物理系统中，为了性能优化，长时间静止的物体会“休眠”。

| 模式 | 含义 |
|------|------|
| 开始唤醒 | 启动时激活，最常用 |
| 开始休眠 | 启动时休眠，直到被唤醒 |
| 永不休眠 | 永不休眠（性能开销大） |

你可以通过以下代码查看物体当前是否处于唤醒状态：

```csharp
Debug.Log(gameObject.name + " is awake = " + rb.IsAwake());
```
:::

> - 只有物体带有 Rigidbody 组件，才能使用 AddForce 和 AddTorque 等力学函数。

---

接下来添加组件：`Polygon Collider 2D`：

- 作用：确保飞船与其他物体产生真实碰撞
- 可选调整：点击 “编辑碰撞体” 调整碰撞多边形点位


### 2. 学习 Inspector 面板中 name 和 tag 的使用

在实际项目中，我们常常需要在代码中引用场景中的特定 GameObject，例如我们的主角飞船。Unity 提供了多种方法来查找对象。

```csharp title="方法一：根据名称查找"
GameObject player = GameObject.Find("Player");
```

> 💡 注意：`.Find()` 会遍历整个场景寻找名称为 "Player" 的对象。适用于仅有一个目标时快速调用，但性能**开销较大**，不推荐频繁调用。

---

```csharp title="方法二：根据标签查找"
GameObject player = GameObject.FindWithTag("Player");
```

> ✅ 优点：Tag 是 Unity 内部优化过的结构，查找效率高，且能确保唯一性（不易重名冲突）

:::info 如何用 Tag 获取多个同类对象中的某一个？

如果你需要一次获取多个拥有同样标签的对象（如敌人群体）：

```csharp
GameObject[] enemies = GameObject.FindGameObjectsWithTag("Enemy");
for (int i = 0; i < enemies.Length; i++) {
    if (enemies[i].name == "Enemy") {
        // Do something with enemies[i]
    }
}
```

> ✅ 用于群体行为、AI 控制、批量删除等场景非常实用
:::


### 3. 使用物理引擎构建新的控制逻辑

```csharp title="路径建议：Assets/Q2/Code/RotatingShipController.cs"
using UnityEngine;

namespace Q2 {
    public class RotatingShipController : MonoBehaviour {
        private Rigidbody2D rb;
        public float speed;
        public float rotationTorque;

        void Start() {
            rb = GetComponent<Rigidbody2D>();

            speed = 20f;
            rotationTorque = 20f;
        }

        void Update() {
            if (Input.GetKey(KeyCode.LeftArrow)) {
                rb.AddTorque(rotationTorque * Time.deltaTime);
            }
            if (Input.GetKey(KeyCode.RightArrow)) {
                rb.AddTorque(-rotationTorque * Time.deltaTime);
            }
            if (Input.GetKey(KeyCode.Space)) {
                rb.AddRelativeForce(Vector2.right * speed * Time.deltaTime);
            }
        }
    }
}
```

> *说明：  
> - `AddTorque`：添加绕 Z 轴旋转的力矩(2D)  
> - `AddRelativeForce`：添加基于局部坐标系的力（相对于物体当前朝向）  
> - `Time.deltaTime`：将时间切片化，确保在不同帧率下的表现一致性


### 4. 添加迷宫障碍物与碰撞检测

为了测试飞船的物理碰撞行为，我们需要构建一个简单的迷宫障碍物区域。

1. 拖入障碍物精灵（陨石）到场景中
2. 为障碍物添加组件：`Polygon Collider 2D` （不需要添加 Rigidbody2D，静态障碍物不应该移动）

```csharp title="Assets/Q2/Code/MazeObstacle.cs"
using UnityEngine;
using UnityEngine.SceneManagement;  // 新包，用于场景管理

namespace Q2 {
    public class MazeObstacle : MonoBehaviour {
        void OnCollisionEnter2D(Collision2D other) {
            // 判断是否是“带有飞船控制脚本的对象”撞上
            if (other.gameObject.GetComponent<RotatingShipController>() != null) {
                SceneManager.LoadScene(SceneManager.GetActiveScene().name);
            }
        }
    }
}
```

> **说明：**  
> `.GetActiveScene()` 获取当前场景对象（Scene类型对象，即我们的当前场景“Q1”）  
也就是说，我们同样可以直接写成：  
```csharp
SceneManager.LoadScene("Q1");
```

:::tip OnCollisionEnter2D 的触发条件
两个 GameObject 都必须有 `Collider`，且至少一个拥有 `Rigidbody`。否则不会触发！
:::

---

当然，上述判断方式较为复杂，也可以通过前文所讲的方式——通过对象`名称`或`标签`来判断飞船身份：

```csharp
// 方法一：根据对象名
if (other.gameObject.name == "Player")

// 方法二：根据标签
if (other.gameObject.CompareTag("Player"))
```
