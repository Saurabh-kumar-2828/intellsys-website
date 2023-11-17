FROM node:20
RUN apt-get update && apt-get install -y apt-transport-https ca-certificates curl gnupg && \
    curl -sLf --retry 3 --tlsv1.2 --proto "=https" 'https://packages.doppler.com/public/cli/gpg.DE2A7741A397C129.key' | apt-key add - && \
    echo "deb https://packages.doppler.com/public/cli/deb/debian any-version main" | tee /etc/apt/sources.list.d/doppler-cli.list && \
    apt-get update && \
    apt-get -y install doppler
WORKDIR /intellsys-website
COPY package*.json ./
RUN npm install
COPY build ./build
COPY public ./public
COPY server.js ./
EXPOSE 3000
CMD ["doppler", "run", "--", "npm", "start" ]
