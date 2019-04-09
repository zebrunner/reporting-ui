#!/bin/sh

# Config updates
sed -i -e 's#http://localhost:8080/zafira-ws#'"$ZAFIRA_WS_URL"'#g' '/usr/share/nginx/html'"$ZAFIRA_UI_BASE"'config.json'
sed -i -e 's#/app/#'"$ZAFIRA_UI_BASE"'#g' '/etc/nginx/conf.d/default.conf'
# Start NGINX
nginx -g 'daemon off;'
