FROM node:13.3.0-alpine AS builder

COPY package*.json ./
RUN npm install


#second stage
FROM node:13.3.0-alpine

ENV PATH="./node_modules/.bin:$PATH"
WORKDIR /usr/src/app
COPY --from=builder node_modules node_modules
COPY . .
EXPOSE 4200
CMD ["npm", "run", "start-docker"]



