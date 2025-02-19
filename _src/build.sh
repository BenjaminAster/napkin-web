
latexmlc _src/1.tex --dest=latexml-out/index.html --nodefaultresources --whatsout=document --splitat=chapter --split --splitnaming=labelrelative --log=/dev/null --sitedirectory=latexml-out/ --path=external/venhance-napkin/ --base=external/venhance-napkin/ --includestyles --timeout=0

node _src/postprocessing.ts
