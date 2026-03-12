# 小手机 - 高仿微信AI聊天应用

一个基于 Vue 3 的高仿微信UI的本地AI多角色聊天PWA应用。

## 功能特性

- 🎨 **高仿微信UI** - 完美复刻微信界面风格
- 💬 **多角色聊天** - 支持创建多个AI角色，每个角色独立配置
- 🧠 **智能上下文** - 自动维护最近15轮对话上下文
- 🖼️ **图片识别** - 支持发送图片，Claude Vision自动识别
- 🎤 **语音输入** - 浏览器原生语音识别转文字
- 💾 **本地存储** - 使用IndexedDB存储所有数据，完全离线可用
- 📱 **PWA支持** - 可安装到桌面，像原生应用一样使用
- ⚡ **智能延迟** - 模拟真人打字效果，自然的对话体验

## 技术栈

- Vue 3 + Composition API
- Vue Router
- Vite
- Dexie.js (IndexedDB封装)
- Vite PWA Plugin

## 安装使用

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

应用将在 http://localhost:3000 启动。

### 3. 构建生产版本

```bash
npm run build
```

构建产物在 `dist` 目录。

### 4. 预览生产版本

```bash
npm run preview
```

## 使用指南

### 创建第一个AI角色

1. 点击底部导航栏的「通讯录」
2. 点击右上角「+ 新角色」
3. 填写角色信息：
   - **角色名称**: 给角色起个名字（必填）
   - **API格式**: 选择 Anthropic 官方或 OpenAI 兼容格式
   - **API Key**: 填入你的 API Key（必填）
   - **API端点**: 可选，不填使用默认端点
   - **模型名称**: 可选，不填使用默认模型
   - **头像URL**: 可选，角色头像图片链接
   - **系统提示词**: 可选，设定角色性格和专业领域
4. 点击「保存角色」

### 开始聊天

1. 在「通讯录」中点击已创建的角色
2. 进入聊天界面，开始对话
3. 支持功能：
   - 📝 文字消息
   - 🖼️ 图片识别
   - 🎤 语音输入（点击麦克风图标）

### API 配置说明

#### Anthropic 官方 API

- API格式: `anthropic`
- 默认端点: `https://api.anthropic.com/v1/messages`
- 推荐模型: `claude-3-5-sonnet-20241022`

#### OpenAI 兼容 API

- API格式: `openai`
- 默认端点: `https://api.openai.com/v1/chat/completions`
- 推荐模型: `gpt-3.5-turbo` 或 `gpt-4`

## 项目结构

```
D:\claude_project\小手机\
├── src/
│   ├── views/              # 页面组件
│   │   ├── Chats.vue       # 消息列表
│   │   ├── ChatRoom.vue    # 聊天界面
│   │   ├── Contacts.vue    # 通讯录
│   │   ├── NewRole.vue     # 新建角色
│   │   ├── Discover.vue    # 发现
│   │   ├── Me.vue          # 我
│   │   └── ...
│   ├── components/         # 通用组件
│   │   ├── TabBar.vue      # 底部导航
│   │   ├── NavBar.vue      # 顶部导航
│   │   ├── MessageBubble.vue  # 消息气泡
│   │   └── ChatInput.vue   # 输入框
│   ├── services/           # 服务层
│   │   ├── db.js           # IndexedDB服务
│   │   ├── claude.js       # Claude API服务
│   │   └── speech.js       # 语音识别服务
│   ├── router/             # 路由配置
│   └── assets/             # 资源文件
├── public/                 # 静态资源
├── index.html
├── vite.config.js
└── package.json
```

## 核心功能实现

### 15轮上下文管理

应用自动维护最近15轮（30条消息）对话上下文，超出部分自动截断，确保API调用效率。

### 智能延迟回复

每次AI回复都会：
1. 显示"对方正在输入..."状态
2. 调用API获取回复
3. 根据实际耗时添加智能延迟（最少800ms）
4. 模拟真人打字效果

### 图片识别

支持发送图片给Claude Vision API：
1. 点击输入框左侧的图片图标
2. 选择图片文件
3. 自动转换为Base64并调用Vision API
4. AI识别图片内容并回复

### 语音输入

使用浏览器原生Web Speech API：
1. 点击麦克风图标
2. 允许麦克风权限
3. 说话后自动转换为文字
4. 支持中文识别

## 数据存储

所有数据使用IndexedDB存储在本地浏览器：

- **roles** - 角色配置（API Key、模型等）
- **conversations** - 会话列表
- **messages** - 聊天消息记录

数据完全本地化，不会上传到任何服务器。

## 注意事项

1. API Key 安全：API Key存储在本地浏览器，请妥善保管
2. 浏览器兼容：推荐使用Chrome、Edge等现代浏览器
3. 语音识别：需要浏览器支持Web Speech API（Chrome/Edge）
4. 网络要求：需要网络连接调用AI API

## 开发计划

- [ ] 表情包系统
- [ ] 消息撤回
- [ ] 导出聊天记录
- [ ] 角色分组
- [ ] 自定义主题
- [ ] 更多AI模型支持

## 许可证

MIT License

## 致谢

本项目仅供学习交流使用，UI设计灵感来自微信。
