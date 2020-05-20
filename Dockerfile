FROM node:12.16-alpine as build-stage

ARG version=1.0-SNAPSHOT

ENV UI_VERSION=${version}

WORKDIR /app
COPY ./ /app/

RUN npm cache clean --force \
  && npm i \
  && npm run build

FROM nginx:1.17.10-alpine

ENV SERVER_HOSTNAME=http://localhost:8080/reporting-service

COPY --from=build-stage /app/dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY entrypoint.sh /

EXPOSE 80

ENTRYPOINT /entrypoint.sh
