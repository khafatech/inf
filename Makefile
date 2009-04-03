WEB = /home/bcrowell/Lightandmatter/calc/inf

# For linting, download jslint.js from http://www.jslint.com/rhino/index.html .
# Below I invoke it via a trivial perl script for convenience.

post:
	cp *.js $(WEB)
	cp *.html $(WEB)

lint:
	perl -e 'foreach my $$js(<*.js>) {print "-------------$$js------------\n"; system("jslint $$js")}'
