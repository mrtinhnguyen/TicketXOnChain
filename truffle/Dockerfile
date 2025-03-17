FROM node:22-alpine AS production

WORKDIR /app

COPY package*.json .

RUN npm ci --silent

RUN npm install ganache --silent

COPY . .

EXPOSE 8545

CMD ["npm", "run", "ganache"]