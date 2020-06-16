'use strict';

const carinaLogsAgent = function carinaLogsAgent(
    moment,
) {
    'ngInject';

    return {
        name: 'Carina logs agent',
        esIndex: '',
        prefix: 'logs-',
        searchCriteria: [],

        initESIndex,
        initSearchCriteria,
        handleScreenshotLog,
    };

    function handleScreenshotLog(log, logs) {
        let isNewScreenshotLog = false;
        const pathId = getMetaLogCorrelationId(log);
        let screenshotLog = getScreenshotLogByPathId(pathId, logs);

        if (!screenshotLog) {
            isNewScreenshotLog = true;
            log.originalLevel = log.level;
            log.level = 'INFO';
            log.message = log.message || 'Screenshot is captured';
            log.urls = {};
            screenshotLog = log;
        }

        const imagePath = getMetaLogAmazonPath(log);
        const thumbnailPath = getMetaLogThumbAmazonPath(log);

        if (imagePath) {
            screenshotLog.urls.image = {
                path: imagePath,
                name: log.threadName || 'screenshot',
            };
        }
        if (thumbnailPath) {
            screenshotLog.urls.thumb = { path: thumbnailPath };
        }

        return isNewScreenshotLog ? screenshotLog : null;
    }

    function initSearchCriteria(ciRunId, ciTestId) {
        this.searchCriteria = [
            {'correlation-id': `${ciRunId}_${ciTestId}`},
        ];
    }

    function initESIndex(startTime, finishTime) {
        const startTimeFormatted = moment.utc(startTime).format('YYYY.MM.DD');
        const finishTimeFormatted = moment.utc(finishTime).format('YYYY.MM.DD');
        const startIndex = `${this.prefix}${startTimeFormatted}`;
        const finishIndex = `${this.prefix}${finishTimeFormatted}`;

        this.esIndex = startIndex === finishIndex ? startIndex : `${startIndex},${finishIndex}`;
    }

    function getScreenshotLogByPathId(pathId, logs) {
        return logs.find((log) => log.headers && getMetaLogCorrelationId(log) === pathId);
    }

    function getMetaLogCorrelationId(log) {
        return getMetaLogHeader(log, 'AMAZON_PATH_CORRELATION_ID');
    }

    function getMetaLogAmazonPath(log) {
        return getMetaLogHeader(log, 'AMAZON_PATH');
    }

    function getMetaLogThumbAmazonPath(log) {
        return getMetaLogHeader(log, 'THUMB_AMAZON_PATH');
    }

    function getMetaLogHeader(log, headerName) {
        return log.headers[headerName];
    }
}

export default carinaLogsAgent;
