# @npora/create-admin

创建 Vue 3、TypeScript、Element Plus 和 Pinia 后台项目，内置登录、动态菜单、权限、系统管理和操作审计。

[在线演示](https://admin.npora.live)使用公开账号 `admin` 和演示密码 `123456`。体验会话撤销时，请使用自行创建的测试账号。

## 快速开始

建议使用 Node.js 24 LTS。生成器最低要求 Node.js 22.12，并支持 npm、pnpm 和 Yarn。

```sh
npx @npora/create-admin@latest my-admin --yes --preset starter --install npm
cd my-admin
npm run dev
```

省略 `--yes` 可交互选择模板。省略 `--install` 时，非交互模式默认跳过安装。运行 `npx @npora/create-admin@latest --help` 查看参数。

| 模板              | 内容                                                 |
| ----------------- | ---------------------------------------------------- |
| `starter`（默认） | 核心前端和 MySQL 脚本，使用自有后端                  |
| `worker`          | 核心前端和 Worker 参考后端，按项目内说明初始化后端   |
| `demo`            | 展示页面和参考后端，使用 `npm run dev:demo` 启动前端 |

通过 `--preset worker` 或 `--preset demo` 选择对应模板。使用自有后端时，可传入 `--api-url https://api.example.com`，也可在生成项目的 `.env.development.local` 中设置 `VITE_API_URL`。

## 账号与权限

- 在个人中心查看活跃会话，撤销单个其他会话或退出全部其他会话。
- 在用户管理预览指定用户生效的菜单与按钮权限，查看角色或继承来源。
- 获得授权的管理员可查询和撤销指定用户的会话，撤销结果可在操作审计日志中查询。
- 登录后访问未获授权的内置系统管理页会显示 403，并提供返回首页的入口。

三种模板都包含这些界面和接口说明。纯净版需要自有后端提供相应接口，数据库文件仅包含 MySQL，按生成项目 `database/mysql/README.md` 初始化或增量升级。Worker 版和展示版提供参考实现和 SQLite 迁移。Google Authenticator 默认关闭。

## 使用文档

- [登录、首页和系统管理截图](https://github.com/npora/admin-template/tree/main/docs/showcase) · [会话管理与权限预览](https://github.com/npora/admin-template/blob/main/docs/account-management.md)
- [接口契约](https://github.com/npora/admin-template/blob/main/docs/api.md) · [接入自有后端](https://github.com/npora/admin-template/blob/main/docs/backend-replacement.md)
- [MySQL 初始化与迁移](https://github.com/npora/admin-template/tree/main/database/mysql) · [登录与验证器设置](https://github.com/npora/admin-template/blob/main/docs/authentication.md)
- [模板源码](https://github.com/npora/admin-template) · [变更记录](CHANGELOG.md) · [许可证](LICENSE)
