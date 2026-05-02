FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

WORKDIR /app

COPY package.json pnpm-workspace.yaml tsconfig.base.json pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/

RUN pnpm install --filter api...

COPY apps/api ./apps/api

WORKDIR /app/apps/api

EXPOSE 4000

CMD ["pnpm", "run", "dev"]
