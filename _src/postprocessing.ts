
import * as FS from "node:fs/promises";
import * as Path from "node:path";

import asymptoteSVGs from "./asy-temp/all-svgs.json" with { type: "json" };

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
interface Chapter {
	id: string;
	originalFileName: string;
	name: string;
	part: Part;
	number: string | null;
}
interface Part {
	id: string;
	name: string;
	originalPath: string;
	chapters: Chapter[];
	romanNumeral: string | null;
}
const book: Part[] = [
	{
		id: "fontmatter",
		name: "Fontmatter",
		originalPath: "",
		chapters: [],
		romanNumeral: null,
	},
];

for (const line of mainIndexTOC.split("\n")) {
	// console.log(line);
	let { path, name } = line.match(
		/<a href="(?<path>[^"]+)".+<span class="ltx_text ltx_ref_title">(?<name>.+)<\/span><\/a>/
	).groups as { path: string; name: string; };
	// console.log({ path, name });
	if (path.endsWith(".html")) {
		book[0].chapters.push({
			id: chapterRewrites.get(path),
			originalFileName: path,
			name: name,
			part: book[0],
			number: null,
		});
	} else {
		let id = path.slice(0, -1);
		if (id.startsWith("part_")) id = id.slice(5);
		else id = "appendix";
		let romanNumeral: string;
		[romanNumeral, name] = name.slice('<span class="ltx_tag ltx_tag_ref">'.length).split(" </span>");
		book.push({
			id,
			name,
			originalPath: path,
			chapters: [],
			romanNumeral,
		});
	}
};

// console.dir(index, {
// 	depth: Infinity,
// });

for (const part of book.slice(1)) {
	const partIndexHTML = await FS.readFile(Path.resolve(import.meta.dirname, `../latexml-out/${part.originalPath}index.html`), { encoding: "utf-8" });
	const partTOCHTML = partIndexHTML.match(/<ol class="ltx_toclist ltx_toclist_part">\n(.+)\n<\/ol>/s)[1];
	part.chapters.push(...partTOCHTML.split("\n").map((line) => {
		const { originalFileName, name, chapterNumber } = line.match(
			/<a href="(?<originalFileName>[^"]+)".+<span class="ltx_tag ltx_tag_ref">(?<chapterNumber>\w+) <\/span>(?<name>.+)<\/span>/
		).groups as { originalFileName: string; name: string; chapterNumber: string; };
		let id: string = originalFileName.replaceAll("_", "-").slice(0, -5);
		if (id.startsWith("ch-")) id = id.slice(3).toLowerCase();
		else if (id.startsWith("app-")) id = id.slice(4);
		else if (id.startsWith("Ch")) id = "p-adic-numbers";
		else if (id.startsWith("A")) id = "glossary";
		return {
			originalFileName,
			name,
			id,
			part,
			number: chapterNumber,
		};
	}));
}

console.dir(book, { depth: Infinity });

for (let partIndex = 0; partIndex < book.length; ++partIndex) {
	const part = book[partIndex];
	for (let chapterIndex = 0; chapterIndex < part.chapters.length; ++chapterIndex) {
		const chapter = part.chapters[chapterIndex];
		const file = await FS.readFile(
			Path.resolve(import.meta.dirname, `../latexml-out/${part.originalPath}${chapter.originalFileName}`),
			"utf-8",
		);
		let asymptoteCount = 0;
		const fileContent = file.match(/(<div class="ltx_page_content">.+<\/div>)\n<footer class="ltx_page_footer">/s)[1]
			.replaceAll(/<pre class="ltx_verbatim ltx_centering ltx_font_typewriter">.*?<\/pre>/sg, () => {
				++asymptoteCount;
				return [
					'<div class="asymptote-drawing">',
					asymptoteSVGs[`${chapter.number}${String.fromCodePoint(0x40 + asymptoteCount)}`]
						.replaceAll(" id='", ` id='asymptote-${chapter.number}-${asymptoteCount}-`)
						.replaceAll("='url(#", `='url(#asymptote-${chapter.number}-${asymptoteCount}-`)
						.replaceAll(" xlink:href='#", ` href='#asymptote-${chapter.number}-${asymptoteCount}-`),
					'</div>',
				].join("\n");
			})
			.replaceAll(/color:#([0-9A-Fa-f]{6});/g, "color:var(--latex-color-$1);")
			.replaceAll(/ (stroke|fill)=['"]#([0-9A-Fa-f]{3,6})['"]/g, ' $1="var(--asymptote-color-$2)"')
			.replaceAll(/ mathcolor="#.{6}"/g, '')
			.replaceAll(/ mathsize="\d{2}%"/g, '')
			.replaceAll('<mo lspace="0em" rspace="0.167em">\u2223</mo>', '<mo>\u2223</mo>')
			.replaceAll('<mfrac>', '<mfrac linethickness="0.6px">')
			.replaceAll(/<mo fence="true" ([lr])space="0em" stretchy="true">\u2225<\/mo>/g, '<mo fence="true" $1space="0em" stretchy="true">\u2016</mo>')
			.replaceAll('<table ', '<div class="table-container"><table ')
			.replaceAll('</table>', '</table></div>')
			.replaceAll('\u220E', '<sub title="End of proof">\u25FB\uFE0E</sub>')
			.replaceAll('<img ', '<img loading="lazy" ')
			.replaceAll(' src="external/venhance-napkin/', ' src="../external/venhance-napkin/')
			.replaceAll(' src="x', ` src="../latexml-out/${part.originalPath}/x`)
			.replaceAll(/ href="\.\.\/part_(?<part>.+)\/ch_(?<chapter>.+)\.html/g,
				(...args) => ` href="../${args.at(-1).part.replaceAll("_", "-")}/${args.at(-1).chapter.replaceAll("_", "-")}.html`
			)
			.replaceAll('<h6 ', '<h5 ')
			.replaceAll('</h6>', '</h5>');
		const outPath = Path.resolve(import.meta.dirname, `../${part.id}/${chapter.id}.html`);
		const previousChapter = part.chapters[chapterIndex - 1] ?? book[partIndex - 1]?.chapters.at(-1) ?? null;
		const nextChapter = part.chapters[chapterIndex + 1] ?? book[partIndex + 1]?.chapters[0] ?? null;
		const navbar = [
			``,
			`<nav>`,
			`<a href="../">Table of Contents</a><br />`,
			previousChapter
				? `<a href="${escapeHTML(
					`../${previousChapter.part.id}/${previousChapter.id.replaceAll("_", "-")}.html`
				)}">Previous chapter: ${escapeHTML(previousChapter.name)}</a><br />`
				: "",
			nextChapter
				? `<a href="${escapeHTML(
					`../${nextChapter.part.id}/${nextChapter.id.replaceAll("_", "-")}.html`
				)}">Next chapter: ${escapeHTML(nextChapter.name)}</a>`
				: "",
			`</nav>`,
			``,
		].join("\n");
		await FS.mkdir(Path.dirname(outPath), { recursive: true });
		await FS.writeFile(outPath, wrapHTML({
			title: `${chapter.name}`,
			html: navbar + fileContent + navbar,
			base: "../",
		}));
	}
}

{
	await FS.writeFile(Path.resolve(import.meta.dirname, `../index.html`), wrapHTML({
		title: "An infinitely large napkin",
		html: [
			`<h1>An infinitely large napkin</h1>`,
			`<h2>Table of Contents</h2>`,
			`<ul id="toc">`,
			...book.map((part, partNumber) => [
				`<li>`,
				part.romanNumeral ? `${part.romanNumeral}: ` : "",
				part.name,
				`<ul>`,
				...part.chapters.map(chapter => [
					`<li>`,
					`<a href="${escapeHTML(`./${part.id}/${chapter.id}.html`)}">`,
					(chapter.number ? `${chapter.number}: ` : ""),
					chapter.name,
					`</a>`,
					`</li>`,
				].join("\n")),
				`</ul>`,
				`</li>`,
			].join("\n")),
			`</ul>`,
		].join("\n"),
		base: "./",
	}));
}
