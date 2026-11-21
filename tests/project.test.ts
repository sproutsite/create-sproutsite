import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
    mkdtemp,
    readFile,
    readdir,
    mkdir,
    symlink,
    writeFile,
    rm,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { createProject, packageName, validateName } from '../src/project.js';
import {
    safePath,
    sha256,
    verifyAssets,
    verifySnapshot,
} from '../scripts/starter-assets.js';

const root = new URL('../', import.meta.url);

test('generates an English site with safe names and packaged components', async () => {
    const parent = await mkdtemp(join(tmpdir(), 'create-sproutsite-unit-'));
    try {
        const target = join(parent, 'Website with spaces');
        const name = 'Team: "North" # __PACKAGE_NAME__';
        await createProject({ directory: target, name, language: 'en' });
        const config = await readFile(
            join(target, 'src/content/site.yaml'),
            'utf8',
        );
        assert.equal(config.split('\n')[0], `name: ${JSON.stringify(name)}`);
        assert.match(
            config,
            /i18n:\n    locale: en\n    defaultLocale: en\n    locales: \[en\]/,
        );
        assert.doesNotMatch(config, /^(?:language|locales|hero-classes):/m);
        assert.match(
            config,
            /hero:\n    classes:\n        - ss-hero--theme-1\n    background-image: \/images\/hero\.jpg/,
        );
        assert.match(
            config,
            /links:\n    external:\n        newTab: true\n        icon: true/,
        );
        assert.doesNotMatch(
            config,
            /externalNewTab|externalIcon|hero-waves\.svg/,
        );
        const manifest = JSON.parse(
            await readFile(join(target, 'package.json'), 'utf8'),
        ) as {
            name: string;
            private: boolean;
            dependencies: Record<string, string>;
        };
        assert.equal(manifest.name, 'website-with-spaces');
        assert.equal(manifest.private, true);
        assert.equal(manifest.dependencies.sproutsite, '~0.5.28');
        assert.ok(
            (
                await readFile(
                    join(target, 'src/content/pages/02-next-steps.mdx'),
                    'utf8',
                )
            ).includes("from 'sproutsite/components'"),
        );
        assert.ok((await readdir(target)).includes('.gitignore'));
        assert.match(
            await readFile(join(target, 'AGENTS.md'), 'utf8'),
            /editorial/i,
        );
    } finally {
        await rm(parent, { recursive: true, force: true });
    }
});

test('generates German content at the root using existing locale conventions', async () => {
    const parent = await mkdtemp(join(tmpdir(), 'create-sproutsite-unit-'));
    try {
        await createProject({
            directory: parent,
            name: 'Björns Website',
            language: 'de',
        });
        assert.match(
            await readFile(join(parent, 'src/pages/[...slug].astro'), 'utf8'),
            /getSproutsiteStaticPaths\("de"\)/,
        );
        const base = await readFile(
            join(parent, 'src/content/site.yaml'),
            'utf8',
        );
        assert.match(
            base,
            /i18n:\n    locale: de\n    defaultLocale: de\n    locales: \[de\]/,
        );
        assert.ok(base.includes('name: "Björns Website"'));
        assert.match(base, /header:\n    links:\n        - label: Startseite/);
        assert.doesNotMatch(base, /^(?:language|locales|hero-classes):/m);
        const override = await readFile(
            join(parent, 'src/content/site.de.yaml'),
            'utf8',
        );
        assert.equal(
            override
                .split('\n')
                .filter((line) => !line.startsWith('#'))
                .join('\n')
                .trim(),
            '{}',
        );
        assert.equal(
            await readFile(join(parent, 'src/content/pages/page.yaml'), 'utf8'),
            await readFile(
                join(parent, 'src/content/pages/page.de.yaml'),
                'utf8',
            ),
        );
        assert.match(
            await readFile(
                join(parent, 'src/content/pages/hero.de.md'),
                'utf8',
            ),
            /Ein Platz für deine Ideen/,
        );
        assert.match(
            await readFile(join(parent, 'AGENTS.md'), 'utf8'),
            /Redaktionelle Regeln/,
        );
    } finally {
        await rm(parent, { recursive: true, force: true });
    }
});

test('refuses occupied directories, files and symlinks without modifying them', async () => {
    const parent = await mkdtemp(join(tmpdir(), 'create-sproutsite-unit-'));
    try {
        const occupied = join(parent, 'occupied');
        await mkdir(occupied);
        await writeFile(join(occupied, '.keep'), 'original');
        await assert.rejects(
            createProject({
                directory: occupied,
                name: 'Website',
                language: 'en',
            }),
            /not empty/,
        );
        assert.deepEqual(await readdir(occupied), ['.keep']);
        assert.equal(
            await readFile(join(occupied, '.keep'), 'utf8'),
            'original',
        );
        const file = join(parent, 'file');
        await writeFile(file, 'unchanged');
        await assert.rejects(
            createProject({ directory: file, name: 'Website', language: 'en' }),
            /not a file or symlink/,
        );
        const empty = join(parent, 'empty');
        await mkdir(empty);
        const link = join(parent, 'link');
        await symlink(empty, link, 'dir');
        await assert.rejects(
            createProject({ directory: link, name: 'Website', language: 'en' }),
            /symlink/,
        );
        await assert.rejects(
            createProject({
                directory: join(link, 'new-site'),
                name: 'Website',
                language: 'en',
            }),
            /symlink/,
        );
        assert.deepEqual(await readdir(empty), []);
    } finally {
        await rm(parent, { recursive: true, force: true });
    }
});

test('both locales copy the reviewed public artwork, notices and hero byte for byte', async () => {
    const manifest = await verifySnapshot(fileURLToPath(root));
    const parent = await mkdtemp(join(tmpdir(), 'create-sproutsite-assets-'));
    try {
        for (const language of ['en', 'de'] as const) {
            const target = join(parent, language);
            await createProject({
                directory: target,
                name: 'Studio: "North" # __PACKAGE_NAME__',
                language,
            });
            for (const asset of manifest.files) {
                const bytes = await readFile(
                    join(target, 'public', asset.path),
                );
                assert.equal(sha256(bytes), asset.sha256, asset.path);
            }
            const hero = manifest.heroExample;
            assert.equal(
                sha256(await readFile(join(target, hero.contentDestination))),
                manifest.files.find(
                    (asset) => `public/${asset.path}` === hero.source,
                )!.sha256,
            );
            const config = await readFile(
                join(target, 'src/content/site.yaml'),
                'utf8',
            );
            assert.equal((config.match(/^branding:/gm) ?? []).length, 1);
            assert.ok(config.includes('showName: true'));
            assert.ok(
                config.includes(
                    `alt: ${manifest.localizedSharingImageAlt[language]}`,
                ),
            );
            const content = await readFile(
                join(
                    target,
                    `src/content/pages/hero${language === 'de' ? '.de' : ''}.md`,
                ),
                'utf8',
            );
            assert.ok(
                content.includes(
                    `background-image: ${hero.frontmatter['background-image']}`,
                ),
            );
            assert.ok(content.includes('classes: null'));
        }
    } finally {
        await rm(parent, { recursive: true, force: true });
    }
});

test('manifest asset paths reject traversal and absolute or ambiguous destinations', () => {
    for (const path of [
        '../outside',
        '/tmp/asset',
        'branding/../../outside',
        'branding\\file.png',
        './file',
        'branding//file',
        'C:/file',
        'branding/',
    ]) {
        assert.throws(() => safePath(path), path);
    }
    assert.equal(safePath('branding/logo.svg'), 'branding/logo.svg');
});

test('asset verification rejects mismatched hashes and unlisted files', async () => {
    const manifest = await verifySnapshot(fileURLToPath(root));
    const corrupted = structuredClone(manifest);
    corrupted.files[0]!.sha256 = '0'.repeat(64);
    await assert.rejects(
        verifyAssets(
            fileURLToPath(
                new URL('../templates/minimal/common/public/', import.meta.url),
            ),
            corrupted,
        ),
        /hash mismatch/,
    );
    const missing = structuredClone(manifest);
    missing.files.pop();
    await assert.rejects(
        verifyAssets(
            fileURLToPath(
                new URL('../templates/minimal/common/public/', import.meta.url),
            ),
            missing,
        ),
        /file list differs/,
    );
});

test('--no-install generates both complete starters without invoking npm', async () => {
    const parent = await mkdtemp(
        join(tmpdir(), 'create-sproutsite-no-install-'),
    );
    try {
        // A missing installer would fail immediately if the CLI invoked npm.
        for (const language of ['en', 'de']) {
            const target = join(parent, language);
            const result = spawnSync(
                process.execPath,
                [
                    '--import',
                    'tsx',
                    'src/index.ts',
                    target,
                    '--name',
                    'My __SITE_NAME_YAML__ studio',
                    '--language',
                    language,
                    '--yes',
                    '--no-install',
                ],
                {
                    encoding: 'utf8',
                    env: {
                        ...process.env,
                        npm_execpath: join(parent, 'must-not-run.ts'),
                    },
                },
            );
            assert.equal(result.status, 0, result.stderr);
            assert.ok(
                (
                    await readFile(join(target, 'public/branding/favicon.ico'))
                ).includes(0),
            );
            assert.equal(
                (await readdir(target)).includes('node_modules'),
                false,
            );
            assert.equal(
                (await readdir(target)).includes('package-lock.json'),
                false,
            );
        }
    } finally {
        await rm(parent, { recursive: true, force: true });
    }
});

test('invalid input fails before writing and package names stay safe', () => {
    assert.throws(() => validateName(' \n '));
    assert.throws(() => validateName('bad\nname'));
    assert.throws(() => validateName('x'.repeat(121)));
    assert.equal(packageName('/tmp/你好'), 'my-website');
    assert.equal(packageName('/tmp/-- Test $(echo) --'), 'test-echo');
});

test('installation failure preserves generated files and explains retry', async () => {
    const parent = await mkdtemp(join(tmpdir(), 'create-sproutsite-unit-'));
    try {
        const installer = join(parent, 'failing-npm.ts');
        await writeFile(installer, 'process.exit(7);\n');
        const target = join(parent, 'website');
        const result = spawnSync(
            process.execPath,
            [
                '--import',
                'tsx',
                'src/index.ts',
                target,
                '--name',
                'Website',
                '--language',
                'en',
                '--yes',
                '--install',
            ],
            {
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'pipe'],
                env: { ...process.env, npm_execpath: installer },
            },
        );
        assert.equal(result.status, 1);
        assert.match(result.stderr, /npm install failed \(7\)/);
        assert.match(result.stderr, /files were kept/);
        assert.match(
            await readFile(join(target, 'src/content/pages/hero.md'), 'utf8'),
            /A place for your ideas/,
        );
    } finally {
        await rm(parent, { recursive: true, force: true });
    }
});

test('CLI requires unattended consent, rejects invalid flags, and supports help', async () => {
    const run = (args: string[]) =>
        spawnSync(
            process.execPath,
            ['--import', 'tsx', 'src/index.ts', ...args],
            { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
        );
    assert.equal(run(['--help']).status, 0);
    assert.match(run([]).stderr, /Non-interactive mode/);
    assert.match(
        run(['--yes', '--language', 'fr', '--no-install']).stderr,
        /en or de/,
    );
    assert.match(run(['--yes', '--install', '--no-install']).stderr, /either/);
    assert.notEqual(run(['--force']).status, 0);
    assert.equal(
        run(['--version']).stdout.trim(),
        (await readFile(new URL('../VERSION', import.meta.url), 'utf8')).trim(),
    );
});
