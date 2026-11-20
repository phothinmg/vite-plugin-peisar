import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { peisar, toml, yaml } from "peisar";
import type { Plugin, ResolvedConfig } from "vite";

/// File extensions recognized as Markdown, mirroring the
/// [`markdown-extensions`](https://github.com/sindresorhus/markdown-extensions)
const DEFAULT_EXTENSIONS = [
	".md",
	".markdown",
	".mdown",
	".mkdn",
	".mkd",
	".mdwn",
	".mkdown",
	".ron",
];
const VITE_ASSET_QUERY_RE = /[?&](raw|url|inline|worker|sharedworker)(?:&|$)/;
const HTML_QUERY_RE = /[?&]html(?:&|$)/;

export interface VitePluginPeisarOptions {
	/** File extensions to transform. Defaults to the common Markdown extensions listed below. */
	fileExtensions?: (
		| ".md"
		| ".markdown"
		| ".mdown"
		| ".mkdn"
		| ".mkd"
		| ".mdwn"
		| ".mkdown"
		| ".ron"
	)[];
	/** Peisar plugins to apply when rendering Markdown. */
	plugins?: peisar.PeisarPlugin[];
	/** Enable GitHub Flavored Markdown. Defaults to `true`. */
	gfm?: boolean;
	/** Enable Kramdown syntax. Defaults to `true`. */
	kramdown?: boolean;
	/** Set a CSS class on the generated React wrapper. */
	wrapperClass?: string;
	/** Enable the persistent cache in Vite's cache directory. Defaults to `false`. */
	cache?: boolean;
}

interface CacheEntry {
	hash: string;
	html: string;
	// biome-ignore  lint/suspicious/noExplicitAny: any
	frontmatter: Record<string, any>;
}

interface CacheFile {
	renderConfigHash: string;
	entries: Record<string, CacheEntry>;
}

// Helpers

function hashContent(content: string): string {
	return crypto.createHash("sha256").update(content).digest("hex");
}

function writeDts() {
	const filePath = path.resolve(process.cwd(), "vite-peisar-env.d.ts");
	if (!fs.existsSync(filePath)) {
		const txt = `/// <reference types="vite/client" />\n/// <reference types="vite-plugin-peisar/client" />`;
		fs.writeFileSync(filePath, txt);
	}
}

export function vitePluginPeisar(
	options: VitePluginPeisarOptions = {},
): Plugin {
	writeDts();
	const extensions = options.fileExtensions ?? DEFAULT_EXTENSIONS;
	const enableDiskCache = options.cache ?? true;
	const peisarPlugins = options.plugins ?? [];
	const is_gfm = options.gfm ?? true;
	const is_kramdown = options.kramdown ?? true;
	const pluginSignatures = peisarPlugins.map((plugin) =>
		Object.entries(plugin)
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([hook, callback]) => [hook, callback.toString()]),
	);
	const renderConfigHash = hashContent(
		JSON.stringify({
			gfm: is_gfm,
			kramdown: is_kramdown,
			plugins: pluginSignatures,
		}),
	);
	const class_name: Record<string, unknown> = options.wrapperClass
		? { className: options.wrapperClass }
		: {};

	const memoryCache = new Map<string, CacheEntry>();

	// let resolvedConfig: ResolvedConfig;
	let cacheFilePath = "";
	let isDirty = false;
	let saveTimer: NodeJS.Timeout | null = null;

	const isMarkdownFile = (filepath: string) =>
		extensions.some((ext) => filepath.endsWith(ext));

	function writeCacheToDisk() {
		if (!enableDiskCache || !isDirty || !cacheFilePath) return;

		if (saveTimer) {
			clearTimeout(saveTimer);
			saveTimer = null;
		}

		fs.mkdirSync(path.dirname(cacheFilePath), { recursive: true });
		fs.writeFileSync(
			cacheFilePath,
			JSON.stringify({
				renderConfigHash,
				entries: Object.fromEntries(memoryCache),
			}),
			"utf-8",
		);
		isDirty = false;
	}

	function scheduleSave() {
		if (!enableDiskCache || !isDirty) return;
		if (saveTimer) clearTimeout(saveTimer);

		// Wait 500ms after the last file transform before writing to disk
		saveTimer = setTimeout(writeCacheToDisk, 500);
	}

	return {
		name: "vite-plugin-peisar",
		enforce: "pre",

		config() {
			return {
				optimizeDeps: {
					exclude: ["peisar"],
				},
				ssr: {
					external: ["peisar"],
				},
			};
		},
		configResolved(config: ResolvedConfig) {
			if (!enableDiskCache) return;

			cacheFilePath = path.join(config.cacheDir, "peisar-cache.json");
			if (fs.existsSync(cacheFilePath)) {
				try {
					const cached = JSON.parse(
						fs.readFileSync(cacheFilePath, "utf-8"),
					) as CacheFile;
					if (cached.renderConfigHash !== renderConfigHash) {
						memoryCache.clear();
						fs.rmSync(cacheFilePath, { force: true });
						return;
					}
					for (const [key, value] of Object.entries(cached.entries)) {
						memoryCache.set(key, value as CacheEntry);
					}
				} catch {
					memoryCache.clear();
					fs.rmSync(cacheFilePath, { force: true });
				}
			}
		},
		watchChange(id) {
			const [filepath] = id.split("?");
			if (
				isMarkdownFile(filepath as string) &&
				memoryCache.delete(filepath as string)
			) {
				isDirty = true;
			}
		},
		handleHotUpdate(ctx) {
			const [filepath] = ctx.file.split("?");
			if (
				isMarkdownFile(filepath as string) &&
				memoryCache.delete(filepath as string)
			) {
				isDirty = true;
			}
		},
		// Persist updated cache to disk once bundling finishes
		buildEnd() {
			writeCacheToDisk();
		},
		transform(code, id) {
			if (VITE_ASSET_QUERY_RE.test(id)) return;

			const [filepath, rawQuery = ""] = id.split("?");
			if (!isMarkdownFile(filepath as string)) return;

			const contentHash = hashContent(JSON.stringify([renderConfigHash, code]));
			let entry = memoryCache.get(filepath as string);

			if (!entry || entry.hash !== contentHash) {
				const pei = new peisar.Peisar(code, {
					fragment: true,
					gfm: is_gfm,
					kramdown: is_kramdown,
				});
				if (peisarPlugins.length > 0) {
					for (const plugin of peisarPlugins) {
						pei.use(plugin);
					}
				}
				// biome-ignore  lint/suspicious/noExplicitAny: any
				let fmt = {} as Record<string, any>;
				switch (pei.frontmatter.frontmatterType) {
					case "Empty":
						fmt = {};
						break;
					case "Yaml":
						fmt = yaml.yamlParser(pei.frontmatter.raw);
						break;
					case "Toml":
						fmt = toml.parseToml(pei.frontmatter.raw);
						break;
					case "Json":
						fmt = JSON.parse(pei.frontmatter.raw);
						break;
					default:
						fmt = {};
						break;
				}
				entry = {
					hash: contentHash,
					html: pei.html,
					frontmatter: fmt,
				};

				memoryCache.set(filepath as string, entry);
				isDirty = true;
				scheduleSave();
			}
			const sharedExports = `
        export const raw = ${JSON.stringify(code)};
        export const frontmatter = ${JSON.stringify(entry.frontmatter)};
      `;

			if (HTML_QUERY_RE.test(`?${rawQuery}`)) {
				return {
					code: `
            ${sharedExports}
            export default ${JSON.stringify(entry.html)};
          `,
					map: null,
				};
			}
			return {
				code: `
          import React from "react";

          export const html = ${JSON.stringify(entry.html)};
          ${sharedExports}

          export default function MarkdownContent(props) {
            return React.createElement("div", {
              ...props,
              ...${JSON.stringify(class_name)},
              dangerouslySetInnerHTML: { __html: html },
            });
          }
        `,
				map: null,
			};
		},
	};
}
