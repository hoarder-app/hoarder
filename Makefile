MAKEFLAGS += --always-make

format:
	bunx prettier . --write && bunx eslint .

prisma:
	cd db; \
	bunx prisma migrate dev; \
	bunx prisma generate

workers:
	cd workers; \
	bun --watch index.ts
web:
	cd web; \
	bun run dev

studio:
	cd db; \
	bunx prisma studio
