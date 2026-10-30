# Publishing to npm

The package name is `unique-boat-name-generator`. Publication is public and uses
the version in `package.json`. Keep `package-lock.json` at the same version.

## Check the release

```bash
npm ci
npm run data
npm run typecheck
npm test
npm run test:package
npm run build:demo -- /npm-unique-boat-name-generator/
```

Review changes produced by data generation. Boat and username dictionaries have
separate versions and fingerprints. Changes to either dictionary need its own
version bump, updated seeded output where applicable, and a changelog entry.

`test:package` builds the library, creates an npm archive, installs it in a
temporary project and checks ESM, CommonJS and TypeScript imports. Research files,
examples and the web demo are excluded from the archive.

Check the package contents before publishing:

```bash
npm publish --dry-run
```

Before publishing, replace the README's unpublished status with npm installation
instructions. Commit the intended release source and push it to GitHub. The
package should correspond to that source revision.

## Authenticate and publish

```bash
npm whoami
npm login --auth-type=web
npm publish --access public
```

Run `npm login` if authentication is missing or expired. Complete npm's browser
sign-in or two-factor prompt yourself. Do not put tokens or recovery codes in this
repository. The `prepublishOnly` script reruns the source checks and build.

An npm package version cannot be reused. After publication, verify the published
version and install it in a separate project:

```bash
npm view unique-boat-name-generator version
npm install unique-boat-name-generator
```

Publishing the npm package and deploying the web demo are separate operations.
