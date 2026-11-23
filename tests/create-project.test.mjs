import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  mkdtemp,
  mkdir,
  readFile,
  writeFile,
  symlink,
  chmod,
  realpath,
  lstat,
  readdir,
  rm
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  createProject,
  validateProjectName,
  normalizeApiURL
} from '../src/create-project.js';

async function fixture(t) {
  const cwd = await mkdtemp(path.join(tmpdir(), 'nova-cli-test-'));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const source = path.join(cwd, 'template');
  const files = {
    'package.json': JSON.stringify({
      name: 'template',
      private: true,
      scripts: {
        dev: 'vite',
        'dev:demo': 'node scripts/demo.mjs',
        'update:presets': 'node scripts/update-presets.mjs',
        'check:presets': 'node scripts/check-presets.mjs'
      }
    }),
    'src/main.ts': 'export {};',
    'AGENTS.md': '# Local-only assistant instructions',
    'database/mysql/01-schema.sql': 'CREATE TABLE sys_user (id INT);',
    'database/mysql/02-seed.sql': '-- Basic permissions',
    'database/mysql/03-dictionaries.sql':
      '-- Dictionary tables and permissions',
    'database/mysql/04-query-indexes.sql': '-- Query indexes',
    'database/mysql/05-authenticator.sql':
      '-- Encrypted authenticator bindings',
    'src/components/AuthenticatorSettings/index.vue':
      '<template>Optional authenticator</template>',
    'src/components/DateRangePicker/index.vue':
      '<template>Zoned date range</template>',
    'src/config/datetime.ts':
      'export const defaultTimeZone = "Asia/Shanghai";',
    'src/types/timezone.ts':
      'export const TIME_ZONE = { UTC: "UTC", SHANGHAI: "Asia/Shanghai" };',
    '.env': 'VITE_AUTHENTICATOR_ENABLED=false\n',
    '.env.development': 'VITE_API_URL=http://localhost:8080\nVITE_APP_TITLE=Fixture\n',
    '.env.development.local.example': 'PRIVATE_TOKEN=sample-do-not-copy',
    'src/views/login/index.vue': '<template>Login</template>',
    'src/views/dashboard/index.vue': '<template>Dashboard</template>',
    'src/views/error/403.vue': '<template>Access denied</template>',
    'src/views/system/dict/index.vue':
      '<template>Dictionary management</template>',
    'src/components/DataTable/index.vue':
      '<template>Table and pagination</template>',
    'src/components/DataTable/types.ts':
      'export interface DataTablePagination {}',
    'src/api/protocol/index.ts':
      'export const unwrapApiResponse = (value) => value;',
    'examples/composables/usePaginatedTable.ts':
      '// Example-only table query',
    'build/optional-examples.ts': 'export {};',
    'scripts/demo.mjs': '// Showcase launcher',
    'scripts/lib/vite.mjs': '// Showcase-only Vite launcher',
    'examples/index.ts': 'export {};',
    'workers/api/src/index.mjs': '// Optional backend',
    'public/favicon.svg': '<svg />',
    LICENSE: 'MIT License',
    'CHANGELOG.md': '# Template changes',
    'scaffold/core/docs/new-business-page.md': '# Add a page',
    'scaffold/core/docs/authentication.md':
      '# Authenticator: administrator creation is immediately active',
    'package-lock.json': JSON.stringify({
      name: 'template',
      lockfileVersion: 3,
      packages: { '': { name: 'template' } }
    }),
    'scaffold/metadata.json': JSON.stringify({
      version: 2,
      sourceLockHash: createHash('sha256')
        .update(
          JSON.stringify({
            name: 'template',
            lockfileVersion: 3,
            packages: { '': { name: 'template' } }
          })
        )
        .digest('hex')
    }),
    'docs/api.md': '# API',
    'docs/account-management.md':
      '# Account management\n\n![Account sessions](images/account-management.png)',
    'docs/images/account-management.png': Buffer.from([
      137, 80, 78, 71, 13, 10, 26, 10
    ]),
    '.github/workflows/browser.yml': '# Maintainer browser checks',
    '.github/workflows/ci.yml': '# Template CI',
    '.github/workflows/presets.yml': '# Maintainer integration only',
    'tests/browser/check.spec.mjs': '// Maintainer browser check',
    'tests/integration/views.test.mjs': '// App integration check',
    'scaffold/core/.github/workflows/ci.yml': '# Application CI',
    'scaffold/demo/README.md': '# Full demo',
    'docs/examples.md': '# Examples',
    'deploy/cloudflare/index.mjs': '// deploy',
    'cloudflare.config.ts': '// deployment config',
    'scaffold/core/package.json': JSON.stringify({
      name: 'template',
      private: true,
      scripts: { dev: 'vite' }
    }),
    'scaffold/core/package-lock.json': JSON.stringify({
      name: 'template',
      lockfileVersion: 3,
      packages: { '': { name: 'template' } }
    }),
    'scaffold/core/vite.config.ts': '// Core only',
    'scaffold/core/src/router/extensions.ts': '// Empty routes',
    'scaffold/worker/workers/api/src/config/pages.mjs':
      '// Core page catalogue',
    'scaffold/worker/workers/api/migrations/0002_seed.sql':
      '-- Core permissions',

    '.env.development.local': 'PRIVATE_TOKEN=do-not-copy',
    'workers/api/.local/credentials.json': 'do-not-copy',
    'workers/api/.dev.vars': 'AUTH_TOTP_KEY=private-do-not-copy',
    'workers/api/.dev.vars.production':
      'AUTH_TOTP_KEY=private-do-not-copy',
    'workers/api/.env': 'AUTH_TOTP_KEY=private-do-not-copy',
    'workers/api/.env.production': 'AUTH_TOTP_KEY=private-do-not-copy',
    'workers/api/.dev.vars.example': 'AUTH_TOTP_KEY=fill-in-locally',
    'workers/api/.env.example': 'AUTH_TOTP_ENABLED=false',
    'node_modules/private.txt': 'do-not-copy',
    '.git/config': 'do-not-copy',
    '.cloudflare/cache.json': 'do-not-copy',
    'dist/index.html': 'do-not-copy'
  };
  for (const [name, text] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(source, name)), {
      recursive: true
    });
    await writeFile(path.join(source, name), text);
  }
  await symlink(
    path.join(source, '.env.development.local'),
    path.join(source, 'linked-secret')
  );
  return { cwd, source };
}

test('account help and linked screenshots are included in every preset', async (t) => {
  const { cwd, source } = await fixture(t);
  for (const preset of ['starter', 'worker', 'demo']) {
    const { directory } = await createProject({
      projectName: `help-${preset}`,
      cwd,
      templateDir: source,
      preset
    });
    for (const name of [
      'docs/account-management.md',
      'docs/images/account-management.png'
    ]) {
      assert.deepEqual(
        await readFile(path.join(directory, name)),
        await readFile(path.join(source, name))
      );
    }
  }
});

test('every preset retains core authorization and CI checks without maintainer browser checks', async (t) => {
  const { cwd, source } = await fixture(t);
  for (const preset of ['starter', 'worker', 'demo']) {
    const { directory } = await createProject({
      projectName: `access-${preset}`,
      cwd,
      templateDir: source,
      preset
    });
    for (const name of [
      'src/views/error/403.vue',
      'tests/integration/views.test.mjs',
      '.github/workflows/ci.yml'
    ]) {
      assert.ok((await lstat(path.join(directory, name))).isFile());
    }
    for (const name of ['tests/browser', '.github/workflows/browser.yml']) {
      await assert.rejects(lstat(path.join(directory, name)), { code: 'ENOENT' });
    }
  }
});

test('starter creation preserves SQL and excludes optional modules, excludes personal files and writes fresh configuration', async (t) => {
  const { cwd, source } = await fixture(t);
  const result = await createProject({
    projectName: 'my-admin',
    cwd,
    templateDir: source,
    apiURL: 'https://api.example.com/'
  });
  const target = result.directory;
  const pkg = JSON.parse(
    await readFile(path.join(target, 'package.json'))
  );
  assert.equal(pkg.name, 'my-admin');
  assert.equal(pkg.private, true);
  assert.equal(pkg.packageManager, undefined);
  assert.equal(result.startCommand, 'npm run dev');
  for (const name of [
    'database/mysql/01-schema.sql',
    'database/mysql/02-seed.sql',
    'database/mysql/03-dictionaries.sql',
    'database/mysql/04-query-indexes.sql',
    'database/mysql/05-authenticator.sql',
    'src/components/AuthenticatorSettings/index.vue',
    'src/components/DateRangePicker/index.vue',
    'src/config/datetime.ts',
    'src/types/timezone.ts',
    'docs/authentication.md',
    'src/views/login/index.vue',
    'src/views/dashboard/index.vue',
    'src/views/system/dict/index.vue',
    'src/components/DataTable/index.vue',
    'src/components/DataTable/types.ts',
    'src/api/protocol/index.ts',
    'public/favicon.svg',
    'LICENSE',
    'CHANGELOG.md',
    'docs/new-business-page.md'
  ]) {
    assert.ok((await lstat(path.join(target, name))).isFile());
  }
  for (const name of [
    'node_modules',
    '.git',
    'dist',
    '.cloudflare',
    'workers',
    'examples',
    'deploy',
    'cloudflare.config.ts',
    'scaffold',
    'docs/examples.md',
    '.github/workflows/presets.yml',
    'linked-secret',
    '.env.development.local',
    '.env.development.local.example',
    'scripts/lib',
    'AGENTS.md'
  ]) {
    await assert.rejects(lstat(path.join(target, name)), {
      code: 'ENOENT'
    });
  }
  const env = await readFile(
    path.join(target, '.env.development'),
    'utf8'
  );
  assert.doesNotMatch(env, /VITE_DEMO_ENABLED/);
  assert.equal(result.preset, 'starter');
  assert.equal(
    await readFile(path.join(target, '.github/workflows/ci.yml'), 'utf8'),
    '# Application CI'
  );
  assert.equal(pkg.scripts['dev:demo'], undefined);
  assert.match(env, /VITE_API_URL=https:\/\/api.example.com\n/);
  assert.doesNotMatch(env, /PRIVATE_TOKEN/);
  assert.match(env, /^VITE_APP_TITLE=Fixture$/m);
  assert.equal(env.match(/^VITE_API_URL=/gm).length, 1);
  assert.equal(await readFile(path.join(target, '.env.production'), 'utf8'), '');
  assert.match(
    await readFile(path.join(source, '.env.development.local'), 'utf8'),
    /PRIVATE_TOKEN/
  );
});

test('demo creation prints the real demo command, custom demo API uses the configured dev entry', async (t) => {
  const { cwd, source } = await fixture(t);
  const result = await createProject({
    projectName: 'showcase',
    cwd,
    templateDir: source,
    demo: true
  });
  assert.equal(result.startCommand, 'npm run dev:demo');
  await assert.rejects(
    lstat(path.join(result.directory, '.github/workflows/presets.yml')),
    { code: 'ENOENT' }
  );
  const demoPackage = JSON.parse(
    await readFile(path.join(result.directory, 'package.json'))
  );
  assert.equal(demoPackage.packageManager, undefined);
  assert.equal(demoPackage.scripts['update:presets'], undefined);
  assert.equal(demoPackage.scripts['check:presets'], undefined);
  assert.match(
    await readFile(
      path.join(result.directory, '.env.development'),
      'utf8'
    ),
    /VITE_DEMO_ENABLED=true/
  );
  const custom = await createProject({
    projectName: 'custom-demo',
    cwd,
    templateDir: source,
    demo: true,
    apiURL: 'http://localhost:9000'
  });
  assert.equal(custom.startCommand, 'npm run dev');
  assert.match(
    await readFile(
      path.join(custom.directory, '.env.development'),
      'utf8'
    ),
    /VITE_API_URL=http:\/\/localhost:9000/
  );
});

test('never overwrite existing directories or targets created while downloading', async (t) => {
  const { cwd, source } = await fixture(t);
  await mkdir(path.join(cwd, 'existing'));
  await writeFile(path.join(cwd, 'existing', 'keep.txt'), 'keep');
  await assert.rejects(
    createProject({ projectName: 'existing', cwd, templateDir: source }),
    /已存在/
  );
  assert.equal(
    await readFile(path.join(cwd, 'existing', 'keep.txt'), 'utf8'),
    'keep'
  );
  await assert.rejects(
    createProject({
      projectName: 'race',
      cwd,
      download: async (_input, options) => {
        const { cp } = await import('node:fs/promises');
        await cp(source, options.dir, { recursive: true });
        await mkdir(path.join(cwd, 'race'));
        await writeFile(path.join(cwd, 'race', 'keep.txt'), 'concurrent');
      }
    }),
    { code: 'EEXIST' }
  );
  assert.equal(
    await readFile(path.join(cwd, 'race', 'keep.txt'), 'utf8'),
    'concurrent'
  );
});

test('current repository/ref is downloaded and failed or incomplete downloads leave no project', async (t) => {
  const { cwd, source } = await fixture(t);
  let received;
  await createProject({
    projectName: 'downloaded',
    cwd,
    ref: 'v0.1.0',
    download: async (input, options) => {
      received = input;
      assert.equal(options.force, false);
      const { cp } = await import('node:fs/promises');
      await cp(source, options.dir, { recursive: true });
    }
  });
  assert.equal(received, 'github:npora/admin-template#v0.1.0');
  await assert.rejects(
    createProject({
      projectName: 'failed',
      cwd,
      download: async () => {
        throw new Error('network failed');
      }
    }),
    /network failed/
  );
  await assert.rejects(lstat(path.join(cwd, 'failed')), {
    code: 'ENOENT'
  });
  await rm(path.join(source, 'database/mysql/02-seed.sql'));
  await assert.rejects(
    createProject({ projectName: 'incomplete', cwd, templateDir: source }),
    /模板缺少/
  );
  await assert.rejects(lstat(path.join(cwd, 'incomplete')), {
    code: 'ENOENT'
  });
  assert.deepEqual((await readdir(cwd)).sort(), [
    'downloaded',
    'template'
  ]);
});

test('project and API inputs reject traversal, shell text and credentials', () => {
  for (const name of [
    '',
    '.',
    '..',
    '../outside',
    '/absolute',
    'My App',
    'UPPERCASE',
    'node_modules',
    'con',
    'name;echo',
    'a'.repeat(215)
  ]) {
    assert.throws(() => validateProjectName(name));
  }
  assert.equal(validateProjectName('my-admin_2'), 'my-admin_2');
  for (const value of [
    'ftp://api.example.com',
    'https://user:secret@api.example.com',
    'https://api.example.com?token=secret',
    'not-a-url'
  ]) {
    assert.throws(() => normalizeApiURL(value));
  }
});

test('worker preset includes only core frontend and independent backend', async (t) => {
  const { cwd, source } = await fixture(t);
  const result = await createProject({
    projectName: 'with-worker',
    cwd,
    templateDir: source,
    preset: 'worker'
  });
  assert.equal(result.preset, 'worker');
  assert.equal(result.startCommand, 'npm run dev');
  assert.ok(
    (
      await lstat(path.join(result.directory, 'workers/api/src/index.mjs'))
    ).isFile()
  );
  assert.equal(
    await readFile(
      path.join(result.directory, 'workers/api/src/config/pages.mjs'),
      'utf8'
    ),
    '// Core page catalogue'
  );
  const pkg = JSON.parse(
    await readFile(path.join(result.directory, 'package.json'))
  );
  assert.match(pkg.scripts['check:backend'], /workers\/api/);
  assert.doesNotMatch(pkg.scripts['check:backend'], /pnpm|npm run|yarn/);
  for (const example of ['.dev.vars.example', '.env.example'])
    assert.ok(
      (
        await lstat(path.join(result.directory, 'workers/api', example))
      ).isFile()
    );
  for (const entry of [
    'examples',
    'deploy',
    'scaffold',
    'workers/api/.local',
    'workers/api/.dev.vars',
    'workers/api/.dev.vars.production',
    'workers/api/.env',
    'workers/api/.env.production'
  ])
    await assert.rejects(lstat(path.join(result.directory, entry)), {
      code: 'ENOENT'
    });
});

test('presets reject unknown selections, conflicting alias and stale snapshots before creating a project', async (t) => {
  const { cwd, source } = await fixture(t);
  for (const options of [
    { preset: 'other' },
    { preset: 'worker', demo: true }
  ])
    await assert.rejects(
      createProject({
        projectName: 'invalid',
        cwd,
        templateDir: source,
        ...options
      }),
      /模板|--demo/
    );
  await writeFile(
    path.join(source, 'scaffold/core/package.json'),
    JSON.stringify({ scripts: { dev: 'outdated' } })
  );
  await assert.rejects(
    createProject({ projectName: 'stale', cwd, templateDir: source }),
    /快照已过期/
  );
  await assert.rejects(lstat(path.join(cwd, 'stale')), { code: 'ENOENT' });
});

test('CLI flags generate starter by default and accept explicit worker/demo selections', async (t) => {
  const { cwd, source } = await fixture(t);
  const cli = fileURLToPath(new URL('../bin/index.js', import.meta.url));
  for (const preset of ['starter', 'worker', 'demo']) {
    const args = [
      cli,
      `cli-${preset}`,
      '--yes',
      '--template-dir',
      source,
      ...(preset === 'starter' ? [] : ['--preset', preset])
    ];
    const result = spawnSync(process.execPath, args, {
      cwd,
      encoding: 'utf8'
    });
    assert.equal(result.status, 0, result.stderr);
    const directory = path.join(cwd, `cli-${preset}`);
    assert.equal(
      (await readdir(directory)).includes('workers'),
      preset !== 'starter'
    );
    assert.equal(
      (await readdir(directory)).includes('examples'),
      preset === 'demo'
    );
    for (const file of [
      'src/views/login/index.vue',
      'src/views/dashboard/index.vue',
      'src/views/system/dict/index.vue',
      'src/components/DataTable/index.vue',
      'src/components/DataTable/types.ts',
      'src/api/protocol/index.ts',
      'database/mysql/03-dictionaries.sql',
      'database/mysql/04-query-indexes.sql',
      'database/mysql/05-authenticator.sql',
      'src/components/AuthenticatorSettings/index.vue',
      'src/components/DateRangePicker/index.vue',
      'src/config/datetime.ts',
      'src/types/timezone.ts'
    ]) {
      assert.equal(
        await readFile(path.join(directory, file), 'utf8'),
        await readFile(path.join(source, file), 'utf8')
      );
    }
    if (preset === 'demo')
      assert.equal(
        await readFile(
          path.join(
            directory,
            'examples/composables/usePaginatedTable.ts'
          ),
          'utf8'
        ),
        '// Example-only table query'
      );
    assert.match(result.stdout, /初始化完成/);
    assert.match(result.stdout, /npm install/);
    assert.match(
      result.stdout,
      preset === 'demo' ? /npm run dev:demo/ : /npm run dev/
    );
    assert.match(result.stdout, /pnpm.*Yarn/);
    assert.doesNotMatch(result.stdout, /包管理器版本：|undefined/);
    const pkg = JSON.parse(
      await readFile(path.join(directory, 'package.json'), 'utf8')
    );
    assert.equal(pkg.packageManager, undefined);
    const lock = JSON.parse(
      await readFile(path.join(directory, 'package-lock.json'), 'utf8')
    );
    assert.equal(lock.name, pkg.name);
    assert.equal(lock.packages[''].name, pkg.name);
    assert.equal(
      (await readdir(path.join(directory, 'scripts'))).includes('lib'),
      preset === 'demo'
    );
  }
});

test('changed source lock requires regeneration and never leaves a project', async (t) => {
  const { cwd, source } = await fixture(t);
  await writeFile(path.join(source, 'package-lock.json'), 'changed');
  await assert.rejects(
    createProject({ projectName: 'stale-lock', cwd, templateDir: source }),
    /锁文件快照已过期/
  );
  await assert.rejects(lstat(path.join(cwd, 'stale-lock')), {
    code: 'ENOENT'
  });
});

test('all presets ignore legacy package manager pins without changing the source template', async (t) => {
  const { cwd, source } = await fixture(t);
  for (const file of ['package.json', 'scaffold/core/package.json']) {
    const location = path.join(source, file);
    const pkg = JSON.parse(await readFile(location, 'utf8'));
    pkg.packageManager = 'pnpm@12.3.4';
    await writeFile(location, JSON.stringify(pkg));
  }
  for (const preset of ['starter', 'worker', 'demo']) {
    const result = await createProject({
      projectName: `legacy-${preset}`,
      cwd,
      templateDir: source,
      preset
    });
    const pkg = JSON.parse(
      await readFile(path.join(result.directory, 'package.json'), 'utf8')
    );
    assert.equal(pkg.packageManager, undefined);
    await assert.rejects(lstat(path.join(result.directory, 'AGENTS.md')), {
      code: 'ENOENT'
    });
  }
  const original = JSON.parse(
    await readFile(path.join(source, 'package.json'), 'utf8')
  );
  assert.equal(original.packageManager, 'pnpm@12.3.4');
});

test('legacy pnpm snapshot remains readable without pinning the generated manager', async (t) => {
  const { cwd, source } = await fixture(t);
  await rm(path.join(source, 'package-lock.json'));
  await rm(path.join(source, 'scaffold/core/package-lock.json'));
  const content = 'lockfileVersion: 9.0';
  await writeFile(path.join(source, 'pnpm-lock.yaml'), content);
  await writeFile(
    path.join(source, 'scaffold/core/pnpm-lock.yaml'),
    content
  );
  await writeFile(
    path.join(source, 'scaffold/metadata.json'),
    JSON.stringify({
      version: 1,
      sourceLockHash: createHash('sha256').update(content).digest('hex')
    })
  );
  const result = await createProject({
    projectName: 'legacy-snapshot',
    cwd,
    templateDir: source
  });
  const pkg = JSON.parse(
    await readFile(path.join(result.directory, 'package.json'), 'utf8')
  );
  assert.equal(pkg.packageManager, undefined);
});

test('explicit installs use the selected executable and cwd; failures preserve the generated project', async (t) => {
  const { cwd, source } = await fixture(t);
  const bin = path.join(cwd, 'test-bin');
  await mkdir(bin);
  const body = `const fs = require('node:fs');
fs.writeFileSync('install-call.json', JSON.stringify({ cwd: process.cwd(), args: process.argv.slice(2) }));
process.exit(Number(process.env.TEST_INSTALL_EXIT || 0));`;
  for (const manager of ['npm', 'pnpm', 'yarn']) {
    if (process.platform === 'win32') {
      const script = path.join(bin, `${manager}.cjs`);
      await writeFile(script, body);
      await writeFile(
        path.join(bin, `${manager}.cmd`),
        `@"${process.execPath}" "${script}" %*`
      );
    } else {
      const script = path.join(bin, manager);
      await writeFile(script, `#!${process.execPath}\n${body}`);
      await chmod(script, 0o755);
    }
  }
  const cli = fileURLToPath(new URL('../bin/index.js', import.meta.url));
  const run = (name, manager, exit = '0') =>
    spawnSync(
      process.execPath,
      [cli, name, '--yes', '--template-dir', source, '--install', manager],
      {
        cwd,
        encoding: 'utf8',
        timeout: 15000,
        env: {
          ...process.env,
          PATH: `${bin}${path.delimiter}${process.env.PATH}`,
          TEST_INSTALL_EXIT: exit
        }
      }
    );
  for (const manager of ['npm', 'pnpm', 'yarn']) {
    const name = `installed-${manager}`;
    const result = run(name, manager);
    assert.equal(result.status, 0, result.stderr);
    const call = JSON.parse(
      await readFile(path.join(cwd, name, 'install-call.json'), 'utf8')
    );
    assert.equal(
      await realpath(call.cwd),
      await realpath(path.join(cwd, name))
    );
    assert.deepEqual(call.args, ['install']);
    assert.match(result.stdout, /依赖安装完成/);
    assert.ok(
      result.stdout.includes(
        manager === 'yarn' ? 'yarn dev' : `${manager} run dev`
      )
    );
    assert.equal(
      JSON.parse(await readFile(path.join(cwd, name, 'package.json')))
        .packageManager,
      undefined
    );
  }
  const failed = run('failed-install', 'npm', '9');
  assert.equal(failed.status, 1);
  assert.match(failed.stderr, /项目已保留/);
  assert.ok(
    (await lstat(path.join(cwd, 'failed-install', 'src/main.ts'))).isFile()
  );
  const skipped = run('skipped-install', 'skip');
  assert.equal(skipped.status, 0);
  await assert.rejects(
    lstat(path.join(cwd, 'skipped-install', 'install-call.json')),
    { code: 'ENOENT' }
  );
  const invalid = run('invalid-install', 'npm;echo');
  assert.equal(invalid.status, 1);
  await assert.rejects(lstat(path.join(cwd, 'invalid-install')), {
    code: 'ENOENT'
  });
});
