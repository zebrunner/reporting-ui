'use strict';

const toolsService = function toolsService($httpMock, API_URL, $q, SettingsService, UtilService) {
    'ngInject';

    let loader$ = null;
    const tools = {

    };
    const service = {
        initialized: false,

        get tools() { return tools; },
        getTools,
        fillToolSettings,
        getToolData,
        saveToolData,
        getToolStatus,
        setToolStatus,
        isToolConnected,
    };

    function initTools() {
        return SettingsService.getSettingTools()
            .then(response => {
                if (response.success) {
                    const promises = response.data.map(toolName => {

                        tools[toolName] = tools[toolName] || {};
                        tools[toolName].name = toolName;

                        return SettingsService.isToolConnected(toolName)
                            .then(toolResponse => {
                                if (toolResponse.success) {
                                    tools[toolName].connected = toolResponse.data;
                                }
                            });
                    });

                    return $q.all(promises)
                        .then(() => tools)
                        .finally(() => {
                            service.initialized = true;
                        });
                }

                return $q.reject(response);
            });
    }

    function getTools(force) {
        if (!force && loader$) {
            return loader$;
        }

        loader$ = initTools();

        return loader$;
    }

    function getToolData(toolName) {
        fetchToolData(toolName)
            .then(res => {

            });
    }

    function saveToolData(tool) {

    }

    function getToolStatus(toolName) {

    }

    function setToolStatus(toolName, status) {
        const tool = tools[toolName];

        if (tool.enabled === status) { return $q.resolve(); }

        tool.enabled = status;

        if (!status) {
            tool.connected = status;

            return $q.resolve(tool);
        } else {
            return SettingsService.isToolConnected(toolName)
                .then(rs => {
                    if (rs.success) {
                        tool.connected = rs.data;
                    } else {
                        alertify.error(rs.message);
                    }

                    return tool;
                });
        }
    }

    function fetchToolData(toolName) {

    }

    function isToolConnected(toolName) {
        return tools[toolName] && tools[toolName].connected;
    }

    function fillToolsSettings(toolName) {
        SettingsService.getSettingByTool(toolName).then(response => {
            if (response.success) {
                const settings = UtilService.settingsAsMap(response.data);

                fillToolSettings(toolName, settings);
            }
        });
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

    return service;
};

export default toolsService;
