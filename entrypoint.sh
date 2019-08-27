#!/bin/sh

# Config updates
sed -i -e 's#http://localhost:8080/zafira-ws#'"$ZAFIRA_API_HOST/$ZAFIRA_API_CONTEXT_PATH"'#g' '/usr/share/nginx/html/app/config.json'
# Start NGINX
nginx -g 'daemon off;'
