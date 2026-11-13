FROM node:22-slim
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY . .
RUN chown -R node:node /app
USER node
ENV NODE_ENV=production
ENV PORT=7860
EXPOSE 7860
CMD ["npm", "start"]
