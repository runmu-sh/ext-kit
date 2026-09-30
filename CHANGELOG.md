# Changelog

## 1.0.1

- The `@muclient/sdk` peer is optional. It only supplies types (μClient provides the module at runtime), and npm 7+
  otherwise tries to install it under its bare name, which is not on npm (the package is `@runmu.sh/sdk`).

## 1.0.0

- First release: `clients/extensions/_kit` from runmu-sh/client, as a package.
