
/* 
node _src/initial-preparations.ts
*/

import * as FS from "node:fs/promises";
import * as Path from "node:path";
import * as ChildProcess from "node:child_process";

await FS.mkdir(Path.resolve(import.meta.dirname, "./asy-temp/"), { recursive: true });

const asymptoteSVGs = new Map<string, string>();

for (const entry of await FS.readdir(Path.resolve(import.meta.dirname, "../external/venhance-napkin/asy"))) {
	if (!entry.endsWith(".asy")) continue;
	const name = entry.slice(0, -4);
	const content = (await FS.readFile(
		Path.resolve(import.meta.dirname, `../external/venhance-napkin/asy/${name}.asy`
		), { encoding: "utf-8" })).replace('settings.outformat = "pdf";', 'settings.outformat = "svg";');
	await FS.writeFile(Path.resolve(import.meta.dirname, `./asy-temp/${name}.asy`), content);
	const { promise, resolve } = Promise.withResolvers();
	ChildProcess.exec(
		`asy -cd external/venhance-napkin ../../_src/asy-temp/${name}.asy`,
		{ cwd: Path.resolve(import.meta.dirname, "../") },
		resolve,
	);
	await promise;
	let svg = (await FS.readFile(
		Path.resolve(import.meta.dirname, `../external/venhance-napkin/${name}.svg`),
		"utf-8",
	)).split("\n").slice(1).join("\n");
	await FS.rm(Path.resolve(import.meta.dirname, `../external/venhance-napkin/${name}.svg`));
	asymptoteSVGs.set(name.slice("Napkin-".length), svg);
}

await FS.writeFile(
	Path.resolve(import.meta.dirname, `./asy-temp/all-svgs.json`),
	JSON.stringify(Object.fromEntries(asymptoteSVGs), null, "\t"),
);


{
	// LaTeXML CSS:
	const files = [
		"LaTeXML.css",
		"ltx-book.css",
		"ltx-ulem.css",
	];
	let cssString = "";

	for (const file of files) {
		const content = await (await fetch(
			`https://raw.githubusercontent.com/brucemiller/LaTeXML/master/lib/LaTeXML/resources/CSS/${file}`
		)).text();
		cssString += `\n/* ===== ${file} ===== */\n\n${content}\n`;
	}

	await FS.writeFile(Path.resolve(import.meta.dirname, "./latexml.css"), cssString);
}

{
	// tkz-graph

	const content = await (await fetch(
		`https://ctan.org/tex-archive/macros/latex/contrib/tkz/tkz-graph/latex/tkz-graph.sty`
	)).text();

	await FS.writeFile(Path.resolve(import.meta.dirname, "../external/venhance-napkin/tkz-graph.sty"), content);
}
