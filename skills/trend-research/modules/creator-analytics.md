# 达人数据采集模块

当需要采集达人/创作者的账号数据和作品数据时，加载此模块。适用于竞品分析、账号诊断、内容复盘等场景。

---

## 前置条件

```bash
python3 -c "import f2, browser_cookie3; print('OK')"
```

如缺少依赖：`pip3 install f2 browser_cookie3`

---

## 使用流程

### 1. 获取创作者主页 URL（首次使用）

URL **只需首次提供**——会自动保存到 `~/.config/creator-analytics/accounts.json`。后续运行可省略 `--url`。

接受的格式：
- **完整 URL**: `https://www.douyin.com/user/MS4wLjABAAAA...`
- **分享链接**: `https://v.douyin.com/i2wyU53P/`
- 用户可在抖音 APP → 个人主页 → 分享 → 复制链接获取

### 2. 提醒用户关闭 Chrome

**重要**：`browser_cookie3` 需要独占访问 Chrome 的 cookie 数据库。用户必须完全关闭 Chrome 后再运行采集脚本。

### 3. 运行采集脚本

```bash
# 首次——提供 URL（自动保存）：
python3 skills/trend-research/scripts/creator-analytics/collect.py \
  --platform douyin \
  --url "<PROFILE_URL>"

# 后续——不需要 URL：
python3 skills/trend-research/scripts/creator-analytics/collect.py \
  --platform douyin

# 查看已保存的账号：
python3 skills/trend-research/scripts/creator-analytics/collect.py \
  --platform douyin --list-accounts
```

**参数：**

| Flag | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `--platform` | 是 | — | 目标平台：`douyin` |
| `--url` | 否 | 已保存 | 创作者主页 URL |
| `--browser` | 否 | `chrome` | Cookie 来源浏览器 |
| `--max-posts` | 否 | 全部 | 限制采集的作品数量 |
| `--list-accounts` | 否 | — | 显示已保存账号并退出 |

### 4. 解析输出

脚本将 JSON 输出到 **stdout**，错误输出到 **stderr**（exit code 1）。

**结果展示方式：**
1. **账号概览** — 昵称、粉丝数、获赞总数、作品数
2. **互动摘要** — 平均播放、点赞、评论、转发、收藏；互动率
3. **TOP 作品** — 按播放量或点赞排序，展示前 5 条
4. **趋势** — 如数据跨多月，标注增长趋势

---

## 输出 Schema

```json
{
  "platform": "douyin",
  "collected_at": "2026-03-19T10:30:00+00:00",
  "account": {
    "sec_user_id": "MS4wLjAB...",
    "nickname": "创作者昵称",
    "signature": "个人简介",
    "follower_count": 125000,
    "following_count": 320,
    "total_favorited": 5600000,
    "aweme_count": 186
  },
  "works": [
    {
      "aweme_id": "7341...",
      "desc": "视频描述",
      "create_time": "2026-03-15 14:30:00",
      "play_count": 89200,
      "digg_count": 45200,
      "comment_count": 1230,
      "share_count": 890,
      "collect_count": 3400
    }
  ],
  "summary": {
    "total_works_collected": 186,
    "avg_play": 52000,
    "avg_digg": 24300,
    "avg_comment": 670,
    "avg_share": 430,
    "avg_collect": 1800,
    "engagement_rate": 0.0216
  }
}
```

---

## 错误处理

| 错误码 | 原因 | 解决方法 |
|--------|------|---------|
| `DEPENDENCY_ERROR` | f2 或 browser_cookie3 未安装 | `pip3 install f2 browser_cookie3` |
| `BROWSER_NOT_FOUND` | 不支持的浏览器 | 使用 `--browser chrome` |
| `COOKIE_NOT_FOUND` | 无法读取 cookie 数据库 | 完全关闭浏览器后重试 |
| `NOT_LOGGED_IN` | 无有效会话 | 在浏览器中登录 douyin.com，关闭浏览器后重试 |
| `INVALID_URL` | URL 格式不对 | 使用有效的抖音个人主页 URL |
| `API_ERROR` | API 请求失败 | Cookie 过期——重新登录后重试 |

---

## 支持平台

| 平台 | 状态 | Flag |
|------|------|------|
| 抖音 | 已支持 | `--platform douyin` |
| 小红书 | 规划中 | `--platform xiaohongshu` |

## 架构

```
scripts/creator-analytics/
├── collect.py              # CLI 入口
└── platforms/
    ├── __init__.py          # BaseCollector 抽象基类
    └── douyin.py            # 抖音采集器（f2 + browser_cookie3）
```

新增平台：创建 `platforms/<name>.py` 实现 `BaseCollector`，并在 `collect.py` 中注册。
