# create-sproutsite — Rules for Coding Agents

This separate package creates ordinary Astro websites using the published Sproutsite dependency. It is a project initializer, not a CMS runtime, router, visual editor or agent. No publication, remote repository creation, push, tag or deployment without an explicit request.

- Maintain first-party program logic in TypeScript only. Build the CLI to JavaScript with TypeScript; generated `dist/` JavaScript is allowed. Keep Node.js 24 as the minimum and `.nvmrc` as the local supported LTS version.
- Keep runtime dependencies minimal. Prefer Node built-ins for argument parsing, prompts, file operations and process execution. Never interpolate user input into a shell command.
- Keep starter files in `templates/minimal/common/`, `en/` and `de/`. Reuse Sproutsite's documented exports. Do not copy theme/components, implement new routing, or modify the dependency's content contract to suit a template.
- Generated content, README and editorial AGENTS.md use the chosen language. Put editorial users first; technical contributor instructions are secondary. State precisely which files users edit and which pieces the library supplies.
- Use American English (en-US) for English-language text unless explicitly requested otherwise.
- Never overwrite populated target directories, hidden files or symlink targets. Validate user options before writing. Write new files exclusively; preserve generated files if npm installation fails and explain how to retry. Do not add an implicit destructive `--force` mode.
- Treat website names as data: quote YAML/JSON safely and never inject them into executable code, commands or headings. Avoid global string substitution of arbitrary content; only fixed tokens in the internal templates are supported.
- Install the real published Sproutsite package in generated websites. Version ranges must match tested peer versions. Do not use absolute local paths, workspace links, unpublished packages or an invented starter dependency in shipped templates.
- Keep npm archive and release metadata correct. Include LICENSE, NOTICE and templates in the archive. Do not let inherited `npm_config_dry_run` suppress local verification. The outer publish dry run must remain a dry run.
- `npm run format` formats sources and templates; `npm run format:check` checks them. Use four spaces, no tabs. Preserve official license text and do not format lockfiles or generated code.
- `npm run check` checks CLI, scripts and tests. `npm test` checks input safety and template output. `npm run test:starter` packs the generator, executes the packed CLI, installs published dependencies, and checks/builds English and German websites at `/` and `/demo/`.
- Run appropriate checks and document results honestly. Do not claim automated tests prove WCAG conformance. No own JavaScript source outside generated directories; no tests or developer files in npm archives.
- This package and first-party templates are Apache-2.0. Preserve copyright, LICENSE, NOTICE and third-party notices. Do not impose additional attribution obligations or grant trademark rights. The user's website content has no license assigned automatically.

Release preparation updates package.json, package-lock.json, VERSION and CHANGELOG.md consistently. The creator has its own versions, independent of Sproutsite. Use a tested library range rather than synchronizing version numbers automatically.
