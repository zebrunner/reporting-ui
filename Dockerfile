FROM node:10.15.1-alpine as build-stage

LABEL authors="Alex Khursevich"

ARG version=1.0-SNAPSHOT

ENV ZAFIRA_UI_BASE=/app/
ENV ZAFIRA_UI_VERSION=${version}

# Linux setup
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

RUN npm cache clean --force
RUN npm i
RUN npm run build


FROM nginx:1.15.9-alpine

ENV ZAFIRA_API_HOST=http://localhost:8080 \
    ZAFIRA_API_CONTEXT_PATH=zafira-ws

COPY --from=build-stage /app/dist/ /usr/share/nginx/html/app/
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY entrypoint.sh /

EXPOSE 80

ENTRYPOINT /entrypoint.sh
