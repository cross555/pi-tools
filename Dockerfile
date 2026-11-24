FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY server.js ./
COPY public ./public

# No ejecutar como root dentro del contenedor.
USER node
EXPOSE 8080

CMD ["node", "server.js"]
