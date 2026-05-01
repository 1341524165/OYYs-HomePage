---
sidebar_position: 6
id: Class 5
title: Class 5
tags:
    - Study
    - Unity
    - Video Game Teaching
---

# Class 5 - Core Mechanics & UI

<video width="960" height="540" controls>
  <source src="https://pub-25034b877a7f48ba91623467da545f22.r2.dev/05_UI.mp4" />
</video>

---

在前几节课中，我们已经完成了核心的游戏机制：陨石 (Asteroid) 随机生成、飞船 (Ship) 开火逻辑，以及子弹 (Projectile) 的追踪 AI。本节课我们将继续完善游戏的核心机制，并且引入新的系统 - `用户界面 (User Interface)`。

## Class 5 Overview

1. 子弹的实时转向与移动
2. Explosion 动画触发与销毁
3. 用户 UI
4. 生命值系统

### 1. 子弹的实时转向与移动

既然我们已经实现了子弹的追踪 AI，接下来就是处理它的**转向**和**移动**逻辑。

```csharp title="Projectile.cs"
public class Projectile : MonoBehaviour
{
  // 加速度 和 速度目前暂时设为常量
    float acceleration = 1f;
    float maxSpeed = 2f;

    // 调用上节课的追踪 AI，选择最近的敌人
    ChooseNearestTarget();

    if(target != null)
    {
		// 求得斜边向量
		Vector2 directionToTarget = target.position - transform.position;

		// 利用Atan2函数（即反正切函数），求得斜边向量与 x 轴的夹角
		// Mathf.Atan2(y, x) 返回的是一个弧度值，我们再用Mathf.Rad2Deg将其转换为float角度值
		float angle = Mathf.Atan2(directionToTarget.y, directionToTarget.x) * Mathf.Rad2Deg;

		// 转向
		// 1. 利用Quaternion.Euler函数，将角度转换为四元数
      Quaternion targetRotation = Quaternion.Euler(0, 0, angle);

		// 2. 直接刚体旋转
		rb.MoveRotation(angle);
	}

	// 移动
	rb.AddForce(transform.right * acceleration);
	// 限制速度
	rb.velocity = Vector2.ClampMagnitude(rb.velocity, maxSpeed);
}

```

### 2. Explosion 动画触发与销毁

```csharp title="Projectile.cs"
public class Projectile : MonoBehaviour
{
  void OnCollisionEnter2D(Collision2D other)
  {
    // 限制撞击对象为陨石时才触发爆炸动画
	if(other.gameObject.CompareTag("Asteroid"))
	{
		Destroy(other.gameObject);
		Destroy(gameObject);

		// 触发爆炸动画，延迟销毁
		GameObject explosion = Instantiate(
			GameController.instance.explosionPrefab, // 依旧跨类访问/.
			transform.position,
			Quaternion.identity // 不旋转
		);
		Destroy(explosion, 0.25f); // 爆炸动画持续0.25秒
	}
  }
}
```

:::note 延迟销毁?
动画本身一次循环（当然了，总共也只播放一次..）需要0.3s.  
所以要让“爆炸”效果在结束之前一点点时间内销毁他，免得以一个`结束帧`状态停留在场景中
:::

### 3. 用户 UI

本节将引入 Unity 全新的系统 - `UI`。

#### 3.1 设置 UI 画布（Set Up UI Canvas）

1. 在场景中创建 `Canvas` 对象
2. 设置 `Canvas Scaler` 的 `UI Scale Mode` 为 `Scale With Screen Size`
3. 设置 `Reference Resolution` 为 `1280 x 720`
   ![Canvas Scaler](https://jcqn.oss-cn-beijing.aliyuncs.com/game_design_courseware/01_image/Class5_CanvasScaler.png)

#### 3.2 创建得分文本（Create Score Text）

1. 在 `Canvas` 下创建 `TextMeshPro - Text` 对象，命名为 `Text (TMP) - Score`
2. 设置锚点为左上角（Top-Left）
3. 设置相对位置为 `(20, -20)`，Width 和 Height 分别为 200 和 50 即可
4. 设置 Inspector 中，属性 `Wrapping` 为 **Disabled**；`Overflow` 为 **Overflow**

:::note
锚点(Anchor)：  
锚点是 UI 元素的参考点，用于计算相对位置，即确定`子元素`在`父容器`中的相对位置。

轴心(Pivot)：  
轴心代表的是元素自己的位置。
:::

#### 3.3 创建货币文本（Create Currency Text）

1. 复制得分文本，命名为 `Text (TMP) - Money`
2. 更改锚点为右上角（Top-Right）
3. 设置相对位置为 `(-20, -20)`，Width 和 Height 同上
4. 设置文本对齐为右对齐

#### 3.4 创建生命值进度条（Health Bar Image）

1. 在 `Canvas` 下创建 `Image` 对象，命名为 `Image - Health Bar`
2. 设置锚点为中心顶部（Top-Center）
3. 设置 `Image Type` 为 `Filled`；并设置 `Fill Method` 为 `Horizontal`；设置 `Fill Origin` 为 `Left`
4. 设置相对位置为`(0, -35)`，Width 和 Height 分别为 500 和 20

#### 3.5 创建升级按钮（Upgrade Buttons）

在 Canvas 下创建 `Button` 对象。Button 对象在 Insepctor 自带一个 Image 和 一个Button 组件；此外还自带了一个子对象 Text (TMP)

创建五个按钮用于不同升级功能：

1. `Button - Repair`：修复功能
2. `Button - Hull Strength`：船体强度升级
3. `Button - Fire Speed`：开火速度升级
4. `Button - Missile Speed`：子弹速度升级
5. `Button - Multiplier`：得分倍率升级

每个按钮都设置合适的锚点和位置，形成一列垂直排列。

### 4. 生命值系统

#### 4.1 编写生命值逻辑（Program Health）

在 `Ship.cs` 中添加生命值系统：

```csharp title="Ship.cs"
using UnityEngine.UI;	// 引入 UI 命名空间

namespace SpaceShooter
{
	public class Ship : MonoBehaviour
	{
		public Image imageHealthBar;

		public float health = 100f;
		public float maxHealth = 100f;

		void Update()
		{
			// 如果生命值大于0，则让飞船以正弦波模式运动
			if(health > 0) {
				float yPosition = Mathf.Sin(GameController.instance.timeElapsed) * 3f;
				transform.position = new Vector2(0, yPosition);
			}
		}

		void Die() {
			// 没血似了之后：
			// 1. 停止开火协程
			StopCoroutine(FiringTimer());
			// 2. 设置为动态刚体，让飞船可以被碰撞移动，自由飘荡，，
			Rigidbody2D rb = GetComponent<Rigidbody2D>();
			rb.bodyType = RigidbodyType2D.Dynamic;
			rb.gravityScale = 0f;
		}

		void TakeDamage(float amount) {
			health -= amount;
			if(health <= 0) {
				Die();
			}
			// 更新生命值进度条
			imageHealthBar.fillAmount = health / maxHealth;
		}

		void OnCollisionEnter2D(Collision2D other) {
			// 如果撞到的碰撞体是陨石，则调用上面的函数扣除10点生命值
			if(other.gameObject.GetComponent<Asteroid>()) {
				TakeDamage(10f);
			}
		}
	}
}

```

#### 4.2 添加生命值系统到碰撞检测

在 `Projectile.cs` 的 `OnCollisionEnter2D` 中添加生命值扣除：

```csharp title="Projectile.cs"
void OnCollisionEnter2D(Collision2D other)
{
    if (other.gameObject.CompareTag("Asteroid"))
    {
        // 销毁陨石
        Destroy(other.gameObject);

        // 生成爆炸动画
        GameObject explosion = Instantiate(
            GameController.instance.explosionPrefab,
            transform.position,
            Quaternion.identity
        );
        Destroy(explosion, 0.25f);

        // 销毁子弹
        Destroy(gameObject);
    }
    else if (other.gameObject.CompareTag("Player"))
    {
        // 对玩家造成伤害
        Ship playerShip = other.gameObject.GetComponent<Ship>();
        if (playerShip != null)
        {
            playerShip.TakeDamage(20f);
        }

        // 销毁子弹
        Destroy(gameObject);
    }
}
```
