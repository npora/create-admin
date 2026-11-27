# @npora/create-admin

创建 Vue 或 React 的 TypeScript 纯净后台项目，内置登录、动态菜单、权限、系统管理和操作审计。支持搜索可访问的菜单，并在本机设置主题色、菜单布局和页签风格。

[![操作演示 GIF，展示登录、首页、用户管理和操作审计](https://raw.githubusercontent.com/npora/admin-template/main/docs/showcase/overview.gif)](https://admin.npora.live)

[Npora 官网](https://www.npora.live/) · [Vue 在线演示](https://admin.npora.live/) · [React 在线演示](https://react.npora.live/)

Vue 与 React 在线演示均已开放。Vue 演示使用公开账号 `admin` 和演示密码 `123456`；体验会话撤销时，请使用自行创建的测试账号。

## 快速开始

建议使用 Node.js 24 LTS。生成器 CLI 最低要求 Node.js 22.12；生成的 Vue / React 项目需要 Node.js 22.18 或更新的 22.x，或 Node.js 24.11 及以上版本。生成器支持 npm、pnpm 和 Yarn。

```sh
npx @npora/create-admin@latest my-admin --yes --framework vue --install npm
cd my-admin
```

生成器支持 Vue 和 React 两种纯净后台模板。交互运行时，省略 `--yes` 和 `--framework` 会提示选择框架；省略项目名称时会询问项目目录名，随后可选择 npm、pnpm、Yarn 或跳过安装。无交互运行默认使用 Vue，也可通过 `--framework react` 选择 React。省略 `--install` 时，非交互模式默认跳过安装。运行 `npx @npora/create-admin@latest --help` 查看参数。

Vue 和 React 模板的功能覆盖一致，框架与 UI 技术栈不同。仓库当前源码支持交互选择两种模板；`npx @npora/create-admin@latest` 使用 npm 最新发布版，能力以该版本实际发布内容为准。

| 框架 | 选择参数 | 模板技术栈 |
| --- | --- | --- |
| Vue（默认） | `--framework vue` | Vue 3、Element Plus、Pinia |
| React | `--framework react` | React、Ant Design |

CLI 兼容 `--preset starter`。旧版的 `--preset worker`、`--preset demo` 和 `--demo` 已移除，体验功能请访问在线演示。向新项目传入 `--api-url https://api.example.com` 会写入 `.env.development`。项目根目录使用 `.env`、`.env.development` 和 `.env.production` 分别配置通用、开发和生产环境。

Vue 默认下载与生成器版本一致的模板标签，React 默认下载 React 模板的 `main` 分支。用 `--ref` 可指定标签或分支，用 `--template-dir` 可验证本地模板。

启动纯净版前，按生成项目的 `database/mysql/README.md` 准备表结构与基础权限，由自有后端初始化首个管理员。后端启动且开发代理已配置后，运行 `npm run dev` 并用该管理员账号登录。

纯净版保留核心前端、静态资源、MySQL 脚本和开发所需的构建配置、文档与测试。生成项目不包含 Workers、演示页面或部署工具，也没有 `VITE_DEMO_ENABLED`。Google Authenticator 默认关闭。

## 账号与权限

- 在个人中心查看活跃会话，撤销单个其他会话或退出全部其他会话。
- 在用户管理预览指定用户生效的菜单与按钮权限，查看角色或继承来源。
- 获得授权的管理员可查询和撤销指定用户的会话，撤销结果可在操作审计日志中查询。
- 登录后访问未获授权的内置系统管理页会显示 403，并提供返回首页的入口。

Vue 与 React 纯净版均需自有后端提供相应接口。按生成项目 `database/mysql/README.md` 初始化或增量升级。Google Authenticator 默认关闭。

## 使用文档

- [应用设置、菜单搜索与缓存](https://github.com/npora/admin-template/blob/main/docs/development.md#本地偏好与缓存)
- [登录、首页和系统管理截图](https://github.com/npora/admin-template/tree/main/docs/showcase) · [会话管理与权限预览](https://github.com/npora/admin-template/blob/main/docs/account-management.md)
- [接口契约](https://github.com/npora/admin-template/blob/main/docs/api.md) · [接入自有后端](https://github.com/npora/admin-template/blob/main/docs/backend-replacement.md)
- [Vue 在线数据库指南](https://admin.npora.live/database/) · [React 在线数据库指南](https://react.npora.live/database/)
- [MySQL 初始化与迁移](https://github.com/npora/admin-template/tree/main/database/mysql) · [登录与验证器设置](https://github.com/npora/admin-template/blob/main/docs/authentication.md)
- [Vue 模板源码](https://github.com/npora/admin-template) · [React 模板源码](https://github.com/npora/admin-template-react) · [变更记录](CHANGELOG.md) · [许可证](LICENSE)

## 在线资源

- 官网：<https://www.npora.live/>
- Vue 后台演示：<https://admin.npora.live/>
- React 后台演示：<https://react.npora.live/>
- `@npora/request` 控制台：<https://request.npora.live/>
