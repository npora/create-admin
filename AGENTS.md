# 生成器协作约定

- 生成器支持 Vue 与 React 两种纯净后台模板，功能覆盖一致，框架和 UI 技术栈不同。默认 Vue；`--framework` 可显式选择。仅保留 `starter`，不生成 Worker 或演示版。
- Vue、React 和生成器是配套项目；共用功能、配置、生成行为或文档变更须同一轮检查并同步三方。发布版本号和 `vX.Y.Z` 标签保持一致。默认模板引用：Vue 使用与生成器版本对应的模板标签，React 使用同版本标签；`--ref` 可覆盖。调整生成行为时核对两套模板目录结构、环境配置、MySQL 文档和生成后的安装与构建。
- CLI 的成功摘要和 `--help` 要醒目列出官网、Vue 演示、React 演示及 Request 控制台地址。任一地址变化时，同步检查 CLI、README 和 `online-npora/www/` 的入口文案。
- 修改框架选项、模板内容、命令或支持状态时，同步检查 README、变更记录及 Vue/React 模板说明；公开 npm 包的能力描述以实际发布产物为准，并与仓库源码状态区分。
- 验证入口为 `npm run check` 和 `npm pack --dry-run --json`。修改生成结果时，在隔离临时目录分别生成 Vue、React 项目，并验证安装、检查和构建。
- 生成器是三仓库中唯一发布 npm 包的项目；Vue 与 React 发布公开 GitHub Release，不发布 npm。Git 提交、推送和发布按本次用户授权执行。
