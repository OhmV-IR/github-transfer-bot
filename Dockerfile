FROM ubuntu:24.04

RUN apt-get update && apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get install -y nodejs && apt-get clean
RUN mkdir /opt/appdata

WORKDIR /app
COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm i
COPY dist/ ./dist/

CMD ["node", "dist/index.js"]