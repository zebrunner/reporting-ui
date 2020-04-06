'use strict';

const logLevelService = function logLevelService() {
    // TODO: create array of level objects
    const logLevels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'status'];
    const initialLevel = 'status';

    function filterLogs(logs, selectedLevel) {
        if (selectedLevel !== 'status') {
            const selectedRange = logLevels.slice(0, logLevels.indexOf(selectedLevel) + 1);
            
            return logs.filter((log) => selectedRange.includes(log.level.toLowerCase()));
        }

        return logs;
    }

    function setFilterRange(selectedLevel) {
        return logLevels.slice(0, logLevels.indexOf(selectedLevel) + 1);
    }

    return {
        filterLogs,
        setFilterRange,

        get logLevels() { return logLevels; },

        get initialLevel() { return initialLevel; },
    };
};

export default logLevelService;
