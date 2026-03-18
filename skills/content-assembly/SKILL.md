---
name: content-assembly
description: Assemble generated assets into final publishable content using ffmpeg for video editing and image composition. Use this skill whenever the user wants to combine clips, edit video, add subtitles, add music, create the final output, assemble content, or when the pipeline step is "assembly". Handles video concatenation, transitions, subtitle overlay, music mixing, and publish-ready text generation.
---

# Content Assembly Skill

You are an expert video editor and content assembler specializing in short-form social media content for Douyin (抖音) and Xiaohongshu (小红书). Your job is to take generated assets (video clips, images) and assemble them into a polished, platform-ready final output using ffmpeg.

## Setup: Gather Context

```bash
# 1. Get work details (includes storyboard/plan in pipeline data)
curl http://localhost:3271/api/works/{workId}

# 2. List all generated assets
curl http://localhost:3271/api/works/{workId}/assets

# 3. Check shared assets for music, fonts, watermarks
curl http://localhost:3271/api/shared-assets
```

Identify:
- All video clips in `clips/` directory
- All frame images in `frames/` directory
- All content images in `images/` directory
- Available music files in shared assets
- The storyboard/plan from the previous pipeline step

---

## Workflow: Short Video Assembly (短视频剪辑)

### Phase 1: Propose Editing Plan

Before executing any ffmpeg commands, present the editing plan to the user:

```markdown
## 剪辑方案

### 片段顺序
1. clip-01.mp4 (3s) — 开场/Hook
2. clip-02.mp4 (5s) — 主体内容
3. clip-03.mp4 (5s) — 发展
4. clip-04.mp4 (3s) — 高潮
5. clip-05.mp4 (3s) — 结尾/CTA

### 转场效果
- 片段 1→2: fade (0.5s)
- 片段 2→3: dissolve (0.3s)
- 片段 3→4: cut (直切)
- 片段 4→5: fade (0.5s)

### 字幕时间线
| 时间 | 字幕内容 | 样式 |
|------|---------|------|
| 00:00-00:03 | "你知道吗？" | 大号居中，白色描边 |
| 00:03-00:08 | "这个方法..." | 标准居中 |
| ... | ... | ... |

### 配乐
- 音乐: [shared asset name or description]
- 音量: 背景音乐 30%, 人声/旁白 100%
- 淡入: 0-1s
- 淡出: 最后2s

### 输出规格
- 分辨率: 1080×1920 (9:16)
- 编码: H.264
- 帧率: 30fps
- 预计总时长: ~25s

确认此方案？
```

Wait for user confirmation before proceeding.

### Phase 2: Execute Assembly

#### Step 1: Normalize All Clips

Ensure all clips have the same resolution, frame rate, and codec before concatenation:

```bash
# Get the asset directory path
WORK_DIR=$(curl -s http://localhost:3271/api/works/{workId} | python3 -c "import sys,json; print(json.load(sys.stdin).get('path',''))")

# Normalize each clip to consistent specs
ffmpeg -i clip-01.mp4 -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black" -r 30 -c:v libx264 -preset medium -crf 23 -c:a aac -ar 44100 -y norm-01.mp4
```

Do this for each clip. Key normalization parameters:
- Resolution: `scale=1080:1920` with padding to maintain aspect ratio
- Frame rate: `-r 30`
- Codec: `-c:v libx264 -preset medium -crf 23`
- Audio: `-c:a aac -ar 44100`

#### Step 2: Concatenate Clips

**Method A: Simple concatenation (no transitions)**
```bash
# Create concat list
cat > concat-list.txt << 'EOF'
file 'norm-01.mp4'
file 'norm-02.mp4'
file 'norm-03.mp4'
file 'norm-04.mp4'
file 'norm-05.mp4'
EOF

# Concatenate
ffmpeg -f concat -safe 0 -i concat-list.txt -c copy -y concat.mp4
```

**Method B: With transitions (use xfade filter)**

For 2 clips with a fade transition:
```bash
ffmpeg -i norm-01.mp4 -i norm-02.mp4 \
  -filter_complex "[0:v][1:v]xfade=transition=fade:duration=0.5:offset=2.5[v]" \
  -map "[v]" -c:v libx264 -preset medium -crf 23 -y merged-01-02.mp4
```

For chaining multiple clips with transitions, build incrementally:
```bash
# Merge clips 1+2
ffmpeg -i norm-01.mp4 -i norm-02.mp4 \
  -filter_complex "[0:v][1:v]xfade=transition=fade:duration=0.5:offset=2.5[v]" \
  -map "[v]" -c:v libx264 -crf 23 -y temp-12.mp4

# Merge (1+2)+3
ffmpeg -i temp-12.mp4 -i norm-03.mp4 \
  -filter_complex "[0:v][1:v]xfade=transition=dissolve:duration=0.3:offset=7.0[v]" \
  -map "[v]" -c:v libx264 -crf 23 -y temp-123.mp4

# Continue chaining...
```

**The offset value** = total duration of previous merged video minus the transition duration. Calculate carefully:
- offset = (sum of all previous clip durations) - (sum of all previous transition durations) - (current transition duration)

#### Step 3: Add Subtitles

**Method A: drawtext filter (simple, no external files needed)**

```bash
ffmpeg -i concat.mp4 \
  -vf "drawtext=text='你知道吗？':enable='between(t,0,3)':fontsize=56:fontcolor=white:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h*0.82:fontfile=/System/Library/Fonts/PingFang.ttc, \
       drawtext=text='这个方法改变了一切':enable='between(t,3,8)':fontsize=48:fontcolor=white:borderw=2:bordercolor=black:x=(w-text_w)/2:y=h*0.82:fontfile=/System/Library/Fonts/PingFang.ttc" \
  -c:v libx264 -preset medium -crf 23 -c:a copy -y subtitled.mp4
```

**Key drawtext parameters:**
- `text`: The subtitle text (must be properly escaped)
- `enable='between(t,START,END)'`: Show text only during this time range
- `fontsize`: Size in pixels (48-64 for mobile-optimized subtitles)
- `fontcolor`: Text color (white is standard for social media)
- `borderw` + `bordercolor`: Text outline for readability
- `x=(w-text_w)/2`: Horizontally centered
- `y=h*0.82`: Positioned at ~82% from top (lower third area, above platform UI)
- `fontfile`: Path to a Chinese-capable font

**macOS Chinese fonts:**
- `/System/Library/Fonts/PingFang.ttc` — PingFang SC (clean, modern)
- `/System/Library/Fonts/STHeiti Medium.ttc` — Heiti (bold, impactful)
- `/System/Library/Fonts/Hiragino Sans GB.ttc` — Hiragino Sans

**Method B: ASS subtitles (complex styling)**

For more advanced subtitle styling (multiple colors, animations, karaoke effects), create an ASS file:

```bash
cat > subs.ass << 'ASSEOF'
[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,OutlineColour,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV
Style: Default,PingFang SC,56,&H00FFFFFF,&H00000000,1,3,0,2,20,20,340
Style: Highlight,PingFang SC,64,&H0000FFFF,&H00000000,1,4,0,2,20,20,340

[Events]
Format: Layer,Start,End,Style,Text
Dialogue: 0,0:00:00.00,0:00:03.00,Highlight,你知道吗？
Dialogue: 0,0:00:03.00,0:00:08.00,Default,这个方法改变了一切
ASSEOF

ffmpeg -i concat.mp4 -vf "ass=subs.ass" -c:v libx264 -crf 23 -c:a copy -y subtitled.mp4
```

#### Step 4: Add Background Music

```bash
# Simple music overlay with volume control
ffmpeg -i subtitled.mp4 -i music.mp3 \
  -filter_complex "[1:a]volume=0.3,afade=t=in:st=0:d=1,afade=t=out:st=22:d=2[music];[0:a][music]amix=inputs=2:duration=first[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -y final.mp4
```

**If the input video has no audio track:**
```bash
ffmpeg -i subtitled.mp4 -i music.mp3 \
  -filter_complex "[1:a]volume=0.3,afade=t=in:st=0:d=1,afade=t=out:st=22:d=2[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -shortest -y final.mp4
```

**Music volume guidelines:**
- Background music only: `volume=0.3` to `volume=0.5`
- Music with voiceover: `volume=0.15` to `volume=0.25`
- Music as main audio: `volume=0.7` to `volume=1.0`
- Fade in: 1-2 seconds
- Fade out: 2-3 seconds at the end

#### Step 5: Final Output

```bash
# Move to output directory
mkdir -p output/
cp final.mp4 output/final.mp4
```

---

## Workflow: Image-Text Assembly (图文排版)

### Phase 1: Propose Layout

```markdown
## 图文排版方案

### 图片顺序
1. cover.png — 封面图 (3:4)
2. image-01.png — [description]
3. image-02.png — [description]
4. image-03.png — [description]

### 封面处理
- 添加标题文字叠加
- 色调统一调整

### 输出
- 所有图片复制到 output/ 目录
- 生成 publish-text.md

确认此方案？
```

### Phase 2: Execute

#### Optional: Add Text Overlays to Images

```bash
# Add title text to cover image
ffmpeg -i cover.png \
  -vf "drawtext=text='10个提升生活品质的好物':fontsize=72:fontcolor=white:borderw=4:bordercolor=black@0.6:x=(w-text_w)/2:y=h*0.75:fontfile=/System/Library/Fonts/PingFang.ttc" \
  -y output/cover.png
```

#### Optional: Create Image Collage

```bash
# 2×2 collage from 4 images
ffmpeg -i img1.png -i img2.png -i img3.png -i img4.png \
  -filter_complex "[0:v]scale=540:720[a];[1:v]scale=540:720[b];[2:v]scale=540:720[c];[3:v]scale=540:720[d];[a][b]hstack[top];[c][d]hstack[bottom];[top][bottom]vstack[out]" \
  -map "[out]" -y collage.png
```

#### Copy Final Images

```bash
mkdir -p output/
cp images/cover.png output/
cp images/image-01.png output/
cp images/image-02.png output/
# ... etc
```

---

## Publish Text Generation

After assembly, generate `output/publish-text.md`:

### For Douyin:
```markdown
# 发布文案 — 抖音

## 标题
[Short, catchy title — max 55 characters]

## 文案
[Caption text with line breaks, emoji if appropriate]

## 标签
#tag1 #tag2 #tag3 #tag4 #tag5

## 发布建议
- 最佳发布时间: [specific time]
- 封面选择: 使用视频第X秒画面 或 自定义封面
- 合集/系列: [if applicable]
```

### For XHS:
```markdown
# 发布文案 — 小红书

## 标题
[SEO-optimized title with emoji — max 20 characters]

## 正文
[Full post body — 300-800 characters, structured with line breaks, subtitles, and emoji. Include keywords naturally. End with a question or CTA to drive comments.]

## 标签
#tag1 #tag2 #tag3 #tag4 #tag5 #tag6 #tag7 #tag8

## 话题
#topic1 #topic2 #topic3

## 发布建议
- 最佳发布时间: [specific time]
- 封面图: output/cover.png
```

Write this file:
```bash
cat > output/publish-text.md << 'EOF'
[generated content here]
EOF
```

---

## ffmpeg Quick Reference

### Common Operations

**Get video info:**
```bash
ffmpeg -i input.mp4 2>&1 | grep -E "Duration|Stream"
```

**Trim video:**
```bash
ffmpeg -i input.mp4 -ss 00:00:02 -to 00:00:08 -c copy -y trimmed.mp4
```

**Change speed:**
```bash
# 2x speed
ffmpeg -i input.mp4 -filter_complex "[0:v]setpts=0.5*PTS[v];[0:a]atempo=2.0[a]" -map "[v]" -map "[a]" -y fast.mp4
# 0.5x speed (slow motion)
ffmpeg -i input.mp4 -filter_complex "[0:v]setpts=2.0*PTS[v];[0:a]atempo=0.5[a]" -map "[v]" -map "[a]" -y slow.mp4
```

**Add watermark:**
```bash
ffmpeg -i input.mp4 -i watermark.png \
  -filter_complex "[1:v]scale=100:-1,format=rgba,colorchannelmixer=aa=0.5[wm];[0:v][wm]overlay=W-w-20:20[v]" \
  -map "[v]" -map 0:a -c:v libx264 -crf 23 -c:a copy -y watermarked.mp4
```

**Extract frame as image:**
```bash
ffmpeg -i input.mp4 -ss 00:00:03 -frames:v 1 -y frame.png
```

**Convert image sequence to video:**
```bash
ffmpeg -framerate 1 -i image-%02d.png -c:v libx264 -r 30 -pix_fmt yuv420p -y slideshow.mp4
```

**Resize/crop for platform:**
```bash
# Crop center for 9:16 from 16:9 source
ffmpeg -i input.mp4 -vf "crop=ih*9/16:ih:(iw-ih*9/16)/2:0" -c:v libx264 -crf 23 -y vertical.mp4
```

### Transition Effects Reference

Available xfade transitions:
| Transition | Effect | Best For |
|-----------|--------|----------|
| `fade` | Gradual opacity crossfade | Universal, smooth |
| `dissolve` | Pixel-level dissolve | Dreamy, soft transitions |
| `wipeleft` | Left-to-right wipe | Energetic, sequential |
| `wiperight` | Right-to-left wipe | Reverse reveal |
| `wipeup` | Bottom-to-top wipe | Uplifting, progressive |
| `wipedown` | Top-to-bottom wipe | Dramatic reveal |
| `slideleft` | Slide new clip in from right | Dynamic, modern |
| `slideright` | Slide new clip in from left | Dynamic, modern |
| `smoothleft` | Smooth left slide | Polished |
| `smoothright` | Smooth right slide | Polished |
| `circlecrop` | Circular reveal | Creative, attention-grabbing |
| `rectcrop` | Rectangular reveal | Clean, professional |
| `distance` | Zoom-out reveal | Dramatic |
| `fadeblack` | Fade through black | Scene change, time skip |
| `fadewhite` | Fade through white | Dreamy, flashback |
| `radial` | Radial wipe | Dynamic, energetic |
| `smoothup` | Smooth upward slide | Progressive, uplifting |
| `smoothdown` | Smooth downward slide | Settling, conclusive |

**Transition duration guidelines:**
- Fast-paced content (Douyin hooks): 0.2-0.3s
- Standard content: 0.3-0.5s
- Slow, cinematic content: 0.5-1.0s
- Direct cut (no transition): 0s — use for impact moments

### Video Encoding Best Practices

**For Douyin upload:**
```bash
-c:v libx264 -preset medium -crf 20 -profile:v high -level 4.1 -pix_fmt yuv420p -r 30 -c:a aac -b:a 128k -ar 44100
```

**For XHS upload:**
```bash
-c:v libx264 -preset medium -crf 22 -profile:v high -pix_fmt yuv420p -r 30 -c:a aac -b:a 128k -ar 44100
```

**CRF guidelines:**
- CRF 18-20: High quality, larger file (~10-15MB per minute at 1080p)
- CRF 22-23: Good quality, balanced size (~5-8MB per minute)
- CRF 25-28: Acceptable quality, small file (~3-5MB per minute)

**Platform max file sizes:**
- Douyin: 4GB (but recommend under 50MB for fast upload)
- XHS: 1GB for video, 20MB per image

### Subtitle Styling for Social Media

**Recommended subtitle specs:**
- Font size: 48-64px for 1080p vertical video
- Color: White (#FFFFFF) with black outline (borderw=2-4)
- Position: 75-85% from top (above platform UI elements)
- Shadow: Optional, `shadowx=2:shadowy=2:shadowcolor=black@0.5`
- Max characters per line: 15-18 Chinese characters
- Line break: Use `\n` in drawtext or multi-line ASS dialogue

**Two-line subtitle:**
```bash
drawtext=text='第一行内容\n第二行内容':...
```

### Music Mixing Cheat Sheet

**Volume levels (0.0 to 1.0):**
- Dialogue/voiceover: 1.0
- Background music during speech: 0.15-0.25
- Background music (no speech): 0.3-0.5
- Sound effects: 0.4-0.7
- Intro/outro music: 0.5-0.8

**Audio ducking (auto-lower music when speech is detected):**
```bash
ffmpeg -i video_with_voice.mp4 -i music.mp3 \
  -filter_complex "[0:a]asplit=2[voice][sc];[sc]sidechaincompress=threshold=0.02:ratio=6:attack=200:release=1000[compressed];[1:a]volume=0.4[music];[voice][music][compressed]amix=inputs=3:duration=first[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -y output.mp4
```

**Crossfade between two audio tracks:**
```bash
ffmpeg -i audio1.mp3 -i audio2.mp3 \
  -filter_complex "acrossfade=d=3:c1=tri:c2=tri" \
  -y crossfaded.mp3
```

---

## Platform Output Specifications

### Douyin (抖音)
- **Video:** 9:16 (1080×1920), H.264, 30fps, max 15min (recommended <60s)
- **Cover:** Can be extracted from video or custom image
- **Title:** Max 55 characters
- **Caption:** Max 5000 characters (but short is better)
- **Hashtags:** 5-7 recommended
- **Music:** Can add from Douyin library after upload (or embed in video)

### Xiaohongshu (小红书)
- **Video:** 9:16 or 3:4, H.264, max 15min (recommended <5min)
- **Images:** 3:4 (1080×1440) preferred, 1-18 images per post, minimum 1080px wide
- **Title:** Max 20 characters (with emoji recommended)
- **Body:** Max 1000 characters (300-800 recommended)
- **Hashtags:** 5-10 in body text
- **Topics:** 3-5 official topic tags

---

## Error Handling

### Common ffmpeg Errors

**"No such file or directory":**
- Check file paths — use absolute paths when possible
- Verify assets were generated: `curl http://localhost:3271/api/works/{workId}/assets`

**"Invalid data found when processing input":**
- File may be corrupted or incomplete
- Try re-downloading: `curl -o clip.mp4 http://localhost:3271/api/works/{workId}/assets/clips/clip-01.mp4`

**"Cannot find a matching stream":**
- Audio/video stream mismatch
- Add `-an` to strip audio, or use `-c:a aac` to encode audio

**"Filter complex... error":**
- Usually a typo in filter syntax
- Test each filter step individually before combining

**Subtitles not showing:**
- Font file path may be wrong — verify with `ls /System/Library/Fonts/`
- Special characters in text need escaping: `:` → `\:`, `'` → `'\''`

---

## Completion

After assembly is done:

1. Present the final output summary:
```
## 成品输出

### 视频
- output/final.mp4 (25s, 1080×1920, 12MB)
- 预览: http://localhost:3271/api/works/{workId}/assets/output/final.mp4

### 发布文案
- output/publish-text.md

### 下一步
1. 预览视频确认效果
2. 根据 publish-text.md 中的建议时间发布
3. 发布后关注前30分钟的数据表现
```

2. Update pipeline status:
```bash
curl -X PUT http://localhost:3271/api/works/{workId} \
  -H "Content-Type: application/json" \
  -d '{"pipeline": {"assembly": {"status": "done"}}}'
```
