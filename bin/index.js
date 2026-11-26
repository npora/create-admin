#!/usr/bin/env node

import { Command, Option } from 'commander';
import { createInterface } from 'node:readline/promises';
import { readFile } from 'node:fs/promises';
import ora from 'ora';
import chalk from 'chalk';
import { createProject } from '../src/create-project.js';
import { FRAMEWORKS, resolveFramework, resolvePreset } from '../src/presets.js';
import {
  installProject,
  projectCommands,
  resolveInstallChoice
} from '../src/install.js';

const pkg = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8')
);
const program = new Command();
const onlineLinks = [
  ['官网', 'https://www.npora.live/'],
  ['Vue 后台演示', 'https://admin.npora.live/'],
  ['React 后台演示', 'https://react.npora.live/'],
  ['Request 控制台', 'https://request.npora.live/']
];

program
  .name('create-admin')
  .version(pkg.version)
  .description('创建 Vue 或 React 纯净后台项目')
  .argument('[project-name]', '项目名称，例如 my-admin')
  .option('-y, --yes', '无交互创建；未指定名称时使用 nova-admin-app')
  .option('--framework <framework>', '框架：vue（默认）、react')
  .option('--preset <preset>', '兼容参数，支持 starter')
  .addOption(new Option('--demo').hideHelp())
  .option('--api-url <url>', '配置自己的 HTTP 后端地址')
  .option('--ref <ref>', '模板分支或标签（Vue 默认为生成器同版本标签，React 默认为 main）')
  .option('--install <manager>', '创建后安装依赖：npm、pnpm、yarn、skip')
  .option('--template-dir <directory>', '从本地模板创建，供离线开发和验证')
  .addHelpText(
    'after',
    `\n在线资源：\n${onlineLinks.map(([label, url]) => `  ${label} ${url}`).join('\n')}\n`
  )
  .action(async (projectName, options) => {
    const preset = resolvePreset(options.preset, options.demo);
    let framework =
      options.framework === undefined ? undefined : resolveFramework(options.framework);
    let install = resolveInstallChoice(options.install);
    let project;
    if (!projectName && !options.yes && !process.stdin.isTTY)
      throw new Error('请提供项目名称，或使用 --yes 采用默认名称。');
    if (
      process.stdin.isTTY &&
      !options.yes &&
      (!projectName || !framework)
    ) {
      const prompt = createInterface({
        input: process.stdin,
        output: process.stdout
      });
      try {
        if (!projectName)
          projectName =
            (await prompt.question('项目名称 (nova-admin-app): ')).trim() ||
            'nova-admin-app';
        if (!framework) {
          console.log('选择框架：\n  1. Vue（默认）\n  2. React');
          while (!framework) {
            const answer = (await prompt.question('请选择 (1): ')).trim() || '1';
            framework = { 1: 'vue', 2: 'react', vue: 'vue', react: 'react' }[answer];
            if (!Object.hasOwn(FRAMEWORKS, framework)) {
              framework = undefined;
              console.log('请输入 1、2 或框架名称。');
            }
          }
        }
      } finally {
        prompt.close();
      }
    }
    projectName ||= 'nova-admin-app';
    framework = resolveFramework(framework);
    const spinner = ora(
      options.templateDir ? '正在准备本地模板…' : '正在获取 Npora Admin 模板…'
    ).start();
    try {
      project = await createProject({
        projectName,
        ...options,
        preset,
        framework,
        ref: options.ref ?? (framework === 'vue' ? `v${pkg.version}` : 'main'),
        apiURL: options.apiUrl
      });
      spinner.succeed('项目已创建');
      console.log(
        chalk.green(
          `\n${project.projectName} 初始化完成（${project.presetLabel}）。`
        )
      );
      if (install === undefined && process.stdin.isTTY && !options.yes) {
        const prompt = createInterface({
          input: process.stdin,
          output: process.stdout
        });
        try {
          console.log(
            '是否立即安装依赖？\n  1. npm\n  2. pnpm\n  3. Yarn\n  4. 跳过（默认）'
          );
          while (install === undefined) {
            const answer =
              (await prompt.question('请选择 (4): ')).trim() || '4';
            install = {
              1: 'npm',
              2: 'pnpm',
              3: 'yarn',
              4: 'skip',
              npm: 'npm',
              pnpm: 'pnpm',
              yarn: 'yarn',
              skip: 'skip'
            }[answer];
            if (!install) console.log('请输入 1、2、3、4 或包管理器名称。');
          }
        } finally {
          prompt.close();
        }
      }
      const manager = install && install !== 'skip' ? install : 'npm';
      const commands = projectCommands(project, manager);
      if (install && install !== 'skip') {
        console.log(`正在使用 ${manager} 安装依赖…`);
        await installProject(project, manager);
        console.log('依赖安装完成。');
      }
      console.log(
        `\n  cd ${project.projectName}\n  ${install && install !== 'skip' ? '' : `${commands.install}\n  `}${commands.start}\n`
      );
      console.log('支持 npm、pnpm 或 Yarn，不限制包管理器版本。');
      if (options.apiUrl !== undefined)
        console.log(
          '已在 .env.development 配置后端地址，请使用该后端初始化的账号。'
        );
      else
        console.log(
          '请先启动自己的后端，或修改 .env.development 中的 VITE_API_URL。'
        );
      console.log(
        'MySQL 初始化使用 database/mysql/init.sh，已有数据库的升级步骤见 database/mysql/README.md。'
      );
      console.log(chalk.bold.cyan('\n在线资源与演示'));
      for (const [label, url] of onlineLinks)
        console.log(`  ${chalk.bold(label)}  ${chalk.cyan(url)}`);
    } catch (error) {
      if (!project) spinner.fail('项目创建失败');
      else {
        const manager = install && install !== 'skip' ? install : 'npm';
        const commands = projectCommands(project, manager);
        console.error(
          `项目已保留在 ${project.directory}。可稍后重试：\n  cd ${project.projectName}\n  ${commands.install}\n  ${commands.start}`
        );
      }
      throw error;
    }
  });

try {
  await program.parseAsync(process.argv);
} catch (error) {
  console.error(
    chalk.red(error.message || '创建失败，请检查模板和网络后重试。')
  );
  process.exitCode = 1;
}
