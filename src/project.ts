import { lstat, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type Language = 'en' | 'de';

export interface ProjectOptions {
    directory: string;
    name: string;
    language: Language;
}

const templateRoot = fileURLToPath(
    new URL('../templates/minimal/', import.meta.url),
);

export function packageName(directory: string): string {
    const name = basename(resolve(directory))
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 100);
    return name && name !== 'node-modules' ? name : 'my-website';
}

export function validateName(name: string): string {
    const trimmed = name.trim();
    if (
        !trimmed ||
        trimmed.length > 120 ||
        /[\u0000-\u001f\u007f]/.test(trimmed)
    ) {
        throw new Error(
            'Website name must contain 1–120 characters without control characters.',
        );
    }
    return trimmed;
}

/** A starter only: refuse links and populated targets, including dotfiles. */
export async function assertEmptyTarget(directory: string): Promise<void> {
    try {
        const entry = await lstat(directory);
        if (entry.isSymbolicLink() || !entry.isDirectory()) {
            throw new Error(
                `Target must be an empty directory, not a file or symlink: ${directory}`,
            );
        }
        if ((await readdir(directory)).length) {
            throw new Error(
                `Target is not empty; no files were changed: ${directory}`,
            );
        }
    } catch (error) {
        if (!(
            error instanceof Error &&
            'code' in error &&
            error.code === 'ENOENT'
        ))
            throw error;
    }
}

async function templateFiles(
    directory: string,
    prefix = '',
): Promise<string[]> {
    const entries = await readdir(directory, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
        if (entry.isSymbolicLink())
            throw new Error('Template symlinks are not supported.');
        const name = join(prefix, entry.name);
        if (entry.isDirectory())
            files.push(
                ...(await templateFiles(join(directory, entry.name), name)),
            );
        else if (entry.isFile()) files.push(name);
    }
    return files;
}

export async function createProject(options: ProjectOptions): Promise<string> {
    if (options.language !== 'en' && options.language !== 'de')
        throw new Error('Language must be en or de.');
    const name = validateName(options.name);
    const target = resolve(options.directory);
    await assertEmptyTarget(target);

    // Only fixed template tokens are replaced, once. JSON string literals are
    // valid YAML scalars and prevent names from injecting YAML or frontmatter.
    const tokens: Record<string, string> = {
        PACKAGE_NAME: packageName(target),
        SITE_NAME_YAML: JSON.stringify(name),
        LOCALE_JSON: JSON.stringify(options.language),
    };
    const output = new Map<string, string>();
    for (const layer of ['common', options.language]) {
        const directory = join(templateRoot, layer);
        for (const file of await templateFiles(directory)) {
            const destination = file === 'gitignore' ? '.gitignore' : file;
            if (output.has(destination))
                throw new Error(`Duplicate template file: ${destination}`);
            const content = await readFile(join(directory, file), 'utf8');
            output.set(
                destination,
                content.replace(/__([A-Z_]+)__/g, (_token, key: string) => {
                    const value = tokens[key];
                    if (value === undefined)
                        throw new Error(`Unknown template token: ${key}`);
                    return value;
                }),
            );
        }
    }
    await mkdir(target, { recursive: true });
    await assertEmptyTarget(target);
    for (const [file, content] of output) {
        const path = join(target, file);
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, content, { flag: 'wx' });
    }
    return target;
}
