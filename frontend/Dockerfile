FROM node:18 as builder

WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN rm -rf /build && mv /src/build /build
