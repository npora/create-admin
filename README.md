# Create Nova Admin

创建简洁、可扩展业务的 Vue 3 + TypeScript + Element Plus + Pinia 后台框架。

生成器从 [admin-template](https://github.com/npora/admin-template) 获取模板，默认使用与生成器版本一致的 Tag（例如 `v1.0.11`），也可通过 `--ref main` 跟随开发分支。基础功能包含登录、首页、布局、动态菜单、用户/部门/角色/菜单/字典管理、按钮权限、个人中心、多语言和主题。

## 在线演示

[打开展示网站](https://admin.npora.live) · [演示 API 健康检查](https://api.npora.live/health)

账号：`admin`，密码：`123456`。这是展示站账号，不是正式 SQL 自动创建的账号。

## 创建项目

```sh
npx @niping9542/create-nova-admin@latest my-admin --install npm
cd my-admin
npm run dev
```

按提示选择模板，直接回车默认创建纯净后台。项目生成后可选择 npm、pnpm、Yarn 或跳过安装；默认跳过。安装成功后打印对应工具的启动命令。也可明确指定：

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

### 自动安装依赖

```sh
npx @niping9542/create-nova-admin@latest my-admin --yes --install npm
# 也支持 --install pnpm、--install yarn、--install skip
```

非交互或 `--yes` 默认跳过安装，只有明确传入 `--install` 时才安装。选择的包管理器需预先安装。安装失败时保留生成项目并返回非零状态，按提示进入项目重新执行安装即可；不会自动启动开发服务。

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
| `--ref <ref>`                  | 模板分支或标签，默认与生成器版本相同的 Tag              |
| `--install <manager>`          | npm、pnpm、yarn 或 skip；非交互默认 skip                |
| `--template-dir <directory>`   | 使用本地完整模板目录                                    |
| `-V, --version` / `-h, --help` | 查看版本/帮助                                           |

已有目标目录不会覆盖。仅在用户选择后安装依赖，不自动启动后端、执行 SQL 或部署网站。

## 环境与维护

Node.js 要求见 `package.json`；后端检查需要 Node.js 22.13+。以 npm 和 `package-lock.json` 维护，生成项目不设置 `packageManager`，使用者可选择 npm、pnpm 或 Yarn。在线创建需要访问 npm 和 GitHub。

生成器负责获取、组合文件及可选的依赖安装；基础功能、组件、接口及依赖版本在 `admin-template` 维护。只修改模板时，无需重新发布生成器，使用 `--ref main` 创建的项目会获取开发分支的新内容；默认命令获取对应版本 Tag；已经创建的项目不会自动更新。

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

## 统一版本和自动发布

两个仓库使用同一版本号和 `v<版本号>` Tag。只有 `create-admin` 发布 npm；`admin-template` 是私有 npm 包，仅创建 GitHub Release 和源码 Tag。基础功能和依赖在模板仓库维护。

两个本地目录相邻时，在任一仓库运行：

```sh
npm run release:prepare -- patch
# 也支持 minor、major，或明确版本号，例如 1.1.0
```

该命令一次更新两个仓库的 `package.json`、npm 锁文件、纯净版快照及其校验值，不会提交或发布。检查通过并分别提交、推送后，先推送模板 Tag，再推送生成器的同名 Tag：

```sh
# 在 admin-template 中
 git tag v1.0.11
 git push origin v1.0.11
# 在 create-admin 中
 git tag v1.0.11
 git push origin v1.0.11
```

示例版本应替换为准备命令打印的版本。Tag 工作流会校验两仓库版本、锁文件和模板快照；不一致时停止发布。生成器发布前从相同 Tag 获取模板并验证三种生成结果，之后自动执行 `npm publish` 并创建 GitHub Release。普通分支推送只运行检查，不发布 npm。

### 首次配置 npm Trusted Publisher

在 npm 包 `@niping9542/create-nova-admin` 的 Settings → Trusted publishing 添加 GitHub Actions：

- Organization：`npora`
- Repository：`create-admin`
- Workflow filename：`release.yml`
- 不填写 Environment（工作流未使用环境）
- 允许该工作流执行发布操作

此配置需 npm 包管理员完成一次。工作流使用 OIDC，无需保存 npm Token；未配置时 npm 发布会被拒绝，不能把它当作已经启用的线上发布。详见 [npm 官方说明](https://docs.npmjs.com/trusted-publishers/)。

当前生成器保留旧版 pnpm 快照兼容能力；模板依赖变化后，在模板仓库执行 `npm run update:presets` 并检查生成结果。纯净版与 Worker 版只保留基础开发依赖，不包含构建分析、额外压缩或展示站部署工具。

[生成器源码](https://github.com/npora/create-admin) · [模板源码](https://github.com/npora/admin-template) · [变更记录](CHANGELOG.md) · [MIT 许可证](LICENSE)。第三方依赖遵循各自许可证。
