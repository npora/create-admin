import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { readFile, mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const cli = path.join(root, 'bin/index.js');
const run = (args, cwd = root) =>
  spawnSync(process.execPath, [cli, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1' },
    timeout: 10000
  });

test('package name, binary, lock metadata and CLI version agree', async () => {
  const pkg = JSON.parse(await readFile(path.join(root, 'package.json')));
  const lock = JSON.parse(await readFile(path.join(root, 'package-lock.json')));
  assert.deepEqual(pkg.bin, { 'create-admin': 'bin/index.js' });
  assert.equal(lock.name, pkg.name);
  assert.equal(lock.packages[''].name, pkg.name);
  assert.deepEqual(lock.packages[''].bin, pkg.bin);
  assert.equal(run(['--version']).stdout.trim(), pkg.version);
  assert.match(run(['--help']).stdout, /--framework/);
  assert.match(run(['--help']).stdout, /https:\/\/www\.npora\.live/);
  assert.match(run(['--help']).stdout, /--preset/);
  assert.match(run(['bad', '--preset', 'unknown']).stderr, /模板仅支持/);
  assert.match(run(['bad', '--framework', 'unknown']).stderr, /框架仅支持/);
  for (const flags of [['--demo'], ['--preset', 'demo'], ['--preset', 'worker']]) {
    const rejected = run(['bad', ...flags]);
    assert.equal(rejected.status, 1);
    assert.match(rejected.stderr, /已移除/);
  }
});

test('noninteractive missing name and invalid paths exit unsuccessfully without creating files', async (t) => {
  const cwd = await mkdtemp(path.join(tmpdir(), 'nova-cli-command-'));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const missing = run([], cwd);
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /提供项目名称/);
  const invalid = run(['../outside'], cwd);
  assert.equal(invalid.status, 1);
  assert.match(invalid.stderr, /项目名/);
  const broken = run(['my-admin', '--template-dir', './missing-template'], cwd);
  assert.equal(broken.status, 1);
});

test('successful project creation highlights all online resources', async (t) => {
  const cwd = await mkdtemp(path.join(tmpdir(), 'nova-cli-resources-'));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const template = path.join(cwd, 'template');
  for (const directory of ['src', 'database/mysql'])
    await mkdir(path.join(template, directory), { recursive: true });
  await writeFile(
    path.join(template, 'package.json'),
    JSON.stringify({ name: 'fixture', scripts: { dev: 'vite', build: 'vite build' } })
  );
  await writeFile(path.join(template, 'package-lock.json'), '{}\n');
  await writeFile(path.join(template, 'vite.config.ts'), 'export default {};\n');
  await writeFile(path.join(template, 'src/main.ts'), 'export {};\n');
  await writeFile(path.join(template, 'database/mysql/01-schema.sql'), '-- schema\n');
  await writeFile(path.join(template, 'database/mysql/02-seed.sql'), '-- seed\n');

  const result = run(
    ['my-admin', '--yes', '--framework', 'vue', '--template-dir', './template', '--install', 'skip'],
    cwd
  );
  assert.equal(result.status, 0, result.stderr);
  for (const text of [
    '在线资源与演示',
    '官网  https://www.npora.live/',
    'Vue 后台演示  https://admin.npora.live/',
    'React 后台演示  https://react.npora.live/',
    'Request 控制台  https://request.npora.live/'
  ])
    assert.ok(result.stdout.includes(text), `missing ${text} in CLI output`);
});
