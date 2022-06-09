FROM node:16
WORKDIR /usr/src/app
COPY . .
RUN npm install
EXPOSE 8000 6379 27017
CMD [ "npm", "start" ]
