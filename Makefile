MAKEFLAGS += --always-make

format:
	bunx prettier . --write && bunx eslint .

prisma:
	cd packages/db; \
	bunx prisma migrate dev; \
	bunx prisma generate

workers:
	cd packages/workers; \
	bun --watch index.ts
web:
	cd packages/web; \
	bun run dev

studio:
	cd packages/db; \
	bunx prisma studio
