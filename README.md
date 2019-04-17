# Zafira UI

## Requirements
* NPM 6.0.0
* Node v8.9.4+

## Installation
Go to the project directory and install dependencies
```
npm cache clean --force
npm i
```

## Build

**NOTE**: The build artifacts will be stored in the `dist/` directory.

### Development

For local development specify correct **ZAFIRA_WS_URL** and execute:
```
ZAFIRA_WS_URL=https://localhost:8080/zafira-ws npm start
```
Application will be available by the URL: http://localhost:3000, it will automatically reload if you change any of the source files.

### Production

For production deployment execute:
```
npm run build
```
The following environement variables may be specified:
* **ZAFIRA_UI_BASE** - UI bath path (default is /app/)
* **ZAFIRA_UI_VERSION** - version of UI build

### Startup variables
* **ZAFIRA_WS_URL** - URL of API server
