import { cp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

export const FRAMEWORKS = {
  vue: 'Vue',
  react: 'React'
};

export function resolveFramework(framework = 'vue') {
  if (!Object.hasOwn(FRAMEWORKS, framework))
    throw new Error('框架仅支持 vue、react。');
  return framework;
}

export function resolvePreset(preset = 'starter', demo = false) {
  if (demo || preset === 'worker' || preset === 'demo')
    throw new Error('已移除 worker 和 demo 预设；请使用纯净模板，或访问在线演示。');
  if (preset !== 'starter')
    throw new Error('模板仅支持 starter 纯净版。');
  return preset;
}

const removeCore = [
  'examples',
  'deploy',
  'cloudflare.config.ts',
  'tsconfig.demo.json',
  'build/optional-examples.ts',
  'build/optional-tools.ts',
  'src/types/examples.d.ts',
  'scripts/demo.mjs',
  'scripts/lib',
  'scripts/check-backend.mjs',
  'scripts/check-standalone.mjs'
];

// Compose data files only; never execute scripts from a downloaded template.
export async function composePreset(directory, original, legacyVue) {
  const overlays = path.join(directory, 'scaffold');
  if (legacyVue) {
    const metadata = JSON.parse(
      await readFile(path.join(overlays, 'metadata.json'), 'utf8')
    );
    if (![1, 2].includes(metadata.version))
      throw new Error('不支持的模板锁文件快照版本。');
    const lockfile =
      metadata.version === 2 ? 'package-lock.json' : 'pnpm-lock.yaml';
    const sourceLockHash = createHash('sha256')
      .update(await readFile(path.join(directory, lockfile)))
      .digest('hex');
    if (metadata.sourceLockHash !== sourceLockHash)
      throw new Error(
        '模板的纯净版锁文件快照已过期，请维护者运行 npm run update:presets。'
      );
    const core = JSON.parse(
      await readFile(path.join(overlays, 'core/package.json'), 'utf8')
    );
    const expected = { ...original.devDependencies };
    delete expected['@cloudflare/vite-plugin'];
    delete expected.cf;
    for (const optional of [
      'rollup-plugin-visualizer',
      'vite-plugin-compression2'
    ])
      if (!Object.hasOwn(core.devDependencies ?? {}, optional))
        delete expected[optional];
    const equal = (a, b) =>
      JSON.stringify(Object.entries(a ?? {}).sort()) ===
      JSON.stringify(Object.entries(b ?? {}).sort());
    if (
      !equal(core.dependencies, original.dependencies) ||
      !equal(core.devDependencies, expected) ||
      Object.entries(core.scripts).some(
        ([key, value]) => value !== original.scripts[key]
      )
    )
      throw new Error(
        '模板的纯净版依赖快照已过期，请维护者运行 npm run update:presets。'
      );
    for (const entry of removeCore)
      await rm(path.join(directory, entry), { recursive: true, force: true });
    await rm(path.join(directory, 'workers'), { recursive: true, force: true });
    // Keep common contracts, replace repository-specific usage documentation.
    for (const entry of await readdir(path.join(directory, 'docs'))) {
      if (
        ![
          'account-management.md',
          'api.md',
          'database',
          'deployment.md',
          'i18n.md',
          'images',
          'rbac.md'
        ].includes(entry)
      )
        await rm(path.join(directory, 'docs', entry), {
          recursive: true,
          force: true
        });
    }
    await cp(path.join(overlays, 'core'), directory, {
      recursive: true,
      force: true
    });
  }
  for (const entry of [
    '.github/workflows/browser.yml',
    '.github/workflows/presets.yml',
    '.github/workflows/release.yml',
    'scripts/release',
    'scripts/update-presets.mjs',
    'scripts/check-presets.mjs',
    'tests/browser'
  ]) {
    await rm(path.join(directory, entry), { force: true, recursive: true });
  }
  await rm(overlays, { recursive: true, force: true });
  const pkg = JSON.parse(
    await readFile(path.join(directory, 'package.json'), 'utf8')
  );
  delete pkg.packageManager;
  delete pkg.scripts['update:presets'];
  delete pkg.scripts['check:presets'];
  delete pkg.scripts['release:prepare'];
  if (pkg.scripts['check:all'] === 'npm run check && node --test scripts/release/release.test.mjs') {
    pkg.scripts['check:all'] = 'npm run check';
  }
  await writeFile(
    path.join(directory, 'package.json'),
    JSON.stringify(pkg, null, 2) + '\n'
  );
  return pkg;
}
