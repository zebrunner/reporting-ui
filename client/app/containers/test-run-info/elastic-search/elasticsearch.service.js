'use strict';

// TODO: add flag if service is not initialized by some reason, and handle cases if service is not initialized

const elasticsearchService = function elasticsearchService(
    $http,
    toolsService,
) {
    'ngInject';

    let esSettings;

    return {
        initService,
        fetchCount,
        fetchSearch,
    };

    function buildMustClause(termsArray) {
        return termsArray.map((searchField) => ({ term: searchField }));
    }

    function initService() {
        return toolsService.fetchToolSettings('ELASTICSEARCH')
            .then(({ success, data }) => {
                if (success) {
                    esSettings = data.reduce((accum, setting) => {
                        accum[setting.name.toLowerCase()] = setting.value;

                        return accum;
                    }, {});
                    initAuthData();
                }

                return success;
            });
    }

    function initAuthData() {
        // get username and password from URL, and clean URL from them
        if (esSettings.url.includes('@')) {
            parseESUrl();
        }
        // generate value for Basic Authentication header
        if (esSettings.user && esSettings.password) {
            esSettings.authBasic = getAuthBasic(esSettings.user, esSettings.password);
        }
    }

    function getAuthBasic(username, password) {
        const base64 = btoa(`${username}:${password}`);

        return `Basic ${base64}`;
    }

    function parseESUrl() {
        try {
            const url = new URL(esSettings.url);

            esSettings.user = url.username;
            esSettings.password = url.password;
            url.username = '';
            url.password = '';
            esSettings.url = url.href;
        } catch (error) {
            console.error('Incorrect elastic search URL');
        }
    }

    function fetchCount(esIndex, searchFields, canceler) {
        const params = {
            query: {
                bool: {
                    must: buildMustClause(searchFields),
                },
            },
        };
        const settings = {
            headers: { Authorization:  esSettings.authBasic },
            timeout: canceler,
        };

        return $http.post(`${esSettings.url}/${esIndex}/_count`, params, settings)
            .then((response) => response.data);
    }

    function fetchSearch(esIndex, searchFields, from, size, canceler) {
        const params = {
            query: {
                bool: {
                    must: buildMustClause(searchFields),
                },
            },
            sort: [{
                timestamp: {
                    order: 'asc',
                },
            }],
            size,
            from,
        };
        const settings = {
            headers: { Authorization:  esSettings.authBasic },
            timeout: canceler,
        };

        return $http.post(`${esSettings.url}/${esIndex}/_search`, params, settings)
            .then((response) => response.data);
    }
};

export default elasticsearchService;
