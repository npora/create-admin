import {
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile
} from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { downloadTemplate } from 'giget';
import { composePreset, FRAMEWORKS, resolveFramework, resolvePreset } from './presets.js';

const TEMPLATE_REPOSITORIES = {
  vue: 'github:npora/admin-template',
  react: 'github:npora/admin-template-react'
};

export function validateProjectName(name) {
  if (
    typeof name !== 'string' ||
    name.length > 214 ||
    !/^[a-z0-9][a-z0-9._-]*$/.test(name) ||
    ['node_modules', 'favicon.ico'].includes(name) ||
    /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name)
  ) {
    throw new Error(
      '项目名请使用小写字母、数字、连字符、下划线或点，不能是路径或保留名称。'
    );
  }
  return name;
}

export function normalizeApiURL(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('后端地址必须是完整的 http:// 或 https:// URL。');
  }
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      '后端地址只支持 HTTP/HTTPS，不能包含账号、密码、查询参数或片段。'
    );
  }
  return url.toString().replace(/\/$/, '');
}

const rootEnvFiles = new Set([
  '.env',
  '.env.development',
  '.env.production'
]);

const excluded = new Set([
  '.git',
  'AGENTS.md',
  '.agents',
  '.codex',
  '.aws',
  '.idea',
  'node_modules',
  'dist',
  'dist-ssr',
  '.cloudflare',
  '.wrangler',
  'coverage',
  '.pnpm-store',
  '.dev.vars',
  '.DS_Store',
  'report.html'
]);

async function copyTemplate(
  source,
  destination,
  { contentsOnly = false } = {}
) {
  const options = {
    recursive: true,
    force: false,
    errorOnExist: true,
    filter: async (entry) => {
      const name = path.basename(entry);
      const isEnv = name === '.env' || name.startsWith('.env.');
      const extraRootEnv =
        path.dirname(entry) === source && isEnv && !rootEnvFiles.has(name);
      const workerEnv =
        path.relative(source, entry).split(path.sep).includes('workers') &&
        isEnv &&
        !name.endsWith('.example');
      const privateVars =
        name.startsWith('.dev.vars.') && !name.endsWith('.example');
      return (
        !excluded.has(name) &&
        !extraRootEnv &&
        !workerEnv &&
        !privateVars &&
        !name.endsWith('.local') &&
        !name.endsWith('.log') &&
        !(await lstat(entry)).isSymbolicLink()
      );
    }
  };
  if (contentsOnly) {
    // The caller exclusively created the target. Copy new children without
    // asking fs.cp to merge the existing root (which fails on Node 24).
    for (const entry of await readdir(source)) {
      await cp(
        path.join(source, entry),
        path.join(destination, entry),
        options
      );
    }
  } else {
    await cp(source, destination, options);
  }
}

async function validateTemplate(directory, framework) {
  const metadataPath = path.join(directory, 'scaffold/metadata.json');
  let legacyVue = false;
  if (framework === 'vue') {
    try {
      legacyVue = (await lstat(metadataPath)).isFile();
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  const required = [
    framework === 'vue' ? 'src/main.ts' : 'src/main.tsx',
    'database/mysql/01-schema.sql',
    'database/mysql/02-seed.sql'
  ];
  if (legacyVue) {
    const metadata = JSON.parse(await readFile(metadataPath, 'utf8'));
    const lockfile =
      metadata.version === 2 ? 'package-lock.json' : 'pnpm-lock.yaml';
    required.push(
      lockfile,
      `scaffold/core/${lockfile}`,
      'scaffold/core/package.json',
      'scaffold/core/vite.config.ts',
      'scaffold/core/src/router/extensions.ts'
    );
  } else {
    required.push('package-lock.json', 'vite.config.ts');
    for (const entry of [
      'examples',
      'deploy',
      'workers',
      'src/views/examples',
      'src/views/dashboard/demo'
    ]) {
      try {
        const location = path.join(directory, entry);
        if (
          !(await lstat(location)).isDirectory() ||
          (await readdir(location, { recursive: true, withFileTypes: true }))
            .some((child) => !child.isDirectory())
        ) {
          throw new Error(`模板包含 ${entry}，请使用纯净版模板。`);
        }
        await rm(location, { recursive: true });
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
  }
  for (const file of required) {
    try {
      if (!(await lstat(path.join(directory, file))).isFile())
        throw new Error();
    } catch {
      throw new Error(`模板缺少 ${file}，请使用对应框架的纯净版模板。`);
    }
  }
  const pkg = JSON.parse(
    await readFile(path.join(directory, 'package.json'), 'utf8')
  );
  if (!pkg.scripts?.dev || !pkg.scripts?.build) {
    throw new Error('模板缺少开发或构建命令。');
  }
  return { pkg, legacyVue };
}

export async function createProject({
  projectName,
  cwd = process.cwd(),
  demo = false,
  preset,
  framework,
  apiURL,
  ref = 'main',
  templateDir,
  download = downloadTemplate
}) {
  validateProjectName(projectName);
  const selected = resolvePreset(preset, demo);
  framework = resolveFramework(framework);
  if (
    !/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(ref) ||
    ref.includes('..') ||
    ref.includes('//') ||
    ref.endsWith('/')
  ) {
    throw new Error('模板版本必须是有效的分支或标签名称。');
  }
  const backend =
    apiURL === undefined ? undefined : normalizeApiURL(apiURL);
  const target = path.resolve(cwd, projectName);
  try {
    await lstat(target);
    throw new Error(
      `目录 ${projectName} 已存在，请换一个项目名；不会覆盖已有内容。`
    );
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const temporary = await mkdtemp(
    path.join(tmpdir(), 'create-nova-admin-')
  );
  const prepared = path.join(temporary, 'prepared');
  let created = false;
  try {
    if (templateDir) {
      const source = path.resolve(cwd, templateDir);
      if (!(await lstat(source)).isDirectory())
        throw new Error('本地模板必须是目录。');
      const relative = path.relative(source, temporary);
      if (
        !relative ||
        (!relative.startsWith(`..${path.sep}`) &&
          relative !== '..' &&
          !path.isAbsolute(relative))
      ) {
        throw new Error('本地模板不能包含生成器的临时工作目录。');
      }
      await copyTemplate(source, prepared);
    } else {
      const downloaded = path.join(temporary, 'downloaded');
      await download(`${TEMPLATE_REPOSITORIES[framework]}#${ref}`, {
        dir: downloaded,
        force: false,
        registry: false
      });
      await copyTemplate(downloaded, prepared);
    }
    const { pkg: original, legacyVue } = await validateTemplate(prepared, framework);
    const pkg = await composePreset(prepared, original, legacyVue);
    pkg.name = projectName;
    pkg.private = true;
    await writeFile(
      path.join(prepared, 'package.json'),
      `${JSON.stringify(pkg, null, 2)}\n`
    );
    // npm 锁文件的项目名称同步为生成项目名称，保留完整依赖解析结果。
    try {
      const lockPath = path.join(prepared, 'package-lock.json');
      const lock = JSON.parse(await readFile(lockPath, 'utf8'));
      lock.name = projectName;
      if (lock.packages?.['']) lock.packages[''].name = projectName;
      await writeFile(lockPath, JSON.stringify(lock, null, 2) + '\n');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    const developmentPath = path.join(prepared, '.env.development');
    const previousDevelopment = await readFile(developmentPath, 'utf8').catch(
      (error) => {
        if (error.code === 'ENOENT') return '';
        throw error;
      }
    );
    const developmentApiURL =
      backend ?? 'http://localhost:8080';
    const values = new Map([['VITE_DEMO_ENABLED', undefined]]);
    if (developmentApiURL) {
      // Vite expands dollar signs when loading dotenv files.
      const escapedApiURL = developmentApiURL.replaceAll('$', () => '\\$');
      values.set('VITE_API_URL', escapedApiURL);
    }
    const development = previousDevelopment
      .split(/\r?\n/)
      .filter((line) => {
        const key = /^\s*(?:export\s+)?(\w+)\s*=/.exec(line)?.[1];
        return !values.has(key);
      })
      .join('\n')
      .trimEnd();
    const settings = [...values]
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => `${key}=${value}`);
    await writeFile(
      developmentPath,
      [development, ...settings].filter(Boolean).join('\n') + '\n'
    );
    for (const name of ['.env', '.env.production'])
      await writeFile(path.join(prepared, name), '', { flag: 'a' });

    // 独占创建目标：下载期间出现同名目录时也不覆盖。
    await mkdir(target);
    created = true;
    await copyTemplate(prepared, target, { contentsOnly: true });
    return {
      directory: target,
      projectName,
      framework,
      preset: selected,
      presetLabel: `${FRAMEWORKS[framework]} 纯净后台`,
      startCommand: 'npm run dev'
    };
  } catch (error) {
    if (created) await rm(target, { recursive: true, force: true });
    throw error;
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}
