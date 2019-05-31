'use strict';

const testDetailsService = function testDetailsService() {
    'ngInject';

    let _tags = null;
    let _statuses = null;

    return  {
        setTags,
        getTags,
        setStatuses,
        getStatuses,
        isDetailsFilterActive,
        clearDataCache,
    };

    function setTags(tags) {
        _tags = tags;
    }

    function getTags() {
        return _tags;
    }

    function setStatuses(statuses) {
        _statuses = statuses;
    }

    function getStatuses() {
        return _statuses;
    }

    function isDetailsFilterActive() {
        return (_statuses && _statuses.length) || (_tags && _tags.length);
    }

    function clearDataCache() {
        _tags = null;
        _statuses = null;
    }
};

export default testDetailsService;
