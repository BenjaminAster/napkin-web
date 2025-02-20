
latexmlc _src/1.tex --dest=latexml-out/index.html --nodefaultresources --whatsout=document --splitat=chapter --split --splitnaming=labelrelative --log=/dev/null --sitedirectory=latexml-out/ --path=external/venhance-napkin/ --includestyles --timeout=0

for file in external/venhance-napkin/asy/*.asy;
	do asy -f svg "$file";
done


node _src/postprocessing.ts
