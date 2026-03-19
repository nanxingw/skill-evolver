<h1 align="center">AutoViral</h1>

<p align="center">
  <strong>AI 驱动的社交媒体内容创作平台 — 从选题调研到成片发布，一站式完成</strong>
</p>

<p align="center">
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node.js-%3E%3D18-green" alt="Node.js >= 18"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
</p>

---

AutoViral 是一个本地运行的 AI 内容创作工作台，专为**抖音**和**小红书**创作者设计。它通过 4 步流水线（调研 → 规划 → 生图/生视频 → 合成）将一个选题变成可发布的内容，全程由 AI Agent 驱动，你只需确认和反馈。

## 核心流程

```
选题调研  →  内容规划  →  素材生成  →  视频合成
  │            │            │            │
  │ AI 搜索    │ 分镜/图文   │ 即梦 API   │ FFmpeg
  │ 热门趋势   │ 脚本策划    │ 生图/生视频  │ 拼接+字幕+配乐
  ▼            ▼            ▼            ▼
 调研报告    创作方案     图片/视频素材   成品视频/图文
```

**支持两种内容类型：**
- **短视频** — 适用于抖音，从分镜脚本到成片
- **图文** — 适用于小红书，从排版规划到成品图文

## 快速开始

### 前置要求

- **Node.js** >= 18
- **[Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code)** 已安装并登录
- **FFmpeg**（视频合成需要）：`brew install ffmpeg`
- **即梦 AI API 密钥**（生图/生视频需要，见下方申请指南）

### 安装

```bash
git clone https://github.com/nanxingw/AutoViral.git
cd AutoViral

npm install
npm run build
```

### 配置 API 密钥

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env，填入你的密钥
```

`.env` 文件内容：

```env
# 即梦 AI（必填）
JIMENG_ACCESS_KEY=你的AccessKeyId
JIMENG_SECRET_KEY=你的SecretAccessKey

# OpenRouter（可选，备用 LLM）
OPENROUTER_API_KEY=

# EverMemOS（可选，长期记忆）
EVERMEMOS_API_KEY=
```

### 启动

```bash
autoviral start          # 后台启动（守护进程）
autoviral start --foreground  # 前台启动（可看日志）
```

打开浏览器访问 **http://localhost:3271**

### 其他命令

```bash
autoviral stop           # 停止服务
autoviral dashboard      # 打开浏览器
autoviral config get     # 查看配置
autoviral config set model haiku  # 修改配置
```

## 即梦 AI API 申请指南

即梦 AI 是字节跳动旗下的 AI 生成平台，提供文生图、图生视频等能力。AutoViral 通过即梦 API 生成图片和视频素材。

### 第 1 步：注册火山引擎账号

1. 打开 [火山引擎官网](https://www.volcengine.com/)
2. 点击右上角「注册」，使用手机号注册
3. 完成实名认证（个人认证即可）

### 第 2 步：开通即梦 AI 服务

1. 打开 [即梦官网](https://jimeng.jianying.com/)
2. 点击左上角「API 调用」
3. 进入新页面后点击「立即开通」
4. 分别开通「图片生成」和「视频生成」服务

> 也可直接访问 [火山引擎控制台](https://console.volcengine.com/ai/ability/detail/10) 开通

### 第 3 步：获取 API 密钥

1. 登录 [火山引擎控制台](https://console.volcengine.com/)
2. 点击右上角头像 → 「API 访问密钥」
3. 点击「新建密钥」
4. 记录 **Access Key ID** 和 **Secret Access Key**

> 密钥创建后 Secret Key 只显示一次，请妥善保存

### 第 4 步：填入 AutoViral

将获取的密钥填入项目根目录的 `.env` 文件：

```env
JIMENG_ACCESS_KEY=AKLTxxxxxxxxxxxxxxxx
JIMENG_SECRET_KEY=xxxxxxxxxxxxxxxx
```

### 费用说明

- 新用户有免费额度
- 正式使用按量计费，图片生成和视频生成分别计费
- 测试阶段有并发限制（约 1 并发）
- 详见 [即梦 API 定价](https://www.volcengine.com/docs/6791/1397048)

## 使用流程

### 1. 探索趋势

进入「探索」页面，选择抖音或小红书，点击「刷新趋势」。AI 会实时搜索平台热门话题，展示搜索进度，最终生成趋势卡片。看到感兴趣的方向可以直接「以此创建作品」。

### 2. 创建作品

进入「作品」页面，点击新建：
- 输入标题（如"奶龙抽象新闻联播"）
- 选择类型：短视频 / 图文
- 选择平台：抖音 / 小红书
- 可选：填写选题方向提示

### 3. 流水线创作

点击作品卡片进入 Studio 工作台，左侧是 4 步流水线：

**话题调研** — AI 搜索平台趋势，分析竞争度和热度，输出调研报告。你可以指定调研方向，也可以让 AI 广泛搜索。

**内容规划** — 基于调研结果，AI 策划具体内容方案：
- 短视频：分镜脚本、画面描述、台词、时长
- 图文：每张图的内容规划、文案结构

**素材生成** — AI 调用即梦 API 逐个生成素材：
- 短视频：先生图（首帧）→ 再生视频片段
- 图文：生成配图

**视频合成**（短视频）/ **图文排版**（图文）— 最终组装：
- 短视频：FFmpeg 拼接片段 + 字幕 + 配乐 + 转场
- 图文：排版输出 + 发布文案

每个步骤 AI 会先和你确认方案，等你同意后再执行。你可以随时在聊天中给反馈。

### 4. 发布

成品保存在作品的 `output/` 目录，右侧素材面板可以预览和下载。

## 项目架构

```
浏览器 (Svelte 5 SPA)
     ↕ WebSocket 实时通信
Node.js 服务器 (Hono)
     ↕ stdout/stdin 管道
Claude Code CLI (stream-json 模式)
     ↕ 工具调用
即梦 API / FFmpeg / WebSearch
```

### 目录结构

```
src/
  cli.ts                 # CLI 入口（start/stop/config）
  config.ts              # 配置管理（.env + config.yaml）
  work-store.ts          # 作品持久化存储
  ws-bridge.ts           # WebSocket 桥接（浏览器 ↔ Claude CLI）
  server/
    api.ts               # REST API 路由
    index.ts             # Web 服务器
  providers/
    jimeng.ts            # 即梦 API 集成（HMAC-SHA256 签名）
    base.ts              # Provider 接口
    registry.ts          # Provider 注册

web/
  src/
    pages/
      Studio.svelte      # 创作工作台（聊天+流水线+素材）
      Explore.svelte     # 趋势探索
      Works.svelte       # 作品列表
    components/
      PipelineSteps.svelte    # 流水线侧边栏
      ResearchProgress.svelte # 搜索进度指示器
      AssetPanel.svelte       # 素材浏览面板

skills/                  # AI Agent 技能定义
  trend-research/        # 趋势调研技能
  content-planning/      # 内容规划技能
  asset-generation/      # 素材生成技能
  content-assembly/      # 内容合成技能
```

### 数据存储

所有数据存储在 `~/.autoviral/`：

```
~/.autoviral/
  config.yaml            # 运行配置
  works/
    works.yaml           # 作品索引
    w_20260319_1044_a1f/  # 每个作品独立目录
      work.yaml           # 作品定义
      research/            # 调研数据
      plan/                # 规划方案
      assets/              # 生成素材
        frames/            # 首帧图片
        clips/             # 视频片段
        images/            # 图文配图
      output/              # 最终成品
  trends/
    douyin/               # 抖音趋势缓存
    xiaohongshu/          # 小红书趋势缓存
```

## 配置项

配置优先级：`.env` 环境变量 > `~/.autoviral/config.yaml`

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `port` | `3271` | 仪表盘端口 |
| `model` | `opus` | Claude 模型（opus/sonnet/haiku） |
| `jimeng.accessKey` | — | 即梦 API AccessKey（建议在 .env 配置） |
| `jimeng.secretKey` | — | 即梦 API SecretKey（建议在 .env 配置） |
| `research.enabled` | `true` | 是否启用定时调研 |
| `research.schedule` | `0 9,21 * * *` | 调研 cron 表达式（默认每天 9 点和 21 点） |
| `research.platforms` | `["douyin","xiaohongshu"]` | 监控的平台 |

## 技术栈

| 层 | 技术 |
|----|------|
| 后端 | Node.js, Hono, TypeScript |
| 前端 | Svelte 5 (runes), Vite |
| AI | Claude Code CLI（子进程 stream-json） |
| 图片/视频生成 | 即梦 AI API（火山引擎） |
| 视频编辑 | FFmpeg |
| 实时通信 | WebSocket |
| 主题 | Glass Noir 深色主题 |

## License

MIT
