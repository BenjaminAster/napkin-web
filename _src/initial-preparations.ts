
/* 
node --experimental-strip-types src/load-latexml-css.ts
*/

import * as FS from "node:fs/promises";
import * as Path from "node:path";

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
