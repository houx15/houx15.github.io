# Build from repository root: docker build -f server/Dockerfile -t portfolio-assistant .
FROM node:24-bookworm-slim
ENV NODE_ENV=production PORT=8787 PORTFOLIO_BIND=0.0.0.0
WORKDIR /app
COPY --chown=node:node server ./server
COPY --chown=node:node src/assets/knowledge.js ./src/assets/knowledge.js
COPY --chown=node:node package.json ./package.json
USER node
EXPOSE 8787
CMD ["node", "server/index.mjs"]
