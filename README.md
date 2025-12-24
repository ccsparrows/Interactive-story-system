# 儿童故事交互系统 (Interactive Story System)

这是一个基于手势识别的儿童故事交互系统原型。通过摄像头捕捉儿童的手势（如挥手、比心、竖大拇指），来控制故事的翻页和触发特效。

## 项目结构

- **frontend/**: React 前端应用
  - 使用 `@mediapipe/hands` 进行手势识别
  - 使用 `framer-motion` 进行动画展示
- **backend/**: Node.js/Express 后端服务
  - 提供故事数据 API

## 环境要求

- Node.js (v14 或更高版本)
- 摄像头

## 安装与运行

### 1. 安装依赖

在项目根目录下打开终端：

**安装后端依赖:**

```bash
cd backend
npm install
```

**安装前端依赖:**

```bash
cd ../frontend
npm install
```

### 2. 启动项目

你需要同时启动后端和前端。

**启动后端 (端口 5000):**

```bash
cd backend
npm start
```

**启动前端 (端口 3000):**
打开一个新的终端窗口：

```bash
cd frontend
npm start
```

### 3. 使用说明

1. 浏览器会自动打开 `http://localhost:3000`。
2. 允许浏览器访问摄像头。
3. 等待右下角摄像头画面出现，并显示 "Loading Model..." 消失。
4. 根据屏幕上的提示做出相应手势：
   - **竖起大拇指 (Thumb Up)**: 确认/开始
   - **张开手掌 (Open Palm)**: 推开障碍物/挥手
   - **双手比心 (Heart)**: 触发爱心特效

## 开发笔记

- 手势识别逻辑位于 `frontend/src/services/gestureService.js`。目前实现了基础的几何规则识别。
- 故事数据位于 `backend/src/data/stories.json`，可以自由扩展新的故事和交互点。
