import { spawn } from 'node:child_process';

export const INSTALL_CHOICES = ['npm', 'pnpm', 'yarn', 'skip'];

export function resolveInstallChoice(value) {
  if (value !== undefined && !INSTALL_CHOICES.includes(value))
    throw new Error('安装选项仅支持 npm、pnpm、yarn、skip。');
  return value;
}

export function projectCommands(project, manager = 'npm') {
  if (!['npm', 'pnpm', 'yarn'].includes(manager))
    throw new Error('不支持的包管理器。');
  return {
    install: `${manager} install`,
    start: project.startCommand.replace(
      /^npm run /,
      manager === 'yarn' ? 'yarn ' : `${manager} run `
    )
  };
}

/** 只在项目生成后按用户选择安装；失败不删除已经创建的项目。 */
export async function installProject(project, manager) {
  projectCommands(project, manager);
  await new Promise((resolve, reject) => {
    const child = spawn(manager, ['install'], {
      cwd: project.directory,
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });
    child.once('error', (error) =>
      reject(
        new Error(
          error.code === 'ENOENT'
            ? `未找到 ${manager}，请先安装该包管理器后重试。`
            : error.message
        )
      )
    );
    child.once('close', (code, signal) => {
      if (code === 0 && !signal) resolve();
      else
        reject(new Error(`${manager} install 未完成（${signal || code}）。`));
    });
  });
}
