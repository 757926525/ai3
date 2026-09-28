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
4. **Cloudflare Pages Functions 资源集完美适配**：
   - 完美适配 Cloudflare Pages 后台资源集（D1 数据库 `env.DB`、Workers AI `env.AI`），无需手动编写 API 逻辑即可零延迟调用 Cloudflare 边缘能力。
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

### 方式一：Cloudflare 代码上传部署 (CLI Code Upload Deployment - 推荐)

直接通过 Cloudflare CLI (`wrangler`) 将打包编译后的代码直接上传部署至 Cloudflare Pages 全球边缘节点。

```bash
# 1. 克隆代码仓库并安装依赖
git clone https://github.com/your-username/baihu-ai-three.git
cd baihu-ai-three
npm install

# 2. 执行 Cloudflare Pages Functions 适配编译
npm run pages:build

# 3. 使用 Wrangler 一键直传部署至 Cloudflare Pages
npx wrangler pages deploy .vercel/output/static --project-name=baihu-ai-three
```

#### 🛠️ Cloudflare Pages 仪表盘资源集绑定（D1 数据库 & Workers AI）
在 Cloudflare 仪表盘控制台打开你的 Pages 项目 `baihu-ai-three`：
1. **绑定 D1 数据库 (`env.DB`)**：
   - 侧边栏进入 **Settings ➔ Functions** ➔ 下滑至 **D1 database bindings**。
   - 点击 **Add binding**：
     - **Variable name (变量名)**：填写 `DB`（必须大写）
     - **D1 database (数据库)**：选择你创建的 D1 数据库（如 `baihu_ai_db`）
2. **绑定 Workers AI 资源集 (`env.AI`)**：
   - 侧边栏进入 **Settings ➔ Functions** ➔ 下滑至 **Workers AI bindings**。
   - 点击 **Add binding**：
     - **Variable name (变量名)**：填写 `AI`（必须大写）
3. **配置环境变量**：
   - 进入 **Settings ➔ Environment variables**，添加 `CLOUDFLARE_ACCOUNT_ID` 与 `CLOUDFLARE_API_TOKEN`。
4. **重新部署**：保存绑定后，重新点击 Deploy 或运行 `npx wrangler pages deploy`，Pages Functions 将自动拥有原生 D1 与 AI 资源访问权限！

---

### 方式二：Cloudflare Pages Git 拉取部署 (Automated Git Integration)

此方式通过 GitHub 仓库联动，每次 `git push` 自动触发 Cloudflare Pages 拉取构建。

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)。
2. 点击侧边栏 **Workers & Pages** ➔ **Create application** ➔ **Pages** ➔ **Connect to Git**。
3. 选择本仓库。
4. **Build Settings**:
   - **Framework preset**: `None` (或 `Next.js`)
   - **Build command**: `npm run pages:build`
   - **Build output directory**: `.vercel/output/static`
   - **Environment variables**: `NODE_VERSION=20`
5. 在 Pages 项目 **Settings ➔ Functions ➔ Compatibility flags** 中添加 `nodejs_compat`。
6. 同上在 **Functions** 设置中绑定 `DB` (D1) 与 `AI` (Workers AI) 资源集。

---

### 方式三：Vercel 及类似 Node.js 平台部署 (Vercel / Netlify / Render / Zeabur)

1. 将本仓库 Fork 或 Push 至 GitHub。
2. 在 [Vercel 控制台](https://vercel.com) 点击 **Add New Project** ➔ 选择本仓库。
3. Framework Preset 选择 **Next.js**。
4. 在 Environment Variables 中添加 `CLOUDFLARE_ACCOUNT_ID`、`CLOUDFLARE_API_TOKEN` 或 `OPENAI_API_KEY`（可选）。
5. 点击 **Deploy**，大约 1 分钟即可完成部署上线。

---

### 方式四：Wasmer Edge 容器部署 (Wasmer 部署)

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

### 方式五：Docker & Docker Compose 容器部署

仓库内置 Dockerfile（采用 Next.js Standalone 多阶段轻量构建）。

#### 使用 Docker Compose 一键启动 (推荐)

```bash
# 启动 Docker 容器
docker-compose up -d --build

# 查看运行状态
docker-compose ps

# 访问服务
# 打开浏览器访问 http://localhost:3000
```

#### 使用原生 Docker 命令构建运行

```bash
# 构建 Docker 镜像
docker build -t baihu-ai-three .

# 运行容器
docker run -d -p 3000:3000 --name baihu-ai-three \
  -e ADMIN_PASSWORD=admin888 \
  -e CLOUDFLARE_ACCOUNT_ID=your_id \
  -e CLOUDFLARE_API_TOKEN=your_token \
  baihu-ai-three
```

---

## 🛠️ 本地开发与命令行参考

```bash
# 本地 D1 数据库创建与初始化
npx wrangler d1 create baihu_ai_db
npx wrangler d1 execute baihu_ai_db --file=./schema.sql

# 启动本地开发服务器
npm run dev

# 执行生产打包编译
npm run build

# 执行 Cloudflare Pages 原生构建
npm run pages:build
```

---

*版权所有 © 2025 白狐AI三团队*
