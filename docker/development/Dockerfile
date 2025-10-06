FROM node:20-alpine

WORKDIR /src

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8081

CMD ["npm", "run", "start:dev"]
