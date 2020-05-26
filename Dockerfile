FROM node:12.16-alpine as build-stage

ARG version=1.0-SNAPSHOT

ENV UI_VERSION=${version} \
    BASE_PATH=abc

WORKDIR /app

COPY ./package.json /app/
RUN npm cache clean --force && npm i

# build from sources performed in a different layer to benefit from previous layers caching
COPY ./ /app/
RUN npm run build

FROM nginx:1.17.10-alpine

ENV SERVER_URL=http://localhost:8080/reporting-service

COPY --from=build-stage /app/dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY entrypoint.sh /

EXPOSE 80

ENTRYPOINT /entrypoint.sh
