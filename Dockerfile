FROM mcr.microsoft.com/playwright:v1.50.0-noble
LABEL authors="choffmann"

RUN npm install -g corepack@latest && \
    corepack enable

RUN corepack prepare pnpm@latest --activate
