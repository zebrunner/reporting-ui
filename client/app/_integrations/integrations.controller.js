'use strict';

const integrationsController = function integrationsController($scope, $rootScope, $state, $mdConstant,
                                                               $stateParams, $mdDialog, UploadService,
                                                               SettingsService, toolsService, $q) {
    'ngInject';

    const vm = {
        isLoading: true,
        tools: null,

        regenerateKey,
        changeStatus,
        saveTool,
    };

    $scope.settingTools = [];
    $scope.enabledSettings = {};

    var ENABLED_POSTFIX = '_ENABLED';
    var PASSWORD_POSTFIX = '_PASSWORD';
    var ALTERNATIVE_PASSWORD_POSTFIX = '_API_TOKEN_OR_PASSWORD';

    var SORT_POSTFIXES = {
        '_URL': 1,
        '_USER': 2,
        '_PASSWORD': 3,
        '_ACCESS_KEY': 4,
        '_SECRET_KEY': 5
    };

    var NOT_EDITABLE_SETTINGS = ['GOOGLE_CLIENT_SECRET_ORIGIN', 'CLOUD_FRONT_PRIVATE_KEY'];
    $scope.FILE_TYPE_SETTINGS = {
        'GOOGLE': 'GOOGLE_CLIENT_SECRET_ORIGIN',
        'CLOUD_FRONT': 'CLOUD_FRONT_PRIVATE_KEY'
    };

    $scope.saveTool = function (tool) {
        SettingsService.editSettings(tool.settings).then(function (rs) {
            if (rs.success) {
                var settingTool = getSettingToolByName(tool.name);
                settingTool.isConnected = rs.data.connected;
                rs.data.settingList.forEach(function (setting) {
                    settingTool.settings[settingTool.settings.indexOfField('name', setting.name)].value = setting.value;
                });
                settingTool.settings.sort(compareBySettingSortOrder);
                alertify.success('Tool ' + tool.name + ' was changed');
            }
        });
    };

    function saveTool(tool) {
        SettingsService.editSettings(tool.settings)
            .then(rs => {
                console.log(rs);
                if (rs.success) {
                    var settingTool = getSettingToolByName(tool.name);
                    console.log(settingTool);
                    console.log(settingTool === tool);
                    settingTool.connected = rs.data.connected;
                    rs.data.settingList.forEach(function (setting) {
                        settingTool.settings[settingTool.settings.indexOfField('name', setting.name)].value = setting.value;
                    });
                    settingTool.settings.sort(compareBySettingSortOrder);
                    alertify.success('Tool ' + tool.name + ' was changed');
                }
        });
    }

    $scope.createSetting = function (tool) {
        var addedSetting = tool.newSetting;
        addedSetting.tool = tool.name;
        tool.settings.push(addedSetting);
        tool.newSetting = {};
        SettingsService.createSetting(addedSetting).then(function (rs) {
            if (rs.success) {
                alertify.success('New setting for ' + tool.name + ' was added');
            }
        });
    };

    $scope.deleteSetting = function (setting, tool) {
        var array = tool.settings;
        var index = array.indexOf(setting);
        if (index > -1) {
            array.splice(index, 1);
        }
        SettingsService.deleteSetting(setting.id).then(function (rs) {
            if (rs.success) {

                alertify.success('Setting ' + setting.name + ' was deleted');
            }
        });
    };

    function regenerateKey() {
        SettingsService.regenerateKey()
            .then(rs => {
                if (rs.success) {
                    $state.reload(); //TODO: get rid of this reload
                    alertify.success('Encrypt key was regenerated');
                } else {
                    alertify.error(rs.message);
                }
            });
    }

    $scope.switchEnabled = function (tool) {
        var setting = {};
        setting.name = tool.name + ENABLED_POSTFIX;
        setting.tool = tool.name;
        setting.id = $scope.enabledSettings[tool.name];
        setting.value = tool.isEnabled;
        var settings = [];
        settings.push(setting);
        SettingsService.editSettings(settings).then(function (rs) {
            if (rs.success) {
                //TODO: move getting settings into resolver after BE is fixed
                toolsService.fillToolSettings(tool.name, rs.data);
                if (setting.value) {
                    alertify.success('Tool ' + tool.name + ' is enabled');
                } else {
                    alertify.success('Tool ' + tool.name + ' is disabled');
                }
            }
        });
    };

    function changeStatus(tool) {
        const statusSetting = {...tool.statusSetting};

        console.log(typeof statusSetting.value);

        statusSetting.value = tool.enabled ? 'true' : 'false';
        SettingsService.editSettings([statusSetting])
            .then(function (rs) {
                console.log(rs.data);
                if (rs.success) {
                    tool.statusSetting = statusSetting;

                    if (tool.enabled) {
                        alertify.success('Tool ' + tool.name + ' is enabled');
                    } else {
                        alertify.success('Tool ' + tool.name + ' is disabled');
                    }
                    toolsService.setToolStatus(tool.name, tool.enabled)
                        .then(updatedTool => {
                            updatedTool && (tool.connected = updatedTool.connected);
                        });
                } else {
                    alertify.error('Unable to change ' + tool.name + ' state');
                }
            });
    }

    var getSettingToolByName = function (name) {
        return $scope.settingTools.filter(function (tool) {
            return tool.name === name;
        })[0];
    };

    function getEnabledSetting(tool, settings) {
        return settings.find(({ name }) => name === tool + ENABLED_POSTFIX);
    }

    function getStatusSetting(toolName, settings) {
        return settings.find(({ name }) => name === toolName + ENABLED_POSTFIX);
    }

    function compareBySettingSortOrder(a, b) {
        var aSortOrder = getSortOrderByPostfix(a.name);
        var bSortOrder = getSortOrderByPostfix(b.name);
        return compareTo(aSortOrder, bSortOrder)
    }

    function compareByName(a, b) {
        var aSortOrder = a.name;
        var bSortOrder = b.name;
        return compareTo(aSortOrder, bSortOrder)
    }

    function compareByIsEnabled(a, b) {
        var aSortOrder = a.isEnabled;
        var bSortOrder = b.isEnabled;
        return compareTo(aSortOrder, bSortOrder)
    }

    function compareTo(aSortOrder, bSortOrder) {
        if(typeof(aSortOrder) === 'boolean' && typeof(bSortOrder) === 'boolean') {
            if(aSortOrder === true && bSortOrder === false) {
                return -1;
            } else if(aSortOrder === false && bSortOrder === true) {
                return 1;
            } else
                return 0;
        } else {
            if (aSortOrder < bSortOrder) {
                return -1;
            } else if (aSortOrder > bSortOrder) {
                return 1;
            } else
                return 0;
        }
    }

    var getSortOrderByPostfix = function (settingName) {
        for(var postfix in SORT_POSTFIXES) {
            try {
                if (settingName.includes(postfix)) {
                    return SORT_POSTFIXES[postfix];
                }
            } catch(e) {
                console.log('setting name ' + settingName);
            }
        }
        return getMaxSortOrder() + 1;
    };

    var getMaxSortOrder = function () {
        var max = 0;
        for(var postfix in SORT_POSTFIXES) {
            if(SORT_POSTFIXES[postfix] > max) {
                max = SORT_POSTFIXES[postfix];
            }
        }
        return max;
    };

    function initTool(toolName) {
        SettingsService.getSettingByTool(toolName)
            .then(function(settings) {
                if (settings.success) {
                    // console.log(settings);
                    const enabledSetting = getEnabledSetting(toolName, settings.data);
                    const currentTool = {
                        name: toolName,
                        isConnected: toolsService.isToolConnected(toolName),
                        settings: settings.data.filter(setting => {
                            setting.notEditable = NOT_EDITABLE_SETTINGS.indexOf(setting.name) >= 0;

                            // return isEnabledSetting(toolName, setting) ? false : setting.tool === toolName;
                            return enabledSetting !== setting;
                        }),
                        isEnabled: enabledSetting.value === 'true',
                        newSetting: {}
                    };

                    // console.log(enabledSetting);

                    $scope.enabledSettings[enabledSetting.tool] = enabledSetting.id;
                    const index = $scope.settingTools.findIndex((tool) => tool.name === toolName);

                    if (index === -1) {
                        currentTool.settings.sort(compareBySettingSortOrder);
                        $scope.settingTools.push(currentTool);
                        $scope.settingTools.sort(compareByName);
                        $scope.settingTools.sort(compareByIsEnabled);
                    } else {
                        SettingsService.isToolConnected(toolName).then(function (rs) {
                            if(rs.success) {
                                currentTool.isConnected = rs.data;
                                toolsService.tools[toolName] = rs.data;
                            }
                        });
                        $scope.settingTools.splice(index, 1, currentTool);
                    }
                } else {
                    console.error(`Failed to load ${toolName} settings`);
                }
            });
    }

    $scope.showUploadFileDialog = function ($event, toolName, settingName) {
        $mdDialog.show({
            controller: FileUploadController,
            template: require('./file_modal.html'),
            parent: angular.element(document.body),
            targetEvent: $event,
            clickOutsideToClose: true,
            fullscreen: true,
            locals: {
                toolName: toolName,
                settingName: settingName
            }
        })
            .then(function (tool) {
            }, function (tool) {
                if (tool) {
                    initTool(tool);
                }
            });
    };

    function FileUploadController($scope, $mdDialog, toolName, settingName) {
        'ngInject';

        $scope.uploadFile = function (multipartFile) {
            UploadService.uploadSettingFile(multipartFile, toolName, settingName).then(function (rs) {
                if(rs.success)
                {
                    alertify.success("File was uploaded");
                    $scope.cancel();
                }
                else
                {
                    alertify.error(rs.message);
                }
            });
        };
        $scope.hide = function() {
            $mdDialog.hide(true);
        };
        $scope.cancel = function() {
            $mdDialog.cancel(toolName);
        };
    }

    function fillTooslSettings() {
        const promises = vm.tools.map(tool => fillToolSettings(tool));

        $q.all(promises)
            .finally(() => {
                vm.tools
                    .sort(compareByName)
                    .sort(compareByIsEnabled);
                vm.isLoading = false;

                console.log(vm.tools);
                console.log($scope.settingTools);
            });
    }

    function fillToolSettings(tool) {
        return SettingsService.getSettingByTool(tool.name)
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
                    tool.newSetting = {};
                    tool.statusSetting = statusSetting;
                } else {
                    console.error(`Failed to load ${tool.name} settings`);
                }
            });
    }

    function controllerInit() {
        // tools should be fetched by resolver
        Object.keys(toolsService.tools).forEach((key) => {
            initTool(key);
        });

        vm.tools = Object.values(toolsService.tools);
        fillTooslSettings();
    }

    vm.$onInit = controllerInit;

    return vm;
};

export default integrationsController;
