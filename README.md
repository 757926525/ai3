# 🦊 白狐AI三 - 极速轻量 AI 绘图 Web 工具

<p align="center">
  <b>白狐AI三</b> 是一款简洁、移动端友好、零传统数据库依赖、可快速部署的高性能 AI 绘图工具。支持全品类绘图、AI 助手对话/识图反推、30+ 预置与开源模型库、本地与 Cloudflare D1 云存储同步。
</p>

---

## 🌟 核心特性与工程优势

1. **面板固定标题**：面板标题固定显示为 **白狐AI三**。
2. **多端融合算力引擎**：
   - 支持集成 **Cloudflare Pages Functions 原生 AI 资源集 (`env.AI`)** 与边缘极速推理。
   - 默认集成 **Pollinations 免费开放算力池**（免 API Key，秒级高质量生成）。
   - 支持接入 **SiliconFlow 硅基流动**、**OpenAI DALL-E 3** 与外接对话/LLM API Key。
   - 三重实时状态指示灯 (🟢/🟡/🔴)，随时监视 Workers AI 接口、对话 API Key 与 D1 数据库连通性。
3. **移动优先交互**：
   - 顶部 30+ 预置与开源模型快速选择库（标注「支持中文生图」与「免费免 Key」）。
   - 正向与反向提示词输入、一键 **Google GTX 中英双向智能互译**、**5维 Prompt 结构化扩写**。
   - 像素级画幅控制：包含 quick 预设画幅与 **自定义 Width / Height 像素滑动条**。
   - 实时工作台预览区直接位于提示词下方，移动端操作流畅顺手。
   - **🔞 成人内容生成开关**：开关开启后解禁敏感艺术词限制，智能过滤并防止黑图。
   - **AI 助手中心**：内置 AI 智能问答对话、AI Vision 图像识别/Prompt 反推与 8 国语言多语种翻译。
4. **📱 手机一键直接部署（零电脑·零终端·零编译）**：
   - 专门提供预编译打包好的 Cloudflare Pages 资源 Zip 压缩包，手机下载后直接在 Cloudflare 控制台网页上传即可成功上线！
5. **本地/云端持久化存储**：
   - 默认采用浏览器 **IndexedDB**（配合 WebP 自动压缩），零数据库也能完整运行。
   - 绑定 Cloudflare D1 数据库后，系统自动并支持一键**手动同步设置与历史记录**。

---

## 🔑 环境变量与核心配置表

| 变量名 | 必填 | 默认值 | 作用与配置说明 |
| :--- | :---: | :---: | :--- |
| `ADMIN_USERNAME` | 否 | `admin` | 管理员登录用户名 |
| `ADMIN_PASSWORD` | 否 | `admin888` | 管理员初始登录密码 |
| `JWT_SECRET` | 否 | `baihu-fox-ai-3-secret` | JWT 鉴权签署密钥 |
| `CLOUDFLARE_ACCOUNT_ID` | 否 | - | Cloudflare Account ID（在 CF 仪表盘右侧获取） |
| `CLOUDFLARE_API_TOKEN` | 否 | - | Cloudflare Workers AI Bearer Token |
| `SILICONFLOW_API_KEY` | 否 | - | SiliconFlow 硅基流动 API Key (可选) |
| `OPENAI_API_KEY` | 否 | - | OpenAI DALL-E 3 / LLM API Key (可选) |

---

## 📖 完整部署指南

### 📱 方式一：手机/电脑免终端直连部署 (首选·最简单·零电脑需求)

无需电脑、无需运行任何终端命令行、无需配置 Node 环境！直接使用手机浏览器即可 1 分钟快速完成部署上线！

#### 步骤 1：直接下载预编译 Pages 资产 Zip 包
点击下方任意预编译包地址直接下载到手机/电脑本地：
- 📦 **直接部署 Zip 资产包下载地址**：[https://github.com/your-username/baihu-ai-three/releases/download/v1.0.0/cloudflare-pages-deploy.zip](https://github.com/your-username/baihu-ai-three/releases/download/v1.0.0/cloudflare-pages-deploy.zip) *(或在仓库 Releases 页面下载 `cloudflare-pages-deploy.zip`)*

#### 步骤 2：用手机/电脑浏览器登录 Cloudflare 控制台
1. 在手机或电脑浏览器打开 [Cloudflare 控制台](https://dash.cloudflare.com)。
2. 点击侧边栏 **Workers & Pages** ➔ 点击 **Create application** ➔ 切换到 **Pages** 标签页。
3. 点击 **Upload assets** (上传资产)。
4. **Project name** 随意填写项目名称（例如 `baihu-ai-three`）。
5. 点击上传按钮，选择刚才下载的 `cloudflare-pages-deploy.zip` 压缩包文件（或将 `.vercel/output/static` 解压文件夹拖入）。
6. 点击 **Deploy site** 按钮，系统自动解压部署，秒级生成上线网址！

---

### 💻 方式二：源码本地编译与 CLI 代码上传部署

如果你有电脑并希望自行基于源码构建打包：

```bash
# 1. 克隆代码仓库并安装依赖
git clone https://github.com/your-username/baihu-ai-three.git
cd baihu-ai-three
npm install

# 2. 生成 Cloudflare Pages 原生部署资产包
npm run pages:build

# 3. 使用 Wrangler 命令行直传部署
npx wrangler pages deploy .vercel/output/static --project-name=baihu-ai-three
```

#### 🛠️ Cloudflare Pages 仪表盘资源集绑定（D1 数据库 & Workers AI）
在 Cloudflare 仪表盘控制台打开你的 Pages 项目 `baihu-ai-three`：
1. **绑定 D1 数据库 (`env.DB`)**：
   - 进入 **Settings ➔ Functions** ➔ **D1 database bindings** ➔ **Add binding**：
     - **Variable name (变量名)**：`DB`（必须大写）
     - **D1 database (数据库)**：选择你创建的 D1 数据库（如 `baihu_ai_db`）
2. **绑定 Workers AI 资源集 (`env.AI`)**：
   - 进入 **Settings ➔ Functions** ➔ **Workers AI bindings** ➔ **Add binding**：
     - **Variable name (变量名)**：`AI`（必须大写）
3. **配置环境变量**：
   - 进入 **Settings ➔ Environment variables**，添加 `CLOUDFLARE_ACCOUNT_ID` 与 `CLOUDFLARE_API_TOKEN`。

---

### 方式三：Cloudflare Pages Git 自动化拉取部署

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com) ➔ **Workers & Pages** ➔ **Create application** ➔ **Pages** ➔ **Connect to Git**。
2. 选择本 GitHub 仓库。
3. **Build Settings**:
   - **Framework preset**: `None` (或 `Next.js`)
   - **Build command**: `npm run pages:build`
   - **Build output directory**: `.vercel/output/static`
   - **Environment variables**: `NODE_VERSION=20`
4. 在 Pages 项目 **Settings ➔ Functions ➔ Compatibility flags** 中添加 `nodejs_compat`。

---

### 方式四：Vercel 及类似 Node.js 平台部署 (Vercel / Netlify / Render / Zeabur)

1. 将本仓库 Fork 或 Push 至 GitHub。
2. 在 [Vercel 控制台](https://vercel.com) 点击 **Add New Project** ➔ 选择本仓库。
3. Framework Preset 选择 **Next.js**。
4. 在 Environment Variables 中添加对应 Key 即可一键部署。

---

### 方式五：Wasmer Edge 容器部署 (Wasmer 部署)

本项目根目录已内置 Wasmer 标准配置文件 `wasmer.toml`。

```bash
# 1. 安装 Wasmer CLI
curl https://get.wasmer.io -sSfL | sh

# 2. 登录 Wasmer 账户
wasmer login

# 3. 一键部署到 Wasmer Edge 边缘云
wasmer deploy
```

---

### 方式六：Docker & Docker Compose 容器部署

```bash
# 使用 Docker Compose 启动容器
docker-compose up -d --build

# 打开浏览器访问 http://localhost:3000
```

---

*版权所有 © 2025 白狐AI三团队*
