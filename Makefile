MAKEFLAGS += --always-make

format:
	yarn prettier . --write

lint:
	yarn eslint .

prisma:
	cd packages/db; \
	yarn prisma migrate dev; \
	yarn prisma generate

workers:
	cd packages/workers; \
	yarn start
web:
	cd packages/web; \
	yarn run dev

studio:
	cd packages/db; \
	yarn prisma studio
