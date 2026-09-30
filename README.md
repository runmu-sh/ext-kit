# @runmu.sh/ext-kit

The world-module runtime shared by the first-party [μClient](https://runmu.sh) extensions
[Tickets](https://github.com/runmu-sh/ext-tickets), [Assist](https://github.com/runmu-sh/ext-assist) and
[Puppets](https://github.com/runmu-sh/ext-puppets). Each of them bundles it; it is not an extension itself.

| Import | What |
|---|---|
| `@runmu.sh/ext-kit/module` | `enabled` (off/auto/on) and `source` (gmcp/api/both) per world, staff role, the Views entry and auto-panels, the `Core.Supports` handshake, configurable actions (command/gmcp/ext/none) with extension overrides, data requests, read marks, `fillTemplate` |
| `@runmu.sh/ext-kit/schema` | A small JSON Schema subset validator for module payloads |
| `@runmu.sh/ext-kit/dom` | `h(tag, props, ...children)` and `sanitize(html)` (the channel HTML allow-list) |
| `@runmu.sh/ext-kit/css` | The module panel styles, laid out over the host's `mu.ui.css` primitives, tokens only |

```sh
npm i -D @runmu.sh/ext-kit @muclient/sdk@npm:@runmu.sh/sdk@^1.6.0
```

The module model is described in the μClient docs: <https://runmu.sh/docs/extensions/>.
