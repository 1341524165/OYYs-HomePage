---
sidebar_position: 4
id: Class 4
title: Class 4
tags:
  - Study
  - Unity
  - Video Game Teaching
---

# Class 4 - Coroutine & AI

<video width="960" height="540" controls>
  <source src="https://pub-25034b877a7f48ba91623467da545f22.r2.dev/04_Coroutine%26AI.mp4" />
</video>

---

本节课的目标是基于上节课的工作，继续完善这个 SpaceShooter 游戏，其中本节重点是引入`协程（Coroutine）`概念。

## Class 4 Overview

1. 创建并管理陨石出生点（Spawn Points）  
2. 随机生成陨石逻辑
3. 基于协程的动态生成间隔  
4. 飞船开火逻辑  
5. 子弹追踪 AI  


### 1. 创建陨石刷新点（Spawn Points）

1. 在场景中创建 9 个空物体，作为陨石出生位置，坐标示例：  

{10, 4, 0}, {10, 3, 0}, {10, 2, 0}, {10, 1, 0}, {10, 0, 0}, {10, -1, 0}, {10, -2, 0}, {10, -3, 0}, {10, -4, 0}

2. 在 Inspector 的左上角为这些空物体添加 `Icon 标记`，方便可视化管理：

![Icon](https://jcqn.oss-cn-beijing.aliyuncs.com/game_design_courseware/01_image/Class4_Icon.png)


### 2. 随机生成陨石逻辑

先来声明公共变量：  
```csharp title="GameController.cs"
public Transform[] spawnPoints;       // 出生点数组
public GameObject[] asteroidPrefabs;  // 陨石 Prefab 数组
```

> **说明：**  
> - 使用 `Transform` 类型声明出生点这一变量，是因为只需读取其三维坐标。

而后我们需要在 Inspector 中将场景中的 Spawn Points 与陨石 Prefabs 拖入对应的槽位：  
![Drag_Assignment](https://jcqn.oss-cn-beijing.aliyuncs.com/game_design_courseware/01_image/Class4_DragAssignment.png)

接下来是`实例化`对象，即生成陨石：  
```csharp
void SpawnAsteroid()
{
    // 随机选择一个出生点
    int randomSpawnIndex = Random.Range(0, spawnPoints.Length);
    Transform randomSpawnPoint = spawnPoints[randomSpawnIndex];
    // 随机选择一个陨石 Prefab
    int randomAsteroidIndex = Random.Range(0, asteroidPrefabs.Length);
    GameObject randomAsteroidPrefab = asteroidPrefabs[randomAsteroidIndex];

    // 实例化陨石
    Instantiate(randomAsteroidPrefab, randomSpawnPoint.position, Quaternion.identity);
}
```

> **说明：**
> Instantiate 函数接收的参数包括以下 3/4 个：
> - prefab：要实例化的对象
> - position：实例化位置
> - rotation：实例化旋转（Quaternion）
> - parent (optional)：实例化后对象的父级

:::note Quaternion
Quaternion 代表“四元数”，是unity用来表示`旋转`的一个数据结构。具体用法有：  
- `Quaternion.identity` 是 0°，无旋转
- `Quaternion.Euler(x, y, z)` 用欧拉角来表示绕某个轴旋转
- `Quaternion.LookRotation(x)` 表示与 x 向量的方向同向

- 旋转插值：
    - 包括三个函数：.Lerp, .Slerp, .RotateTowards  
        它们都接收三个参数：`(当前角度，目标角度，旋转速度)`，区别在于转速，因为需要过渡旋转的角度不同，具体的观感也不一样。
:::


### 3. 基于协程的动态生成间隔

我们希望随着游戏时间推移，游戏难度提高，陨石生成速度加快，也即陨石的生成间隔减小 -- 但不低于一个下限。

```csharp title="GameController.cs"
public float maxAsteroidDelay = 2f;     // 上边界
public float minAsteroidDelay = 0.2f;   // 下边界

public float timeElapsed;
public float asteroidDelay;

void Update()
{
    // 计时器
    timeElapsed += Time.deltaTime;

    // 计算当前间隔（线性递减）
    float decreaseDelayOverTime = maxAsteroidDelay - 
        ((maxAsteroidDelay - minAsteroidDelay) / 30f * timeElapsed);

    // 钳制范围
    asteroidDelay = Mathf.Clamp(decreaseDelayOverTime, minAsteroidDelay, maxAsteroidDelay);
}
```

这样我们就得到了一个动态变化的陨石生成间隔。接下来，我们需要在`协程`中使用这个间隔来控制陨石的生成频率。

#### 3.1 协程

```csharp
IEnumerator SpawnAsteroidRoutine()
{
    yield return new WaitForSeconds(asteroidDelay); // 等待当前间隔

    SpawnAsteroid(); // 生成陨石

    StartCoroutine(SpawnAsteroidRoutine()); // 递归地重新启动协程
}

void Start()
{
    StartCoroutine(SpawnAsteroidRoutine()); // 启动协程
}
```

> ***协程***在 Unity 中的核心是一个特殊的返回类型：`IEnumerator`  
> 你可以把它当成 _“可暂停执行的函数”_ -- 普通函数一旦调用，会一口气从头跑到尾。而 IEnumerator 可以在中间 `yield return` 的地方暂停，然后**等到某个条件满足**时再从这里继续往下执行。

> 我们需要使用 `StartCoroutine()` 这个函数来启动 IEnumerator 这个返回类型的协程。


:::caution “等到某个条件满足”？
yield return 实则不止课上讲的，也是我们最常用的等待固定时长这一个用法：

```csharp
yield return new WaitForSeconds(1f); // 等待 1 秒

yield return null; // 等待下一帧

// -------------------等待某个条件满足-------------------
// 1. 全写
bool PlayerIsDead()
{
    // 检查玩家是否死亡
    return playerHealth <= 0;
}
IEnumerator WaitForPlayerDeath()
{
    yield return new WaitUntil(PlayerIsDead);
}
// 2. 简写：匿名写法
IEnumerator WaitForPlayerDeath()
{
    yield return new WaitUntil(delegate { return playerHealth <= 0; });
}
// 3. 简写：Lambda 表达式
IEnumerator WaitForPlayerDeath()
{
    yield return new WaitUntil(() => playerHealth <= 0);
}
// -------------------等待某个条件满足-------------------

yield return StartCoroutine(OtherCoroutine()); // 甚至可以嵌套另一个协程，等到OtherCoroutine()执行完了再继续
```
:::


:::tip 简写
上面的代码中提到了两种简写：匿名写法和 Lambda 表达式。

1. 匿名写法  
在 C# 2.0 中引入，`delegate` 是一种类型，可以用来保存**指向方法的引用**  
简单来说，就是我们可以不用写一个单独的方法名，直接在委托位置**临时声明**一个方法。

2. Lambda 表达式
Lambda 表达式是 C# 3.0 中引入的一种更简洁的写法，这一用法与 Java 中相同，可以用来创建匿名方法。它的基本语法是 `(参数) => { 方法体 }`，例如：
```csharp
IEnumerator WaitForPlayerDeath()
{
    yield return new WaitUntil(() => playerHealth <= 0); // 不需要接收参数，所以是空括号
}
```
:::


> P.S. 协程并不是真的传统意义上那种多线程，或者后台线程。他只是一个Unity的主循环外面的，也就是独立在Update函数外面的，一个逻辑。简单来说，他和主循环是交错进行的：
> - 每一帧里面都会分段，先执行Update，之后会检查协程的代码。在二者都结束之后，Unity 才开始渲染这一帧。这一整套流程，都是在`主线程`，也就是 main thread 里面的。所以我们说 unity 实际还是`单线程`的。

### 4. 飞船开火逻辑  

飞船开火逻辑的本质还是生成物体（生成子弹），所以他的代码基本与陨石生成逻辑一致。

```csharp title="Ship.cs"
public GameObject projectilePrefab;
public float fireDelay = 1f;

void Start()
{
    StartCoroutine(FiringTimer());
}

IEnumerator FiringTimer()
{
    yield return new WaitForSeconds(fireDelay);

    Instantiate(projectilePrefab, transform.position, Quaternion.identity);

    StartCoroutine(FiringTimer());
}
```


### 5. 子弹追踪 AI

```csharp title="Projectile.cs"
public class Projectile : MonoBehaviour
{
    public Transform target;

    /// <summary>
    /// 从场景中筛选：1. 在我右侧的 2. 距离最近的陨石
    /// </summary>
    public void ChooseNearestTarget()
    {
        // 大的初始值，确保第一颗陨石总会被当作“当前最近”
        float closestSqrDistance = 9999f;

        Asteroid[] asteroids = FindObjectsOfType<Asteroid>();

        for (int i = 0; i < asteroids.Length; i++)
        {
            Asteroid asteroid = asteroids[i];

            // 1. 只锁定“位于我右侧”的目标（x 更大）
            if (asteroid.transform.position.x > transform.position.x)
            {
                // 目标方向向量
                Vector2 directionToTarget = asteroid.transform.position - transform.position;

                // 使用平方距离 sqrMagnitude 进行比较（无需开根号，性能更好）
                // 2. 如果更近，则更新“当前最近目标”
                if (directionToTarget.sqrMagnitude < closestSqrDistance)
                {
                    // 更新“最近距离”
                    closestSqrDistance = directionToTarget.sqrMagnitude;
                    // 索敌
                    target = asteroid.transform;
                }
            }
        }
    }
}
```

> **说明：**
> - FindObjectsOfType 函数会在场景中找到所有挂载了尖括号内指定组件类型 `T` 的对象，并返回一个包含这些对象的**数组**，数组元素类型为 `T`
> - FindObjectOfType 函数会在场景中找到**第一个**挂载了尖括号内指定组件类型 `T` 的对象，并返回该对象的引用

