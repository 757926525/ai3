# 🦊 白狐AI三 - 极速轻量 AI 绘图 Web 工具

<p align="center">
  <b>白狐AI三</b> 是一款简洁、移动端友好、零传统数据库依赖、可快速部署的高性能 AI 绘图工具。支持全品类绘图、AI 助手对话/识图反推、30+ 预置与开源模型库、本地与 Cloudflare D1 云存储同步。
</p>

---

## 🌟 核心特性与工程优势

1. **面板固定标题**：面板标题固定显示为 **白狐AI三**。
2. **多端融合算力引擎**：
   - 默认集成 **Pollinations 免费开放算力池**（免 API Key，秒级高质量生成）。
   - 支持集成 **Cloudflare Workers AI** 边缘极速推理。
   - 支持接入 **SiliconFlow 硅基流动**、**OpenAI DALL-E 3** 与外接对话/LLM API Key。
   - 三重实时状态指示灯 (🟢/🟡/🔴)，随时监视 Workers AI 接口、对话 API Key 与 D1 数据库连通性。
3. **移动优先交互**：
   - 顶部 30+ 预置与开源模型快速选择库（标注「支持中文生图」与「免费免 Key」）。
   - 正向与反向提示词输入、一键 **Google GTX 中英双向智能互译**、**5维 Prompt 结构化扩写**。
   - 像素级画幅控制：包含 quick 预设画幅与 **自定义 Width / Height 像素滑动条**。
   - 实时工作台预览区直接位于提示词下方，移动端操作流畅顺手。
   - **🔞 成人内容生成开关**：开关开启后解禁敏感艺术词限制，智能过滤并防止黑图。
   - **AI 助手中心**：内置 AI 智能问答对话、AI Vision 图像识别/Prompt 反推与 8 国语言多语种翻译。
4. **Cloudflare 后台一键绑定（免前台输入）**：
   - 支持直接在 Cloudflare Pages 仪表盘「设置 ➔ 环境变量」中绑定 `CLOUDFLARE_ACCOUNT_ID` 与 `CLOUDFLARE_API_TOKEN`，重新部署后全站免手动输入密钥自动连通！
5. **本地/云端持久化存储**：
   - 默认采用浏览器 **IndexedDB**（配合 WebP 自动压缩），零数据库也能完整运行。
   - 支持一键绑定 Cloudflare D1 数据库进行全端云同步。

---

## 🔑 环境变量与核心配置表

| 变量名 | 必填 | 默认值 | 作用与配置说明 |
| :--- | :---: | :---: | :--- |
| `ADMIN_USERNAME` | 否 | `admin` | 管理员登录用户名 |
| `ADMIN_PASSWORD` | 否 | `admin888` | 管理员初始登录密码 |
| `JWT_SECRET` | 否 | `baihu-fox-ai-3-secret` | JWT 鉴权签署密钥 |
| `CLOUDFLARE_ACCOUNT_ID` | 否 | - | Cloudflare Account ID（在 CF 仪表盘右侧获取） |
| `CLOUDFLARE_API_TOKEN` | 否 | - | Cloudflare Workers AI Bearer Token（开通 Workers AI 权限） |
| `SILICONFLOW_API_KEY` | 否 | - | SiliconFlow 硅基流动 API Key (可选) |
| `OPENAI_API_KEY` | 否 | - | OpenAI DALL-E 3 / LLM API Key (可选) |

---

## 📖 完整部署指南

### 方式一：Cloudflare Pages Git/Pull 拉取部署 (推荐)

此方式通过 GitHub 仓库联动，每次 `git push` 自动触发 Cloudflare Pages 构建与拉取部署。

#### 步骤 1：连接 GitHub 仓库
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)。
2. 点击侧边栏 **Workers & Pages** ➔ **Create application** ➔ **Pages** ➔ **Connect to Git**。
3. 选择 `baihu-ai-three` 仓库。

#### 步骤 2：配置构建设置 (Build Settings)
- **Framework preset**: `None` (或 `Next.js`)
- **Build command**: `npm run pages:build`
- **Build output directory**: `.vercel/output/static`
- **Root directory**: `/`
- **Environment variables (环境变量)**:
  - `NODE_VERSION`: `20`
  - `CLOUDFLARE_ACCOUNT_ID`: 你的账户 ID
  - `CLOUDFLARE_API_TOKEN`: 你的 API Token

#### 步骤 3：开通 Node.js 兼容性标志
在 Pages 项目 Settings ➔ Functions ➔ **Compatibility flags** 中添加 `nodejs_compat`。

---

### 方式二：Cloudflare Pages CLI 代码部署 (代码直传)

无需绑定 Git 仓库，本地直接打包上传至 Cloudflare Pages 节点。

```bash
# 1. 安装依赖
npm install

# 2. 执行 Cloudflare Pages 适配编译
npm run pages:build

# 3. 使用 Wrangler 部署代码产物
npx wrangler pages deploy .vercel/output/static --project-name=baihu-ai-three
```

#### 可选：绑定 Cloudflare D1 数据库
```bash
# 创建 D1 数据库
npx wrangler d1 create baihu_ai_db

# 初始化数据表
npx wrangler d1 execute baihu_ai_db --file=./schema.sql
```
在 `wrangler.toml` 中解开 `[[d1_databases]]` 注释并填入 `database_id` 即可。

---

### 方式三：Cloudflare Worker 代理部署 (CF 代理部署)

若已有主站或节点服务器，希望通过 Cloudflare Worker 进行反向代理与全局 CDN 加速：

1. 仓库根目录已附带反向代理脚本 `cf-proxy-worker.js`。
2. 打开 `cf-proxy-worker.js`，将 `TARGET_UPSTREAM` 替换为你的应用真实源站地址（如 `https://baihu-ai.vercel.app` 或你的源站 IP）。
3. 在 Cloudflare Worker 后台新建 Worker，粘贴 `cf-proxy-worker.js` 内容并点击 **Deploy**。
4. 绑定自定义域名（如 `ai.yourdomain.com`）即可完成 CDN 代理加速部署。

---

### 方式四：Vercel 及类似平台部署 (Vercel / Netlify / Render / Zeabur)

1. 将本仓库 Fork 或 Push 至 GitHub。
2. 在 [Vercel 控制台](https://vercel.com) 点击 **Add New Project** ➔ 选择本仓库。
3. Framework Preset 选择 **Next.js**。
4. 在 Environment Variables 中添加 `CLOUDFLARE_ACCOUNT_ID`、`CLOUDFLARE_API_TOKEN` 或 `OPENAI_API_KEY`（可选）。
5. 点击 **Deploy**，大约 1 分钟即可完成部署上线。

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

## 🛠️ 本地开发与指令

```bash
# 启动本地开发服务器
npm run dev

# 执行生产打包编译
npm run build

# 启动生产服务
npm start
```

---

*版权所有 © 2025 白狐AI三团队*
