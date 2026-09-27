# 🦊 白狐AI三 - 极速轻量 AI 绘图 Web 工具

<p align="center">
  <b>白狐AI三</b> 是一款简洁、移动端友好、零传统数据库依赖、可快速部署的高性能 AI 绘图工具。
</p>

---

## 🌟 核心特性与工程优势

1. **面板固定标题**：面板标题及全站品牌固定显示为 **白狐AI三**。
2. **多端融合算力引擎**：
   - 默认集成 **Pollinations 免费自由艺术算力池**（免 API Key，支持全品类无限制创作）。
   - 支持集成 **Cloudflare Workers AI** 边缘极速推理。
   - 支持接入 **SiliconFlow 硅基流动**、**OpenAI DALL-E 3** 与外接对话/LLM Key。
   - 包含三重实时状态指示灯 (🟢/🟡/🔴)，随时掌控算力与数据库连通性。
3. **移动优先交互**：
   - 紧凑型顶部大模型快速选择与 30+ 预置模型库（标注「支持中文生图」与「免费免 Key」）。
   - 正向与负向提示词词库输入、一键 **中英智能互译**、**五维 Prompt 结构化扩写**。
   - 核心画质调节棒、画幅预设与 **自定义 Width / Height 像素滑动条**。
   - **AI 助手中心**：内置 AI 智能问答对话、AI Vision 图像识别/Prompt 反推与 8 国语言多语种翻译。
4. **Cloudflare 后台一键绑定（免前台输入）**：
   - 支持直接在 Cloudflare Pages 仪表盘「设置 ➔ 环境变量」中绑定 `CLOUDFLARE_ACCOUNT_ID` 与 `CLOUDFLARE_API_TOKEN`，重新部署后全站免手动输入密钥自动连通！
5. **Cloudflare D1 数据库云同步（可选）**：
   - 默认采用浏览器本地 **IndexedDB**（结合 WebP 图片压缩技术），零数据库即可完整运行。
   - 绑定 Cloudflare D1 数据库后，系统自动并支持一键**手动同步设置与历史记录**。

---

## 🚀 快速本地运行

```bash
# 1. 克隆代码仓库
git clone https://github.com/your-username/baihu-ai-three.git
cd baihu-ai-three

# 2. 安装依赖
npm install

# 3. 配置环境变量 (可选)
cp .env.example .env.local

# 4. 启动本地开发服务
npm run dev
# 浏览器访问 http://localhost:3000 即可使用
```

---

## ☁️ Cloudflare Pages 部署流程 (推荐)

### 步骤 1：创建 D1 数据库 (可选，实现云同步)

```bash
# 创建 D1 数据库
npx wrangler d1 create baihu-ai-d1

# 执行数据库建表初始化 schema
npx wrangler d1 execute baihu-ai-d1 --file=./schema.sql
```

### 步骤 2：在 Cloudflare Pages 仪表盘配置环境变量

在 Cloudflare Pages 项目后台 `Settings ➔ Environment variables` 中配置：
- `CLOUDFLARE_ACCOUNT_ID`：账户 ID
- `CLOUDFLARE_API_TOKEN`：Cloudflare AI API Token
- `ADMIN_PASSWORD`：（可选）管理员初始密码 (默认 `admin888`)

### 步骤 3：一键构建部署

```bash
# 执行 Cloudflare Pages 原生适配构建
npm run pages:build

# 使用 Wrangler 部署到 Cloudflare Pages
npx wrangler pages deploy .vercel/output/static --project-name=baihu-ai-three
```

---

## 📐 Vercel 部署流程

1. 将仓库 Fork 或上传至 GitHub。
2. 在 Vercel 控制台中选择 **Import Project**，导入本项目。
3. Framework Preset 选择 **Next.js**。
4. 在 Environment Variables 中填入对应 Key（如 `OPENAI_API_KEY` 或 `SILICONFLOW_API_KEY`）。
5. 点击 **Deploy** 即可瞬间上线。

---

## 🐳 Docker 部署流程

### 使用 Docker Compose 一键启动

```bash
# 启动容器
docker-compose up -d --build

# 访问服务
# 浏览器访问 http://localhost:3000
```

---

## 🔑 环境变量配置说明

| 变量名 | 必填 | 默认值 | 说明 |
| :--- | :---: | :---: | :--- |
| `ADMIN_USERNAME` | 否 | `admin` | 管理员登录用户名 |
| `ADMIN_PASSWORD` | 否 | `admin888` | 管理员登录初始密码 |
| `JWT_SECRET` | 否 | `baihu-fox-ai-3-secret` | 用于本地 Token 签署的密钥 |
| `CLOUDFLARE_API_TOKEN` | 否 | - | Cloudflare Workers AI 访问 Token |
| `CLOUDFLARE_ACCOUNT_ID` | 否 | - | Cloudflare Account ID |
| `SILICONFLOW_API_KEY` | 否 | - | SiliconFlow 硅基流动 API Key |
| `OPENAI_API_KEY` | 否 | - | OpenAI DALL-E 3 官方 Key |

---

*版权所有 © 2025 白狐AI三团队*
