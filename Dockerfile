ARG BASE_IMAGE
FROM ${BASE_IMAGE} 

WORKDIR /intellsys
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD [ "npm", "start" ]