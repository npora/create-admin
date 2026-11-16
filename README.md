# Create Nova Admin

创建简洁、可扩展业务的 Vue 3 + TypeScript + Element Plus + Pinia 后台框架。

生成器从 [admin-template](https://github.com/npora/admin-template) 获取模板，默认使用 `main` 分支。基础功能包含登录、首页、布局、动态菜单、用户/部门/角色/菜单/字典管理、按钮权限、个人中心、多语言和主题。

## 在线演示

[打开展示网站](https://admin.npora.live) · [演示 API 健康检查](https://api.npora.live/health)

账号：`admin`，密码：`123456`。这是展示站账号，不是正式 SQL 自动创建的账号。

## 创建项目

```sh
npx @niping9542/create-nova-admin@latest my-admin
cd my-admin
npm install
npm run dev
```

按提示选择模板，直接回车默认创建纯净后台。也可明确指定：

```sh
npx @niping9542/create-nova-admin@latest my-admin --preset starter
```

| 模板              | 内容                                             |
| ----------------- | ------------------------------------------------ |
| `starter`（默认） | 全部基础前端功能和正式 MySQL SQL，对接自己的后端 |
| `worker`          | 相同核心前端，附加独立 Worker 后端参考实现       |
| `demo`            | 演示首页、示例页面、测试后端和展示站实现         |

纯净版保留登录和首页，不生成 Worker、演示页面及展示站部署工具，创建后无需删除文件。三种模板都保留基础系统管理和可配置的 `DataTable`：表格与分页是同一个组件，分页条数、布局、对齐等通过参数配置。

Worker 版先按生成项目的 `workers/api/README.md` 初始化并运行后端，`npm run dev` 只启动前端。完整演示使用 `npm run dev:demo`，默认连接 `https://api.npora.live`，需要网络；`--demo` 是 `--preset demo` 的快捷方式。

## 接入自己的后端

创建时指定地址：

```sh
npx @niping9542/create-nova-admin@latest my-admin --api-url https://api.example.com
```

也可修改生成项目的 `.env.development.local`：

```dotenv
VITE_API_URL=http://localhost:8080
```

修改后重启开发服务。默认 `/api` 前缀在开发代理中移除后转发；生产需要站点服务器转发。项目使用真实 HTTP，不附带本地 Mock。登录、动态菜单和系统管理需要可用的后端。

请求函数位于 `src/api/modules/`，DTO 位于 `src/api/types/`，响应协议集中在 `src/api/protocol/index.ts`。具体接口见生成项目的 `docs/api.md`。完整演示使用自定义 `--api-url` 时，按生成器提示的 `npm run dev` 启动，让本机地址配置生效。

## 生成后的目录

| 目录                          | 职责                                          | 包含的模板       |
| ----------------------------- | --------------------------------------------- | ---------------- |
| `src/`                        | 基础页面、布局、系统管理、API、状态和公共组件 | 全部             |
| `database/mysql/`             | 正式权限、字典和索引 SQL                      | 全部             |
| `public/`、`build/`           | 静态资源、构建和启动加载层                    | 全部             |
| `scripts/`、`tests/`、`docs/` | 所选模板的运行、验证和开发说明                | 全部             |
| `workers/api/`                | 独立后端参考实现及 SQLite 迁移                | `worker`、`demo` |
| `examples/`                   | 演示页面、数据与专属逻辑                      | `demo`           |
| `deploy/`                     | 展示站实现                                    | `demo`           |

`scaffold/` 和生成器维护工具不进入生成项目。`node_modules/`、`dist/`、本机配置、密钥和 Git 历史不随模板复制。

### 正式 SQL

在空 MySQL 数据库中，按生成项目的 `database/mysql/README.md` 依次导入：

1. `01-schema.sql`：用户、部门、角色、菜单及关联表，包含索引和约束。
2. `02-seed.sql`：基础部门、角色、菜单、按钮权限及授权关系。
3. `03-dictionaries.sql`：字典类型、数据、选项及权限。
4. `04-query-indexes.sql`：列表、筛选和树形查询索引。

管理员和密码哈希由实际后端初始化；已有数据库按增量迁移说明升级。Worker 的 SQLite 迁移与 MySQL SQL 分开使用。

### 开发命令

| 命令                                      | 用途                           |
| ----------------------------------------- | ------------------------------ |
| `npm run dev`                             | 启动前端，按本机配置访问后端   |
| `npm run build`                           | 类型检查并构建核心前端         |
| `npm run check`                           | 核心格式、类型与测试           |
| `npm run preview`                         | 预览静态产物，API 转发仍需提供 |
| `npm run check:backend`                   | 检查可选后端，限 Worker/演示版 |
| `npm run dev:demo` / `npm run build:demo` | 开发/构建完整演示，限演示版    |

生成项目包含 `docs/new-business-page.md`，说明新增业务、表格分页配置、表单、菜单和权限的接入方式。命令以实际生成的 `package.json` 为准。

## 选项

| 选项                           | 说明                                                    |
| ------------------------------ | ------------------------------------------------------- |
| `[project-name]`               | 单级项目名，使用小写字母、数字、连字符、下划线或点      |
| `-y, --yes`                    | 跳过交互；未指定名称时使用 `nova-admin-app`，默认纯净版 |
| `--preset <preset>`            | `starter`、`worker`、`demo`                             |
| `--demo`                       | `--preset demo` 的快捷方式                              |
| `--api-url <url>`              | HTTP/HTTPS 后端地址，不接受凭据、查询参数或片段         |
| `--ref <ref>`                  | 模板分支或标签，默认 `main`                             |
| `--template-dir <directory>`   | 使用本地完整模板目录                                    |
| `-V, --version` / `-h, --help` | 查看版本/帮助                                           |

已有目标目录不会覆盖。生成器不自动安装依赖、启动后端、执行 SQL 或部署网站。

## 环境与维护

Node.js 要求见 `package.json`；后端检查需要 Node.js 22.13+。以 npm 和 `package-lock.json` 维护，生成项目不设置 `packageManager`，使用者可选择 npm、pnpm 或 Yarn。在线创建需要访问 npm 和 GitHub。

生成器只负责获取和组合文件；基础功能、组件、接口及依赖版本在 `admin-template` 维护。只修改模板时，无需重新发布生成器，之后创建的项目会获取所选分支的新内容；已经创建的项目不会自动更新。

在本仓库验证生成器：

```sh
npm ci
npm run check
npm pack --dry-run
```

与相邻模板一起验证三种真实生成结果：

```sh
node ../admin-template/scripts/check-presets.mjs .
```

CI 在 Node.js 22、24 上检查生成器和打包内容，并使用 npm/pnpm 验证三种模板的独立安装、类型、测试和构建。CI 不发布 npm 或部署网站。生成项目只保留自身的应用 CI。

修改生成器逻辑或本 README 后，需要递增 npm 版本并发布，npm 用户才能拿到这些修改：

```sh
npm version patch --no-git-tag-version
npm run check
npm pack --dry-run
# 提交并推送已检查的修改后发布
npm publish --access public --registry=https://registry.npmjs.org/
```

登录失效时执行 `npm login --auth-type=web --registry=https://registry.npmjs.org/`。发布后用 `npm view @niping9542/create-nova-admin version dist-tags --json` 确认公开版本。Git 推送不会自动发布 npm。

当前生成器支持 npm 版模板快照，并保留旧版 pnpm 快照兼容能力。模板依赖变更后，在模板仓库执行 `npm run update:presets` 并检查生成结果。

[生成器源码](https://github.com/npora/create-admin) · [模板源码](https://github.com/npora/admin-template) · [变更记录](CHANGELOG.md) · [MIT 许可证](LICENSE)。第三方依赖遵循各自许可证。
