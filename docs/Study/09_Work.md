---
sidebar_position: 9
id: Eight-legged Essay
title: Eight-legged Essay
tags:
    - Work
    - Eight-legged Essay
---

# MySQL

## 一、什么是 MySQL?

MySQL是一个开源的关系型数据库管理系统（RDBMS, Relational Database Management System），它使用结构化查询语言（Structured Query Language, SQL）进行数据库的创建、管理和操作。MySQL 是由瑞典公司 MySQL AB 开发的，现在最终成为 Oracle 公司的产品。

### 怎么创建 / 删除 一张表？

可以使用 `DROP TABLE` 来删除表，使用 `CREATE TABLE` 来创建表。

创建表的时候，可以通过 `PRIMARY KEY` 设定主键。

```sql title="后续都将使用这个 employees 表"
CREATE TABLE employees (
    id INT AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
	salary DECIMAL(10, 2),
	birthdate DATE,
    PRIMARY KEY (id),
	INDEX idx_name (name),
	INDEX idx_birthdate (birthdate),

	department VARCHAR(100),
	location VARCHAR(100)
);
```

p.s. 如果要添加索引，`CREATE INDEX idx_name ON employees(name);` 跟 `ALTER TABLE employees ADD KEY idx_name (name)`是完全等价的。

### 请写一个升序 / 降序的 SQL 语句？

可以使用 `ORDER BY` 来进行排序，**默认是升序**，可以使用 `DESC` 来指定**降序**。

比如要给员工表，以工资降序：

```sql
SELECT id, name, salary
FROM employees
ORDER BY salary DESC;
```

如果要**多重排序**，可以指定多个字段 (列)：

```sql
SELECT id, name, salary
FROM employees
ORDER BY salary DESC, name ASC;
```

这样就按**优先级**，先按工资降序排序；如果工资相同，再按名字升序排序。

### MySQL 出现性能差的原因有哪些？

1. 可能是 SQL 查询用了**全表扫描**

:::note 为什么会全表扫描?

1. 没有使用索引

```sql
SELECT *
FROM employees
WHERE name = 'John';
```

2. 用了索引，但索引列上有**函数**操作

```sql
SELECT *
FROM employees
WHERE YEAR(birthdate) = 1990;
```

3. 模糊查询以通配符`%`开头

```sql
SELECT *
FROM employees
WHERE name LIKE '%ohn';
```

p.s. 这里很有意思。 如果是`LIKE 'John%'`，或是`LIKE '_ohn'`，都是可以走索引的。  
前者是因为索引是有序的，可以直接定位到`John`**开头**的部分；后者是因为`_`代表单个字符，索引定位到以`ohn`作为**第2,3,4个字符**的记录。

:::

2. 也可能是查询语句过于复杂，如多表 `JOIN` 或嵌套子查询

:::

1. 多表`JOIN`：

```sql
SELECT *
FROM employees
JOIN departments ON employees.department = departments
JOIN locations ON departments.location = locations
```

意思是，把 `employees` 表和 `departments` 表通过 `department` 字段连接起来，再把结果和 `locations` 表通过 `location` 字段连接起来，最后返回所有字段。  
这样需要扫描三张表。

2. 嵌套子查询：

```sql
SELECT * FROM 订单表
WHERE 用户id IN (
    SELECT id FROM 用户表
    WHERE 城市 IN (
        SELECT 城市名 FROM 城市表
        WHERE 省份 = '广东'
    )
)
```

这样也需要扫描三张表。

:::

3. 当然也有可能单纯因为单张表的数据量过大

---

通常情况下，**添加索引**就能解决大部分性能问题。对于一些`热点数据`，还可以通过**增加 Redis 缓存**，来减轻数据库的访问压力。

## 二、怎么存储emoji？

emoji 是 `4 个字节`的 UTF-8 字符，而 MySQL 默认的 utf8 字符集`只支持 3 个字节`的 UTF-8 字符，所以需要把字符集改成 **_utf8mb4_** 字符集 (m: minimum, b: bytes)。

```sql
ALTER TABLE 表名
CONVERT TO CHARACTER SET utf8mb4	-- 将字符集改为 utf8mb4
COLLATE utf8mb4_unicode_ci;	-- 将排序规则改为 utf8mb4_unicode编码标准_不区分大小写(Case Insensitive)
```

p.s. `_ci`是Case Insensitive, 不区分大小写；`_ai`是Accent Insensitive, 不区分重音符号, 比如 é 跟 e 是一样的。

:::note MySQL8 已经默认支持 utf8mb4 了

可以通过 `SHOW VARIABLES WHERE Variable_name LIKE 'character\_set\_%' OR Variable_name LIKE 'collation%';` 查看。

:::

### 三、一条查询语句是如何执行的？

当我们执行一条 SELECT 语句时，MySQL 并**不会直接去磁盘读取数据**，而是经过 6 个步骤来解析、优化、执行，然后再返回结果。

1. 客户端发送 SQL 查询语句到 MySQL 服务器
2. MySQL 服务器的`连接器`接收到请求，跟客户端建立连接、获取权限、管理连接
3. `解析器`对 SQL 语句进行解析， **检查**语句是否符合 SQL 语法规范，确保数据库、表、列都是存在的；并处理 SQL 语句中的`名称解析`和`权限验证`
4. `优化器`负责确定 SQL 语句的**执行计划**，选择最优的执行路径，比如选择使用哪些索引？决定表之间的连接顺序等
5. `执行器`会调用`存储引擎`的 API 来进行数据的读写
6. `存储引擎`负责查询数据，读取磁盘上的数据页到内存中，并把执行结果返回给客户端。客户端收到查询结果了，完成这次查询请求。

![MySQL 查询语句执行流程图](https://jcqn.oss-cn-beijing.aliyuncs.com/WORK/MySQL_1.png)

### 四、MySQL有哪些常见的存储引擎？

MySQL 有多种存储引擎，常见的有MyISAM、InnoDB、MEMORY等。

![MySQL 存储引擎对比表](https://jcqn.oss-cn-beijing.aliyuncs.com/WORK/MySQL_2.png)

:::note 详解

1. InnoDB (现代 MySQL 的默认存储引擎)

- 支持`事务`：保证数据操作的**完整性**
- 支持`行级锁`：多个用户同时操作时，`只锁定被修改的行`【提高并发性能】
- 支持`外键`：可以建立表与表之间的关联关系
- MySQL 默认存储引擎

完整性：要么全部成功，要么全部失败 - `回滚`

比如银行转账，1️⃣A账户扣款，2️⃣B账户加款。  
如果中途失败了，没有事务支持的 `MyISAM` 就会出现 A 账户的款也扣了，B 账户又没加，钱凭空消失了，这就是**数据不一致性**的问题。  
`InnoDB` 则会把**整个转账操作作为一个事务**，要是中途失败了，就回滚所有操作重来。

2. MyISAM (旧版引擎)

- 不支持`事务`
- 只支持`表级锁`：当一个用户在修改表时，`整个表都会被锁定`，其他用户只能等待【低并发性能】
- 不支持`外键`

3. MEMORY (内存引擎)

- 数据存储 RAM 中，读写速度非常快
- 但：数据库重启后，数据会丢失

:::
