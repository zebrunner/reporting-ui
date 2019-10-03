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
        uploadSettingFile,
        fetchIntegrationsTypes,
        fetchIntegrationOfType,
        fetchIntegrationOfTypeByName,
        createIntegration,

        // fillToolSettings,
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

    function setToolStatus(toolName, id, status) {
        let currentTool = tools[toolName].find((tool) => {
            return tool.integrationId === id;
        })
        if (currentTool.connected === status) { return; }

        currentTool.connected = status;
    }

    function isToolConnected(currentTool) {
        if(!currentTool.name) {
            return tools[currentTool] && tools[currentTool].some((tool) => {
                return tool.connected;
            });
        } else if(tools[currentTool.type.name]) {
            let tempTool = tools[currentTool.type.name].find((tool) => {
                return tool.integrationId === currentTool.id;
            })

            return tempTool && tempTool.connected;
        }
    }

    // function fillToolSettings(toolName, settings) {
    //     switch(toolName) {
    //         case 'RABBITMQ':
    //             tools.rabbitmq.enabled = settings['RABBITMQ_ENABLED'];
    //             tools.rabbitmq.user = settings['RABBITMQ_USER'];
    //             tools.rabbitmq.pass = settings['RABBITMQ_PASSWORD'];
    //             break;
    //         case 'JIRA':
    //             tools.jira.enabled = settings['JIRA_ENABLED'];
    //             tools.jira.url = settings['JIRA_URL'];
    //             break;
    //         case 'JENKINS':
    //             tools.jenkins.enabled = settings['JENKINS_ENABLED'];
    //             tools.jenkins.url = settings['JENKINS_URL'];
    //             break;
    //         case 'GOOGLE':
    //             tools.google.enabled = settings['GOOGLE_ENABLED'];
    //             break;
    //         default:
    //             break;
    //     }
    // }

    function updateSettings(id, integrationDTO) {
        return $httpMock.put(API_URL + '/api/integrations/' + id, integrationDTO).then(UtilService.handleSuccess, UtilService.handleError('Unable to edit settings'));
    }

    /* Fetch available tools with their statuses */
    function fetchTools() {
        return $httpMock.get(API_URL + '/api/integrations-info')
            .then(UtilService.handleSuccess, UtilService.handleError('Unable to fetch tools'))
            .then(response => {
                if (response.success) {
                    tools = response.data;
                    tools = formatTools();
                    
                    return tools;
                }

                return $q.reject(response);
            });
    }

    function formatTools() {
        let formattedTools = {};
        for (let key in tools) {
            formattedTools = {...formattedTools, ...tools[key]};
        }

        return formattedTools;
    }

    function fetchToolSettings(toolName) {
        return $httpMock.get(API_URL + '/api/settings/tool/' + toolName).then(UtilService.handleSuccess, UtilService.handleError(`Unable to fetch ${toolName} settings`));
    }

    function fetchIntegrationsTypes() {
        return $httpMock.get(API_URL + '/api/integration-groups').then(UtilService.handleSuccess, UtilService.handleError(`Unable to fetch integration groups`));
    }

    function createIntegration(integrationTypeId, integrationDTO) {
        return $httpMock.post(API_URL + '/api/integrations?integrationTypeId=' + integrationTypeId, integrationDTO).then(UtilService.handleSuccess, UtilService.handleError('Unable to create integration'));
    }

    function fetchIntegrationOfType(type) {
        return $httpMock.get(API_URL + '/api/integrations?groupId=' + type).then(UtilService.handleSuccess, UtilService.handleError(`Unable to fetch integrations of groups`));
    }

    function fetchIntegrationOfTypeByName(name) {
        return $httpMock.get(API_URL + '/api/integrations?groupName=' + name).then(UtilService.handleSuccess, UtilService.handleError(`Unable to fetch integrations of groups`));
    }

    function fetchToolConnectionStatus(groupName, id) {
        return $httpMock.get(API_URL + '/api/integrations-info/' + id + '?groupName=' + groupName).then(UtilService.handleSuccess, UtilService.handleError('Unable to get tool connection'));
    }

    function uploadSettingFile(multipartFile, tool, settingName) {
        return $httpMock.post(API_URL + '/api/settings/tools?tool=' + tool + '&name=' + settingName + '&file=', multipartFile, {headers: {'Content-Type': undefined}, transformRequest : angular.identity}).then(UtilService.handleSuccess, UtilService.handleError('Unable to upload file'));
    }

    return service;
};

export default toolsService;
