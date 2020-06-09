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

### Container startup variables
* **SERVER_URL** - hostname of API server

### Container build variables
* **BASE_PATH** - base path used to serve content. May be useful if you plan to run Reporting UI behind proxy
* **UI_VERSION** - version of UI build

# Zebrunner Reporting UI as a package
Reporting module is available as an [npm package](https://www.npmjs.com/package/@zebrunner/reporting).

```
npm install @zebrunner/reporting
```

## Available scripts

### `npm run package:prepare`
It cleans all builded folders and create typing for the package.

### `npm run package:build`
This script runs `package:clean` and build the project as a library.

### `npm run package:serve`
This script runs `package:clean` and build the package in the `development` mode watchers on updates.
