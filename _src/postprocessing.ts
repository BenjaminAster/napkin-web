
import * as FS from "node:fs/promises";
import * as Path from "node:path";

const escapeHTML = (input: string) => input
	.replaceAll('&', '&amp;')
	.replaceAll('"', '&quot;')
	.replaceAll('<', '&lt;')
	.replaceAll('>', '&gt;');

const wrapHTML = (info: { title: string; html: string; base: string; }) => /*html*/`<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1, interactive-widget=resizes-content, viewport-fit=cover" />
		<meta name="robots" content="all" />
		<meta name="referrer" content="no-referrer" />
		<meta name="author" content="Benjamin Aster" />
		<meta name="description" content="An infinitely large napkin" />
		<!-- <meta property="og:image" content="https://benjaminaster.com/NAME/assets/icon.png" /> -->
		<!-- <meta name="twitter:card" content="summary_large_image" /> -->
		<!-- <link rel="code-repository" href="https://github.com/BenjaminAster/NAME" /> -->
		<!-- <link rel="canonical" href="https://benjaminaster.com/NAME/" /> -->

		<title>${escapeHTML(info.title)}</title>
		<meta property="og:title" content="${escapeHTML(info.title)}" />

		<!-- <link rel="icon" href="https://venhance.github.io/napkin/cover-art.png" /> -->
		<link rel="icon" href="${info.base}assets/icon.png" />
		<!-- <link rel="aster:icon-dark" href="${info.base}assets/icon-dark.svg" /> -->
		<!-- <link rel="icon" href="${info.base}assets/icon.png" type="image/png" media="not (prefers-color-scheme: light)" sizes="512x512" /> -->
		<!-- <link rel="icon" href="${info.base}assets/icon-light.png" type="image/png" media="(prefers-color-scheme: light)" sizes="512x512" /> -->
		<meta name="color-scheme" content="dark light" />
		<!-- <meta name="theme-color" content="#111" /> -->
		<link rel="manifest" href="${info.base}_src/app.webmanifest" />

		<link rel="stylesheet" href="${info.base}_src/style.css" />
		<link rel="preload" as="style" href="${info.base}_src/latexml.css" />

		<script type="module" src="${info.base}_src/script.js"></script>

		<!-- <link rel="preload" as="font" crossorigin="anonymous" href="${info.base}assets/latinmodern-math/regular.otf" /> -->
		<link rel="preload" as="font" crossorigin="anonymous" href="${info.base}assets/newcomputermodern/regular.otf" />
		<link rel="preload" as="font" crossorigin="anonymous" href="${info.base}assets/newcomputermodern/bold.otf" />
		<link rel="preload" as="font" crossorigin="anonymous" href="${info.base}assets/newcomputermodern/italic.otf" />
		<link rel="preload" as="font" crossorigin="anonymous" href="${info.base}assets/newcomputermodern/bolditalic.otf" />
		<link rel="preload" as="font" crossorigin="anonymous" href="${info.base}assets/newcomputermodern/math.otf" />
	</head>
	<body>
		<main>
			${info.html}
		</main>
	</body>
</html>
`;

{
	FS.cp(
		Path.resolve(import.meta.dirname, "../external/venhance-napkin/media/"),
		Path.resolve(import.meta.dirname, "../media/"),
		{ recursive: true, filter: (source) => !source.endsWith("pdf") },
	);
}

const chapterRewrites = new Map([
	["Chx1.html", "preface"],
	["Chx2.html", "reader-advice"],
]);

const mainIndexHTML = await FS.readFile(Path.resolve(import.meta.dirname, `../latexml-out/index.html`), { encoding: "utf-8" });
const mainIndexTOC = mainIndexHTML.match(/<ol class="ltx_toclist ltx_toclist_document">\n(.+)\n<\/ol>/s)[1];
const index = [
	{
		id: "fontmatter",
		name: "Fontmatter",
		originalPath: "",
		chapters: [],
	},
];
for (const line of mainIndexTOC.split("\n")) {
	console.log(line);
	let { path, name } = line.match(/<a href="(?<path>[^"]+)".+<span class="ltx_text ltx_ref_title">(?<name>.+)<\/span><\/a>/).groups as { path: string; name: string; };
	console.log({ path, name });
	if (path.endsWith(".html")) {
		index[0].chapters.push({
			id: chapterRewrites.get(path),
			originalPath: path,
			name: name,
		});
	} else {
		let id = path.slice(0, -1);
		if (id.startsWith("part_")) id = id.slice(5);
		else id = "appendix";
		name = name.split("</span>").at(-1);
		index.push({
			id,
			name,
			originalPath: path,
			chapters: [],
		});
	}
};

console.dir(index, {
	depth: Infinity,
});

for (const part of index.slice(1)) {
	
}

// const mainTOC = await Promise.all(index.map(async ({ id: partId, name: partName }) => {
// 	const partTOCFile = await FS.readFile(Path.resolve(import.meta.dirname, `../latexml-out/part_${partId}/index.html`), { encoding: "utf-8" });
// 	// console.log(partId);
// 	const partTOCHTML = partTOCFile.match(/<ol class="ltx_toclist ltx_toclist_part">\n(.+)\n<\/ol>/s)[1];
// 	const partTOC = partTOCHTML.split("\n").map((line) => ({
// 		...(line.match(/<a href="ch_(?<id>.+)\..+ <\/span>(?<name>.+)<\/span>/)?.groups ?? {}) as { id: string; name: string; },
// 		partId,
// 	})).filter(({ id }) => id);
// 	return {
// 		id: partId,
// 		name: partName,
// 		toc: partTOC,
// 	};
// }));

// for (let partIndex = 0; partIndex < mainTOC.length; ++partIndex) {
// 	const { id: partId, name: partName, toc } = mainTOC[partIndex];
// 	for (let chapterIndex = 0; chapterIndex < toc.length; ++chapterIndex) {
// 		const { id: chapterId, name: chapterName } = toc[chapterIndex];
// 		const newChapterId = chapterId.replaceAll("_", "-");
// 		const file = await FS.readFile(Path.resolve(import.meta.dirname, `../latexml-out/part_${partId}/ch_${chapterId}.html`), { encoding: "utf-8" });
// 		const fileContent = file.match(/(<div class="ltx_page_content">.+<\/div>)\n<footer class="ltx_page_footer">/s)[1]
// 			.replaceAll(/color:#([0-9A-F]{6});/g, "color:var(--latex-color-$1);")
// 			.replaceAll(/ mathcolor="#.{6}"/g, '')
// 			.replaceAll(/ mathsize="\d{2}%"/g, '')
// 			.replaceAll('<mo lspace="0em" rspace="0.167em">\u2223</mo>', '<mo>\u2223</mo>')
// 			.replaceAll('<mfrac>', '<mfrac linethickness="0.6px">')
// 			.replaceAll(/<mo fence="true" ([lr])space="0em" stretchy="true">\u2225<\/mo>/g, '<mo fence="true" $1space="0em" stretchy="true">\u2016</mo>')
// 			.replaceAll('<table ', '<div class="table-container"><table ')
// 			.replaceAll('</table>', '</table></div>')
// 			.replaceAll('\u220E', '<sub title="End of proof">\u25FB\uFE0E</sub>')
// 			.replaceAll('<img ', '<img loading="lazy" ')
// 			.replaceAll(' src="media/', ' src="../media/')
// 			.replaceAll(/ href="\.\.\/part_(?<part>.+)\/ch_(?<chapter>.+)\.html/g,
// 				(...args) => ` href="../${args.at(-1).part.replaceAll("_", "-")}/${args.at(-1).chapter.replaceAll("_", "-")}.html`
// 			)
// 			.replaceAll('<h6 ', '<h5 ')
// 			.replaceAll('</h6>', '</h5>');
// 		const outPath = Path.resolve(import.meta.dirname, `../${partId}/${newChapterId}.html`);
// 		const previousChapter = toc[chapterIndex - 1] ?? mainTOC[partIndex - 1]?.toc.at(-1) ?? null;
// 		const nextChapter = toc[chapterIndex + 1] ?? mainTOC[partIndex + 1]?.toc[0] ?? null;
// 		const navbar = [
// 			``,
// 			`<nav>`,
// 			`<a href="../">Table of Contents</a><br />`,
// 			previousChapter
// 				? `<a href="${escapeHTML(
// 					`../${previousChapter.partId}/${previousChapter.id.replaceAll("_", "-")}.html`
// 				)}">Previous chapter: ${escapeHTML(previousChapter.name)}</a><br />`
// 				: "",
// 			nextChapter
// 				? `<a href="${escapeHTML(
// 					`../${nextChapter.partId}/${nextChapter.id.replaceAll("_", "-")}.html`
// 				)}">Next chapter: ${escapeHTML(nextChapter.name)}</a>`
// 				: "",
// 			`</nav>`,
// 			``,
// 		].join("\n");
// 		await FS.mkdir(Path.dirname(outPath), { recursive: true });
// 		await FS.writeFile(outPath, wrapHTML({
// 			title: `${chapterName}`,
// 			html: navbar + fileContent + navbar,
// 			base: "../",
// 		}));
// 	}
// }

// {
// 	await FS.writeFile(Path.resolve(import.meta.dirname, `../index.html`), wrapHTML({
// 		title: "An infinitely large napkin",
// 		html: [
// 			`<h1>An infinitely large napkin</h1>`,
// 			`<h2>Table of Contents</h2>`,
// 			`<ul id="toc">`,
// 			...mainTOC.map(part => [
// 				`<li>`,
// 				part.name,
// 				`<ul>`,
// 				...part.toc.map(chapter => [
// 					`<li>`,
// 					`<a href="${escapeHTML(`./${chapter.partId}/${chapter.id.replaceAll("_", "-")}.html`)}">`,
// 					chapter.name,
// 					`</a>`,
// 					`</li>`,
// 				].join("\n")),
// 				`</ul>`,
// 				`</li>`,
// 			].join("\n")),
// 			`</ul>`,
// 		].join("\n"),
// 		base: "./",
// 	}));
// }
