FROM node:20
WORKDIR /intellsys-website
COPY package*.json ./
RUN npm install
COPY build ./build
COPY public ./public
COPY server.js ./
EXPOSE 3000
CMD ["npm", "start" ]
