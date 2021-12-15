FROM node:15.9
WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

ENV NODE_ENV development
EXPOSE 80

CMD [ "node", "server.js" ]
