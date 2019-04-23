'use strict';

const toolsService = function toolsService($httpMock, API_URL, $q, UtilService) {
    'ngInject';

    let loader$ = null;
    let tools = {

    };
    const service = {
        initialized: false,

        get tools() { return tools; },
        getTools,
        fetchToolSettings,
        updateSettings,
        fetchToolConnectionStatus,

        fillToolSettings,
        setToolStatus,
        isToolConnected,
    };

    function getTools(force) {
        if (!force && loader$) {
            return loader$;
        }

        loader$ = fetchTools();

        return loader$;
    }

    function setToolStatus(toolName, status) {
        if (tools[toolName] === status) { return; }

        tools[toolName] = status;
    }

    function isToolConnected(toolName) {
        return tools[toolName];
    }

    function fillToolSettings(toolName, settings) {
        switch(toolName) {
            case 'RABBITMQ':
                tools.rabbitmq.enabled = settings['RABBITMQ_ENABLED'];
                tools.rabbitmq.user = settings['RABBITMQ_USER'];
                tools.rabbitmq.pass = settings['RABBITMQ_PASSWORD'];
                break;
            case 'JIRA':
                tools.jira.enabled = settings['JIRA_ENABLED'];
                tools.jira.url = settings['JIRA_URL'];
                break;
            case 'JENKINS':
                tools.jenkins.enabled = settings['JENKINS_ENABLED'];
                tools.jenkins.url = settings['JENKINS_URL'];
                break;
            case 'GOOGLE':
                tools.google.enabled = settings['GOOGLE_ENABLED'];
                break;
            default:
                break;
        }
    }

    function updateSettings(settings) {
        return $httpMock.put(API_URL + '/api/settings/tools', settings).then(UtilService.handleSuccess, UtilService.handleError('Unable to edit settings'));
    }

    /* Fetch available tools with their statuses */
    function fetchTools() {
        return $httpMock.get(API_URL + '/api/settings/tools')
            .then(UtilService.handleSuccess, UtilService.handleError('Unable to fetch tools'))
            .then(response => {
                if (response.success) {
                    tools = response.data;

                    return tools;
                }

                return $q.reject(response);
            });
    }

    function fetchToolSettings(toolName) {
        return $httpMock.get(API_URL + '/api/settings/tool/' + toolName).then(UtilService.handleSuccess, UtilService.handleError(`Unable to fetch ${toolName} settings`));
    }

    function fetchToolConnectionStatus(name) {
        return $httpMock.get(API_URL + '/api/settings/tools/' + name).then(UtilService.handleSuccess, UtilService.handleError('Unable to get tool connection'));
    }

    return service;
};

export default toolsService;
