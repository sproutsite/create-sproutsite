import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
    mkdtempSync,
    readFileSync,
    existsSync,
    rmSync,
    mkdirSync,
    lstatSync,
    readdirSync,
    writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    readManifest,
    sha256,
    verifyAssets,
    verifySnapshot,
} from './starter-assets.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const npmCli = process.env.npm_execpath;
assert.ok(npmCli, 'Run this test with npm run test:starter.');
const directory = mkdtempSync(join(tmpdir(), 'create-sproutsite-smoke-'));
const codexSkill = '.agents/skills/sproutsite-edit-page/SKILL.md';
const claudeSkill = '.claude/skills/sproutsite-edit-page/SKILL.md';
const skillMetadata = '.agents/skills/sproutsite-edit-page/agents/openai.yaml';
const agentFiles = [
    codexSkill,
    claudeSkill,
    skillMetadata,
    '.codex/config.toml',
    '.mcp.json',
    'CLAUDE.md',
];
const sproutsiteMcpUrl = 'https://mcp.sproutsite.dev/mcp';
const baseline = process.env.SPROUTSITE_STARTER_BASELINE;

function compareProjects(expected: string, actual: string, path = ''): void {
    const entries = (directory: string) =>
        readdirSync(join(directory, path))
            .filter((name) => path || name !== 'node_modules')
            .sort();
    const names = entries(expected);
    assert.deepEqual(
        entries(actual),
        names,
        `File list differs at ${path || '.'}`,
    );
    for (const name of names) {
        const relative = join(path, name);
        const left = join(expected, relative);
        const right = join(actual, relative);
        const type = lstatSync(left);
        if (type.isDirectory()) {
            assert.ok(lstatSync(right).isDirectory(), relative);
            compareProjects(expected, actual, relative);
        } else {
            assert.ok(type.isFile() && lstatSync(right).isFile(), relative);
            assert.ok(
                readFileSync(left).equals(readFileSync(right)),
                `Generated file differs: ${relative}`,
            );
        }
    }
}

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
    const assetManifest = await verifySnapshot(root);
    const fixture = process.env.SPROUTSITE_TEST_PACKAGE;
    assert.ok(
        !(fixture && baseline),
        'Use registry dependencies for baseline comparisons.',
    );
    if (fixture) {
        const source = JSON.parse(
            readFileSync(
                join(root, 'templates/minimal/asset-source.json'),
                'utf8',
            ),
        ) as { archiveSha256?: string };
        assert.equal(
            sha256(readFileSync(resolve(fixture))),
            source.archiveSha256,
            'Local test archive must match the reviewed snapshot provenance. Resync when changing the source.',
        );
        console.log(
            'Testing with the reviewed local Sproutsite archive. This does not verify registry availability or approve publication.',
        );
    }
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
        ...agentFiles.map((file) => `templates/minimal/common/${file}`),
        'templates/minimal/asset-manifest.json',
        'templates/minimal/asset-source.json',
        ...assetManifest.files.map(
            (asset) => `templates/minimal/common/public/${asset.path}`,
        ),
        `templates/minimal/common/${assetManifest.heroExample.contentDestination}`,
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
    const unpacked = join(directory, 'unpacked');
    mkdirSync(unpacked);
    const extraction = spawnSync('tar', ['-xzf', tarball, '-C', unpacked], {
        encoding: 'utf8',
    });
    assert.equal(extraction.status, 0, extraction.stderr);
    await verifySnapshot(join(unpacked, 'package'));
    const baselineParent = join(directory, 'baseline');
    if (baseline) mkdirSync(baselineParent);
    for (const language of ['en', 'de']) {
        for (const mode of ['--install', '--no-install']) {
            const project = join(
                directory,
                `website ${language} ${mode.slice(2)}`,
            );
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
                    'Studio: "North" & Süd __PACKAGE_NAME__',
                    '--language',
                    language,
                    '--yes',
                    mode,
                ],
                directory,
            );
            if (baseline) {
                // Keep the target basename identical so the generated npm name
                // and lockfile can also be compared.
                const expected = join(
                    baselineParent,
                    `website ${language} ${mode.slice(2)}`,
                );
                npm(
                    [
                        'exec',
                        '--yes',
                        '--package',
                        resolve(baseline),
                        '--',
                        'create-sproutsite',
                        expected,
                        '--name',
                        'Studio: "North" & Süd __PACKAGE_NAME__',
                        '--language',
                        language,
                        '--yes',
                        mode,
                    ],
                    baselineParent,
                );
                compareProjects(expected, project);
                console.log(
                    `PASS archive parity → ${language} ${mode}, including hidden files and any generated lockfile.`,
                );
            }
            const generatedPackage = readFileSync(
                join(project, 'package.json'),
                'utf8',
            );
            for (const file of agentFiles) {
                assert.ok(
                    lstatSync(join(project, file)).isFile(),
                    `Expected a regular file in the ${language} starter: ${file}`,
                );
            }
            assert.deepEqual(
                readFileSync(join(project, claudeSkill)),
                readFileSync(join(project, codexSkill)),
                'Codex and Claude Code must receive identical skill content.',
            );
            const codexConfig = readFileSync(
                join(project, '.codex/config.toml'),
                'utf8',
            );
            const codexUrl = codexConfig.match(
                /^\[mcp_servers\.sproutsite\]\r?\nurl = "([^"]+)"/m,
            )?.[1];
            const claudeConfig = JSON.parse(
                readFileSync(join(project, '.mcp.json'), 'utf8'),
            ) as {
                mcpServers: { sproutsite: { type: string; url: string } };
            };
            assert.equal(codexUrl, sproutsiteMcpUrl);
            assert.deepEqual(claudeConfig.mcpServers.sproutsite, {
                type: 'http',
                url: codexUrl,
            });
            assert.ok(
                readFileSync(join(project, skillMetadata), 'utf8').includes(
                    sproutsiteMcpUrl,
                ),
            );
            assert.equal(
                readFileSync(join(project, 'CLAUDE.md'), 'utf8').trim(),
                '@AGENTS.md',
            );
            if (mode === '--no-install') {
                assert.equal(existsSync(join(project, 'node_modules')), false);
                assert.equal(
                    existsSync(join(project, 'package-lock.json')),
                    false,
                );
            }
            await verifyAssets(join(project, 'public'), assetManifest);
            const hero = assetManifest.heroExample;
            assert.equal(
                sha256(readFileSync(join(project, hero.contentDestination))),
                assetManifest.files.find(
                    (asset) => `public/${asset.path}` === hero.source,
                )!.sha256,
            );
            // The real CLI's --install path uses published dependencies. Until the
            // new API is published, overlay the reviewed archive only in this
            // temporary website; never put local dependencies in shipped templates.
            if (fixture || mode === '--no-install')
                npm(
                    [
                        'install',
                        '--no-audit',
                        '--no-fund',
                        ...(fixture
                            ? [
                                  '--no-save',
                                  '--package-lock=false',
                                  resolve(fixture),
                              ]
                            : []),
                    ],
                    project,
                );
            const consumerRequire = createRequire(
                join(project, 'package.json'),
            );
            let starterEntry: string;
            try {
                starterEntry = consumerRequire.resolve(
                    'sproutsite/starter-assets',
                );
            } catch {
                throw new Error(
                    'The installed Sproutsite package lacks sproutsite/starter-assets. Use SPROUTSITE_TEST_PACKAGE for the reviewed local snapshot; do not release until a compatible published package is tested.',
                );
            }
            assert.deepEqual(await readManifest(starterEntry), assetManifest);
            await verifyAssets(
                join(dirname(starterEntry), assetManifest.publicDirectory),
                assetManifest,
            );
            assert.equal(
                readFileSync(join(project, 'package.json'), 'utf8'),
                generatedPackage,
            );
            if (mode === '--install' || !fixture)
                assert.ok(existsSync(join(project, 'package-lock.json')));
            assert.ok(existsSync(join(project, '.nvmrc')));
            assert.ok(existsSync(join(project, 'LICENSE-SPROUTSITE')));
            assert.ok(existsSync(join(project, 'NOTICE-SPROUTSITE')));
            // Exercise the public inheritance contract in one temporary site:
            // partial objects retain sibling fields, while lists are replaced.
            const inheritanceCase =
                language === 'de' && mode === '--no-install';
            if (inheritanceCase) {
                writeFileSync(
                    join(project, 'src/content/site.de.yaml'),
                    'branding:\n    sharingImage:\n        alt: Lokale Vorschau\nheader:\n    links:\n        - label: Lokaler Einstieg\n          href: /\nfooter:\n    text: Lokaler Footer\n',
                );
                const heroFile = join(project, 'src/content/pages/hero.de.md');
                writeFileSync(
                    heroFile,
                    readFileSync(heroFile, 'utf8').replace(
                        'background-image: ./_assets/hero.jpg\nclasses: null\n',
                        '',
                    ),
                );
            }
            npm(['run', 'check'], project);
            for (const base of ['/', '/demo/']) {
                npm(['run', 'build'], project, false, base);
                const html = readFileSync(
                    join(project, 'dist/index.html'),
                    'utf8',
                );
                assert.ok(html.includes(`lang="${language}"`));
                assert.ok(html.includes(`href="https://example.com${base}"`));
                assert.ok(html.includes('ss-feature'));
                assert.ok(html.includes(`src="${base}branding/logo.svg"`));
                assert.ok(
                    html.includes(`src="${base}branding/logo-light.svg"`),
                );
                assert.match(html, /ss-brand-logo__name[^>]*>[\s\S]*?Studio:/);
                assert.ok(html.includes('__PACKAGE_NAME__'));
                assert.ok(html.includes(`href="${base}branding/favicon.svg"`));
                assert.ok(html.includes(`href="${base}branding/favicon.ico"`));
                assert.ok(
                    html.includes(
                        `href="${base}branding/apple-touch-icon.png"`,
                    ),
                );
                assert.ok(
                    html.includes(
                        `content="https://example.com${base}branding/sharing-image.png"`,
                    ),
                );
                assert.ok(
                    html.includes(
                        inheritanceCase
                            ? 'Lokale Vorschau'
                            : assetManifest.localizedSharingImageAlt[
                                  language as 'en' | 'de'
                              ],
                    ),
                );
                assert.ok(html.includes('ss-hero--has-background-image'));
                const heroImages = [
                    ...html.matchAll(/\/_astro\/hero\.[^"'&)\s<]+/g),
                ];
                if (inheritanceCase) {
                    const header = html.match(
                        /<header\b[\s\S]*?<\/header>/,
                    )?.[0];
                    assert.ok(header);
                    assert.ok(header.includes('Lokaler Einstieg'));
                    assert.equal(
                        header.includes('Startseite'),
                        false,
                        'Header link list must replace the base list.',
                    );
                    const footer = html.match(
                        /<footer\b[\s\S]*?<\/footer>/,
                    )?.[0];
                    assert.ok(footer);
                    assert.ok(footer.includes('Lokaler Footer'));
                    assert.ok(
                        footer.includes('Startseite'),
                        'Footer links must survive a partial text override.',
                    );
                    assert.ok(
                        html.includes('ss-hero--theme-1'),
                        'Global hero classes must be inherited.',
                    );
                    assert.ok(
                        html.includes(`${base}images/hero.jpg`),
                        'Global public hero image must be inherited.',
                    );
                } else {
                    assert.ok(
                        heroImages.length > 0,
                        'Missing optimized local hero.',
                    );
                }
                for (const image of heroImages) {
                    assert.ok(
                        html.includes(
                            `${base}_astro/${image[0].slice('/_astro/'.length)}`,
                        ),
                    );
                    assert.ok(
                        existsSync(join(project, 'dist', image[0].slice(1))),
                    );
                }
                for (const asset of assetManifest.files)
                    assert.equal(
                        sha256(readFileSync(join(project, 'dist', asset.path))),
                        asset.sha256,
                        `Built asset changed: ${asset.path}`,
                    );
                const webmanifest = JSON.parse(
                    readFileSync(
                        join(project, 'dist/site.webmanifest'),
                        'utf8',
                    ),
                ) as { icons: { src: string }[] };
                assert.ok(
                    webmanifest.icons.some(
                        (icon) => icon.src === `${base}branding/icon-192.png`,
                    ),
                );
                assert.ok(
                    webmanifest.icons.some(
                        (icon) => icon.src === `${base}branding/icon-512.png`,
                    ),
                );
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
                for (const route of [
                    'blog/index.html',
                    '404.html',
                    '500.html',
                ]) {
                    const routeHtml = readFileSync(
                        join(project, 'dist', route),
                        'utf8',
                    );
                    assert.ok(routeHtml.includes(`lang="${language}"`), route);
                }
                for (const component of ['ss-header', 'ss-footer']) {
                    assert.match(
                        html,
                        new RegExp(`class="[^"]*\\b${component}\\b`),
                    );
                }
                assert.match(
                    readFileSync(join(project, 'dist/sitemap.xml'), 'utf8'),
                    new RegExp(`<loc>https://example.com${base}</loc>`),
                );
                console.log(
                    `PASS packed generator → ${language} ${mode} → ${base} build, branding, binary hashes, hero, metadata, sitemap and errors.`,
                );
            }
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
