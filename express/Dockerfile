# Build environment
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json .

RUN npm ci --silent

COPY . .

RUN npm run build

# Production environment
FROM node:22-alpine AS production

WORKDIR /app

ENV PORT 3000
ENV NODE_ENV production
ENV TZ 'UTC'

COPY package*.json .

RUN npm ci --silent

COPY --from=build /app/dist dist
COPY --from=build /app/openapi openapi
COPY activationEmailTemplate.html .

EXPOSE 3000

CMD ["npm", "start"]