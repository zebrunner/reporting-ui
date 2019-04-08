FROM node:10.15.1-alpine as build-stage

LABEL authors="Alex Khursevich"

ARG environment=stage
ARG version=1.0-SNAPSHOT

#Linux setup
RUN apk update \
  && apk add --update alpine-sdk \
  && rm -rf /tmp/* /var/cache/apk/* *.tar.gz ~/.npm \
  && npm cache verify \
  && sed -i -e "s/bin\/ash/bin\/sh/" /etc/passwd \
  && apk add autoconf \
  && apk add automake \
  && apk add zlib=1.2.11-r1 \
  && apk add zlib-dev=1.2.11-r1 \
  && apk add libtool \
  && apk add nasm

WORKDIR /app
COPY ./ /app/
COPY ./nginx.conf /nginx.conf

RUN npm cache clean --force
RUN npm i
RUN npm run build

FROM nginx:1.15.9-alpine

COPY --from=build-stage /app/dist/ /usr/share/nginx/html/app
COPY --from=build-stage /nginx.conf /etc/nginx/conf.d/default.conf
