# Vite plugin for Peisar

Use [Peisar](https://github.com/phothinmg/peisar), a Rust-powered Markdown
parser, to import Markdown files into a Vite application. Markdown imports
include a React component and rendered HTML, and expose the source text and
frontmatter as named exports.

## Install

```sh
npm install vite vite-plugin-peisar peisar react
```

Your application also needs React's type declarations if it uses TypeScript and
does not already include them.

## Configure Vite

Add the plugin to your Vite configuration:

```ts
import { defineConfig } from "vite";
import { vitePluginPeisar } from "vite-plugin-peisar";

export default defineConfig({
  plugins: [vitePluginPeisar()],
});
```

Create file `src/vite-peisar-env.d.ts` with following content:

```ts
/// <reference types="vite/client" />
/// <reference types="vite-plugin-peisar/client" />
```

The plugin creates `vite-peisar-env.d.ts` in the project `src` directory if
it does not already exist. This file adds Vite and Markdown module types for
TypeScript.

## Import Markdown

Import a Markdown file as a React component:

```tsx
import Guide, { frontmatter, html, raw } from "./guide.md";

export function Page() {
  return (
    <article>
      <h1>{frontmatter.title}</h1>
      <Guide />
    </article>
  );
}
```

- The default export is a React component that renders the generated HTML.
- `html` is the rendered HTML string.
- `raw` is the original Markdown source.
- `frontmatter` is an object parsed from YAML, TOML, or JSON frontmatter (or an
  empty object if the document has none).

Use the `?html` query to import the rendered HTML string as the default export:

```ts
import html, { frontmatter, raw } from "./guide.md?html";
```

Vite's asset query imports, such as `?raw` and `?url`, are left to Vite to
handle.

## Options

Pass an options object to `vitePluginPeisar(options)`:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `fileExtensions` | Array of supported extension literals | `.md`, `.markdown`, `.mdown`, `.mkdn`, `.mkd`, `.mdwn`, `.mkdown`, `.ron` | File extensions to transform. |
| `plugins` | `peisar.PeisarPlugin[]` | `[]` | Peisar plugins to apply while rendering Markdown. |
| `gfm` | `boolean` | `true` | Enable GitHub Flavored Markdown. |
| `kramdown` | `boolean` | `true` | Enable Kramdown syntax. |
| `wrapperClass` | `string` | — | Set a CSS class on the generated React component's wrapper element. |
| `cache` | `boolean` | `true` | Enable the persistent render cache in Vite's cache directory. |

`.ron` files are recognized by default, but `.ron` is not currently included in
the TypeScript type for custom `fileExtensions` values.

For example, to disable the persistent cache and set a wrapper class:

```ts
vitePluginPeisar({
  cache: false,
  wrapperClass: "markdown-content",
});
```

## License

[Apache-2.0](./LICENSE)
