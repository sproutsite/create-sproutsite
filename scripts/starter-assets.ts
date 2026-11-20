import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { lstat, readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export interface AssetManifest {
    schemaVersion: 1;
    license: 'Apache-2.0';
    publicDirectory: string;
    files: { path: string; sha256: string }[];
    branding: {
        logo: {
            src: string;
            srcOnDark: string;
            width: number;
            height: number;
            showName: true;
        };
        icons: {
            favicon: string;
            shortcut: string;
            appleTouch: string;
            app192: string;
            app512: string;
        };
        sharingImage: { src: string; alt: string };
    };
    localizedSharingImageAlt: { en: string; de: string };
    heroExample: {
        source: string;
        contentDestination: string;
        frontmatter: { 'background-image': string; classes: null };
    };
}

export function sha256(data: Uint8Array): string {
    return createHash('sha256').update(data).digest('hex');
}

export function safePath(path: string): string {
    assert.equal(typeof path, 'string');
    assert.ok(/^[a-zA-Z0-9_./-]+$/.test(path), `Invalid asset path: ${path}`);
    assert.ok(
        path.split('/').every((part) => part && part !== '.' && part !== '..'),
        `Unsafe asset path: ${path}`,
    );
    return path;
}

export async function filesUnder(root: string): Promise<string[]> {
    assert.ok((await lstat(root)).isDirectory(), `Expected directory: ${root}`);
    const result: string[] = [];
    for (const entry of await readdir(root, { withFileTypes: true })) {
        assert.ok(!entry.isSymbolicLink(), `Asset symlink: ${entry.name}`);
        if (entry.isDirectory()) {
            for (const child of await filesUnder(join(root, entry.name)))
                result.push(`${entry.name}/${child}`);
        } else {
            assert.ok(entry.isFile(), `Unsupported asset: ${entry.name}`);
            result.push(entry.name);
        }
    }
    return result.sort();
}

export async function readManifest(file: string): Promise<AssetManifest> {
    assert.ok(
        (await lstat(file)).isFile(),
        'Manifest must be a regular file, not a symlink.',
    );
    const manifest = JSON.parse(await readFile(file, 'utf8')) as AssetManifest;
    assert.equal(manifest.schemaVersion, 1);
    assert.equal(manifest.license, 'Apache-2.0');
    assert.equal(manifest.publicDirectory, 'public');
    assert.ok(Array.isArray(manifest.files) && manifest.files.length > 0);
    const paths = manifest.files.map((asset) => {
        assert.match(asset.sha256, /^[a-f0-9]{64}$/);
        return safePath(asset.path);
    });
    assert.equal(
        new Set(paths).size,
        paths.length,
        'Duplicate manifest paths.',
    );
    for (const required of ['LICENSE.txt', 'NOTICE.txt'])
        assert.ok(paths.includes(required));
    assert.equal(manifest.branding.logo.showName, true);
    assert.ok(
        manifest.branding.logo.width > 0 && manifest.branding.logo.height > 0,
    );
    const references = [
        manifest.branding.logo.src,
        manifest.branding.logo.srcOnDark,
        manifest.branding.sharingImage.src,
        ...Object.values(manifest.branding.icons),
    ];
    for (const path of references) {
        assert.ok(path.startsWith('/branding/'));
        assert.ok(
            paths.includes(safePath(path.slice(1))),
            `Missing branding asset: ${path}`,
        );
    }
    for (const language of ['en', 'de'] as const)
        assert.ok(
            typeof manifest.localizedSharingImageAlt[language] === 'string' &&
                manifest.localizedSharingImageAlt[language].length > 0,
        );
    const hero = manifest.heroExample;
    safePath(hero.source);
    safePath(hero.contentDestination);
    assert.ok(hero.source.startsWith('public/'));
    assert.ok(paths.includes(hero.source.slice('public/'.length)));
    assert.ok(hero.contentDestination.startsWith('src/content/pages/_assets/'));
    assert.equal(
        hero.frontmatter['background-image'],
        `./${hero.contentDestination.slice('src/content/pages/'.length)}`,
    );
    assert.equal(hero.frontmatter.classes, null);
    return manifest;
}

export async function verifyAssets(
    directory: string,
    manifest: AssetManifest,
): Promise<void> {
    assert.deepEqual(
        await filesUnder(directory),
        manifest.files.map((asset) => asset.path).sort(),
        'Public file list differs from manifest.',
    );
    for (const asset of manifest.files)
        assert.equal(
            sha256(await readFile(join(directory, safePath(asset.path)))),
            asset.sha256,
            `Asset hash mismatch: ${asset.path}`,
        );
}

export async function verifySnapshot(root: string): Promise<AssetManifest> {
    const minimal = join(root, 'templates/minimal');
    const manifestFile = join(minimal, 'asset-manifest.json');
    const manifest = await readManifest(manifestFile);
    const source = JSON.parse(
        await readFile(join(minimal, 'asset-source.json'), 'utf8'),
    ) as {
        manifestSha256: string;
        packageName: string;
        packageVersion: string;
        publicExport: string;
    };
    assert.equal(source.packageName, 'sproutsite');
    assert.equal(source.publicExport, 'sproutsite/starter-assets');
    assert.match(source.packageVersion, /^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/);
    assert.equal(source.manifestSha256, sha256(await readFile(manifestFile)));
    await verifyAssets(join(minimal, 'common/public'), manifest);
    const hero = manifest.heroExample;
    assert.equal(
        sha256(
            await readFile(resolve(minimal, 'common', hero.contentDestination)),
        ),
        manifest.files.find((asset) => `public/${asset.path}` === hero.source)!
            .sha256,
    );
    return manifest;
}
