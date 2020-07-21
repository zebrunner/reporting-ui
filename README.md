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

For local development specify correct **SERVER_HOST** and execute:
```
SERVER_HOST=https://localhost:8080

npm start
```
Application will be available by the URL: http://localhost:3000, it will automatically reload if you change any of the source files.

### Production

For production deployment execute:
```
npm run build
```

### Container startup variables
* **SERVER_HOST** - hostname of API server

### Container build variables
* **BASE_PATH** - base path used to serve content. May be useful if you plan to run Reporting UI behind proxy
* **UI_VERSION** - version of UI build
