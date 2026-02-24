# Docusaurus 文档网站

这是一个使用 Docusaurus 3.7.0 构建的文档网站，支持多语言和版本控制功能。

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm start

# 构建生产版本
npm run build

# 启动特定语言的开发服务器
npm start -- --locale zh-CN  # 中文
npm start -- --locale ja-JP  # 日语
npm start -- --locale en     # 英文
```

## 📚 多语言支持

本站点支持以下语言：
- 简体中文 (zh-CN) - 默认语言
- 英文 (en)

### 添加新翻译

1. 生成翻译文件：
```bash
npm run write-translations -- --locale zh-CN
```

2. 翻译文件结构：
```
website
├── i18n
│   └── zh-CN          # 语言代码
│       ├── code.json    # 界面文本翻译
│       └── docusaurus-plugin-content-docs
│           └── current  # 当前版本文档翻译
│               └── ...
```

3. 翻译工作流程：
- 编辑 `i18n/[语言代码]/code.json` 进行界面文本翻译
- 在 `i18n/[语言代码]/docusaurus-plugin-content-docs/current/` 中创建对应的文档翻译
- 在 `i18n/[语言代码]/docusaurus-plugin-content-blog` 中创建博客文章翻译

### 翻译检查

确保所有文档都有对应的翻译版本：
1. 检查 `docs/` 目录下的所有文档是否都在 `i18n/zh-CN/docusaurus-plugin-content-docs/current/` 中有对应翻译
2. 检查 `blog/` 目录下的所有文章是否都在 `i18n/zh-CN/docusaurus-plugin-content-blog/` 中有对应翻译

## 📖 版本控制

当前支持的文档版本：
- Current (最新开发版本)
- 1.0.0

### 创建新版本

当有重大更新时，可以创建新的文档版本：

```bash
# 创建新版本（例如 2.0.0）
npm run docusaurus docs:version 2.0.0
```

这将会：
1. 将当前 `docs/` 目录下的文档快照复制到 `versioned_docs/version-2.0.0/`
2. 创建对应的侧边栏配置文件 `versioned_sidebars/version-2.0.0-sidebars.json`
3. 更新 `versions.json` 文件

### 版本目录结构

```
website
├── docs                     # 当前版本文档
├── versioned_docs
│   └── version-1.0.0       # 1.0.0 版本文档
├── versioned_sidebars      # 版本化的侧边栏配置
└── versions.json           # 版本列表配置
```

### 版本维护指南

1. 更新当前版本文档：
   - 直接编辑 `docs/` 目录下的文件

2. 更新已发布版本文档：
   - 编辑 `versioned_docs/version-X.X.X/` 目录下的对应文件

3. 翻译版本化文档：
   - 在 `i18n/[语言代码]/docusaurus-plugin-content-docs/version-X.X.X/` 中创建翻译

## 🔍 最佳实践

1. 文档更新
   - 小改动直接更新 `docs/` 目录
   - 重大更新时创建新版本
   - 确保所有文档都有对应的翻译

2. 翻译管理
   - 使用翻译管理工具（如 Crowdin）来协调翻译工作
   - 定期检查和更新翻译文件
   - 确保新添加的内容都有对应的翻译

3. 版本控制
   - 仅在 API 变更或重大功能更新时创建新版本
   - 保持版本号语义化（遵循 SemVer）
   - 在 `versions.json` 中维护活跃的版本列表

## 🛠️ 常用命令

```bash
# 开发
npm start                    # 启动开发服务器
npm start -- --locale zh-CN # 启动中文开发服务器

# 文档
npm run write-translations   # 生成翻译文件
npm run docusaurus docs:version 2.0.0  # 创建新版本

# 构建
npm run build               # 构建所有版本和语言
npm run serve              # 本地预览构建结果
```

## 📝 注意事项

1. 版本控制
   - 不要删除或修改已发布版本的文档
   - 确保版本号遵循语义化版本规范
   - 在创建新版本前确保当前文档是稳定的

2. 翻译
   - 保持专业术语的一致性
   - 定期更新翻译文件
   - 确保所有用户界面文本都已翻译

3. 文档质量
   - 保持文档结构的一致性
   - 确保代码示例是最新的
   - 及时更新过时的内容

## 🤝 贡献指南

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request
