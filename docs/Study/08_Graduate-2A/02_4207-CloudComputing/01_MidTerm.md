---
sidebar_position: 1
id: MidTerm
title: MidTerm
tags:
    - Study
    - Graduate
    - Cloud Computing
---

# MidTerm Review

## Lecture 1 : Intro

### Types of Cloud Computing

- SaaS (Software as a Service)

    based on delivery of **complete software applications** that run on infrastructure the SaaS vendor manages.  
     eg. Gmail, Google Docs

- PaaS (Platform as a Service)

    based on delivery of **platforms and infrastructure services** that enable developers to build and deploy applications. but they should provide their own **code** to be deployed.  
     eg. AWS S3, Heroku

- IaaS (Infrastructure as a Service)

    based on delivery of only **infrastructure services**. users should handle **all the software and hardware resources**, including operating system, managing software and deployment.
    eg. AWS, Google Cloud Compute Engine

![Types of Cloud Computing](https://jcqn.oss-cn-beijing.aliyuncs.com/img_blog/4207CC/lecture1_1.png)

### Benefits of _Using Cloud Computing_ versus _Building Your Own_?

- Cloud?
  ![Benefits of Using Cloud Computing versus Building Your Own](https://jcqn.oss-cn-beijing.aliyuncs.com/img_blog/4207CC/lecture1_2.png)

### More Definitions

1. Hybrid Cloud:
   Public 和 Private 的混合使用. - 兼顾成本和安全(Confidentiality / Security)
2. Multi-Cloud:
   使用多个云服务提供商. - 避免 `Ventor Lock-in`
3. Severless Computing:
   **不是没有服务器**，是**不用管理**服务器. 按`执行次数`计费。 - 节省成本和时间
   eg. AWS Lambda, Azure Functions

:::note Edge Computing
还有个概念叫边缘计算(Edge Computing)，它是介于云计算和物联网之间的计算模式。它将`计算资源`部署在**离数据源更近的地方**，以*减少延迟和提高效率 (Reduce latency, improve bandwidth efficiency, and enables real-time processing)*。
:::

### Containers (Docker) & Orchestration (Kubernetes, K8s)

- 容器：
    - 以`Docker`为代表，是一种standard way to package and deploy `application`.
    - 将整个`application`及其`依赖`打包进一个`single unit`, 可以轻松地保证在*不同的环境*中运行的`reliability`。

- 编排：
    - 就专讲`Kubernetes`. 是一种`open-source container orchestration platform`，最早由Google开发
    - 用于管理`containers`的部署、伸缩和调度 (manage containerized applications at scale in cloud environments).
    - 自动化部署、扩展和管理这些容器 (Automates the deployment, scaling, and management of containerized workloads).

### Lab 1

:::info 一些基础知识

1. API: Application Programming Interface
    - 一套让不同系统相互通信的规则和端点 (`endpoints`).
    - API可以用来执行`CRUD`操作 (Create, Read, Update, Delete).

2. FastAPI: Python的web框架，用于构建API.

:::

```python title="main.py"
from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
import json

# FastAPI 实例创建
app = FastAPI()

# Jinja2Templates: 用于渲染HTML的模板
templates = Jinja2Templates(directory="templates")

# FastAPI的endpoint / 路由
@app.get("/")
# 需要渲染到HTML的时候就需要有request参数
def read_root(request: Request):
	# templates.TemplateResponse: 模板响应
    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "message": " Hello World from FastAPI!",
            "users": get_users_data(),
        },
    )

# 辅助函数 - 读取users.json文件
def get_users_data():
    with open("users.json", "r", encoding="utf-8") as file:
        file_contents = "".join(file.readlines())

        data = json.loads(file_contents)

        return data


# 第二个路由，依旧request
@app.get("/users")
def get_users(request: Request):
    with open("users.json", "r", encoding="utf-8") as file:
        file_contents = "".join(file.readlines())

        data = json.loads(file_contents)

        return templates.TemplateResponse(
            "users.html",
            {
                "request": request,
                "users": data["users"],
            },
        )

# 第三个路由，依旧request
@app.get("/movies")
def read_movies(request: Request):
    with open("movie_data.json", "r", encoding="utf-8") as file:
        file_contents = "".join(file.readlines())

        data = json.loads(file_contents)

        return templates.TemplateResponse(
            "movies.html",
            {
                "request": request,
                "movies": data["results"],
            },
        )
```

## Lecture 2 : Cloud Storage, APIs, and Access Controls

### Cloud Storage

- hardware storage 的短板:
    - expensive
    - inflexible
    - difficult to scale

所以我们 Big 3 云服务商都各自有solution:

- AWS S3
- Azure Blob Storage
- Google Cloud Storage

Cloud Storage的优点：  
![Cloud Storage的优点](https://jcqn.oss-cn-beijing.aliyuncs.com/img_blog/4207CC/lecture2_1.png)

### S3 Bucket

**_这学期就只学 Amazon S3._**

:::note
S3 stands for Simple Storage Service - 三个S.
(p.s. EC2 stands for Elastic Cloud Compute - 2个E.)
:::

S3 stores files as `objects`. 它有很多用途:

- Data Storage
- Backup & Recovery
- Hosting Static Websites
- Data Archiving

---

S3 跟传统的文件系统(如C盘)有最重要的区别:

- 文件系统是*树状层级结构* (tree hierarchy)
- S3 是*基于键的存储*. 有三个核心概念:
    1.  存储桶 (Bucket): 最外层文件夹
    2.  对象 (Object): file. 每一个file就是一个object, 每一个object都有
    3.  键 (Key): 这个object的唯一标识符-路径. 形如 `bucket_name/object_name`.

由于S3 Bucket的名字是Global NameSpace的，所以一个bucket的名字要全AWS、全世界唯一..

### RBAC: Role-Based Access Control

如果我们对S3 Bucket不加任何访问控制，那么任何人都可以访问这个bucket里的所有object，有安全隐患。

`RBAC`的解决方案是，我们`不给individual user`直接访问S3 Bucket的权限.  
而是`group users by roles`, 给不同的role分配不同的权限。

优点是：

- Enhanced Security: 只有被授权的user才能访问S3 Bucket.
- Simplified Management: 只需要管理role的权限，不需要管理每个user的权限。
- Increased Efficiency
- Improved Compliance: 符合合规性要求。

### PLP: Principle Of Least Privilege

- RBAC 的 `Principle Of Least Privilege (PLP)`: 只授予用户完成其工作所需的最低权限，而不是授予更多权限。
    - Enhanced Security: Minimizes the blast radius of potential attacks or accidental data breaches. 最小化 潜在攻击 / 意外数据泄露 的影响半径
    - Reduced Errors: 减少误操作(别的用户没法再误改误删)
    - Improved Compliance

我们通过`IAM (Identity and Access Management)`来实现PLP.

:::info 如何实践`PLP`?

1. Start with least privilege
    - Begin by granting minimal permissions
2. Regularly review permissions
3. Use temporary credentials
    - Provide short-lived access for specific tasks using IAM roles and STS (Security Token Service)
4. Monitor activity
    - Use `AWS CloudTrail` to track user actions and resources access.

比如给你的EC2 instance分配一个IAM role去访问S3 Bucket, 这个role只有`读取`S3 Bucket的权限，没有`完全访问`权限。
:::

### IAM: Identity and Access Management

IAM服务的几个核心Components:

1. Policy: 这是一个JSON文件，定义了哪些用户/角色/组的权限可以操作哪些资源。
2. Permission: 这是具体操作，比如`s3:CreateBucket`, `s3:StopInstance`等。
3. Role: 这是一个身份，附加了一堆`Policies`。Role可以被用户使用，也可以被如EC2 instance使用。
4. User: 人，有用户名密码(登录)，或API Key (代码访问AWS)。
5. Instance Profile: 这就是`3`中提到的，把Role附加到EC2 instance上的机制。(最安全给我们的云应用，如EC2上的FastAPI，授权的方式)

![IAM Components](https://jcqn.oss-cn-beijing.aliyuncs.com/img_blog/4207CC/lecture2_2.png)

---

**_IAM Authentication?_**

- 从AWS外部：
    1. 从IAM Dashboard生成Root User的API Credentials (Access Key ID & Secret Access Key)
    2. 下载个AWS CLI，配置好credentials
    3. Boto3 和 CLI 就会自动获取credentials，然后就可以操作AWS了。
    4. !! 最不安全
- 从AWS内部：
    1.  Attach 一个 IAM Role to an EC2 instance
    2.  Boto3 和 CLI 就会自动获取Role的credentials，然后就可以操作AWS了。

:::note 实际操作

1. 搞个EC2
2. 在EC2上“修改IAM Role”，Create a new IAM Role
3. 用例选EC2, 权限选`S3 -> AmazonS3FullAccess` (一般实际会选`AmazonS3ReadOnlyAccess`)
4. 给role起个名

这样EC2 instance 和 S3 Bucket的权限，就通过IAM Role关联起来了。

然后就可以：

1. 本机SSH EC2 instance
2. `aws s3 cp s3://my-bucket/my-file.txt .` 这样就把S3 Bucket里的文件下载到EC2 instance的当前目录了。

:::

### Boto3: Python SDK for AWS

Boto3 是 AWS 官方的 Python SDK (Software Development Kit).

- Provides a consistent API for **all AWS services**.
- Supports both `low-level` and `high-level` abstractions.

:::info Why Boto3?

最主要的目的就是**_Automation_**, for `no human in the loop`.

他还有其他优势，诸如：  
![Boto3 Advantages](https://jcqn.oss-cn-beijing.aliyuncs.com/img_blog/4207CC/lecture2_3.png)
:::

有一些key concepts需要做解释：

1. Resources(资源): 高阶的(high-level) abstraction，比如`s3.Bucket`..
2. Clients(客户端): 低级的(low-level) access to AWS services APIs, 比如`s3_client.list_buckets()`
3. Sessions(会话): 用于管理AWS credentials和configuration settings.
4. Waiters(等待者): **很重要的概念！！**有些操作(如创建一个数据库)并不是立即完成的。Waiter会自动等待这个操作完成，再去执行脚本的下一步，而不是让我们写一个for loop去死等。
5. Paginators(分页器): 有些操作(如获取一个S3 Bucket里的所有object)可能返回很多结果。Paginator会`自动分页`(如一次加载十条)，而不是让它们一次性全部加载到内存里。

### Boto3 Code

```python title="boto3.resource和boto3.client详见上面concepts.py"
import boto3

s3 = boto3.resource('s3')
for bucket in s3.buckets.all():
    print(bucket.name)

'''
EC2也可以
'''
ec2 = boto3.resource('ec2')
instance = ec2.create_instance(
    ImageId='ami-0c55b159cbfafe1f0',
    InstanceType='t2.micro',
    MinCount=1,
    MaxCount=1,
)

'''
或者用Boto3 Client来创建一个S3 Bucket
'''
s3 = boto3.client('s3')
s3.create_bucket(Bucket='my-bucket')
s3.upload_file('my-file.json', 'my-bucket', 'my-file.json')

```

:::caution boto3.Object()?
提前解释：  
下面代码中的`s3.Object('my-bucket', 'my-file.json')`，是获取一个S3 Object。  
第一个参数是bucket, 第二个参数则是object的`key`(即路径). 第一节课中提到的`基于键的存储`就是这个意思。
:::

```python title="boto3加载数据.py"

import boto3
import json

s3 = boto3.resource('s3')

def load_data():
	obj = s3.Object('my-bucket', 'my-file.json')
	body = obj.get()['Body'].read()
	data = json.loads(body)
	return data

print(load_data())
```

### Lab 2 : Integration with AWS

lab2比起lab1的区别就在于，是`通过boto3从s3 bucket`加载数据，而`不是从本地文件`加载数据。

```python title="main.py"
from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
import json
import boto3

# FastAPI 实例创建
app = FastAPI()

# Jinja2Templates: 用于渲染HTML的模板
templates = Jinja2Templates(directory="templates")

# boto3 访问 s3 bucket
s3 = boto3.resource('s3')

# FastAPI的endpoint / 路由
@app.get("/")
# 需要渲染到HTML的时候就需要有request参数
def read_root(request: Request):
	# templates.TemplateResponse: 模板响应
    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "message": " Hello World from FastAPI!",
            "users": load_data('lab2/users.json'),
        },
    )

# # 辅助函数 - 读取users.json文件
# def get_users_data():
#     with open("users.json", "r", encoding="utf-8") as file:
#         file_contents = "".join(file.readlines())

#         data = json.loads(file_contents)

#         return data

# 换成：辅助函数 - 从s3 bucket读取users.json / movie_data.json文件
def load_data(key: str):
	obj = s3.Object('cse427-yf', key)
	body = obj.get()['Body'].read()
	data = json.loads(body)
	return data

# 第二个路由，依旧request
@app.get("/users")
def get_users(request: Request):
	return templates.TemplateResponse(
		"users.html",
		{
			"request": request,
			"users": load_data('lab2/users.json')["users"],
		},
	)

# 第三个路由，依旧request
@app.get("/movies")
def read_movies(request: Request):
	return templates.TemplateResponse(
		"movies.html",
		{
			"request": request,
			"movies": load_data('lab2/movie_data.json')["results"],
		},
	)
```

## Lecture 3 : VM & Docker Containers

### Why VM & Containers?

1. 云的基石：Foundation of cloud and big data architecture.
2. 行业标准：Containers are the current standard for deploying the web apps and cloud computing
3. 抽象层的需求：随着apps 和 data 越来越多，我们需要一个`abstraction layer` to manage them.
    - **Application Compatibility**: 我们需要`Software Isolation` to focus on just my app, not the underlying infrastructure.
    - **Distributed Computing**: 当我们需要`scale up`的时候，我们需要一种简单、标准化的方式来快速部署、复制和启动我们的app

### What is a Virtual Machine?

Virtual Machine (VM) is a software `emulation` of a physical computer.

它解决的问题就是**Application Compatibility**，让我们可以在一个Host硬件上运行多个Guest OS.

P.S. 这是一种Hardware-level `abstraction`.

:::note VM 和 Hypervisor

VM通过一个叫Hypervisor(虚拟机监视器)的软件，提供操作系统隔离(OS isolation)的假象

Hypervisor 会 `manage the allocation of shared and replicated resources between host & guest OS`，也就是分配真实的硬件资源，比如 CPU 和 RAM，一个服务器分割成多个虚拟机，每个有自己的CPU和RAM.

- 当我们在lab2启动了一个EC2 instance的时候，实际上就是启动了一个VM.

Hypervisor 的类型：

1. Type 1 : Bare Metal Hypervisor (直接在硬件上模拟硬件)
    - 取代 host OS, `直接运行在物理硬件`上
    - 性能非常好，接近裸金属(Bare Metal)
    - 目前所有的云服务商用的都是Type 1 Hypervisor!!
2. Type 2 : Hosted Hypervisor (用软件模拟硬件)
    - 应用软件类型，运行在 host OS 上，如 VirtualBox, VMware
    - 性能不如Type 1，但更易于管理，适用于个人用户

:::

### VM 的问题

1. Resource Overhead: Hypervisors provisions excess resource. Hypervisor分配的资源是固定的，所以总会多分，分配完就被占用了导致浪费。
2. LARGE: 由于 includeing the OS kernel, 一个 VM image 就得有好几个 GB
3. Slow to Boot :启动一个 VM 就跟启动一个新电脑一样慢。

这些毛病引出来一个烧烤：  
_我只是想运行两个独立的 web app, 真的有必要给他们各自启动一个完整的 linux 系统吗？_

于是引出解决方案：  
不在“硬件层”做 Virtualization, 而是在“操作系统层”进行 Isolation, 这就是**_Containerization_**。

### Container

- Container 提供了与 VM 类似的 `isolated environment, independent from the host OS`.
- **Key Difference**: Container 在操作系统层面上进行隔离，而不是硬件层面上。
- Containers **share the underlying kernel of the host OS**, but have their own isolated user space.

可以想象 Container 就像是一个轻量级的 VM (但它共享了 Host OS 的 kernel, 又有自己的空间).

:::warning VM vs Container - 可能作为mid term的考点!!

1. VMs implement `hardware level virtualization`, while Containers implement `OS level virtualization`.
2. VMs 的 resource allocation 是 `fixed` by the Hypervisor, 而 Containers `have no limits by default`.
    - 这使得 Containers are `more efficient` than VMs for most apps.

:::

### Container 的实现原理 - Namespace

Container 是如何实现上述的 “sharing the underlying kernel of the host OS, while owning their own isolated user space” 的？

答案是，利用了 Linux kernel feature: `namespace`.

---

Namespace 是 Container `main building block` 之一.

Namespace abstracts global resources (PID, network, IPC, etc.), to make them appear to the processes within the namespace as isolated instances of those resources.  
Namespace将全局资源（如PID, network, IPC等）抽象为隔离的实例，使得在namespace内的进程看起来就像自己独占了这些资源一样。

Linux 提供了多种 Namespace:

1. PID: 在 Container 中，你的app看到的pid可能是1，但他在host OS中可能是3456
2. net: container可以有自己的`独立IP和port`
3. mount: 挂载点(文件系统)
4. IPC: 进程间通信
5. uts: hostname
6. user: users & UIDs (可以 `sudo` inside the container but not outside)

总的来说，Namespaces 让 Container 里面的 process 产生了 “i am running in an isolated os” 的假象，实际上他们都仍在“share the underlying kernel of the host OS”

:::note unshare
P.S. 我们使用 `unshare` 命令来创建一个 Namespace, 例如：

```bash
unshare -n bash
```

:::

---

:::tip 自己的小问题

当我`sudo unshare --pid --fork --mount-proc bash`, 这里面是没有加上`--uts`这个参数的时候, 这个时候我用`hostname` command 会输出什么结果？

答案是：依旧会输出 `host OS` 的 `hostname`.

所以说，所以每一个global resource都是**独立的**。  
给某一个 resource, 比如 PID, 用 unshare 创建一个 namespace, 这个namespace里面的 process 看到的这个resource (PID) 就是隔离的；但这个 process 看到的其他 resource (如 network, IPC, etc.) 依旧是共享的, host os 上的。

:::

### VM vs Container 再总结

- Container more `efficient and lightweight` than VM.
- Container's resource allocation is `dynamic` by the Container Runtime, while VM's resource allocation is `fixed` by the Hypervisor.
- Container is visualized in the `OS level`, while VM is visualized in the `hardware level`.

但：

- VM provides `full isolation` from the host OS, while Container provides `partial isolation`, meaning VM is `more secure` than Container.
- Container `cannot run all OS` as it shares kernel, while VM `can` run any OS.
- **GUI dev** is `difficult` in Container, while it's `easy` in software such as VirtualBox.

所以我们说，most modern companies combine both, for security and efficiency.

---

### Docker

Docker is a software that utilizes these kernel features to package software into lightweight containers.  
它提供了一个 easy API that abstracts low-level OS visualization (底层虚拟化技术，指的就是前面讲的container的os层虚拟化，被他封装成了一个 easy API).

---

那么要理解Docker，我们首先需要理解`Image Layer`和`Container Layer`的区别.

首先，什么是image?

- 镜像image 是一个 `read-only` 的 template
- 包含了一个应用所需要的所有`一切`：code, libraries, dependencies, executable files, etc.

### Docker Image Layers

Docker Image 是如何构建的？答案是 `分层(layers)`

- 一个 image 是由多个 read-only layers 组成的
- 每个 layer 都 depends on the one before it
- images build by executing each layer `sequentially`, 然后最后combing them into a single image
    - 比如，底层是bootfs, 然后是Debian，再上Emacs，最后是Apache..

这是 Image Layers，那在这里面什么是 `Container Layer`?

当我们 run a container based on an image, 我们实际上是在创建一个 `writable layer` on top of the image.  
这个 app 就运行在这个 writable layer 上，他的所有改动都只会在最上面这个 writable layer 上.

![Docker Image Layers](https://jcqn.oss-cn-beijing.aliyuncs.com/img_blog/4207CC/lecture3_1.png)

### Docker Image Layers vs DockerContainer Layer (KEY!!)

一般从 Docker Hub 拉取一个 Parent Image，比如 `python:3` 或者 `alpine`(一种lightweight linux distribution) 作为构建镜像的开始。

:::caution 重要对比

![Docker Image Layers vs Docker Container Layer](https://jcqn.oss-cn-beijing.aliyuncs.com/img_blog/4207CC/lecture3_2.png)

:::

### Dockerfile

创建镜像我们主要使用 Dockerfile.

- Dockerfile 是一个纯文本 text file, which contains a series of instructions for building a Docker image.
- 每个 instruction is a command that will `create a new layer` in the image.

:::note 几个核心 Dockerfile instructions

1. `FROM <image>:<tag>`: 设置父镜像。这个是 Dockerfile 的第一条指令，必须有，比如 `FROM python:3` 或者 `FROM alpine`.
2. `COPY <local path> <container path>`: 将本地文件复制到镜像中。
3. `RUN <command>`: 执行命令。通常用来在构建时安装依赖，比如`RUN pip install -r requirements.txt`.
4. `CMD ["cmd"]`: 设置容器启动时默认执行的命令。比如`CMD ["uvicorn", "main:app", "--reload"]`.

:::

### Docker API (CLI)

要使用 Docker, 首先需要启动 “Docker守护进程 (Docker Daemon)”. 在 Mac / Windows 上，就是启动个 Docker Desktop 就完事了。  
这个Daemon会在后台运行，监听命令。我们在CLI中敲的`docker` command 实际上就是和这个Daemon交互，发给他去执行。

:::note 几个docker CLI commands

1. `docker build -t <image name> .`: 构建镜像。`-t` 是 tag, 用来给镜像命名。`.` 是 Dockerfile 在当前目录下的意思。
2. `docker run <image name>`: 运行容器。
3. `docker ps`: 查看正在运行的容器。
4. `docker exec -it <container id> /bin/bash`: 进入容器。BEST FRIEND FOR DEBUGGING!! 他允许我在一个*正在运行的container*里面打开一个bash shell执行命令.

`docker run -p 8000:8000 my-app:demo1` 做了端口转发，把container的8000端口映射到host的8000端口。  
`docker run -p 8001:8000 my-app:demo1` 的 container log 显示的还是 8000 端口，因为在 container 内部自己的 Namespace 里面，它总以为自己运行在 8000 端口.

:::

### Store & Share Images - Docker Hub

我们 `docker build` 出来一个 image 了，但它现在只在我本机，如何分享？ - Docker Hub

几个相关命令：

1. `docker pull <image name>`: 从 Docker Hub 拉取 image.
2. `docker tag <local-image> <dockerhub username>/<image name>:<tag>`: 给 image 打 tag. (必须得有一个**local image** 才能打 tag)
3. `docker login`: 登录 Docker Hub.
4. `docker push <dockerhub username>/<image name>:<tag>`: 推送到 Docker Hub.

### Multi-Platform - Docker Buildx

本机 Mac 是 `ARM 架构`的，但 EC2 实例是 `AMD x86` 架构的。那我 docker build 出来的 image 显然不能在 EC2 实例上运行。为了不给每个平台都构建推送一个不同 tag 的 image，我们使用 `Docker Buildx` 来解决这个问题。

Docker Buildx 是一个 CLI plugin, 它支持多平台构建 (Multi-Platform Build):

`docker buildx build --platform linux/amd64,linux/arm64 -t [dockerhub username]/[image name]:[tag] . --push`: 构建并推送 **amd64 和 arm64 两个平台的 image** 到 Docker Hub.

## Lecture 4 : Kubernetes
