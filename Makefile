.PHONY: all crypto-js build clean clean-npm distclean

build: node_modules
	./src/build.js

node_modules:
	npm install

crypto-js: node_modules
	./setup/crypto-js.sh

all: crypto-js build

clean:
	rm -rf scripts/nano

clean-npm:
	rm -rf node_modules

distclean: clean clean-npm


