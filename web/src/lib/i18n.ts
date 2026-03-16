type Language = "en" | "zh";

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Greeting
    greetingLine1: "While you were away,",
    greetingLine2a: "I researched {count} pieces of competitor content and discovered ",
    greetingLine2b: "{insights} new insights",
    greetingLine2c: ".",

    // Config
    researchConfig: "Research Configuration",
    researchInterval: "Research Interval",
    researchIntervalHint: "How often to run automated research cycles",
    aiModel: "AI Model",
    aiModelHint: "AI model for research agents",
    autoResearch: "Auto Research",
    autoResearchHint: "Automatically run research at set intervals",
    startResearch: "Start Research",
    researchingDots: "Researching...",
    researchStarted: "Research started successfully!",
    researchFailed: "Failed to start research.",

    // Config options
    claudeHaikuFast: "Claude Haiku (Fast)",
    claudeSonnetBalanced: "Claude Sonnet (Balanced)",
    claudeOpusCapable: "Claude Opus (Most Capable)",
    minutes15: "Every 15 minutes",
    minutes30: "Every 30 minutes",
    hour1: "Every 1 hour",
    hours2: "Every 2 hours",
    hours4: "Every 4 hours",
    hours8: "Every 8 hours",

    // Common
    saveChanges: "Save Changes",
    saving: "Saving...",
    settingsSaved: "Settings saved successfully.",
    settingsSaveFailed: "Failed to save settings.",
    loading: "Loading...",

    // Gallery
    newWork: "New Work",
    myWorks: "My Works",
    statusPublished: "Published",
    statusDraft: "Draft",

    // Pipeline (new work)
    backToHome: "Back",
    createNewWork: "Create New Work",
    createNewWorkDesc: "AI will auto-produce, publish, and review — you only need to appear on camera when prompted.",
    startGenerate: "Start Generating",
    pauseWork: "Pause",
    resumeWork: "Resume",
    working: "Generating...",
    stepComplete: "Complete",
    stepPending: "Pending",
    stepRunning: "Running",
    stepPaused: "Paused",

    // 6 pipeline steps
    step1_name: "Viral Topic Generation",
    step1_desc: "Analyze viral videos to extract the winning DNA — hooks, pacing, formats",
    step2_name: "Trending Topic Remix",
    step2_desc: "Adapt trending topics into your unique personal style",
    step3_name: "Competitor Differentiation",
    step3_desc: "Discover your unique competitive advantages",
    step4_name: "Script & Storyboard",
    step4_desc: "Generate complete video script with shot-by-shot storyboard",
    step5_name: "Auto Video Production",
    step5_desc: "AI automatically produces the video based on the script",
    step6_name: "Publish & Review",
    step6_desc: "One-click publish and automated performance review",

    // Appearance toggle
    appearOnCamera: "Appear on Camera",
    noAppearance: "No Appearance",
    appearanceHint: "AI will provide detailed script, shot requirements, and instructions for you",
    noAppearanceHint: "AI will generate a fully automated video without you",

    // Competitor URLs
    addCompetitors: "Add Competitors",
    competitorUrlPlaceholder: "Paste competitor profile URL...",
    aiAutoAnalysis: "AI Auto-Analysis",
    maxUrls: "Max 10 URLs",
    addUrl: "Add",
    removeUrl: "Remove",

    // Video preview & publish
    videoPreview: "Video Preview",
    oneClickPublish: "One-Click Publish",
    missingUserFootage: "Missing User Footage",
    uploadFootage: "Upload Your Footage",
    dontWantAppear: "I Don't Want to Appear",
    publishReady: "Assets Complete",
    uploadFootageOptional: "Upload Assets",
    scriptRequirements: "Script & Shot Requirements",
    shotList: "Shot List",
    performanceReview: "Performance Review",

    // Custom direction
    customDirection: "Custom Direction",
    uploadAssets: "Upload Assets",
    customDirectionPlaceholder: "Tell AI what to focus on for this step...",
    saveDirection: "Save",
    regenNoChange: "No changes made — edit any step to regenerate",
    expandSteps: "Expand Steps",
    collapseSteps: "Collapse",
    saveDirections: "Save Changes",
    directionsSaved: "Saved!",

    // Research stats
    researchStats: "Research Overview",
    totalResearched: "Total Content Analyzed",
    insightsGenerated: "Insights Generated",
    worksCreated: "Works Created",
    lastResearchTime: "Last Research",

    // Strategy Results
    strategyResults: "Finished Product",
    resultTitle: "Content Title",
    resultPreview: "Work Preview",
    resultCopy: "Copy & Hashtags",
    resultPublishTime: "Publish Time",
    resultFeedback: "Work Feedback",
    resultFeedbackHint: "Real-time tracking after publish",
    viewReport: "View Report",
    closeReport: "Close",
    reportPreview: "Report Preview",
    selectReportHint: "Click \"View Report\" on the left to preview a report here.",
    regenerate: "Regenerate",
    regenerating: "Regenerating...",
    likesCount: "Likes",
    commentsCount: "Comments",
    newFollowers: "New Followers",
    liveTracking: "Live",
    noFeedbackYet: "Publish this work to start tracking performance data in real-time.",

    // Tabs
    tabWorks: "Works",
    tabExplore: "Explore",
    tabAnalytics: "Analytics",

    // Explore page
    ytTrending: "YouTube Trending",
    ttTrending: "TikTok Trending",
    ytTags: "YouTube Hot Topics",
    ttTags: "TikTok Hot Topics",
    views: "views",
    likes: "likes",
    comments: "comments",
    posts: "posts",

    // Analytics page
    followers: "Followers",
    todayLikes: "Today Likes",
    todayComments: "Today Comments",
    styleKeywords: "Style Profile",
    fanDemographics: "Fan Demographics",
    ageDistribution: "Age Distribution",
    genderSplit: "Gender Split",
    topRegions: "Top Regions",
    latestInsights: "Latest Research Insights",
    male: "Male",
    female: "Female",

    // Research Reports
    researchReports: "Research Reports",
    noResearchReports: "No research reports yet. Start your first research to see results here.",
  },
  zh: {
    // Greeting
    greetingLine1: "在你离开的时候，",
    greetingLine2a: "我帮你调研了 {count} 条竞品内容，发现了",
    greetingLine2b: " {insights} 个新洞察",
    greetingLine2c: "。",

    // Config
    researchConfig: "调研配置",
    researchInterval: "调研频率",
    researchIntervalHint: "自动调研的运行间隔",
    aiModel: "AI 模型",
    aiModelHint: "用于调研的 AI 模型",
    autoResearch: "自动调研",
    autoResearchHint: "按设定间隔自动运行调研",
    startResearch: "开始调研",
    researchingDots: "调研中...",
    researchStarted: "调研已成功启动！",
    researchFailed: "启动调研失败。",

    // Config options
    claudeHaikuFast: "Claude Haiku（快速）",
    claudeSonnetBalanced: "Claude Sonnet（平衡）",
    claudeOpusCapable: "Claude Opus（最强大）",
    minutes15: "每 15 分钟",
    minutes30: "每 30 分钟",
    hour1: "每 1 小时",
    hours2: "每 2 小时",
    hours4: "每 4 小时",
    hours8: "每 8 小时",

    // Common
    saveChanges: "保存更改",
    saving: "保存中...",
    settingsSaved: "设置保存成功。",
    settingsSaveFailed: "保存设置失败。",
    loading: "加载中...",

    // Gallery
    newWork: "新作品",
    myWorks: "我的作品",
    statusPublished: "已发布",
    statusDraft: "未发布",

    // Pipeline (new work)
    backToHome: "返回",
    createNewWork: "创建新作品",
    createNewWorkDesc: "AI 将自动完成制作、发布与复盘 — 需要出镜时会给出详细脚本，你照做即可。",
    startGenerate: "开始生成",
    pauseWork: "暂停",
    resumeWork: "继续",
    working: "生成中...",
    stepComplete: "已完成",
    stepPending: "等待中",
    stepRunning: "执行中",
    stepPaused: "已暂停",

    // 6 pipeline steps
    step1_name: "爆款选题生成",
    step1_desc: "分析爆款视频提取成功 DNA — 钩子、节奏、格式",
    step2_name: "热点个性化改编",
    step2_desc: "将热点改编成符合个人风格的内容",
    step3_name: "竞品差异化洞察",
    step3_desc: "找出你独特的竞争优势",
    step4_name: "脚本与分镜",
    step4_desc: "生成完整视频脚本与逐镜头分镜",
    step5_name: "视频自动制作",
    step5_desc: "AI 根据脚本自动生成视频",
    step6_name: "发布与复盘",
    step6_desc: "一键发布并自动追踪数据表现",

    // Appearance toggle
    appearOnCamera: "需要出镜",
    noAppearance: "无需出镜",
    appearanceHint: "AI 会给出详细的台词脚本、镜头要求和细节指导，你照做即可",
    noAppearanceHint: "AI 将生成完全自动化的视频，无需你出镜",

    // Competitor URLs
    addCompetitors: "自定义竞品",
    competitorUrlPlaceholder: "粘贴竞争对手主页 URL...",
    aiAutoAnalysis: "AI 自动分析",
    maxUrls: "最多 10 个",
    addUrl: "添加",
    removeUrl: "移除",

    // Video preview & publish
    videoPreview: "视频预览",
    oneClickPublish: "一键发布",
    missingUserFootage: "缺少用户素材",
    uploadFootage: "上传你的素材",
    dontWantAppear: "我不想出镜",
    publishReady: "素材完整",
    uploadFootageOptional: "上传素材",
    scriptRequirements: "脚本与镜头要求",
    shotList: "镜头清单",
    performanceReview: "数据复盘",

    // Custom direction
    customDirection: "自定义方向",
    uploadAssets: "上传素材",
    customDirectionPlaceholder: "告诉 AI 这一步要重点关注什么...",
    saveDirection: "保存",
    regenNoChange: "内容没有变化 — 修改任意步骤后可重新生成",
    expandSteps: "展开步骤",
    collapseSteps: "收起",
    saveDirections: "保存更改",
    directionsSaved: "已保存！",

    // Research stats
    researchStats: "调研概览",
    totalResearched: "累计分析内容",
    insightsGenerated: "生成洞察",
    worksCreated: "已创作品",
    lastResearchTime: "上次调研",

    // Strategy Results
    strategyResults: "成品展示",
    resultTitle: "内容标题",
    resultPreview: "作品预览",
    resultCopy: "文案内容",
    resultPublishTime: "发布时间",
    resultFeedback: "作品反馈",
    resultFeedbackHint: "发布后实时追踪",
    viewReport: "查看报告",
    closeReport: "关闭",
    reportPreview: "报告预览",
    selectReportHint: "点击左侧的「查看报告」来预览调研报告。",
    regenerate: "重新生成",
    regenerating: "生成中...",
    likesCount: "点赞",
    commentsCount: "评论",
    newFollowers: "新增粉丝",
    liveTracking: "实时",
    noFeedbackYet: "发布作品后将开始实时追踪数据表现。",

    // Tabs
    tabWorks: "作品",
    tabExplore: "探索",
    tabAnalytics: "分析",

    // Explore page
    ytTrending: "抖音热门视频",
    ttTrending: "小红书热门视频",
    ytTags: "抖音热门话题",
    ttTags: "小红书热门话题",
    views: "播放",
    likes: "点赞",
    comments: "评论",
    posts: "内容",

    // Analytics page
    followers: "粉丝",
    todayLikes: "今日点赞",
    todayComments: "今日评论",
    styleKeywords: "风格画像",
    fanDemographics: "粉丝画像",
    ageDistribution: "年龄分布",
    genderSplit: "性别比例",
    topRegions: "地区分布",
    latestInsights: "最新调研洞察",
    male: "男",
    female: "女",

    // Research Reports
    researchReports: "调研报告",
    noResearchReports: "暂无调研报告。启动首次调研后结果将在此显示。",
  },
};

let currentLanguage: Language = "en";
let listeners: Set<() => void> = new Set();

export function getLanguage(): Language {
  return currentLanguage;
}

export function setLanguage(lang: Language) {
  currentLanguage = lang;
  localStorage.setItem("autocode-lang", lang);
  listeners.forEach((fn) => fn());
}

export function t(key: string): string {
  return translations[currentLanguage][key] ?? key;
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Initialize from localStorage
if (typeof localStorage !== "undefined") {
  const saved = localStorage.getItem("autocode-lang") as Language | null;
  if (saved === "en" || saved === "zh") {
    currentLanguage = saved;
  }
}
