/**
 * 审美 Skill 库 —— 每套审美源自真实一线产品的公开设计语言
 * 参考开源项目：VoltAgent/awesome-design-md（MIT，73+ 品牌 DESIGN.md）
 * 不是凭空发明的"AI 味"风格，而是 Stripe 的金融靛蓝、Claude 的暖陶编辑、
 * Linear 的深空秩序……每个 Theme 都是一套可注入生成器的完整 token。
 */

export interface Theme {
  id: string;
  name: string;
  tagline: string;
  /** 灵感来源（开源品牌规范） */
  inspiredBy: string;
  /** 文本匹配关键词：品牌名、气质描述都能命中 */
  keywords: string[];
  dark: boolean;
  /** 页面底色 */
  bg: string;
  /** 页面渐变（可选，优先于 bg） */
  gradFrom?: string;
  gradTo?: string;
  /** 卡片/面板底色 */
  surface: string;
  surfaceBorder: string;
  /** 文字 */
  text: string;
  subtext: string;
  /** 品牌强调色对 */
  accent: string;
  accent2: string;
  /** 圆角气质 */
  radius: number;
  /** 大标题气质：字重与字距（细字重+负字距 = 编辑感，粗字重 = 广告感） */
  displayWeight?: number;
  displayTracking?: number;
  /** Hero 视觉语言：orb=3D光影球体（img2threejs/Spline 气质） image=产品摄影（Apple 气质） none=纯排版留白 */
  hero?: "orb" | "image" | "none";
  methodology?: ThemeMethodology;
}

export interface ThemeMethodology {
  mood: string;
  palette: string;
  typography: string;
  composition: string;
  components: string;
  imagery: string;
  motion: string;
  antiPatterns: string;
  finishing: string;
}

/** Stripe 式金融靛蓝：电光靛主色 + 深海军墨字 + 近白纸面 */
export const FINTECH_INDIGO: Theme = {
  id: "fintech-indigo",
  name: "金融靛蓝",
  tagline: "电光靛主色 × 深海军墨字，金融基建的可信感",
  inspiredBy: "Stripe（awesome-design-md）",
  keywords: ["stripe", "金融", "支付", "靛蓝", "商务", "专业", "可信", "fintech"],
  dark: false,
  bg: "#f6f9fc",
  surface: "#ffffff",
  surfaceBorder: "#e3e8ee",
  text: "#0d253d",
  subtext: "#64748d",
  accent: "#533afd",
  accent2: "#ea2261",
  radius: 8,
  displayWeight: 500,
  displayTracking: -1,
  hero: "image",
};

/** Claude 式暖陶编辑：陶土橘 × 米白纸面 × 衬线气质 */
export const WARM_EDITORIAL: Theme = {
  id: "warm-editorial",
  name: "暖陶编辑",
  tagline: "陶土橘 × 米白纸面，人文温度的编辑排版",
  inspiredBy: "Claude（awesome-design-md）",
  keywords: ["claude", "暖", "陶", "米", "编辑", "人文", "文艺", "温柔", "纸"],
  dark: false,
  bg: "#faf9f5",
  surface: "#ffffff",
  surfaceBorder: "#e6dfd8",
  text: "#141413",
  subtext: "#6c6a64",
  accent: "#cc785c",
  accent2: "#5db8a6",
  radius: 12,
  displayWeight: 500,
  displayTracking: -0.5,
  hero: "none",
};

/** Linear 式深空秩序：近黑底 × 雾紫字 × 靛紫点缀 */
export const DEEP_SPACE: Theme = {
  id: "deep-space",
  name: "深空秩序",
  tagline: "近黑底 × 雾紫灰字，工程师的克制与秩序",
  inspiredBy: "Linear（awesome-design-md）",
  keywords: ["linear", "深", "暗", "黑", "秩序", "极客", "开发", "工具", "深色"],
  dark: true,
  bg: "#08090a",
  surface: "#101012",
  surfaceBorder: "#26282b",
  text: "#f7f8f8",
  subtext: "#8a8f98",
  accent: "#5e6ad2",
  accent2: "#9f7df0",
  radius: 8,
  displayWeight: 600,
  displayTracking: -0.5,
  hero: "image",
};

/** Vercel 式黑白锐利：纯白 × 纯黑 × 几何直角 */
export const MONO_SHARP: Theme = {
  id: "mono-sharp",
  name: "黑白锐利",
  tagline: "纯白 × 纯黑 × 发丝线，零装饰的锐利几何",
  inspiredBy: "Vercel（awesome-design-md）",
  keywords: ["vercel", "黑白", "极简", "锐利", "单色", "现代", "mono"],
  dark: false,
  bg: "#ffffff",
  surface: "#fafafa",
  surfaceBorder: "#eaeaea",
  text: "#171717",
  subtext: "#666666",
  accent: "#000000",
  accent2: "#333333",
  radius: 4,
  displayWeight: 700,
  displayTracking: -1,
  hero: "none",
};

/** Notion 式紫罗兰笔记：真品牌 token（堇紫主色 + 活力橘 + 粉彩卡片） */
export const PAPER_INK: Theme = {
  id: "paper-ink",
  name: "紫罗兰笔记",
  tagline: "堇紫主色 × 粉彩卡片，知识库的亲和与条理",
  inspiredBy: "Notion（awesome-design-md）",
  keywords: ["notion", "笔记", "文档", "知识", "堇紫", "手账"],
  dark: false,
  bg: "#ffffff",
  surface: "#f7f6f3",
  surfaceBorder: "#e9e8e5",
  text: "#37352f",
  subtext: "#787774",
  accent: "#5645d4",
  accent2: "#dd5b00",
  radius: 8,
  displayWeight: 700,
  displayTracking: 0,
  hero: "none",
};

/** Airbnb 式珊瑚好客：玫珊瑚主色 × 纯白底 × 圆润亲和 */
export const CORAL_HOSPITALITY: Theme = {
  id: "coral-hospitality",
  name: "珊瑚好客",
  tagline: "玫珊瑚 × 纯白底，旅行平台的热情与亲和",
  inspiredBy: "Airbnb（awesome-design-md）",
  keywords: ["airbnb", "珊瑚", "旅行", "民宿", "热情", "红", "好客"],
  dark: false,
  bg: "#ffffff",
  surface: "#ffffff",
  surfaceBorder: "#dddddd",
  text: "#222222",
  subtext: "#6a6a6a",
  accent: "#ff385c",
  accent2: "#460479",
  radius: 12,
  displayWeight: 700,
  displayTracking: 0,
  hero: "image",
};

/** Figma 式糖果拼贴：黑白骨架 × 柠檬绿/丁香紫粉彩色块 */
export const CANDY_PLAYGROUND: Theme = {
  id: "candy-playground",
  name: "糖果拼贴",
  tagline: "黑白骨架 × 柠檬绿丁香紫粉彩色块，创意工具的玩心",
  inspiredBy: "Figma（awesome-design-md）",
  keywords: ["figma", "糖果", "粉彩", "活泼", "创意", "玩心", "拼接"],
  dark: false,
  bg: "#ffffff",
  surface: "#f7f7f5",
  surfaceBorder: "#e6e6e6",
  text: "#000000",
  subtext: "#666666",
  accent: "#ff3d8b",
  accent2: "#c5b0f4",
  radius: 16,
  displayWeight: 400,
  displayTracking: -1.5,
  hero: "image",
};

/** Apple 式银灰极简：雾灰纸面 × 墨黑 × 科技蓝点缀 */
export const SILVER_CALM: Theme = {
  id: "silver-calm",
  name: "银灰极简",
  tagline: "雾灰纸面 × 墨黑层级，产品发布会式的冷静",
  inspiredBy: "Apple（awesome-design-md）",
  keywords: ["apple", "苹果", "极简", "银", "发布会", "科技", "冷静"],
  dark: false,
  bg: "#f5f5f7",
  surface: "#ffffff",
  surfaceBorder: "#e0e0e0",
  text: "#1d1d1f",
  subtext: "#7a7a7a",
  accent: "#0066cc",
  accent2: "#1d1d1f",
  radius: 16,
  displayWeight: 600,
  displayTracking: -0.5,
  hero: "image",
};

/** Spotify 式暗夜律动：近黑底 × 荧光绿单一强调 × 胶囊几何 */
export const MIDNIGHT_BEAT: Theme = {
  id: "midnight-beat",
  name: "暗夜律动",
  tagline: "近黑底 × 荧光绿单一强调，音乐播放器的沉浸",
  inspiredBy: "Spotify（awesome-design-md）",
  keywords: ["spotify", "音乐", "绿", "夜", "沉浸", "播放器", "律动"],
  dark: true,
  bg: "#121212",
  surface: "#181818",
  surfaceBorder: "#282828",
  text: "#ffffff",
  subtext: "#b3b3b3",
  accent: "#1ed760",
  accent2: "#539df5",
  radius: 12,
  displayWeight: 700,
  displayTracking: 0,
  hero: "image",
};

/** 莫兰迪低饱和：灰调雾色 × 大圆角 × 安静呼吸 */
export const MORANDI_SOFT: Theme = {
  id: "morandi-soft",
  name: "莫兰迪雾感",
  tagline: "低饱和灰调雾色，安静松弛的呼吸感",
  inspiredBy: "Morandi 色卡社区实践",
  keywords: ["莫兰迪", "雾", "低饱和", "高级灰", "松弛", "安静", "柔和"],
  dark: false,
  bg: "#f2f0ec",
  surface: "#fbfaf8",
  surfaceBorder: "#dfdcd5",
  text: "#3f3d39",
  subtext: "#8c897f",
  accent: "#a8977f",
  accent2: "#8fa39b",
  radius: 20,
  displayWeight: 500,
  displayTracking: 0,
  hero: "none",
};

/** Tesla 式极致留白：纯白 × 单一电光蓝 × 零装饰 */
export const PURE_SHOWROOM: Theme = {
  id: "pure-showroom",
  name: "极致留白",
  tagline: "纯白展厅 × 单一电光蓝，摄影扛下所有情绪",
  inspiredBy: "Tesla（awesome-design-md）",
  keywords: ["tesla", "特斯拉", "留白", "展厅", "汽车", "克制", "纯净"],
  dark: false,
  bg: "#ffffff",
  surface: "#f4f4f4",
  surfaceBorder: "#e5e5e5",
  text: "#171a20",
  subtext: "#5c5e62",
  accent: "#3e6ae1",
  accent2: "#171a20",
  radius: 6,
  displayWeight: 500,
  displayTracking: 0,
  hero: "image",
};

/** 3D 律动：程序化光影球体 × 深空底，img2threejs / Spline 式的产品级 3D 气质 */
export const DIMENSION_ORB: Theme = {
  id: "dimension-orb",
  name: "3D 律动",
  tagline: "深空底 × 程序化光影球体，产品级 3D 的悬浮感",
  inspiredBy: "img2threejs / Spline 社区实践",
  keywords: ["3d", "三维", "立体", "光影", "spline", "悬浮", "球体", "空间"],
  dark: true,
  bg: "#0a0a0f",
  gradFrom: "#141420",
  gradTo: "#0a0a0f",
  surface: "#14141c",
  surfaceBorder: "#26263a",
  text: "#f4f4f8",
  subtext: "#8b8b9e",
  accent: "#7c6cff",
  accent2: "#33d6c8",
  radius: 16,
  displayWeight: 600,
  displayTracking: -0.5,
  hero: "orb",
};

const THEME_METHODOLOGIES: Record<string, ThemeMethodology> = {
  "fintech-indigo": {
    mood: "精密、可信、速度感；像金融基础设施而非消费金融广告",
    palette: "近白冷底承载大面积信息，电光靛只用于关键路径，洋红仅作数据异常或高价值提示",
    typography: "中等字重的大标题配紧凑字距，数字使用等宽感并强化小数点和单位层级",
    composition: "采用斜向节奏、错位产品截图和细密基线网格，避免平均三栏",
    components: "卡片低圆角、细边框、弱阴影；表格和指标块优先，CTA 短而确定",
    imagery: "使用真实产品界面、支付终端或抽象网络摄影，裁切需显示可检查的主体",
    motion: "数据沿路径轻扫、数字递增、截图分层进入，时长 180-320ms",
    antiPatterns: "禁止大面积紫渐变、漂浮玻璃卡、硬币插画和泛滥的安全盾牌图标",
    finishing: "检查金额对齐、状态色语义、表格密度和主操作唯一性",
  },
  "warm-editorial": {
    mood: "温暖、聪慧、有作者感；像一本经过编辑的当代文化杂志",
    palette: "纸张米白为主，陶土色落在标题或关键批注，青绿只做冷暖平衡",
    typography: "标题可用衬线气质与较松行距，正文控制窄栏并保留明显段落呼吸",
    composition: "非对称双栏、边注、引文和跨栏图片形成编辑节奏，不做居中 SaaS Hero",
    components: "控件像出版物批注，卡片弱化边界，以排版和细线组织信息",
    imagery: "偏自然光、真实材质和人物工作状态，保留颗粒与环境上下文",
    motion: "段落淡入、图片缓慢揭示，避免弹跳和发光效果",
    antiPatterns: "禁止高饱和霓虹、密集胶囊、巨型圆角卡和无意义插画图标",
    finishing: "检查孤行、行长、基线、图片题注与正文阅读顺序",
  },
  "deep-space": {
    mood: "克制、专注、工程秩序；深色不是炫技而是降低长时工作负担",
    palette: "近黑分层必须可辨，雾紫只标记当前状态，亮色面积严格受控",
    typography: "紧凑无衬线、清晰数字和代码层级，标题不追求夸张尺寸",
    composition: "高密度工作台、连续分隔线和稳定侧栏，主内容保持单一焦点",
    components: "8px 内圆角、1px 暗边、快捷操作图标化，悬停仅提升一级明度",
    imagery: "优先产品实景与代码界面，摄影仅作为局部内容而非氛围壁纸",
    motion: "快速淡入和位移 4-8px，交互反馈控制在 120-200ms",
    antiPatterns: "禁止蓝紫光球、玻璃拟态堆叠、过亮描边和营销式大 Hero",
    finishing: "检查暗色对比度、焦点环、键盘路径和信息密度是否稳定",
  },
  "mono-sharp": {
    mood: "直接、理性、无装饰；靠比例和空白建立权威",
    palette: "黑白为绝对主体，只允许单个功能状态色短暂出现",
    typography: "高对比字号、粗黑标题和规整正文，字距保持自然不做装饰拉伸",
    composition: "硬网格、满宽分割、极大留白与精确边界，元素严格对齐",
    components: "小圆角或直角、无阴影、黑白反转 CTA，状态依靠线宽与填充",
    imagery: "高对比产品图或黑白摄影，裁切几何明确且不加滤镜遮罩",
    motion: "瞬时切换、线性展开和轻微淡入，不使用弹簧",
    antiPatterns: "禁止渐变、柔和彩色阴影、装饰性徽章和多层卡片",
    finishing: "检查像素对齐、黑白层级、留白比例和按钮文案长度",
  },
  "paper-ink": {
    mood: "亲和、条理、可长期书写；像成熟知识工具而非可爱手账",
    palette: "白纸和暖灰区分层级，堇紫标记主动作，橘色仅强调提醒或引用",
    typography: "正文优先，标题克制；列表、层级缩进和行高决定阅读效率",
    composition: "文档流、目录锚点、折叠区块和适度留白形成清晰知识结构",
    components: "轻边界、行内操作、可折叠块与属性行，减少独立卡片",
    imagery: "截图、图表和小型封面图服务内容，不使用纯氛围大图",
    motion: "展开折叠和层级重排平滑完成，保持位置连续性",
    antiPatterns: "禁止糖果色铺满、超大图标、卡片套卡片和花哨页面转场",
    finishing: "检查层级缩进、列表连续性、长文本换行和可扫描性",
  },
  "coral-hospitality": {
    mood: "开放、可信、有生活气；重点是让真实空间和选择更容易比较",
    palette: "白底承载内容，珊瑚色只用于预订主动作，深紫用于少量品牌回声",
    typography: "友好但不幼稚，地点与价格层级明确，辅助信息紧凑可扫读",
    composition: "搜索先行、图片主导、地图与清单互相呼应，信息靠近对应照片",
    components: "搜索框、日期人数控件和房源条目强调可操作性，圆角适中",
    imagery: "必须是真实、明亮、可检查的空间与人物体验，避免过暗氛围图",
    motion: "图片切换、地图定位与收藏反馈柔和，保持滚动位置",
    antiPatterns: "禁止假旅行插画、模糊大图、过多红色按钮和隐藏价格",
    finishing: "检查地点、价格、评分、可用性和预订路径是否一眼可见",
  },
  "candy-playground": {
    mood: "大胆、实验、协作感；玩心来自构图变化而不是堆彩色装饰",
    palette: "黑白骨架稳定界面，粉、丁香、柠檬绿按区块分工且不相互竞争",
    typography: "巨细字号并置、短标题可轻字重，工具文本保持中性清晰",
    composition: "拼贴、跨格、局部旋转和不对称色块，但关键操作仍遵循网格",
    components: "工具控件紧凑，展示内容可以更自由；圆角与直角混合形成节奏",
    imagery: "使用真实创作成果、手势和素材拼贴，避免通用办公图库",
    motion: "拖拽跟手、色块吸附和小幅弹性反馈，避免持续漂浮",
    antiPatterns: "禁止每个元素不同颜色、巨大胶囊、低对比粉彩正文和儿童化 emoji",
    finishing: "检查创意区域与操作区域是否明确、色彩数量和拖拽反馈是否克制",
  },
  "silver-calm": {
    mood: "安静、精密、产品中心；让实体或界面本身承担情绪",
    palette: "银灰背景、纯白表面和墨黑文字，科技蓝仅出现于明确动作",
    typography: "大标题简短有重量，正文宽度受控，关键参数用清晰数字层级",
    composition: "一屏一个主角、纵向章节和大面积负空间，下一段需露出提示",
    components: "少量无边界控件、柔和分段控制和低存在感导航",
    imagery: "高清产品实拍或可检查界面，光线干净、主体完整、不做暗糊裁切",
    motion: "滚动驱动的缓慢位移与透明度变化，控制动作即时反馈",
    antiPatterns: "禁止卡片网格充斥首屏、彩色渐变背景、过多卖点徽章",
    finishing: "检查第一视口主角、下节露出、图片清晰度和文字是否过量",
  },
  "midnight-beat": {
    mood: "沉浸、节奏、个性；界面服务持续播放和快速发现",
    palette: "近黑为场，荧光绿只表示播放与主动作，蓝色用于内容分类而非竞争",
    typography: "标题有音乐海报力度，曲目元数据紧凑，数字和时长对齐",
    composition: "封面图、播放控制和队列形成三角焦点，横向内容轨道可连续浏览",
    components: "圆形播放键、紧凑列表和清晰进度条，卡片悬停才显操作",
    imagery: "专辑封面和艺人真实影像高饱和但不加统一暗遮罩",
    motion: "播放状态、频谱和封面切换有节拍但不干扰控制",
    antiPatterns: "禁止整页荧光绿、发光描边、无内容的大面积黑和复杂 3D 背景",
    finishing: "检查播放状态、当前曲目、队列顺序、音量和键盘可达性",
  },
  "morandi-soft": {
    mood: "松弛、安静、触感柔和；低饱和不等于低对比",
    palette: "灰调中性色分层，灰绿与灰棕各司其职，正文保持足够深度",
    typography: "中等字重、舒展行高与自然字距，标题尺寸克制",
    composition: "错落留白、低密度分组和柔和边界，避免规则卡片墙",
    components: "大但不过度的圆角、几乎无阴影、通过色面区分交互层级",
    imagery: "自然材质、室内光线和静物细节，保留真实纹理",
    motion: "缓入缓出、透明度和轻微缩放，时间略长但不拖沓",
    antiPatterns: "禁止文字也使用低对比灰、全页米色同色调和装饰性光球",
    finishing: "检查对比度、触控目标、色面边界和内容是否因柔和而失焦",
  },
  "pure-showroom": {
    mood: "自信、克制、展厅感；产品必须在首屏清晰可检视",
    palette: "纯白与深墨为主体，电光蓝只承担购买或配置主路径",
    typography: "简洁无衬线、标题短、参数明确，不用口号堆叠",
    composition: "满宽产品图、低位文案和连续规格章节，始终露出下一段线索",
    components: "透明导航、少量实色按钮和参数对比表，不用装饰卡片",
    imagery: "高分辨率产品实拍、完整轮廓和明确材质，背景干净但不虚化主体",
    motion: "滚动切换视角、参数渐显，操作控件反馈保持即时",
    antiPatterns: "禁止通用汽车图库、渐变光晕、卖点卡片墙和隐蔽价格",
    finishing: "检查产品首屏可见、规格可比较、CTA 单一和移动端裁切",
  },
  "dimension-orb": {
    mood: "未来、雕塑感、空间深度；3D 是主内容而不是背景装饰",
    palette: "深空中性底托住紫青材质光，环境光与高光需有物理方向",
    typography: "简短标题与细正文形成材质对比，文字不得压住 3D 主体关键区域",
    composition: "全幅无框 3D 主场景，UI 沿边缘分布并保留旋转观察空间",
    components: "控制器使用紧凑图标、分段和滑杆，面板透明但保持清晰边界",
    imagery: "程序化材质、产品扫描或真实模型，禁止用渐变圆形冒充三维对象",
    motion: "缓慢自转、指针视差和阻尼交互，必须可停止且不导致眩晕",
    antiPatterns: "禁止独立光球装饰、黑紫一色到底、空白 canvas 和无反馈拖拽",
    finishing: "检查首帧非空、材质高光、移动端取景、帧率和交互提示",
  },
};

export function methodologyBrief(theme: Theme): string {
  const method = theme.methodology;
  if (!method) return "";
  return `九段式设计方法：\n1. 情绪：${method.mood}\n2. 色彩：${method.palette}\n3. 字体：${method.typography}\n4. 构图：${method.composition}\n5. 组件：${method.components}\n6. 影像：${method.imagery}\n7. 动效：${method.motion}\n8. 禁忌：${method.antiPatterns}\n9. 收尾：${method.finishing}`;
}

export const ESTHETICS: Theme[] = [
  FINTECH_INDIGO, WARM_EDITORIAL, DEEP_SPACE, MONO_SHARP, PAPER_INK, MORANDI_SOFT,
  CORAL_HOSPITALITY, CANDY_PLAYGROUND, SILVER_CALM, MIDNIGHT_BEAT, PURE_SHOWROOM, DIMENSION_ORB,
].map((theme) => ({ ...theme, methodology: THEME_METHODOLOGIES[theme.id] }));

/** 审美子智能体：从用户话语中匹配气质，命中返回 Theme */
export function matchEsthetic(text: string): Theme | null {
  const lower = text.toLowerCase();
  let best: { theme: Theme; hits: number } | null = null;
  for (const theme of ESTHETICS) {
    const hits = theme.keywords.filter((kw) => lower.includes(kw.toLowerCase())).length;
    if (hits > 0 && (!best || hits > best.hits)) best = { theme, hits };
  }
  return best?.theme ?? null;
}

/* 旧 id 别名导出，保持向后兼容 */
export const AURORA = ESTHETICS.find((theme) => theme.id === FINTECH_INDIGO.id)!;
export const NOIR = ESTHETICS.find((theme) => theme.id === DEEP_SPACE.id)!;
export const CREAM = ESTHETICS.find((theme) => theme.id === WARM_EDITORIAL.id)!;
export const GLASS = NOIR;
export const NEON = NOIR;
export const FOREST = ESTHETICS.find((theme) => theme.id === MORANDI_SOFT.id)!;
