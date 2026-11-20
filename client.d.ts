// Standard Markdown component + HTML exports
// 1
declare module "*.md" {
	import type { ComponentType, HTMLAttributes } from "react";

	export const html: string;
	export const raw: string;
	export const frontmatter: Record<string, any>;
	const MarkdownContent: ComponentType<HTMLAttributes<HTMLDivElement>>;
	export default MarkdownContent;
}
// 2
declare module "*.markdown" {
	export * from "*.md";
	export { default } from "*.md";
}
// 3
declare module "*.mdown" {
	export * from "*.md";
	export { default } from "*.md";
}
// 4
declare module "*.mkdn" {
	export * from "*.md";
	export { default } from "*.md";
}
// 5
declare module "*.mkd" {
	export * from "*.md";
	export { default } from "*.md";
}
// 6
declare module "*.ron" {
	export * from "*.md";
	export { default } from "*.md";
}
// 7
declare module "*.mdwn" {
	export * from "*.md";
	export { default } from "*.md";
}
// 8
declare module "*.mkdown" {
	export * from "*.md";
	export { default } from "*.md";
}
// ------------------------------------------------------------
// Vite asset query suffixes (?raw, ?url, ?inline)
// 1
declare module "*.md?raw" {
	const content: string;
	export default content;
}
// 2
declare module "*.markdown?raw" {
	export { default } from "*.md?raw";
}
// 3
declare module "*.mdown?raw" {
	export { default } from "*.md?raw";
}
// 4
declare module "*.mkdn?raw" {
	export { default } from "*.md?raw";
}
// 5
declare module "*.mkd?raw" {
	export { default } from "*.md?raw";
}

// 6
declare module "*.ron?raw" {
	export { default } from "*.md?raw";
}
// 7
declare module "*.mdwn?raw" {
	export { default } from "*.md?raw";
}
// 8
declare module "*.mkdown?raw" {
	export { default } from "*.md?raw";
}
// ------------------------------------------------
// 1
declare module "*.md?url" {
	const src: string;
	export default src;
}
// 2
declare module "*.markdown?url" {
	export { default } from "*.md?url";
}
// 3
declare module "*.mdown?url" {
	export { default } from "*.md?url";
}
// 4
declare module "*.mkdn?url" {
	export { default } from "*.md?url";
}
// 5
declare module "*.mkd?url" {
	export { default } from "*.md?url";
}
// 6
declare module "*.ron?url" {
	export { default } from "*.md?url";
}
// 7
declare module "*.mdwn?url" {
	export { default } from "*.md?url";
}
// 8
declare module "*.mkdown?url" {
	export { default } from "*.md?url";
}
// ------------------------------------------------
// 1
declare module "*.md?inline" {
	const src: string;
	export default src;
}
// 2
declare module "*.markdown?inline" {
	export { default } from "*.md?inline";
}
// 3
declare module "*.mdown?inline" {
	export { default } from "*.md?inline";
}
// 4
declare module "*.mkdn?inline" {
	export { default } from "*.md?inline";
}
// 5
declare module "*.mkd?inline" {
	export { default } from "*.md?inline";
}
// 6
declare module "*.ron?inline" {
	export { default } from "*.md?inline";
}
// 7
declare module "*.mdwn?inline" {
	export { default } from "*.md?inline";
}
// 8
declare module "*.mkdown?inline" {
	export { default } from "*.md?inline";
}

// ------------------------------------------------
