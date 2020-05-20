#!/bin/sh

# Config updates
sed -i -e 's#http://localhost:8080/reporting-service#'"$SERVER_HOSTNAME"'#g' '/usr/share/nginx/html/config.json'
# Start NGINX
nginx -g 'daemon off;'
