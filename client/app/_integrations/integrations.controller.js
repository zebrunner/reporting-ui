'use strict';

import fileUploadTemplate from './file-upload-modal/file-upload-modal.html';
import fileUploadController from './file-upload-modal/file-upload-modal.controller';

const integrationsController = function integrationsController($state, $mdDialog, SettingsService, toolsService, windowWidthService, $q, messageService, $timeout, integrationsService, $transitions) {
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
        isMultipleAllowed: false,
        FILE_TYPE_SETTINGS: {
            'GOOGLE': 'GOOGLE_CLIENT_SECRET_ORIGIN',
            'CLOUD_FRONT': 'CLOUD_FRONT_PRIVATE_KEY'
        },
        integrationFormIsShowing: false,
        regenerateKey,
        changeStatus,
        saveTool,
        showUploadFileDialog,
        showAddIntegrationForm,
        selectIntegrationType,
        addNewTool,
        newTool,
        cancel,
        isToolConnected: toolsService.isToolConnected,
        isEmptyTool: toolsService.isEmptyTool,
        isNewToolAdding: false,
        isMobile: windowWidthService.isMobile
    };

    function showAddIntegrationForm(isShowing) {
        vm.integrationFormIsShowing = isShowing;
    }

    function saveTool(tool) {
        tool.connectionChecking = true;

        toolsService.updateSettings(tool.id, tool)
            .then(rs => {
                if (rs.success) {
                    return toolsService.fetchToolConnectionStatus(vm.currentType.name, rs.data.id)
                        .then((res) => {
                            if (res.success) {
                                toolsService.setToolStatus(tool.type.name, rs.data.id, res.data.connected);
                            }
                        })
                        .finally(() => {
                            tool.settings.map((setting) => {
                                setting.param.required = false;
                            })
                            messageService.success('Tool ' + tool.name + ' was changed');
                        })
                } else {
                    rs.error.data.validationErrors.forEach((err) => {
                        tool.settings.map((setting) => {
                            if (setting.param.name === err.field) {
                                setting.param.required = true;
                            }
                        })
                    })
                }
            })
            .finally(() => {
                tool.connectionChecking = false;
            })
    }

    function regenerateKey() {
        SettingsService.regenerateKey()
            .then(rs => {
                if (rs.success) {
                    $state.reload();
                    messageService.success('Encrypt key was regenerated');
                } else {
                    messageService.error(rs.message);
                }
            });
    }

    function changeStatus(tool) {
        if (!vm.isEmptyTool(tool)) { //TODO: change adding tool
            tool.enabled && (tool.connectionChecking = true);

            toolsService.updateSettings(tool.id, tool)
            .then(function (rs) {
                if (rs.success) {
                    if (tool.enabled) {
                        messageService.success('Tool ' + tool.name + ' is enabled');

                        return toolsService.fetchToolConnectionStatus(vm.currentType.name, rs.data.id)
                            .then((res) => {
                                toolsService.setToolStatus(tool.type.name, rs.data.id, res.data.connected);
                            });
                    } else {
                        messageService.success('Tool ' + tool.name + ' is disabled');
                    }
                } else {
                    messageService.error('Unable to change ' + tool.name + ' state');
                    tool.enabled = !tool.enabled;
                }
            })
            .finally(() => {
                tool.connectionChecking = false;
            });
        }
    }

    function getStatusSetting(toolName, settings) {
        return settings.find(({ name }) => name === toolName + ENABLED_POSTFIX);
    }

    function compareBySettingSortOrder(a, b) {
        const aSortOrder = getSortOrderByPostfix(a.name);
        const bSortOrder = getSortOrderByPostfix(b.name);

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

    function controllerInit() {
        toolsService.fetchIntegrationsTypes().then((res) => {
            vm.groups = res.data.sort((a, b) => a.displayName.localeCompare(b.displayName))
            vm.isLoading = false;
            integrationsService.readType();
            
            if(vm.groups.length) {
                $timeout(function() {
                    let initialType = integrationsService.getType() || vm.groups[0];

                    vm.selectIntegrationType(initialType);
                });
            }
        })
        bindEvents();
    }

    function bindEvents() {
        const onTransStartSubscription = $transitions.onStart({}, function(trans) {
            integrationsService.clear();
            onTransStartSubscription();
        });
    }

    function selectIntegrationType(type) {
        vm.chipsCtrl.selectedChip = vm.groups.findIndex((group) => {
            return group.id === type.id;
        });
        vm.isNewToolAdding = false;
        vm.newItem = null;
        vm.isMultipleAllowed = type.multipleAllowed;
        vm.currentType = type;

        integrationsService.setType(type);
        integrationsService.storeType();

        toolsService.fetchIntegrationOfTypeByName(type.name).then((res) => {
            vm.tools = res.data;
            vm.toolTypes = vm.groups.find((group) => {
                return group.id === type.id;
            }).types;
        })
    }

    function addNewTool(tool) {
        vm.isNewToolAdding = true;

        selectFieldsForNew(tool);
    }

    function newTool() {
        let itemForRequest = {};
        itemForRequest.name = vm.newItem.name;
        itemForRequest.settings = vm.newItem.params.map((parameter) => {
            return {
                value: parameter.value,
                param: parameter,
            }
        })
        
        toolsService.createIntegration(vm.newItem.id, itemForRequest)
            .then((res) => {
                if (res.success) {
                    vm.tools.unshift(res.data);
                    toolsService.getTools(true);
                    cancel();
                } else {
                    messageService.error(res.message);
                }
            })
    }

    function selectFieldsForNew(tool) {
        let fieldsForNewTool = null;
        vm.groups.forEach((group) => {
            if (!fieldsForNewTool) {
                fieldsForNewTool = group.types.find((type) => {
                    return (type.id === tool.id)
                });
            }
        })
        vm.newItem =  angular.copy(fieldsForNewTool);
        vm.newItem.type = fieldsForNewTool.name;
        vm.newItem.name = '';
    }

    function cancel() {
        vm.isNewToolAdding = false;
        vm.newItem = null;
    }

    vm.$onInit = controllerInit;

    return vm;
};

export default integrationsController;
