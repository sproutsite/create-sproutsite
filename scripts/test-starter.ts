import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const npmCli = process.env.npm_execpath;
assert.ok(npmCli, 'Run this test with npm run test:starter.');
const directory = mkdtempSync(join(tmpdir(), 'create-sproutsite-smoke-'));
function npm(args: string[], cwd: string, capture = false, base = '/') {
    const result = spawnSync(process.execPath, [npmCli!, ...args], {
        cwd,
        env: {
            ...process.env,
            npm_config_dry_run: 'false',
            SPROUTSITE_BASE: base,
        },
        encoding: 'utf8',
        stdio: capture ? 'pipe' : 'inherit',
        maxBuffer: 10 * 1024 * 1024,
    });
    if (result.error) throw result.error;
    assert.equal(
        result.status,
        0,
        result.stderr || `npm ${args.join(' ')} failed`,
    );
    return result.stdout;
}
try {
    const metadata = JSON.parse(
        readFileSync(join(root, 'package.json'), 'utf8'),
    ) as { name: string; version: string };
    const lock = JSON.parse(
        readFileSync(join(root, 'package-lock.json'), 'utf8'),
    ) as {
        name: string;
        version: string;
        packages: Record<string, { name: string; version: string }>;
    };
    assert.equal(metadata.name, 'create-sproutsite');
    assert.equal(lock.name, metadata.name);
    assert.equal(lock.version, metadata.version);
    assert.equal(lock.packages['']?.name, metadata.name);
    assert.equal(lock.packages['']?.version, metadata.version);
    assert.equal(
        readFileSync(join(root, 'VERSION'), 'utf8').trim(),
        metadata.version,
    );
    assert.ok(
        readFileSync(join(root, 'CHANGELOG.md'), 'utf8')
            .split('\n')
            .some((line) => line.startsWith(`## [${metadata.version}] - `)),
        'CHANGELOG.md must contain the release version and date.',
    );
    npm(['run', 'build'], root);
    const archives = JSON.parse(
        npm(
            [
                'pack',
                '--json',
                '--ignore-scripts',
                '--pack-destination',
                directory,
            ],
            root,
            true,
        ),
    ) as { filename: string; files: { path: string }[] }[];
    const archive = archives[0]!;
    const paths = archive.files.map((file) => file.path);
    for (const file of [
        'LICENSE',
        'NOTICE',
        'README.md',
        'CHANGELOG.md',
        'THIRD_PARTY_NOTICES.md',
        'package.json',
        'dist/index.js',
        'dist/project.js',
        'templates/minimal/en/AGENTS.md',
        'templates/minimal/de/AGENTS.md',
        'templates/minimal/common/gitignore',
    ])
        assert.ok(paths.includes(file), `Missing archive file: ${file}`);
    for (const path of paths)
        assert.ok(
            [
                'package.json',
                'README.md',
                'CHANGELOG.md',
                'LICENSE',
                'NOTICE',
                'THIRD_PARTY_NOTICES.md',
                'dist/index.js',
                'dist/project.js',
            ].includes(path) || path.startsWith('templates/minimal/'),
            `Unexpected archive file: ${path}`,
        );
    const tarball = join(directory, archive.filename);
    assert.ok(
        existsSync(tarball),
        'npm pack must create a real tarball, including under publish --dry-run.',
    );
    for (const language of ['en', 'de']) {
        const project = join(directory, `website ${language}`);
        // npm exec resolves the local archive, never a registry generator with
        // the same name; the website itself installs published Sproutsite.
        npm(
            [
                'exec',
                '--yes',
                '--package',
                tarball,
                '--',
                'create-sproutsite',
                project,
                '--name',
                'Studio: "North" & Süd',
                '--language',
                language,
                '--yes',
                '--install',
            ],
            directory,
        );
        assert.ok(existsSync(join(project, 'package-lock.json')));
        assert.ok(existsSync(join(project, '.nvmrc')));
        assert.ok(existsSync(join(project, 'LICENSE-SPROUTSITE')));
        assert.ok(existsSync(join(project, 'NOTICE-SPROUTSITE')));
        npm(['run', 'check'], project);
        for (const base of ['/', '/demo/']) {
            npm(['run', 'build'], project, false, base);
            const html = readFileSync(join(project, 'dist/index.html'), 'utf8');
            assert.ok(html.includes(`lang="${language}"`));
            assert.ok(html.includes(`href="https://example.com${base}"`));
            assert.ok(html.includes('ss-feature'));
            assert.ok(
                html.includes(
                    language === 'de'
                        ? 'Ein Platz für deine Ideen'
                        : 'A place for your ideas',
                ),
            );
            assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
            assert.equal((html.match(/<main\b/g) ?? []).length, 1);
            for (const asset of html.matchAll(
                /(?:href|src)="([^"?#]*\/_astro\/[^"?#]+)"/g,
            )) {
                assert.ok(asset[1]!.startsWith(base));
                assert.ok(
                    existsSync(
                        join(project, 'dist', asset[1]!.slice(base.length)),
                    ),
                );
            }
            for (const file of [
                '404.html',
                '500.html',
                'sitemap.xml',
                'site.webmanifest',
            ])
                assert.ok(existsSync(join(project, 'dist', file)));
            assert.match(
                readFileSync(join(project, 'dist/404.html'), 'utf8'),
                new RegExp(`lang="${language}"`),
            );
            assert.match(
                readFileSync(join(project, 'dist/sitemap.xml'), 'utf8'),
                new RegExp(`<loc>https://example.com${base}</loc>`),
            );
            console.log(
                `PASS packed generator → ${language} website → ${base} build, assets, metadata, sitemap and errors.`,
            );
        }
    }
    rmSync(directory, { recursive: true, force: true });
    console.log(
        'Starter checks passed. Temporary files removed. Nothing published.',
    );
} catch (error) {
    console.error(
        `Starter check failed. Inspect temporary files in ${directory}`,
    );
    throw error;
}
