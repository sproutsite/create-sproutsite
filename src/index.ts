#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import {
    assertEmptyTarget,
    createProject,
    validateName,
    type Language,
} from './project.js';

const help = `Create a website with Sproutsite and Astro (Node.js 24+).

Usage: npm create sproutsite@latest [directory] -- [options]
       create-sproutsite [directory] [options]

Options:
  --name <name>       Website name (default: My website / Meine Website)
  --language <en|de>  Content language (default: en)
  --bilingual         Add the other language under /en/ or /de/
  --install          Install dependencies with npm
  --no-install       Create files without installing dependencies
  --yes, -y          Use defaults without interactive questions; installs by default
  --help, -h         Show this help
  --version, -v      Show the generator version

Existing non-empty directories are never overwritten.
Without a TTY, pass --yes to accept defaults or supply directory, name,
language and --install/--no-install explicitly.
`;

async function install(directory: string): Promise<void> {
    // npm sets npm_execpath for npm create/exec/run; no shell interpolation.
    const npmCli = process.env.npm_execpath;
    const child = npmCli
        ? spawn(
              process.execPath,
              [
                  npmCli,
                  'install',
                  '--no-audit',
                  '--no-fund',
                  '--dry-run=false',
                  '--package-lock=true',
              ],
              {
                  cwd: directory,
                  stdio: 'inherit',
              },
          )
        : spawn(
              process.platform === 'win32' ? 'npm.cmd' : 'npm',
              [
                  'install',
                  '--no-audit',
                  '--no-fund',
                  '--dry-run=false',
                  '--package-lock=true',
              ],
              {
                  cwd: directory,
                  stdio: 'inherit',
                  shell: false,
              },
          );
    await new Promise<void>((accept, reject) => {
        child.once('error', reject);
        child.once('exit', (code, signal) =>
            code === 0
                ? accept()
                : reject(
                      new Error(
                          `npm install failed (${code ?? signal}). Your project files were kept. Run npm install in ${JSON.stringify(directory)} to retry.`,
                      ),
                  ),
        );
    });
}

async function main() {
    const { values, positionals } = parseArgs({
        allowPositionals: true,
        options: {
            name: { type: 'string' },
            language: { type: 'string' },
            bilingual: { type: 'boolean' },
            install: { type: 'boolean' },
            'no-install': { type: 'boolean' },
            yes: { type: 'boolean', short: 'y' },
            help: { type: 'boolean', short: 'h' },
            version: { type: 'boolean', short: 'v' },
        },
    });
    if (values.help) {
        console.log(help);
        return;
    }
    if (values.version) {
        const { readFile } = await import('node:fs/promises');
        const metadata = JSON.parse(
            await readFile(new URL('../package.json', import.meta.url), 'utf8'),
        ) as { version: string };
        console.log(metadata.version);
        return;
    }
    if (Number(process.versions.node.split('.')[0]) < 24)
        throw new Error('Node.js 24 or later is required.');
    if (positionals.length > 1)
        throw new Error('Provide only one target directory.');
    if (values.install && values['no-install'])
        throw new Error('Choose either --install or --no-install.');
    if (
        values.language !== undefined &&
        values.language !== 'en' &&
        values.language !== 'de'
    )
        throw new Error('Language must be en or de.');
    const interactive = Boolean(
        process.stdin.isTTY && process.stdout.isTTY && !values.yes,
    );
    if (
        !interactive &&
        !values.yes &&
        (!positionals[0] ||
            !values.name ||
            !values.language ||
            (!values.install && !values['no-install']))
    ) {
        throw new Error(
            'Non-interactive mode requires --yes or directory, --name, --language and --install/--no-install.',
        );
    }
    const questions = interactive
        ? createInterface({ input: process.stdin, output: process.stdout })
        : undefined;
    const prompt = async (
        message: string,
        fallback: string,
    ): Promise<string> => {
        if (!questions) return fallback;
        return (
            (await questions.question(`${message} (${fallback}): `)).trim() ||
            fallback
        );
    };
    let directory: string;
    let language: Language;
    let name: string;
    let shouldInstall: boolean;
    try {
        directory =
            positionals[0] ?? (await prompt('Project directory', 'my-website'));
        if (!directory.trim())
            throw new Error('Project directory must not be empty.');
        await assertEmptyTarget(resolve(directory));
        const selected =
            values.language ??
            (await prompt('Content language: en / de', 'en'));
        if (selected !== 'en' && selected !== 'de')
            throw new Error('Language must be en or de.');
        language = selected;
        name = validateName(
            values.name ??
                (await prompt(
                    'Website name',
                    language === 'de' ? 'Meine Website' : 'My website',
                )),
        );
        const response = values['no-install']
            ? 'no'
            : values.install
              ? 'yes'
              : await prompt('Install dependencies? yes / no', 'yes');
        if (!['yes', 'y', 'no', 'n'].includes(response.toLowerCase()))
            throw new Error('Answer yes or no for dependency installation.');
        shouldInstall = ['yes', 'y'].includes(response.toLowerCase());
    } finally {
        questions?.close();
    }

    const target = await createProject({
        directory,
        language,
        name,
        bilingual: values.bilingual,
    });
    console.log(
        language === 'de'
            ? `Website angelegt: ${target}`
            : `Website created: ${target}`,
    );
    if (shouldInstall) await install(target);
    console.log(language === 'de' ? '\nNächste Schritte:' : '\nNext steps:');
    console.log(`  cd ${JSON.stringify(target)}`);
    if (!shouldInstall) console.log('  npm install');
    console.log('  npm run dev');
    console.log(
        language === 'de'
            ? '\nInhalte: src/content/ · Produktionsadresse vor Veröffentlichung in site.yaml anpassen.\nAGENTS.md enthält Hinweise für die redaktionelle Arbeit.'
            : '\nContent: src/content/ · Set the production URL in site.yaml before deployment.\nAGENTS.md contains guidance for editorial work.',
    );
}

main().catch((error: unknown) => {
    console.error(
        `create-sproutsite: ${error instanceof Error ? error.message : 'Unexpected error.'}`,
    );
    process.exitCode = 1;
});
