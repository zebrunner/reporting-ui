'use strict';

const logLevelService = function logLevelService() {
    // TODO: create array of level objects with weight indexes
    const logLevels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'status'];
    const initialLevel = 'status';

    function filterLogs(logs, selectedLevel) {
        if (selectedLevel !== logLevels[logLevels.length - 1]) {
            const selectedRange = logLevels.slice(0, logLevels.indexOf(selectedLevel) + 1);

            return logs.filter((log) => selectedRange.includes(log.level.toLowerCase()));
        }

        return logs;
    }

    function setFilterRange(selectedLevel) {
        return logLevels.slice(0, logLevels.indexOf(selectedLevel) + 1);
    }

    function logShouldBeFiltered(log, selectedLevel) {
        // "all" level
        if (selectedLevel === logLevels[logLevels.length - 1]) {
            return false;
        }

        const selectedRange = logLevels.slice(0, logLevels.indexOf(selectedLevel) + 1);

        return !selectedRange.includes(log.level.toLowerCase());
    }

    return {
        filterLogs,
        setFilterRange,
        logShouldBeFiltered,

        get logLevels() { return logLevels; },
        get initialLevel() { return initialLevel; },
    };
};

export default logLevelService;
