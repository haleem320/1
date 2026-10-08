FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY server.js ./
COPY README_PASHTO.txt ./
COPY .env.example ./
EXPOSE 8080
CMD ["npm","start"]
