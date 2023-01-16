FROM node:19-alpine

WORKDIR /collabCrafter

COPY ./package*.json ./

RUN npm install

COPY ./ ./

EXPOSE 80
EXPOSE 443
EXPOSE 27017

CMD ["npm", "start"]