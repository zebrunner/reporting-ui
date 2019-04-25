'use strict';

import fileUploadTemplate from './file-upload-modal/file-upload-modal.html';
import fileUploadController from './file-upload-modal/file-upload-modal.controller';

const integrationsController = function integrationsController($scope, $rootScope, $state, $mdConstant,
                                                               $stateParams, $mdDialog, UploadService,
                                                               SettingsService, toolsService, $q) {
    'ngInject';

    const SORT_POSTFIXES = {
        '_URL': 1,
        '_USER': 2,
        '_PASSWORD': 3,
        '_ACCESS_KEY': 4,
        '_SECRET_KEY': 5
    };
    const ENABLED_POSTFIX = '_ENABLED';
    // const PASSWORD_POSTFIX = '_PASSWORD';
    // const ALTERNATIVE_PASSWORD_POSTFIX = '_API_TOKEN_OR_PASSWORD';
    const NOT_EDITABLE_SETTINGS = ['GOOGLE_CLIENT_SECRET_ORIGIN', 'CLOUD_FRONT_PRIVATE_KEY'];

    const vm = {
        isLoading: true,
        tools: null,
        FILE_TYPE_SETTINGS: {
            'GOOGLE': 'GOOGLE_CLIENT_SECRET_ORIGIN',
            'CLOUD_FRONT': 'CLOUD_FRONT_PRIVATE_KEY'
        },

        regenerateKey,
        changeStatus,
        saveTool,
        showUploadFileDialog,
        isToolConnected: toolsService.isToolConnected,
    };

    function saveTool(tool) {
        tool.connectionChecking = true;

        toolsService.updateSettings(tool.settings)
            .then(rs => {
                if (rs.success) {
                    toolsService.setToolStatus(tool.name, rs.data.connected);
                    alertify.success('Tool ' + tool.name + ' was changed');
                } else {
                    alertify.error(rs.message);
                }
                tool.connectionChecking = false;
        });
    }

    function regenerateKey() {
        SettingsService.regenerateKey()
            .then(rs => {
                if (rs.success) {
                    $state.reload();
                    alertify.success('Encrypt key was regenerated');
                } else {
                    alertify.error(rs.message);
                }
            });
    }

    function changeStatus(tool) {
        const statusSetting = {...tool.statusSetting};

        statusSetting.value = tool.enabled ? 'true' : 'false';
        tool.enabled && (tool.connectionChecking = true);
        toolsService.updateSettings([statusSetting])
            .then(function (rs) {
                if (rs.success) {
                    toolsService.setToolStatus(tool.name, rs.data.connected);

                    if (tool.enabled) {
                        alertify.success('Tool ' + tool.name + ' is enabled');
                    } else {
                        alertify.success('Tool ' + tool.name + ' is disabled');
                    }
                } else {
                    alertify.error('Unable to change ' + tool.name + ' state');
                }

                tool.enabled && (tool.connectionChecking = false);
            });
    }

    function getStatusSetting(toolName, settings) {
        return settings.find(({ name }) => name === toolName + ENABLED_POSTFIX);
    }

    function compareBySettingSortOrder(a, b) {
        const aSortOrder = getSortOrderByPostfix(a.name);
        const bSortOrder = getSortOrderByPostfix(b.name);

        return compareTo(aSortOrder, bSortOrder);
    }

    function compareByName(a, b) {
        const aSortOrder = a.name;
        const bSortOrder = b.name;

        return compareTo(aSortOrder, bSortOrder);
    }

    function compareByIsEnabled(a, b) {
        const aSortOrder = a.enabled;
        const bSortOrder = b.enabled;

        return compareTo(aSortOrder, bSortOrder);
    }

    function compareTo(aSortOrder, bSortOrder) {
        if(typeof(aSortOrder) === 'boolean' && typeof(bSortOrder) === 'boolean') {
            if(aSortOrder === true && bSortOrder === false) {
                return -1;
            } else if(aSortOrder === false && bSortOrder === true) {
                return 1;
            } else {
                return 0;
            }
        } else {
            if (aSortOrder < bSortOrder) {
                return -1;
            } else if (aSortOrder > bSortOrder) {
                return 1;
            } else {
                return 0;
            }
        }
    }

    function getSortOrderByPostfix(settingName) {
        const postfix = Object.keys(SORT_POSTFIXES).find(key => settingName.includes(key));

        return postfix ? SORT_POSTFIXES[postfix] : getMaxSortOrder() + 1;
    }

    function getMaxSortOrder() {
        return Math.max.apply(null, Object.values(SORT_POSTFIXES));
    }

    function showUploadFileDialog($event, tool, settingName) {
        $mdDialog
            .show({
                controller: fileUploadController,
                template: fileUploadTemplate,
                parent: angular.element(document.body),
                controllerAs: '$ctrl',
                targetEvent: $event,
                clickOutsideToClose: true,
                fullscreen: true,
                locals: {
                    toolName: tool.name,
                    settingName,
                }
            })
            .then((data) => {
                toolsService.setToolStatus(tool.name, data.connected);

                const statusSetting = getStatusSetting(tool.name, data.settingList);

                tool.settings = data.settingList
                    .filter(setting => {
                        setting.notEditable = NOT_EDITABLE_SETTINGS.indexOf(setting.name) !== -1;

                        return setting !== statusSetting;
                    })
                    .sort(compareBySettingSortOrder);
                tool.enabled = statusSetting.value === 'true';
                tool.statusSetting = statusSetting;
            })
            .catch(() => {});
    }

    function fillToolsSettings() {
        const promises = vm.tools.map(tool => fillToolSettings(tool));

        $q.all(promises)
            .finally(() => {
                vm.tools
                    .sort(compareByName)
                    .sort(compareByIsEnabled);
                vm.isLoading = false;
            });
    }

    function fillToolSettings(tool) {
        return toolsService.fetchToolSettings(tool.name)
            .then(function(settings) {
                if (settings.success) {
                    const statusSetting = getStatusSetting(tool.name, settings.data);

                    tool.settings = settings.data
                        .filter(setting => {
                            setting.notEditable = NOT_EDITABLE_SETTINGS.indexOf(setting.name) !== -1;

                            return setting !== statusSetting;
                        })
                        .sort(compareBySettingSortOrder);
                    tool.enabled = statusSetting.value === 'true';
                    tool.statusSetting = statusSetting;
                } else {
                    console.error(`Failed to load ${tool.name} settings`);
                }
            });
    }

    function controllerInit() {
        vm.tools = Object.keys(toolsService.tools).map(key => ({ name: key }));
        fillToolsSettings();
    }

    vm.$onInit = controllerInit;

    return vm;
};

export default integrationsController;
