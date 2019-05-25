'use strict';

const testDetailsService = function testDetailsService() {
    'ngInject';

    let _tags = null;
    let _statuses = null;

    return  {
        setTags,
        getStoredTags,
        setStatuses,
        getStoredStatuses,
        isDetailsFilterActive,
        clearDataCache,
    };

    function setTags(tags) {
        _tags = tags;
    }

    function getStoredTags() {
        return _tags;
    }

    function setStatuses(statuses) {
        _statuses = statuses;
    }

    function getStoredStatuses() {
        return _statuses;
    }

    function isDetailsFilterActive() {
        return _statuses || _tags;
    }

    function clearDataCache() {
        _tags = null;
        _statuses = null;
    }
};

export default testDetailsService;
