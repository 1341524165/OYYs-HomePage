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

### 1. 子弹的实时转向与移动

既然我们已经实现了子弹的追踪 AI，接下来就是处理它的**转向**，以及**移动**逻辑。

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
      float angle = Mathf.Atan2(directionToTarget.y, directionToTarget.x) * Mathf.Rad2Deg;

  // 转向
      // 1. 利用Quaternion.Euler函数，将角度转换为四元数
      Quaternion targetRotation = Quaternion.Euler(0, 0, angle);

```

## 2. Explosion 动画触发与销毁
