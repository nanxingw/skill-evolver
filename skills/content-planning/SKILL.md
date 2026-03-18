---
name: content-planning
description: Create detailed content plans and storyboards for Douyin (抖音) and Xiaohongshu (小红书) content. Use this skill whenever the user wants to plan content, create a storyboard, write a shot list, design image-text layouts, plan a content piece, or when the pipeline step is "plan". Handles both short-video storyboards with shot-by-shot breakdowns and image-text content structures with per-image descriptions.
---

# Content Planning Skill

You are an expert content planner and storyboard artist for Chinese social media platforms. Your job is to create detailed, production-ready content plans that can be directly executed by the asset generation step.

## Determine Content Type

Check the work's `type` field:
- **short-video** → Create a storyboard with shot-by-shot breakdown
- **image-text** → Create an image structure with per-image descriptions

Always fetch the work context first:
```bash
curl http://localhost:3271/api/works/{workId}
curl http://localhost:3271/api/shared-assets
curl http://localhost:3271/api/memory/profile
```

---

## Short Video Composition Principles

### Visual Composition Rules

**三分法 (Rule of Thirds):**
- Place subjects at intersection points of the 3×3 grid
- For talking-head videos: eyes at top-third line
- For product shots: product at a power point (intersection)

**引导线 (Leading Lines):**
- Use architectural lines, roads, table edges to guide the eye to the subject
- Diagonal lines create dynamic energy; horizontal lines create calm
- In vertical (9:16) format, vertical leading lines are especially powerful

**框架构图 (Framing):**
- Use doorways, windows, phone screens, or natural frames to draw attention
- Creates depth and focuses the viewer on the subject

**留白 (Negative Space):**
- Leave space for text overlays (especially important for Douyin — text is often placed in the top or bottom third)
- XHS cover images need clean areas for title text

**竖屏构图特点 (Vertical Frame Composition):**
- 9:16 is a tall, narrow frame — use it vertically
- Stack elements top-to-bottom instead of left-to-right
- Close-ups and medium shots work better than wide shots in vertical
- Subject should fill 60-80% of the frame for impact

### Camera Language (镜头语言)

Use Chinese cinematography terminology in storyboards:

| 术语 | English | Use Case | Emotional Effect |
|------|---------|----------|-----------------|
| 推 (Push/Zoom in) | Push in / Dolly in | Emphasize detail, create tension | Focus, importance, intimacy |
| 拉 (Pull/Zoom out) | Pull out / Dolly out | Reveal context, show scale | Revelation, loneliness, grandeur |
| 摇 (Pan) | Pan left/right | Survey a scene, follow action | Exploration, continuity |
| 移 (Dolly/Track) | Dolly / Tracking shot | Follow subject movement | Journey, energy, fluidity |
| 跟 (Follow) | Follow shot | Stay with moving subject | Engagement, immersion |
| 俯拍 (Bird's eye) | Top-down / Overhead | Show layout, food flat-lay | Overview, order, aesthetic |
| 仰拍 (Low angle) | Low angle | Make subject look powerful/tall | Authority, grandeur, drama |
| 特写 (Close-up) | Close-up / ECU | Show detail, emotion | Intimacy, emphasis, tension |
| 全景 (Wide/Establishing) | Wide / Establishing | Set the scene, show environment | Context, atmosphere, scale |
| 中景 (Medium shot) | Medium shot | Standard conversation, action | Neutral, balanced, informative |
| 固定 (Static) | Locked-off / Static | Stable, professional feel | Calm, confidence, clarity |
| 手持 (Handheld) | Handheld | Raw, authentic vlog feel | Energy, authenticity, urgency |

### Narrative Pacing for Short-Form Video

**The Hook-Value-CTA Framework:**

**Hook (0-3 seconds) — 最关键:**
Every short video lives or dies by its first 3 seconds. The hook determines whether the viewer swipes.

Hook types:
- **视觉钩子 (Visual hook):** A striking image — before/after, unusual scene, beautiful composition
- **文字钩子 (Text hook):** On-screen text that poses a question or makes a bold claim
- **声音钩子 (Audio hook):** Surprising sound, trending BGM opening, or attention-grabbing voice
- **悬念钩子 (Suspense hook):** Show the end result first, then "让我告诉你怎么做的"
- **痛点钩子 (Pain point hook):** Identify a problem the viewer has — "你是不是也..."

**Value Delivery (3-45 seconds):**
- Rhythm changes every 5-7 seconds to maintain attention
- Each scene should deliver a micro-value or advance the narrative
- Use visual variety: alternate between close-ups and medium shots
- Text overlays reinforce key points (many viewers watch without sound)

**CTA (Last 3-5 seconds):**
- 关注型: "关注我，下期教你..." (Follow for more)
- 互动型: "你觉得哪个更好？评论区告诉我" (Comment engagement)
- 收藏型: "先收藏，用到的时候找得到" (Save for later)
- 转发型: "转给你需要的朋友" (Share with friends)

### Pacing Rhythm Templates

**教程型 (Tutorial, 30-60s):**
```
[Hook: 成品展示 3s] → [问题引出 3s] → [步骤1 5-8s] → [步骤2 5-8s] → [步骤3 5-8s] → [成品特写 3s] → [CTA 3s]
```

**故事型 (Story, 30-60s):**
```
[Hook: 冲突/悬念 3s] → [背景交代 5s] → [发展 10-15s] → [高潮/反转 5-8s] → [结局 3-5s] → [CTA 3s]
```

**种草型 (Product showcase/XHS, 15-30s):**
```
[Hook: 痛点 3s] → [产品介绍 5s] → [使用展示 5-8s] → [效果对比 5s] → [总结推荐 3s] → [CTA 3s]
```

**Vlog型 (Vlog/日常, 45-90s):**
```
[Hook: 今日亮点 3s] → [场景1 10-15s] → [过渡 2s] → [场景2 10-15s] → [场景3 10-15s] → [总结感悟 5s] → [CTA 3s]
```

---

## Platform-Specific Content Strategy

### Douyin Content Strategy

**What performs well:**
- Hook-driven content — first frame must stop the scroll
- Trending audio (热门BGM) — reusing trending sounds gets algorithmic boost
- 话题挑战 (Hashtag challenges) — participating in trending challenges
- 合拍/对口型 (Duets/Lip-sync) — engagement with existing viral content
- Emotional storytelling with a twist ending
- Practical tutorials with clear, fast pacing

**Video specs:**
- Resolution: 1080×1920 (9:16) or 1088×1920
- Duration: 7-60 seconds optimal (algorithm favors content that people finish watching)
- Frame rate: 30fps standard, 60fps for high-motion
- Codec: H.264 / H.265
- Max file size: 4GB
- Max duration: 15 minutes (but under 60s recommended)

**Text overlay best practices:**
- Large, bold text (48-72px equivalent)
- Centered or top-third placement
- High contrast (white text with black shadow)
- Key phrases only — not full sentences
- Animated text appearance adds engagement

### XHS Content Strategy

**What performs well:**
- Aesthetic-first — beautiful cover images drive clicks
- Educational value — "干货" (useful knowledge) gets saved
- Authentic voice — personal experience > generic advice
- List format — "10个..." "5种..." structured content
- Step-by-step tutorials with clear photos
- Detailed reviews with pros and cons

**Image specs:**
- Cover image: 1080×1440 (3:4) recommended, or 1080×1920 (9:16)
- Interior images: consistent ratio throughout the post
- Minimum 3 images, recommended 6-9 images per post
- Image quality: clear, well-lit, aesthetically pleasing

**XHS image content principles:**
- First image IS the cover — it determines click-through rate
- Cover should have: clear subject + readable title text + aesthetic background
- Use consistent color tone across all images
- Text on images should be readable on mobile (minimum 24px equivalent)
- Include a "拍摄信息" or "详细信息" image for credibility

---

## Color Psychology and Mood

| Color Tone | 中文 | Mood | Best For |
|-----------|------|------|----------|
| Warm orange/yellow | 暖色调 | Cozy, appetizing, friendly | Food, lifestyle, home |
| Cool blue/teal | 冷色调 | Professional, calm, trustworthy | Tech, education, business |
| Pink/peach | 粉色调 | Soft, feminine, romantic | Beauty, fashion, relationship |
| Earth tones | 大地色 | Natural, organic, grounded | Travel, wellness, eco |
| High contrast B&W | 黑白高对比 | Dramatic, artistic, bold | Fashion, art, powerful stories |
| Pastel | 马卡龙色 | Youthful, fresh, playful | Youth content, cute products |
| Vintage/film | 胶片/复古 | Nostalgic, artistic, trendy | Cultural content, lifestyle |
| Morandi colors | 莫兰迪色 | Elegant, muted, sophisticated | XHS aesthetic, premium products |

**Consistency rule:** Choose ONE color palette per content piece and maintain it across all shots/images. This creates visual cohesion and brand recognition.

---

## Prompt Writing for Visual Consistency

When writing scene descriptions (which will be used directly as image/video generation prompts), follow these rules for consistency:

### Character Consistency
If a character appears in multiple shots, create a **Character Reference Block** at the top of the plan:

```
【角色定义】
角色A: young Chinese woman, age 25, long black hair, wearing white linen shirt and light blue jeans, natural makeup, warm smile
```

Then in each shot description, reference the full character description rather than shorthand. This ensures the generation model produces consistent characters.

### Style Consistency Keywords
Define a **Style Block** that gets appended to every generation prompt:

```
【风格定义】
Style: soft natural lighting, warm color grading, shallow depth of field, lifestyle photography aesthetic, shot on iPhone 15 Pro, 4K quality
Negative: blurry, distorted, oversaturated, artificial, stock photo feel
```

### Scene Description Formula

Each scene description should follow this structure:
```
[Subject/Character description], [Action/Pose], [Environment/Background], [Lighting], [Camera angle], [Style keywords]
```

Example:
```
Young Chinese woman with long black hair in white linen shirt, smiling while arranging flowers on a wooden kitchen table, bright modern kitchen with large windows, warm morning sunlight streaming in, medium shot at eye level, soft natural lighting, lifestyle photography, warm color grading
```

---

## Output Format: Short Video (短视频)

```markdown
# 内容策划: [Title]

## 基本信息
- **主题:** [Theme]
- **标题:** [Catchy title for the platform]
- **内容类型:** 短视频
- **目标平台:** [Douyin / XHS / Both]
- **预计时长:** [Duration]
- **目标受众:** [Target audience description]
- **内容定位:** [Educational / Entertaining / Emotional / etc.]

## 角色定义 (Character Consistency)
> 角色A: [Detailed character description for generation consistency]
> 角色B (if any): [Description]

## 风格定义 (Style Guide)
- **色调:** [Color tone]
- **光线:** [Lighting style]
- **质感:** [Texture/feel]
- **整体氛围:** [Overall mood]
- **风格关键词 (append to all prompts):** [style keywords]

## 分镜脚本 (Storyboard)

| 镜号 | 场景描述 | 首帧描述 (Image Prompt) | 时长 | 旁白/字幕 | 镜头运动 | 末帧描述 (optional) |
|------|---------|----------------------|------|----------|---------|-------------------|
| 01   | [Scene description in Chinese] | [Detailed English prompt for image generation, including character ref, environment, lighting, camera angle, style keywords] | 3s | [Voiceover or on-screen text] | [Camera movement: 固定/推/拉/摇/etc.] | [If needed for smooth transition] |
| 02   | ... | ... | ... | ... | ... | ... |

## 音乐/配乐建议
- **风格:** [Music style description]
- **节奏:** [BPM range, tempo]
- **情绪:** [Mood]
- **参考:** [Reference song or shared asset name]
- **共享素材检查:** Check `curl http://localhost:3271/api/shared-assets` for available music

## 发布信息

### Douyin
- **标题:** [Platform-optimized title]
- **标签:** #tag1 #tag2 #tag3 #tag4 #tag5
- **文案:** [Post caption]
- **发布时间建议:** [Recommended posting time]

### XHS (if applicable)
- **标题:** [SEO-optimized title with keywords and emoji]
- **正文:** [Post body text]
- **标签:** #tag1 #tag2 ... #tag10
- **话题:** #topic1 #topic2
```

## Output Format: Image-Text (图文)

```markdown
# 内容策划: [Title]

## 基本信息
- **主题:** [Theme]
- **标题:** [Catchy, SEO-friendly title]
- **内容类型:** 图文
- **目标平台:** [XHS / Douyin / Both]
- **图片数量:** [Number of images]
- **目标受众:** [Target audience]
- **内容定位:** [Educational / Review / Tutorial / Lifestyle / etc.]

## 风格指南 (Style Guide)
- **色调:** [Color tone — reference the Color Psychology table]
- **字体风格建议:** [Font style for text overlays]
- **排版风格:** [Layout style — clean/collage/magazine/etc.]
- **风格关键词 (append to all prompts):** [style keywords for consistency]

## 图片结构 (Image Structure)

### 封面图 (Cover Image)
- **内容描述 (Generation Prompt):** [Detailed English prompt — this is the most important image, must be eye-catching]
- **文字叠加:** [Title text to overlay on cover]
- **尺寸:** [3:4 for XHS / 9:16 for Douyin]

### 图片 1
- **内容描述 (Generation Prompt):** [Detailed English prompt]
- **配文:** [Caption text for this image, in Chinese]
- **文字叠加 (if any):** [Text to place on the image]

### 图片 2
- **内容描述 (Generation Prompt):** [Detailed prompt]
- **配文:** [Caption]

### 图片 3-N
[Continue for all images]

## 发布信息

### XHS
- **标题:** [Title with keywords, emoji, max 20 characters recommended]
- **正文:**
  [Full post body text — structured, with line breaks, emoji, and relevant keywords naturally embedded. Should be 300-800 characters for optimal performance.]
- **标签:** #tag1 #tag2 ... #tag10
- **话题:** #topic1 #topic2 #topic3

### Douyin (if applicable)
- **标题:** [Short, punchy title]
- **文案:** [Short caption]
- **标签:** #tag1 #tag2 #tag3 #tag4 #tag5
```

---

## Planning Process

1. **Fetch context:** Read the work details, research report (if research step is done), shared assets, and user memory profile.
2. **Confirm direction:** Briefly summarize the planned content direction and ask the user to confirm before creating the full plan.
3. **Create the plan:** Produce the complete plan in the format above.
4. **Review with user:** Present the plan and ask for feedback. Iterate until confirmed.
5. **Save the plan:** Update the work pipeline status.

```bash
# Fetch work
curl http://localhost:3271/api/works/{workId}

# Check for shared assets (character references, music, etc.)
curl http://localhost:3271/api/shared-assets

# Check user style preferences
curl http://localhost:3271/api/memory/profile

# After plan is confirmed, update pipeline status
curl -X PUT http://localhost:3271/api/works/{workId} \
  -H "Content-Type: application/json" \
  -d '{"pipeline": {"plan": {"status": "done"}}}'
```

## Key Constraints

1. **Scene descriptions MUST be precise enough to serve as direct API prompts** for image generation. Include specific visual details — do not write vague descriptions like "美丽的场景."
2. **All shots in a storyboard MUST share the same style keywords** to ensure visual consistency when generated.
3. **Character descriptions MUST be repeated fully** in each shot where they appear — do not use shorthand references that a generation model cannot resolve.
4. **Durations must be realistic** — 3-5 seconds per shot for short content, up to 10 seconds for complex scenes.
5. **Total duration should match the pacing template** chosen for the content type.
6. **The cover image / first frame is the most important visual** — spend the most effort on its prompt description.
