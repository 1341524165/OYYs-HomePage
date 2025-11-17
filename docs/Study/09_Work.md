---
sidebar_position: 9
id: Eight-legged Essay
title: Eight-legged Essay
tags:
    - Work
    - Eight-legged Essay
---

# MySQL

## 一、MySQL 基础

### 1. 什么是 MySQL?

MySQL是一个开源的关系型数据库管理系统（RDBMS, Relational Database Management System），它使用结构化查询语言（Structured Query Language, SQL）进行数据库的创建、管理和操作。MySQL 是由瑞典公司 MySQL AB 开发的，现在最终成为 Oracle 公司的产品。

:::note 关系型数据库 RDBMS
`关系`主要指`键`，主键唯一标识，外键建立表与表之间的关系。

RDBMS 通常有 **ACID** 特性：

- 原子性 (Atomicity)：事务中的所有操作要么`全部`完成，要么`全部`不完成 - `回滚`

比如银行转账，1️⃣A账户扣款，2️⃣B账户加款。  
如果中途失败了，没有事务支持的 `MyISAM` 就会出现 A 账户的款也扣了，B 账户又没加，钱凭空消失了。  
p.s.`InnoDB` 会把**整个转账操作作为一个事务**，要是中途失败了，就回滚所有操作重来。

- 一致性 (Consistency)：数据库只会从一个`有效`状态转换到另一个`有效`状态

还是转账，数据库会有一个约束条件：`A账户余额 + B账户余额 = 常量`。  
无论转账过程中发生什么错误，这个约束条件都必须成立。这才叫有效状态。

- 隔离性 (Isolation)：`并发`执行的事务`互不干扰`

当A在给B转账时，C只会看到A账户扣款前的余额；等A的转账事务提交后，C才能看到最新的余额。不可能出现C看到一个`中间状态`的情况。

- 持久性 (Durability)：一旦事务提交，对数据库的修改是`永久`

即使数据库崩溃、断电重启，数据也不会丢失。

:::

### 2. 怎么创建 / 删除 一张表？

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

### 3. 请写一个升序 / 降序的 SQL 语句？

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

### 4. MySQL 出现性能差的原因有哪些？

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

:::note 例子

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

### 5. 怎么存储emoji？

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

## 二、数据库架构

### 1. MySQL 分层架构

1. 连接层主要负责客户端连接的管理，包括验证用户身份、权限校验、连接管理等。可以通过数据库连接池来提升连接的处理效率。

2. 服务层是 MySQL 的核心，主要负责查询解析、优化、执行等操作。在这一层，SQL 语句会经过解析、优化器优化，然后转发到存储引擎执行，并返回结果。这一层包含查询解析器、优化器、执行计划生成器、日志模块等。

3. 存储引擎层负责数据的实际存储和提取。MySQL 支持多种存储引擎，如 InnoDB、MyISAM、Memory 等。

:::note 面经：binlog写入在哪一层？

binlog 在`服务层`，负责**记录 SQL 语句的变化**。它记录了所有对数据库进行更改的操作，用于数据恢复、主从复制等。

:::

![MySQL 分层架构图](https://jcqn.oss-cn-beijing.aliyuncs.com/WORK/MySQL_0.png)

### 2. 一条查询语句是如何执行的？

当我们执行一条 SELECT 语句时，MySQL 并**不会直接去磁盘读取数据**，而是经过 6 个步骤来解析、优化、执行，然后再返回结果。

1. 客户端发送 SQL 查询语句到 MySQL 服务器
2. MySQL 服务器的`连接器`接收到请求，跟客户端建立连接、获取权限、管理连接
    - 这里可能多一步：`查询缓存`。如果之前有执行过相同的 SQL 语句，并且结果还在缓存中，就**直接把缓存结果返回给客户端**，省去后续步骤（如上面的MySQL分层架构图，跟存储引擎无关）
3. `解析器`对 SQL 语句进行解析， **检查**语句是否符合 SQL 语法规范，确保数据库、表、列都是存在的；并处理 SQL 语句中的`名称解析`和`权限验证`
4. `优化器`负责确定 SQL 语句的**执行计划**，选择最优的执行路径，比如选择使用哪些索引？决定表之间的连接顺序等
5. `执行器`会调用`存储引擎`的 API 来进行数据的读写
6. `存储引擎`负责查询数据，读取磁盘上的数据页到内存中，并把执行结果返回给客户端。客户端收到查询结果了，完成这次查询请求。

![MySQL 查询语句执行流程图](https://jcqn.oss-cn-beijing.aliyuncs.com/WORK/MySQL_1.png)

## 三、存储引擎

### 1. MySQL有哪些常见的存储引擎？

MySQL 有多种存储引擎，常见的有MyISAM、InnoDB、MEMORY等。

![MySQL 存储引擎对比表](https://jcqn.oss-cn-beijing.aliyuncs.com/WORK/MySQL_2.png)

:::note 详解

1. InnoDB (现代 MySQL 的默认存储引擎)

- 支持`事务`：保证数据操作的**完整性** (原子性)
- 支持`行级锁`：多个用户同时操作时，`只锁定被修改的行`【提高并发性能】
- 支持`外键`：可以建立表与表之间的关联关系
- MySQL 默认存储引擎

2. MyISAM (旧版引擎)

- 不支持`事务`
- 只支持`表级锁`：当一个用户在修改表时，`整个表都会被锁定`，其他用户只能等待【低并发性能】
- 不支持`外键`

3. MEMORY (内存引擎)

- 数据存储 RAM 中，读写速度非常快
- 但：数据库重启后，数据会丢失

:::

## 四、日志

### 1. MySQL 的日志文件有哪些？

有 6 大类：

- 错误日志 (error log) 用于问题诊断
- 慢查询日志 (slow query log) 用于 SQL **性能分析**
- 一般查询日志 (general log) 用于记录所有的 SQL 语句
- 二进制日志 (binlog) 用于**主从复制和数据恢复** 【记录所有`修改`数据库状态的 SQL 语句，以及每个语句的执行时间，如 INSERT、UPDATE、DELETE 等，但不包括 SELECT 和 SHOW 这类的操作】
- 重做日志 (redo log) 用于保证事务持久性 【记录对于 InnoDB 表的每个`写操作`，不是 SQL 级别的，而是`物理级别的`，主要用于崩溃恢复】
- 回滚日志 (undo log) 用于**事务回滚**和 `MVCC(Multi-Version Concurrency Control, 多版本并发控制)` 【Undo Log 存储了数据的所有历史版本，为 MVCC 提供了时间机器，确保读操作可以获取到事务开始时的数据“快照”，从而实现非阻塞的并发读写】

#### 1.1 重点来讲讲 binlog?

binlog 是一种二进制日志，会在磁盘上记录数据库的所有更改操作。

如果误删了数据，可以通过 binlog 来**恢复数据**，回退到误删之前的状态。

```bash
# 步骤1：恢复全量备份
mysql -u root -p < full_backup.sql
# 步骤2：应用Binlog到指定时间点
mysqlbinlog --start-datetime="2025-03-13 14:00:00" --stop-datetime="2025-03-13 15:00:00" binlog.000001 | mysql -u root -p
```

如果要搭建主从复制，就可以让从库定时读取主库的 binlog。
