.PHONY: build

build:
	npm run build
	scp -P 23 dist/* xander@metasyn.pw:/var/www/nginx/memex/shows
