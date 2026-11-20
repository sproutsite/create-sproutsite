import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, join, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, readFile, writeFile, copyFile, lstat } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import {
    readManifest,
    sha256,
    verifyAssets,
    verifySnapshot,
} from './starter-assets.js';

const root = fileURLToPath(new URL('../', import.meta.url));

async function checkDestination(path: string, boundary: string): Promise<void> {
    const inside = relative(boundary, path);
    assert.ok(
        inside && !inside.startsWith('..') && !isAbsolute(inside),
        'Copy destination escaped templates.',
    );
    for (let current = path; ; current = dirname(current)) {
        try {
            assert.equal(
                (await lstat(current)).isSymbolicLink(),
                false,
                `Destination symlink: ${current}`,
            );
        } catch (error) {
            if (!(
                error instanceof Error &&
                'code' in error &&
                error.code === 'ENOENT'
            ))
                throw error;
        }
        if (current === boundary) break;
    }
}
const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { check: { type: 'boolean' }, archive: { type: 'string' } },
});
assert.ok(
    positionals.length <= 1,
    'Usage: npm run starter-assets:sync -- /reviewed/package [--archive /reviewed/package.tgz] [--check]',
);
if (!positionals[0]) {
    assert.ok(
        values.check,
        'Provide the reviewed, installed or extracted Sproutsite package directory.',
    );
    await verifySnapshot(root);
    console.log(
        'Vendored starter assets, notices and hero match the recorded manifest.',
    );
} else {
    const packageRoot = resolve(positionals[0]);
    const packageFile = join(packageRoot, 'package.json');
    const metadataBytes = await readFile(packageFile);
    const metadata = JSON.parse(metadataBytes.toString('utf8')) as {
        name: string;
        version: string;
    };
    assert.equal(metadata.name, 'sproutsite');
    const entry = createRequire(packageFile).resolve(
        'sproutsite/starter-assets',
    );
    const entryPath = relative(packageRoot, entry);
    assert.ok(
        entryPath && !entryPath.startsWith('..') && !isAbsolute(entryPath),
        'Export resolved outside the supplied package.',
    );
    const manifest = await readManifest(entry);
    const sourceDirectory = dirname(entry);
    await verifyAssets(
        join(sourceDirectory, manifest.publicDirectory),
        manifest,
    );
    const minimal = join(root, 'templates/minimal');
    if (values.check) {
        const recorded = await verifySnapshot(root);
        assert.deepEqual(
            recorded,
            manifest,
            'Supplied package differs from vendored manifest.',
        );
        const source = JSON.parse(
            await readFile(join(minimal, 'asset-source.json'), 'utf8'),
        ) as {
            packageVersion: string;
            packageMetadataSha256: string;
            archiveSha256?: string;
        };
        assert.equal(source.packageVersion, metadata.version);
        assert.equal(source.packageMetadataSha256, sha256(metadataBytes));
        if (values.archive)
            assert.equal(
                source.archiveSha256,
                sha256(await readFile(resolve(values.archive))),
            );
    } else {
        // Validate the entire source before updating delivery copies. This tool
        // only touches the generator checkout, never an existing user website.
        const destinations = [
            ...manifest.files.map((asset) =>
                join(minimal, 'common/public', asset.path),
            ),
            join(minimal, 'common', manifest.heroExample.contentDestination),
            join(minimal, 'asset-manifest.json'),
            join(minimal, 'asset-source.json'),
        ];
        for (const destination of destinations)
            await checkDestination(destination, minimal);
        for (const asset of manifest.files) {
            const target = join(minimal, 'common/public', asset.path);
            await mkdir(dirname(target), { recursive: true });
            await copyFile(
                join(sourceDirectory, manifest.publicDirectory, asset.path),
                target,
            );
        }
        const hero = join(
            minimal,
            'common',
            manifest.heroExample.contentDestination,
        );
        await mkdir(dirname(hero), { recursive: true });
        await copyFile(
            join(sourceDirectory, manifest.heroExample.source),
            hero,
        );
        await copyFile(entry, join(minimal, 'asset-manifest.json'));
        await writeFile(
            join(minimal, 'asset-source.json'),
            JSON.stringify(
                {
                    packageName: metadata.name,
                    packageVersion: metadata.version,
                    publicExport: 'sproutsite/starter-assets',
                    packageMetadataSha256: sha256(metadataBytes),
                    manifestSha256: sha256(await readFile(entry)),
                    ...(values.archive
                        ? {
                              archiveSha256: sha256(
                                  await readFile(resolve(values.archive)),
                              ),
                          }
                        : {}),
                },
                null,
                4,
            ) + '\n',
        );
        await verifySnapshot(root);
    }
    console.log(
        `${values.check ? 'Verified' : 'Copied'} ${manifest.files.length} public assets and local hero from sproutsite@${metadata.version} via sproutsite/starter-assets.`,
    );
}
