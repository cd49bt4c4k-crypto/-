# 虚拟职场共享办公网站

一个2.5D斜45°视角的虚拟职场共享办公网站，基于 FastAPI + SQLite + HTML/Tailwind CSS/JavaScript 开发。

## 功能特性

### 1. 用户系统
- 首次进入弹出入职自定义弹窗
- 自选岗位（前端、后端、产品、运营、财务、人事、设计师、测试、自由职业）
- 自定义2-10字昵称（后端敏感词过滤）
- 自选初始工位区域（靠窗黄金区、普通办公区、角落摸鱼区、地下加班区）
- 自选初始在线状态（认真敲代码、带薪发呆、偷偷刷短视频、假装开会、摸鱼刷论坛、疯狂内卷加班）
- 右侧侧边栏个人面板随时修改信息
- 声望数值系统（声望≥80解锁靠窗工位，声望过低限制地下加班区）
- 每日声望排行榜

### 2. 互动功能
- 发布80字以内工位便签
- 发送表情
- 互相赠送咖啡奶茶（咖啡、奶茶、可乐、零食、鲜花）
- 茶水间长篇吐槽墙
- 会议室话题投票
- 天台吸烟区（仅21:00-凌晨2:00开放）
- 老板办公室随机趣味事件
- AI虚拟同事（自主切换状态、发布留言、互相赠送礼物）

### 3. 摸鱼工具箱
- 自定义下班倒计时
- Excel表格伪装页面（鼠标移动恢复）
- 代码编辑器伪装页面（鼠标移动恢复）
- 白噪音开关
- 实时在线人数统计（真人+AI）
- 今日留言总数
- 全局深色模式切换

### 4. 场景氛围
- 08:00-18:00 明亮日间办公
- 18:00-21:00 多数工位灯光熄灭（黄昏模式）
- 21:00-凌晨2:00 深夜暗光加班模式
- 周一AI集体抱怨上班氛围
- 周五傍晚放松氛围

### 5. 后端安全
- 全量敏感词过滤，违规留言直接拦截
- 数据库仅保留最近450条留言，过期自动清理
- 完善的代码异常捕获和接口容错处理
- 电脑端、手机端完美适配
- 人物互动动画柔和流畅

## 技术栈

**后端：**
- FastAPI 0.104.1
- SQLAlchemy 2.0.23
- SQLite 数据库
- Pydantic 2.5.0

**前端：**
- HTML5
- Tailwind CSS (CDN)
- 原生 JavaScript
- CSS3 动画

## 项目结构

```
project/
├── api/
│   ├── __init__.py
│   ├── index.py           # 主应用入口，包含所有API路由
│   ├── database.py        # 数据库连接配置
│   ├── models.py          # SQLAlchemy 数据模型
│   ├── schemas.py         # Pydantic 数据验证
│   ├── sensitive_filter.py # 敏感词过滤
│   └── utils.py           # 工具函数和常量
├── static/
│   ├── index.html         # 主页面
│   └── js/
│       ├── api.js         # API 调用封装
│       ├── app.js         # 主应用逻辑
│       └── scene.js       # 2.5D 场景渲染
├── requirements.txt       # Python 依赖
├── vercel.json            # Vercel 部署配置
└── start.bat              # Windows 本地启动脚本
```

## 本地运行

### 方法一：使用启动脚本（Windows）

双击 `start.bat` 即可自动安装依赖并启动服务器。

### 方法二：手动启动

1. 安装依赖：
```bash
pip install -r requirements.txt
```

2. 启动服务器：
```bash
uvicorn api.index:app --host 127.0.0.1 --port 8000
```

3. 在浏览器中访问：http://127.0.0.1:8000

## Vercel 部署步骤

### 前置准备
1. 注册 [Vercel](https://vercel.com/) 账号
2. 安装 [Vercel CLI](https://vercel.com/docs/cli)（可选）

### 方法一：通过 Vercel 网站部署（推荐）

1. 将项目代码推送到 GitHub / GitLab / Bitbucket 仓库
2. 登录 Vercel 控制台，点击 "Add New" → "Project"
3. 选择你的项目仓库
4. 在配置页面中：
   - **Framework Preset**: 选择 "Other"
   - **Root Directory**: 保持默认（项目根目录）
   - **Build Command**: 留空
   - **Output Directory**: 留空
5. 点击 "Deploy" 开始部署
6. 等待部署完成（约1-2分钟），点击生成的域名即可访问

### 方法二：通过 Vercel CLI 部署

1. 安装 Vercel CLI：
```bash
npm install -g vercel
```

2. 在项目根目录执行：
```bash
vercel
```

3. 按照提示完成配置：
   - Set up and deploy? → `Y`
   - Which scope? → 选择你的账户
   - Link to existing project? → `N`
   - What's your project's name? → 输入项目名称
   - In which directory is your code located? → `./`
   - Want to modify these settings? → `N`

4. 部署完成后，执行以下命令发布到生产环境：
```bash
vercel --prod
```

### 注意事项

1. **SQLite 限制**：Vercel Serverless 环境的文件系统是临时的，SQLite 数据库会在每次函数调用后重置。如需持久化数据，建议：
   - 使用 Vercel KV 或其他数据库服务
   - 或者将数据库文件挂载到 Vercel 的持久化存储

2. **AI 行为触发**：由于 Vercel Serverless 不支持常驻进程，AI 行为由前端页面定时触发（每15秒）。只要有用户在线，AI 就会保持活跃。

3. **数据库清理**：每次有新消息时会自动检查并清理超过450条的旧数据。

## API 接口列表

### 用户相关
- `GET /api/config` - 获取配置信息
- `POST /api/users/register` - 用户注册/入职
- `GET /api/users/me` - 获取当前用户信息
- `PUT /api/users/me` - 更新当前用户信息
- `GET /api/users` - 获取用户列表

### 留言相关
- `POST /api/messages` - 发布留言/便签
- `GET /api/messages` - 获取留言列表

### 礼物相关
- `POST /api/gifts` - 发送礼物
- `GET /api/gifts/received` - 获取收到的礼物

### 茶水间
- `POST /api/complaints` - 发布吐槽
- `GET /api/complaints` - 获取吐槽列表
- `POST /api/complaints/{id}/like` - 点赞吐槽

### 会议室
- `POST /api/votes` - 创建投票
- `GET /api/votes` - 获取投票列表
- `POST /api/votes/submit` - 提交投票

### 老板办公室
- `POST /api/boss-office/enter` - 进入老板办公室（触发随机事件）

### 排行榜
- `GET /api/ranking/today` - 获取今日声望排行榜

### 统计
- `GET /api/stats` - 获取在线统计数据

### 天台
- `GET /api/rooftop/status` - 获取天台开放状态

### AI 相关
- `POST /api/ai/action` - 触发 AI 随机行为

### 健康检查
- `GET /api/health` - 健康检查

## 自定义配置

### 修改敏感词列表
编辑 `api/sensitive_filter.py` 中的 `SENSITIVE_WORDS` 数组。

### 修改 AI 同事数量
编辑 `api/index.py` 中 `init_ai_users` 函数的数量阈值（默认15个）。

### 修改留言保留数量
编辑 `api/index.py` 中 `cleanup_old_messages` 函数的阈值（默认450条）。

### 修改工位位置
编辑 `static/js/scene.js` 中的位置坐标数组。

## 浏览器兼容性

- Chrome / Edge (推荐)
- Firefox
- Safari
- 移动端浏览器（响应式适配）

## 许可证

MIT License
