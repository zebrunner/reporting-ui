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

For local development specify correct **SERVER_HOSTNAME** and execute:
```
SERVER_URL=https://localhost:8080/reporting-service

npm start
```
Application will be available by the URL: http://localhost:3000, it will automatically reload if you change any of the source files.

### Production

For production deployment execute:
```
npm run build
```
The following environment variables may be specified:
* **UI_VERSION** - version of UI build

### Startup variables
* **SERVER_URL** - hostname of API server
* **BASE_PATH** - base path used to serve content
