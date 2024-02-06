MAKEFLAGS += --always-make

format:
	bunx prettier . --write && bunx eslint .

prisma:
	cd db; \
	bunx prisma migrate dev; \
	bunx prisma generate

worker:
	cd crawler; \
	bun --watch index.ts
web:
	cd web; \
	bun run dev

studio:
	cd db; \
	bunx prisma studio
