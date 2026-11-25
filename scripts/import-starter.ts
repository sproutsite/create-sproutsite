import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
    lstat,
    mkdir,
    mkdtemp,
    readFile,
    rm,
    writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { parseDocument } from 'yaml';
import { filesUnder, sha256, verifySnapshot } from './starter-assets.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const commit = 'ce1395c73f129ffe16e0736c9127176a89a5ee36';
const prefix = 'starters/minimal/';
const assetRoot = 'src/package/starter-assets/';
const skill = '.agents/skills/sproutsite-edit-page/SKILL.md';
const { values } = parseArgs({
    options: { source: { type: 'string' }, check: { type: 'boolean' } },
});
const source = resolve(values.source ?? join(root, '../sproutsite'));

function git(...args: string[]): Buffer {
    return execFileSync(
        'git',
        ['--no-replace-objects', '-C', source, ...args],
        {
            stdio: ['ignore', 'pipe', 'pipe'],
            maxBuffer: 16 * 1024 * 1024,
        },
    );
}

assert.equal(
    git('rev-parse', '--verify', `${commit}^{commit}`).toString().trim(),
    commit,
);
const tree = new Map<string, string>();
const inputPaths = [
    prefix,
    assetRoot + 'manifest.json',
    assetRoot + 'public/',
    'LICENSE',
    'package.json',
    skill,
    '.agents/skills/sproutsite-edit-page/agents/openai.yaml',
    '.codex/config.toml',
    '.mcp.json',
    'CLAUDE.md',
];
for (const entry of git('ls-tree', '-rz', commit, '--', ...inputPaths)
    .toString()
    .split('\0')
    .filter(Boolean)) {
    const match = /^([0-7]+) blob ([a-f0-9]+)\t(.+)$/.exec(entry);
    assert.ok(match, `Unexpected Git entry: ${entry}`);
    const [, mode, hash, path] = match;
    assert.equal(
        mode,
        '100644',
        `Expected a regular non-executable file: ${path}`,
    );
    tree.set(path!, hash!);
}

function readBlob(path: string): Buffer {
    const hash = tree.get(path);
    assert.ok(hash, `Missing source file at ${commit}: ${path}`);
    return git('cat-file', 'blob', hash);
}

const stagedRoot = await mkdtemp(join(tmpdir(), 'create-sproutsite-import-'));
try {
    const staged = join(stagedRoot, 'templates/minimal');
    const destination = join(root, 'templates/minimal');
    const outputs = new Map<string, Buffer>();
    function add(path: string, bytes: Buffer): void {
        assert.ok(
            /^[a-zA-Z0-9_.\[\]/-]+$/.test(path),
            `Invalid template path: ${path}`,
        );
        assert.ok(
            path
                .split('/')
                .every((part) => part && part !== '.' && part !== '..'),
            `Unsafe template path: ${path}`,
        );
        assert.ok(!outputs.has(path), `Duplicate template path: ${path}`);
        outputs.set(path, bytes);
    }
    for (const path of tree.keys()) {
        if (path.startsWith(prefix)) {
            const output = path.slice(prefix.length);
            assert.match(output, /^(common|en|de|de-en|en-de)\//);
            const bytes = readBlob(path);
            if (output === 'common/package.json') {
                const starter = JSON.parse(bytes.toString('utf8')) as {
                    dependencies: Record<string, string>;
                };
                starter.dependencies.sproutsite = '~0.5.35';
                add(
                    output,
                    Buffer.from(JSON.stringify(starter, null, 4) + '\n'),
                );
            } else {
                add(output, bytes);
            }
        }
        if (path.startsWith(assetRoot + 'public/')) {
            add('common/' + path.slice(assetRoot.length), readBlob(path));
        }
    }
    for (const layer of ['common', 'en', 'de', 'de-en', 'en-de']) {
        assert.ok(
            [...outputs.keys()].some((path) => path.startsWith(layer + '/')),
            `Missing template layer: ${layer}`,
        );
    }
    // Apply the same two settings as the upstream preview script at import
    // time, so the shipped CLI can keep copying files without a YAML parser.
    for (const variant of ['de-en', 'en-de']) {
        const site = parseDocument(
            readBlob(
                prefix + variant.slice(0, 2) + '/src/content/site.yaml',
            ).toString('utf8'),
        );
        const overrides = parseDocument(
            readBlob(prefix + variant + '/site-overrides.yaml').toString(
                'utf8',
            ),
        );
        assert.deepEqual(site.errors, []);
        assert.deepEqual(overrides.errors, []);
        for (const path of [
            ['i18n', 'locales'],
            ['header', 'links'],
        ]) {
            const value = overrides.getIn(path, true);
            assert.ok(
                value,
                `Missing bilingual starter setting: ${path.join('.')}`,
            );
            site.setIn(path, value);
        }
        assert.equal(site.get('name'), '__SITE_NAME_YAML__');
        add(
            variant + '/project/src/content/site.yaml',
            Buffer.from(
                site.toString({
                    indent: 4,
                    lineWidth: 0,
                    flowCollectionPadding: false,
                }),
            ),
        );
    }
    for (const path of [
        skill,
        '.agents/skills/sproutsite-edit-page/agents/openai.yaml',
        '.codex/config.toml',
        '.mcp.json',
        'CLAUDE.md',
    ]) {
        add('common/' + path, readBlob(path));
    }
    // The upstream Claude link points at the same skill. Ship a regular file.
    add('common/.claude/skills/sproutsite-edit-page/SKILL.md', readBlob(skill));
    add('common/LICENSE-SPROUTSITE', readBlob('LICENSE'));

    const manifestBytes = readBlob(assetRoot + 'manifest.json');
    const metadataBytes = readBlob('package.json');
    const metadata = JSON.parse(metadataBytes.toString('utf8')) as {
        name: string;
        version: string;
        exports: Record<string, string>;
    };
    assert.equal(metadata.name, 'sproutsite');
    assert.equal(
        metadata.exports['./starter-assets'],
        './' + assetRoot + 'manifest.json',
    );
    add('asset-manifest.json', manifestBytes);
    add(
        'asset-source.json',
        Buffer.from(
            JSON.stringify(
                {
                    packageName: metadata.name,
                    packageVersion: metadata.version,
                    publicExport: 'sproutsite/starter-assets',
                    packageMetadataSha256: sha256(metadataBytes),
                    manifestSha256: sha256(manifestBytes),
                    sourceCommit: commit,
                },
                null,
                4,
            ) + '\n',
        ),
    );

    for (const [path, bytes] of outputs) {
        const file = join(staged, path);
        await mkdir(dirname(file), { recursive: true });
        await writeFile(file, bytes);
    }
    await verifySnapshot(stagedRoot);
    assert.ok(
        (await lstat(dirname(destination))).isDirectory(),
        'Expected a regular templates directory.',
    );
    const current = new Set(
        await filesUnder(destination).catch((error: NodeJS.ErrnoException) => {
            if (error.code === 'ENOENT') return [];
            throw error;
        }),
    );
    const extra = [...current].filter((path) => !outputs.has(path));
    assert.deepEqual(
        extra,
        [],
        'Review and remove obsolete snapshot files before importing.',
    );
    const changed: string[] = [];
    for (const [path, bytes] of outputs) {
        if (
            !current.has(path) ||
            !bytes.equals(await readFile(join(destination, path)))
        )
            changed.push(path);
    }
    if (values.check) {
        assert.deepEqual(
            changed,
            [],
            'Starter snapshot differs from the pinned commit. Run npm run starter:import.',
        );
    } else {
        for (const path of changed) {
            const target = join(destination, path);
            await mkdir(dirname(target), { recursive: true });
            await writeFile(target, outputs.get(path)!);
        }
    }
    console.log(
        `Starter snapshot from Sproutsite ${commit}: ${outputs.size} files, ${changed.length} updated.`,
    );
} finally {
    await rm(stagedRoot, { recursive: true, force: true });
}
