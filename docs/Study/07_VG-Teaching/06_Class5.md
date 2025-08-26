---
sidebar_position: 5
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


