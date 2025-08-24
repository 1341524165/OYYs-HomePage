---
sidebar_position: 1
id: Build up a Blog
title: Build up a Blog
tags:
    - Study
    - Code
    - Build up a Blog
---

## _博客怎么搭起来的呢_

### 一、安装 docusaurus

#### 1.安装 Node.js 和 npm

首先去[node 官网](https://nodejs.org/en/)下载**LTS**（长期支持稳定）版本，下载下来后，双击安装包，一步一步安装即可；  
![1](https://jcqn.oss-cn-beijing.aliyuncs.com/img_blog/Buab1.jpg)

安装路径自然还是**D 盘**:  
![2](https://jcqn.oss-cn-beijing.aliyuncs.com/img_blog/Buab2.jpg)

选**change**:  
![3](https://jcqn.oss-cn-beijing.aliyuncs.com/img_blog/Buab3.jpg)

选**add to path**（添加到环境变量，少点麻烦）:  
![4](https://jcqn.oss-cn-beijing.aliyuncs.com/img_blog/Buab4.jpg)

`安装完成，下一步咯`

#### 2.检查 Node.js 和 npm

Docusaurus 要求您的电脑配置有 Node.js **v16.14** 或以上版本，如果你**没有**安装 Nodejs，请参考上面[安装 Node.js 和 npm](#1安装-nodejs-和-npm)  
然后打开 cmd 检查安装情况，输入：

```bash
node -v
npm -v
```

发现`显示有各自对应版本号，说明成功啦`

#### 3.安装 Docusaurus

新建一个**空**文件夹，在空白处打开 powershell，输入：

```bash
npm init docusaurus
```

选择**classic**  
![5](https://jcqn.oss-cn-beijing.aliyuncs.com/img_blog/Buab5.jpg)

如果你不想使用 TypeScript 作为脚本语言，请输入`N`  
选择**npm**为包管理器  
![6](https://jcqn.oss-cn-beijing.aliyuncs.com/img_blog/Buab6.jpg)

初始化项目需要一段时间  
![7](https://jcqn.oss-cn-beijing.aliyuncs.com/img_blog/Buab7.jpg)

`安装完成咯`

#### 4.一不小心整个文件夹都没了怎么办

有时候由于各种原因，反正我就是**啥都不见了**，怎么重新搞回来呢？  
下载`github desktop`将存放你博客的仓库 clone 到本地来，然后再**npm install**就搞定了
