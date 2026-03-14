# 战场幸存者

> 2D上帝视角多人战斗肉鸽游戏

---

## 目录

- [游戏介绍](#游戏介绍)
- [安装说明](#安装说明)
- [运行方法](#运行方法)
- [开发指南](#开发指南)
- [贡献说明](#贡献说明)
- [许可证信息](#许可证信息)

---

## 游戏介绍

### 项目简介

战场幸存者是一款2D上帝视角多人战斗肉鸽游戏。玩家将在随机生成的战场上与其他玩家进行激烈的战斗，收集装备，不断变强，直到成为最后的幸存者。

### 核心特色

- **2D上帝视角** - 俯瞰整个战场，掌握全局
- **多人联机** - 支持多人同时在线对战
- **肉鸽玩法** - 随机生成地图、随机掉落装备
- **装备系统** - 收集不同类型的武器和防具
- **实时战斗** - WebSocket实时同步，低延迟对战

---

## 安装说明

### 前置要求

在开始之前，请确保你的系统已安装以下软件：

- **Node.js** (推荐 v16 或更高版本)
- **npm** (通常随 Node.js 一起安装)

### 安装步骤

1. **克隆或下载项目**

   ```bash
   # 如果使用 git
   git clone <repository-url>
   cd battle-survivors
   ```

2. **安装依赖**

   在项目根目录下运行：

   ```bash
   npm install
   ```

   这将安装所有必要的依赖包，包括：
   - `phaser` - 前端游戏引擎
   - `express` - 后端Web框架
   - `ws` - WebSocket库
   - `nodemon` - 开发模式热重载（开发依赖）
   - `http-server` - 前端静态文件服务器（开发依赖）

---

## 运行方法

### 启动后端服务器

在项目根目录下运行：

```bash
npm start
```

这将启动后端游戏服务器，默认监听端口 2567。

### 开发模式启动（推荐）

如果你想要在修改代码后自动重启服务器，可以使用开发模式：

```bash
npm run dev
```

这将使用 `nodemon` 启动服务器，当代码发生变化时会自动重启。

### 启动前端开发服务器

如果你想要单独运行前端进行开发，可以使用：

```bash
npm run client
```

这将使用 `http-server` 启动前端静态文件服务器。

### 访问游戏

启动成功后，在浏览器中访问：

```
http://localhost:2567
```

或者（如果使用独立的前端服务器）：

```
http://localhost:8080
```

---

## 开发指南

### 项目结构

```
battle-survivors/
├── client/              # 前端代码
│   ├── assets/          # 游戏资源
│   │   ├── images/      # 图片资源
│   │   ├── audio/       # 音频资源
│   │   └── sprites/     # 精灵图资源
│   ├── js/              # JavaScript代码
│   │   ├── scenes/      # 游戏场景
│   │   ├── objects/     # 游戏对象
│   │   └── utils/       # 工具函数
│   └── index.html       # 前端入口文件
├── server/              # 后端代码
├── .gitignore           # Git忽略文件
├── package.json         # 项目配置
└── README.md            # 项目说明（本文件）
```

### 前端开发

前端使用 Phaser.js 游戏引擎开发。

#### 主要文件说明

- `client/index.html` - 前端入口页面
- `client/js/scenes/` - 游戏场景（主菜单、游戏场景、结束场景等）
- `client/js/objects/` - 游戏对象（玩家、敌人、道具等）
- `client/js/utils/` - 工具函数（数学、碰撞检测等）
- `client/assets/` - 游戏资源（图片、音频、精灵图）

### 后端开发

后端使用 Node.js + Express + WebSocket 开发。

#### 主要文件说明

- `server/server.js` - 后端入口文件
- `server/` - 后端代码目录

### 开发流程

1. **启动开发服务器**

   ```bash
   npm run dev
   ```

2. **修改代码**

   - 前端代码修改后，刷新浏览器即可看到效果
   - 后端代码修改后，`nodemon` 会自动重启服务器

3. **测试游戏**

   在浏览器中访问 `http://localhost:2567` 进行测试。

---

## 贡献说明

我们欢迎任何形式的贡献！

### 贡献方式

1. **报告问题**

   如果你发现了 bug 或有功能建议，请提交 Issue。

2. **提交代码**

   如果你想要贡献代码，请遵循以下步骤：

   1. Fork 本仓库
   2. 创建你的功能分支 (`git checkout -b feature/AmazingFeature`)
   3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
   4. 推送到分支 (`git push origin feature/AmazingFeature`)
   5. 开启一个 Pull Request

### 代码规范

- 请遵循项目现有的代码风格
- 添加必要的注释
- 确保代码在提交前经过测试

---

## 许可证信息

本项目采用 MIT 许可证。

### MIT 许可证

```
MIT License

Copyright (c) 2024 战场幸存者

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 发送邮件

---

**最后更新：** 2024年3月
