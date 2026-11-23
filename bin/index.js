#!/usr/bin/env node

import { Command } from 'commander';
import { createInterface } from 'node:readline/promises';
import { readFile } from 'node:fs/promises';
import ora from 'ora';
import chalk from 'chalk';
import { createProject } from '../src/create-project.js';
import { PRESETS, resolvePreset } from '../src/presets.js';
import {
  installProject,
  projectCommands,
  resolveInstallChoice
} from '../src/install.js';

const pkg = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8')
);
const program = new Command();

program
  .name('create-admin')
  .version(pkg.version)
  .description('创建 Vue 3 + TypeScript + Element Plus + Pinia 后台项目')
  .argument('[project-name]', '项目名称，例如 my-admin')
  .option('-y, --yes', '无交互创建；未指定名称时使用 nova-admin-app')
  .option('--preset <preset>', '模板：starter（默认）、worker、demo')
  .option('--demo', '完整演示模板，等同 --preset demo')
  .option('--api-url <url>', '配置自己的 HTTP 后端地址')
  .option('--ref <ref>', '模板分支或标签', `v${pkg.version}`)
  .option('--install <manager>', '创建后安装依赖：npm、pnpm、yarn、skip')
  .option('--template-dir <directory>', '从本地模板创建，供离线开发和验证')
  .action(async (projectName, options) => {
    let preset = options.preset;
    let install = resolveInstallChoice(options.install);
    let project;
    if (!projectName && !options.yes && !process.stdin.isTTY)
      throw new Error('请提供项目名称，或使用 --yes 采用默认名称。');
    if (
      process.stdin.isTTY &&
      !options.yes &&
      (!projectName || (!preset && !options.demo))
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
        if (!preset && !options.demo) {
          console.log(
            '选择模板：\n  1. 纯净后台（默认）\n  2. 后台 + Worker 后端\n  3. 完整演示'
          );
          while (!preset) {
            const answer =
              (await prompt.question('请选择 (1): ')).trim() || '1';
            preset = {
              1: 'starter',
              2: 'worker',
              3: 'demo',
              starter: 'starter',
              worker: 'worker',
              demo: 'demo'
            }[answer];
            if (!preset) console.log('请输入 1、2、3 或模板名称。');
          }
        }
      } finally {
        prompt.close();
      }
    }
    projectName ||= 'nova-admin-app';
    preset = resolvePreset(preset, options.demo);
    const spinner = ora(
      options.templateDir ? '正在准备本地模板…' : '正在获取 Npora Admin 模板…'
    ).start();
    try {
      project = await createProject({
        projectName,
        ...options,
        preset,
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
      if (project.demo)
        console.log('展示需要网络。演示账号：admin，密码：123456。');
      else
        console.log(
          '请先启动自己的后端，或修改 .env.development 中的 VITE_API_URL。'
        );
      console.log(
        '正式权限 SQL：database/mysql/01-schema.sql → 02-seed.sql → 03-dictionaries.sql → 04-query-indexes.sql。'
      );
      if (project.preset === 'worker')
        console.log(
          '后端源码：workers/api/；先迁移数据库并初始化账号，再配置自己的 API 地址。'
        );
      console.log(
        `已生成${PRESETS[project.preset]}所需文件，无需手动删除演示目录。`
      );
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
