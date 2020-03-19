# Zebrunner Reporting UI

## Requirements
* NPM  v6.0.0+
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

For local development specify correct **ZAFIRA_API_HOST** and **ZAFIRA_API_CONTEXT_PATH** and execute:
```
ZAFIRA_API_HOST=https://localhost:8080
ZAFIRA_API_CONTEXT_PATH=zafira-ws

npm start
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
* **ZAFIRA_API_HOST** - hostname of API server
* **ZAFIRA_API_CONTEXT_PATH** - API server context path
