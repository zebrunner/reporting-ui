#!/bin/sh

# Config updates
sed -i -e 's#http://localhost:8080/zafira-ws#'"$ZAFIRA_WS_URL"'#g' '/usr/share/nginx/html'"$ZAFIRA_UI_BASE"'config.json'
sed -i -e 's#1.0-SNAPSHOT#'"$ZAFIRA_UI_VERSION"'#g' '/usr/share/nginx/html'"$ZAFIRA_UI_BASE"'config.json'
sed -i -e 's#/app/#'"$ZAFIRA_UI_BASE"'#g' '/usr/share/nginx/html'"$ZAFIRA_UI_BASE"'index.html'
# Start NGINX
nginx -g 'daemon off;'
