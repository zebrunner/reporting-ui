'use strict';

import 'brace';
import 'brace/mode/json';
import 'brace/theme/eclipse';
import 'angular-ui-ace';

const CiHelperController = function CiHelperController(
    $scope,
    $rootScope,
    $q,
    toolsService,
    $window,
    $mdDialog,
    $mdMedia,
    $timeout,
    $interval,
    LauncherService,
    UserService,
    ScmService,
    authService,
    messageService,
    UtilService,
    API_URL,
    $http,
    Upload,
) {
    'ngInject';

    let isMultitenant = false;
    let prevLauncher;
    let prevFolder;
    let gitHubPopUp;
    let onAddNewGithubRepoClose; //TODO: seems like unused
    let zafiraWebsocket;
    let subscriptions = {};
    const newGithubRepoCloseClass = 'zf-button-close';
    const newGithubRepoRevertCloseClass = 'zf-button-close-revert';
    const providersPriority =  {
        'SELENIUM': 1,
        'ZEBRUNNER': 2,
        'MCLOUD': 3,
        'AEROKUBE': 4,
        'BROWSERSTACK': 5,
        'SAUCELABS': 6,
        'LAMBDATEST': 7,
        'default': 100,
    };
    // TODO: use json-configs service
    const providersConfigURL = 'https://zebrunner.s3-us-west-1.amazonaws.com/common/moon/providers.json';
    const vm = {
        activeLauncher: {
            scmAccountType: {},
        },
        appFormats: '.app, .ipa, .apk, .apks',
        appMaxSize: '100MB',
        launchers: [],
        platforms: [],
        platformModel: {},
        providers: [],
        launcherPreferences: {},
        organizations: [],
        platformsConfig: null,
        providersFail: false,
        repositories: [],
        loadingScm: true,
        cardNumber: 0,
        creatingLauncher: false,
        launcherControls: [],
        platformControls: [],
        launcherRawModel: {},
        launcherModel: {},

        getRepositories,
        onProviderSelect,
        onPlatformSelect,
        selectProviderOnChipsInit,
        cancelFolderManaging,
        shouldBeDisplayed,
        authService,
        setFavouriteLauncher,
        saveLaunchersPreferencesForRescan,
        applySavedPreferences,
        prepareLauncherConfigForSave,
        saveLauncherConfig,
        chooseSavedLauncherConfig,
        updateLauncherConfig,
        deleteLauncherConfig,
        getWebHook,
        showCIErrorPage,
        hideCIErrorPage,
        getCurrentServer,
        userHasAnyPermission: authService.userHasAnyPermission,
        validations: UtilService.validations,
        getValidationValue: UtilService.getValidationValue,

        get isMobile() { return $mdMedia('xs'); },
        get noPlatformValue() { return getNoPlatformValue(); },
        get activeLauncherId() { return vm.activeLauncher.parentLauncherId || vm.activeLauncher.id; },
        get activeLauncherName() { return vm.launchers.find(item => item.id === vm.activeLauncher.parentLauncherId).name; },
    };

    vm.$onInit = initController;

    $scope.ciOptions = {};
    $scope.editor = {
        text: ''
    };

    $scope.testSuites = [];
    $scope.currentServerId = null;
    $scope.scmAccounts = [];
    $scope.scmAccount = {};
    $scope.launcherScan = {
        branch: 'master'
    };

    $scope.launcherLoaderStatus = {
        determinateValue: 20,
        started: false,
        finished: false,
        failed: false,
        buildNumber: null,
        rescan: false
    };

    $scope.aceOptions = {
        useWrapMode: false,
        showGutter: false,
        theme: 'eclipse',
        mode: 'json',
        firstLineNumber: 5,
        rendererOptions: {
            fontSize: '14px',
        }
    };

    $scope.onChange = function (server) {
        $scope.currentServerId = server.id;
        $scope.needServer = false;
    };

    $scope.DEFAULT_TEMPLATES = {
        model: {},
        variants: [
            {
                name: 'Web',
                json: {
                    'browser': [
                        'chrome',
                        'firefox'
                    ],
                    'thread_count': 5,
                    'branch': '*/master',
                    'email_list': 'demo@qaprosoft.com',
                    'suite': 'web'
                }
            },
            {
                name: 'Mobile',
                json: {
                    'platform': 'ANDROID',
                    'thread_count': 5,
                    'branch': '*/master',
                    'email_list': 'demo@qaprosoft.com',
                    'suite': 'android'
                }
            },
            {
                name: 'API',
                json: {
                    'platform': 'API',
                    'thread_count': 5,
                    'branch': '*/master',
                    'email_list': 'demo@qaprosoft.com',
                    'suite': 'api'
                }
            }
        ]
    };

    $scope.states = {};
    $scope.states.addGitRepo = false;

    $scope.switchFolder = function (e, element, forceExpand) {
        const expandFolderClassName = 'expand-folder';
        const expandFolderFinishClassName = 'expand-folder_finish';
        const switchFolderElement = element ? element : angular.element(e.target);
        const folderElement = angular.element(switchFolderElement.closest('.folder-container'));

        if (folderElement.hasClass(expandFolderClassName) && ! forceExpand) {
            folderElement.addClass(expandFolderFinishClassName);
            folderElement.removeClass(expandFolderClassName);
            $timeout(function () {
                folderElement.removeClass(expandFolderFinishClassName);
            }, 150);
        } else {
            folderElement.addClass(expandFolderClassName);
        }
    };

    $scope.switchFolderMobile = function (event, scmAccountId) {
        $scope.switchFolder(event);
        vm.activeLauncher = {};
    };

    $scope.addNewGithubRepo = function (element, forceClose) {
        $scope.states.addGitRepo = forceClose ? false : !$scope.states.addGitRepo;
        if ($scope.states.addGitRepo) {
            $scope.connectToGitHub().then(function () {
                if (element) {
                    addNewGithubRepoCssApply(element, $scope.states.addGitRepo);
                }
            }, function () {
                $scope.states.addGitRepo = false;
            });
        } else {
            addNewGithubRepoCssApply(element, $scope.states.addGitRepo);
            if (gitHubPopUp) {
                gitHubPopUp.close();
            }
        }
    };

    function saveLaunchersPreferencesForRescan() {
        vm.launchers.forEach((item) => {
            vm.launcherPreferences[item.id] = item.preference;
        });
    }

    function applySavedPreferences() {
        vm.launchers.forEach((item) => {
            item.preference = vm.launcherPreferences[item.id];
        });
        vm.launcherPreferences = {};
    }

    function addNewGithubRepoCssApply(element, isAdd) {
        var el = angular.element(element).closest('button');
        if (isAdd) {
            el.addClass(newGithubRepoCloseClass);
            onAddNewGithubRepoClose = function () {
                $scope.addNewGithubRepo(el);
                addNewGithubRepoCssApply(element, $scope.states.addGitRepo);
            };
        } else {
            el.removeClass(newGithubRepoCloseClass);
            el.addClass(newGithubRepoRevertCloseClass);
            onAddNewGithubRepoClose = undefined;
            $timeout(function () {
                el.removeClass(newGithubRepoRevertCloseClass);
            }, 500);
        }
    }

    function closeConnectGithubBlock() {
        $scope.addNewGithubRepo(angular.element("#connect-github"), true);
    }

    $scope.mergeTemplate = function (template) {
        if (template) {
            vm.activeLauncher.model = vm.activeLauncher.model && vm.activeLauncher.model.isJsonValid() ? vm.activeLauncher.model : '{}';
            vm.activeLauncher.model = JSON.stringify(/*angular.merge(json, template)*/template, null, 2);
        }
    };

    $scope.applyBuilder = function (launcher, isPhone) {
        applyBuilder(launcher);
        vm.cardNumber = isPhone ? 3 : 2;
    };

    function applyBuilder(launcher) {
        const launcherModel = launcher.model || launcher.params;

        // init launcher models
        vm.launcherModel = {};
        vm.launcherRawModel = { ...launcherModel.toJson() };

        // init controls
        $timeout(() => {
            if (vm.chipsCtrl && vm.providers.length) {
                let provider = vm.providers[0];
                //is config
                if (launcher.hasOwnProperty('parentLauncherId')) {
                    if (launcher.hasOwnProperty('providerId')) {
                        const integration = vm.integrations.find(({ id }) => id === launcher.providerId);
                        const predefinedProvider = integration ? vm.providers.find(({ name }) => name.toLowerCase() === integration.name?.toLowerCase()) : null;

                        if (predefinedProvider) {
                            provider = predefinedProvider;
                        }
                    } else {
                        handleProviderDeselection();
                        prepareLauncherControls();
                        return;
                    }
                }
                handleProviderSelection(provider);
            }
            prepareLauncherControls();
        }, 0);
    }

    function isNumeric(value) {
        return !isNaN(value - parseFloat(value));
    }

    function getControlType(value) {
        if (Array.isArray(value)) {
            return 'select';
        } else if (typeof value === 'boolean') {
            return 'checkbox';
        } else if (isNumeric(value)) {
            return 'number';
        }

        return 'text';
    }

    $scope.addTemplate = function () {
        vm.cardNumber = 2;
        vm.activeLauncher = {};
        $scope.DEFAULT_TEMPLATES.model = {};
    };

    $scope.addRepo = function () {
        $scope.repo = {};
        if ($scope.clientId) {
            $scope.connectToGitHub()
                .then(() => {
                    clearPrevLauncherElement();
                    clearPrevFolderElement();
                    vm.cardNumber = 1;
                    $scope.needServer = false;
                    $scope.currentServerId = null;
                });
        }
    };

    function highlightFolder(scmAccount) {
        $timeout(() => {
            clearPrevLauncherElement();
            clearPrevFolderElement();
            chooseFolderElement(scmAccount);
        }, 0);
    }

    $scope.manageFolder = function (scmAccount, isCreating) {
        vm.creatingLauncher = !!isCreating;
        $scope.scmAccount = scmAccount;
        $scope.needServer = true;
        $scope.currentServerId = getCurrentServerId(scmAccount);
        if (scmAccount.id !== $scope.scmAccount.id) {
            getScmAccountDefaultBranchName(scmAccount.id);
        }
        resetLauncher();
        highlightFolder(scmAccount);
        vm.cardNumber = 2;
        vm.activeLauncher.scmAccountType = scmAccount;
    };

    function getCurrentServerId(scmAccount) {
        if (scmAccount.launchers && scmAccount.launchers.length) {
            return scmAccount.launchers[0].job.automationServerId ? scmAccount.launchers[0].job.automationServerId : getDefaultServerId();
        }
    }

    function getDefaultServerId() {
        return $scope.servers.find((server) => {
            return server.default;
        }).id;
    }

    $scope.addLauncher = function (launcher) {
        $scope.createLauncher(launcher)
            .then(function (l) {
                appendLauncher(l);
                resetLauncher();
                vm.creatingLauncher = false;
                $scope.chooseLauncher(l);
            });
    };

    $scope.toEditLauncher = function () {
        //cache previously selected provider to restore after edition mode
        if (vm.chipsCtrl) {
            vm.lastSelectedProvider = vm.chipsCtrl.selectedChip;
        }
        vm.cardNumber = 2;
    };

    function getScmAccountDefaultBranchName(id) {
        ScmService.getDefaultBranch(id).then(function (rs) {
            if (rs.success) {
                $scope.launcherScan.branch = rs.data;
            }
        });
    }

    function showCIErrorPage() {
        vm.previousPage = vm.cardNumber;
        vm.cardNumber = 5;
    }

    function hideCIErrorPage() {
        vm.cardNumber = vm.previousPage;
        vm.previousPage = null;
    }

    $scope.onFilterSearchChange = function (value) {
        $timeout(function () {
            const emptySearchClassName = '__empty-search';
            //find all folder elements
            const folders = angular.element('.folder-container');
            angular.forEach(folders, function (folder) {
                folder = angular.element(folder);
                // if search value is not empty hide folders without elements and expand needed
                // else if search value is empty show all hidden folders
                if (value) {
                    const hasItems = !!folder.find(".folder-container_item_list_item").length;
                    if (!hasItems) {
                        folder.addClass(emptySearchClassName);
                    } else {
                        folder.removeClass(emptySearchClassName);
                        const folderIcons = folder.find(".folder-container_folder_icon");
                        angular.forEach(folderIcons, function (folderIcon) {
                            $scope.switchFolder(null, folderIcon, true);
                        });
                    }
                } else {
                    if (folder.hasClass(emptySearchClassName)) {
                        folder.removeClass(emptySearchClassName);
                    }
                }
            });
        }, 0, false);
    };

    /**
     * resets activeLauncher to the empty object
     */
    function resetLauncher() {
        vm.activeLauncher = {
            scmAccountType: {},
        };
    }

    $scope.editLauncher = function (launcher) {
        vm.activeLauncher = angular.copy(launcher);
        vm.cardNumber = 2;
        closeConnectGithubBlock();
    };

    $scope.chooseLauncher = function (launcher, skipBuilderApply) {
        //do nothing if clicked on already selected launcher
        if (launcher.isActive) { return; }

        highlightLauncher(launcher);
        vm.activeLauncher = angular.copy(launcher);
        $scope.needServer = false;
        $scope.currentServerId = null;
        $scope.DEFAULT_TEMPLATES.model = {};
        if (!skipBuilderApply) {
            switchToLauncherPreview(launcher);
        }
    };

    function chooseSavedLauncherConfig(config, skipBuilderApply) {
        if (!config || config.isActive) { return; }
        const parentLauncherId = vm.activeLauncher.parentLauncherId || vm.activeLauncher.id;

        Reflect.deleteProperty(vm.activeLauncher, 'providerId');

        vm.activeLauncher = {
            ...vm.activeLauncher,
            ...config,
            parentLauncherId,
            presets: [],
            preference: {},
            isSavedConfig: true,
        };
        vm.activeLauncher.model = vm.activeLauncher.params;

        highlightLauncher(config);
        if (!skipBuilderApply) {
            switchToLauncherPreview(vm.activeLauncher);
        }
    }

    function updateLauncherConfig(config) {
        const params = {
            name: config.name,
            params: config.model,
            providerId: vm.integrations.find((item) => item.name.toUpperCase() === vm.selectedProviderName.toUpperCase()).id,
        };

        LauncherService.updateLauncherConfig(config.parentLauncherId, config.id, params)
            .then((rs) => {
                if (rs.success) {
                    const currentLauncher = vm.launchers.find(item => item.id === config.parentLauncherId);
                    const savedConfig = currentLauncher.presets.find(config => config.id === rs.data.id);

                    savedConfig.name = rs.data.name;
                    savedConfig.params = rs.data.params;
                    config.name = rs.data.name;
                    config.params = rs.data.params;
                    $timeout(function () {
                        switchToLauncherPreview(config);
                    }, 0);
                    messageService.success('Launcher was updated');
                } else {
                    messageService.error(rs.message);
                }
            });
    }

    function getWebHook(config) {
        LauncherService.getConfigHook(config.parentLauncherId, config.id)
            .then((rs) => {
                if (rs.success) {
                    rs.data.copyToClipboard();
                    messageService.success('Copied');
                } else {
                    messageService.error(rs.message);
                }
            });
    }

    function switchToLauncherPreview(launcher) {
        $scope.applyBuilder(launcher);
        vm.cardNumber = 3;
    }

    $scope.selectLauncher = function (launcher) {
        $scope.chooseLauncher(launcher, true);
        applyBuilder(launcher);
    };

    function highlightLauncher(launcher) {
        $timeout(() => {
            clearPrevLauncherElement();
            clearPrevFolderElement();
            chooseLauncherElement(launcher);
        }, 0);
    }

    function chooseLauncherElement(launcher) {
        launcher.isActive = true;
        prevLauncher = launcher;
    }

    function chooseFolderElement(folder) {
        folder.isActive = true;
        prevFolder = folder;
    }

    function clearPrevLauncherElement() {
        if (prevLauncher) {
            prevLauncher.isActive = false;
        }
    }


    function clearPrevFolderElement() {
        if (prevFolder) {
            prevFolder.isActive = false;
        }
    }

    $scope.chooseLauncherPhone = function () {
        vm.cardNumber = 3;
    };

    $scope.navigateBack = function () {
        vm.cardNumber = 0;
    };

    $scope.createLauncher = function (launcher) {
        return LauncherService.createLauncher(launcher, $scope.currentServerId)
            .then(function (rs) {
                if (rs.success) {
                    vm.activeLauncher = rs.data || {};
                    vm.launchers.push(vm.activeLauncher);
                    messageService.success('Launcher was created');
                    $scope.applyBuilder(vm.activeLauncher);
                    return vm.activeLauncher;
                } else {
                    messageService.error(rs.message);
                    return $q.reject();
                }
            });
    };

    $scope.updateLauncher = function (launcher) {
        var index = vm.launchers.indexOfField('id', launcher.id);
        LauncherService.updateLauncher(launcher).then(function (rs) {
            if (rs.success) {
                const l = rs.data;
                vm.launchers.splice(index, 1, l);
                const indexScmAccount = $scope.scmAccounts.indexOfField('id', l.scmAccountType.id);
                if (indexScmAccount !== -1) {
                    const scmAccount = $scope.scmAccounts[indexScmAccount];
                    const scmAccountLauncherIndex = scmAccount.launchers.indexOfField('id', l.id);
                    scmAccount.launchers.splice(scmAccountLauncherIndex, 1, l);
                }
                $timeout(function () {
                    switchToLauncherPreview(l);
                }, 0, false);
                messageService.success('Launcher was updated');
            } else {
                messageService.error(rs.message);
            }
            $scope.applyBuilder(launcher);
        });
    };

    function setFavouriteLauncher(launcher) {
        const params = {
            'operation': 'SAVE_FAVORITE',
            'value': !launcher.preference?.favorite,
        };

        LauncherService.setFavouriteLauncher(launcher.id, params).then(function (rs) {
            if (rs.success) {
                const currentLauncher = vm.launchers.find(item => item.id === launcher.id);

                vm.activeLauncher.preference = rs.data;
                currentLauncher.preference = rs.data;
            } else {
                messageService.error(rs.message);
            }
        });
    }

    $scope.deleteLauncher = function (id) {
        if (id) {
            var index = vm.launchers.indexOfField('id', id);
            LauncherService.deleteLauncherById(id).then(function (rs) {
                if (rs.success) {
                    vm.launchers.splice(index, 1);
                    cancelFolderManaging();

                    const l = vm.launchers[index];
                    const indexScmAccount = $scope.scmAccounts.indexOfField('id', l.scmAccountType.id);
                    if (indexScmAccount !== -1) {
                        const scmAccount = $scope.scmAccounts[indexScmAccount];
                        const scmAccountLauncherIndex = scmAccount.launchers.indexOfField('id', id);
                        scmAccount.launchers.splice(scmAccountLauncherIndex, 1);
                    }

                    messageService.success('Template was deleted');
                } else {
                    messageService.error(rs.message);
                }
            });
        }
    };

    function deleteLauncherConfig(config) {
        LauncherService.deleteLauncherConfig(config.parentLauncherId, config.id)
            .then((rs) => {
                if (rs.success) {
                    const parentLauncher = vm.launchers.find((item) => item.id === config.parentLauncherId);
                    const configIndex = parentLauncher.presets.findIndex((item) => item.id === config.id);

                    parentLauncher.presets.splice(configIndex, 1);
                    vm.cardNumber = 0;
                    messageService.success('Config was deleted');
                } else {
                    messageService.error(rs.message);
                }
            });
    }

    $scope.deleteRepository = function (scmAccountId) {
        ScmService.deleteScmAccount(scmAccountId).then(function (rs) {
            if (rs.success) {
                const scmAccountIndex = $scope.scmAccounts.indexOfField('id', scmAccountId);

                clearPrevLauncherElement();
                clearPrevFolderElement();
                cancelFolderManaging();
                $scope.scmAccounts.splice(scmAccountIndex, 1);
                messageService.success('Repository was deleted');
            } else {
                messageService.error(rs.message);
            }
        });
    };

    $scope.saveLauncher = function (launcher) {
        launcher.errorMessage = buildError(launcher);
        if (!launcher.errorMessage && !launcher.errorMessage.length) {
            if (launcher.id) {
                var index = vm.launchers.indexOfField('id', launcher.id);
                LauncherService.updateLauncher(launcher).then(function (rs) {
                    if (rs.success) {
                        vm.launchers.splice(index, 1, rs.data);
                    } else {
                        messageService.error(rs.message);
                    }
                });
            } else {
                LauncherService.createLauncher(launcher).then(function (rs) {
                    if (rs.success) {
                        vm.activeLauncher = rs.data;
                        vm.launchers.push(rs.data);
                    } else {
                        messageService.error(rs.message);
                    }
                });
            }
            $scope.applyBuilder(launcher);
        }
    };

    $scope.scanRepository = function (launcherScan, rescan) {
        const currentServer = getCurrentServer();

        if (!currentServer?.connected) {
            vm.showCIErrorPage();
            return false;
        }

        if (launcherScan && launcherScan.branch && $scope.scmAccount.id) {
            saveLaunchersPreferencesForRescan();
            initWebsocket();
            launcherScan.scmAccountId = $scope.scmAccount.id;
            launcherScan.rescan = !!rescan;
            LauncherService.scanRepository(launcherScan, $scope.currentServerId)
                .then(function (rs) {
                    if (rs.success) {
                        const queueItemUrl = rs.data.queueItemUrl;

                        $scope.launcherLoaderStatus.rescan = launcherScan.rescan;
                        $scope.launcherLoaderStatus.started = true;
                        getBuildNumber(queueItemUrl);
                    } else {
                        $scope.launcherLoaderStatus.started = false;
                        messageService.error(rs.message);
                    }
                });
        }
    };

    function getCurrentServer() {
        return $scope.currentServerId ? $scope.servers.find((server) => server.id === $scope.currentServerId) : $scope.servers.find((server) => server.default === true);
    }

    function getBuildNumber(queueItemUrl) {
        LauncherService.getBuildNumber(queueItemUrl).then(function (rs) {
            if (rs.success) {
                $scope.launcherLoaderStatus.buildNumber = rs.data;
                startCheckScannerInProgressTimeout();
            }
        });
    };

    let checkScannerInProgressTimeout;
    function startCheckScannerInProgressTimeout() {
        const buildNumber = $scope.launcherLoaderStatus.buildNumber;
        const scmAccountId = $scope.scmAccount.id;
        const rescan = $scope.launcherLoaderStatus.rescan;
        checkScannerInProgressTimeout = $timeout(function () {
            isScannerInProgress(buildNumber, scmAccountId, rescan).then(rs => {
                if (rs.success) {
                    const inProgress = rs.data;
                    if (inProgress) {
                        startCheckScannerInProgressTimeout();
                    } else {
                        $scope.launcherLoaderStatus.started = false;
                        $scope.launcherLoaderStatus.failed = true;
                        $scope.launcherLoaderStatus.finished = true;

                        onScanRepositoryFinish();
                    }
                }
            });
        }, 30000);
    };

    function isScannerInProgress(buildNumber, scmAccountId, rescan) {
        return LauncherService.isScannerInProgress(buildNumber, scmAccountId, rescan);
    };

    function finishCheckScannerInProgressTimeout() {
        if (!!checkScannerInProgressTimeout) {
            $timeout.cancel(checkScannerInProgressTimeout);
            checkScannerInProgressTimeout = undefined;
        }
    };

    function onScanRepositoryFinish() {
        disconnectWebsocket();
        runPseudoDeterminateProgress(150, 5);
        $scope.launcherLoaderStatus.determinateValue = 20;

        finishCheckScannerInProgressTimeout();
    };

    $scope.cancelScanRepository = function () {
        const buildNumber = $scope.launcherLoaderStatus.buildNumber;
        const scmAccountId = $scope.scmAccount.id;
        const rescan = $scope.launcherLoaderStatus.rescan;
        LauncherService.abortScanRepository(buildNumber, scmAccountId, rescan).then(function (rs) {
            disconnectWebsocket();
            if (rs.success) {
                $scope.launcherLoaderStatus.started = false;
                $scope.launcherLoaderStatus.finished = false;
                messageService.success('Repository scan was stopped');
            } else {
                messageService.error(rs.message);
            }
        });
    };

    $scope.onScanRepositoryFinish = function () {
        $scope.launcherLoaderStatus.started = false;
        $scope.launcherLoaderStatus.finished = true;
        $scope.launcherLoaderStatus.failed = false;
        $scope.launcherLoaderStatus.determinateValue = 20;

        onScanRepositoryFinish();
    };

    function runPseudoDeterminateProgress(millisToLoad, step) {
        const timeout = Math.round(millisToLoad * step / (100 - $scope.launcherLoaderStatus.determinateValue));
        const interval = $interval(function () {
            if ($scope.launcherLoaderStatus.determinateValue === 100) {
                $interval.cancel(interval);
                return;
            }
            $scope.launcherLoaderStatus.determinateValue += step;
        }, timeout, 0, true);
    };

    $scope.backToLaunchersList = function () {
        $scope.launcherLoaderStatus.finished = false;
    };

    $scope.backToLaunchersList = function () {
        $scope.launcherLoaderStatus.finished = false;
    };

    $scope.hasAutoScannedLaunchers = function (launchers) {
        return launchers && !!launchers.find(function (launcher) {
            return launcher.autoScan;
        });
    };

    function buildError(launcher) {
        var messages = [];
        var errorMessage = '';
        if (!launcher.model) {
            messages.push('code');
        }
        if (!launcher.name) {
            messages.push('name');
        }
        if (!launcher.scmAccountType || !launcher.scmAccountType.id) {
            messages.push('repository');
        }
        if (messages.length) {
            errorMessage = 'Set ';
            messages.forEach(function (message, index) {
                errorMessage += message;
                errorMessage = index !== messages.length - 1 ? errorMessage + ', ' : errorMessage;
            });
            errorMessage += ' for template to save.';
        } else if (!launcher.model.isJsonValid(true)) {
            errorMessage = 'Code is not valid.';
        }
        return errorMessage;
    };

    $scope.cancelLauncher = function () {
        vm.cardNumber = 3;
    };

    function getAllLaunchers() {
        return LauncherService.getAllLaunchers()
            .then(rs => {
                if (rs.success) {
                    return rs.data;
                } else {
                    rs.message && messageService.error(rs.message);
                    return [];
                }
            });
    }

    // $scope.updateLauncher = function(launcher, index) {
    //     LauncherService.updateLauncher(launcher).then(function (rs) {
    //         if(rs.success) {
    //             vm.launchers.splice(index, 1, rs.data);
    //         } else {
    //             messageService.error(rs.message);
    //         }
    //     });
    // };

    $scope.deleteLauncherById = function (id, index) {
        LauncherService.deleteLauncherById(id).then(function (rs) {
            if (rs.success) {
                vm.launchers.splice(index, 1);
            } else {
                messageService.error(rs.message);
            }
        });
    };

    $scope.scmAccount = {};

    function getClientId() {
        return $q(function (resolve, reject) {
            ScmService.getClientId().then(function (rs) {
                if (rs.success) {
                    resolve(rs.data);
                }
            });
        });
    }

    function getTenantInfo() {
        return $q(function (resolve, reject) {
            authService.getTenant().then(function (rs) {
                if (rs.success) {
                    resolve(rs.data);
                } else {
                    reject();
                    messageService.error(rs.message);
                }
            });
        });
    }

    $scope.clientId = '';

    $scope.connectToGitHub = function () {
        return $q(function (resolve, reject) {
            if ($scope.clientId) {
                var host = $window.location.host;
                var tenant = host.split('\.')[0];
                const servletPath = $window.location.pathname.split('/tests/runs')[0];
                var redirectURI = isMultitenant ? `${$window.location.protocol}//${host.replace(tenant, 'api')}/github/callback/${tenant}` : `${$window.location.protocol}//${host}${servletPath}/scm/callback`;
                var url = 'https://github.com/login/oauth/authorize?client_id=' + $scope.clientId + '&scope=user%20repo%20readAorg&redirect_uri=' + redirectURI;
                var height = 650;
                var width = 450;
                var location = getCenterWindowLocation(height, width);
                var gitHubPopUpProperties = 'toolbar=0,scrollbars=1,status=1,resizable=1,location=1,menuBar=0,width=' + width + ', height=' + height + ', top=' + location.top + ', left=' + location.left;
                gitHubPopUp = $window.open(url, 'GithubAuth', gitHubPopUpProperties);

                var localStorageWatcher = $interval(function () {
                    var code = localStorage.getItem('code');
                    if (code) {
                        resolve();
                        codeExchange(code);
                        localStorage.removeItem('code');
                        $interval.cancel(localStorageWatcher);
                    }
                }, 200);

                if (window.focus) {
                    gitHubPopUp.focus();
                }
            }
        });
    };

    function codeExchange(code) {
        if (!code) { return; }

        initAccessToken(code)
            .then(function (scmAccount) {
                $scope.scmAccount = scmAccount;
                getOrganizations();
            });
    }

    function getOrganizations() {
        return ScmService.getOrganizations($scope.scmAccount.id)
            .then(response => {
                if (response.success) {
                    vm.organizations = response.data || [];
                }
            });
    }

    function getRepositories(organization = '') {
        vm.repositories = [];
        $scope.scmAccount.repository = null;

        return ScmService.getRepositories($scope.scmAccount.id, organization)
            .then(response => {
                if (response.success) {
                    vm.repositories = response.data || [];
                }
            });
    }

    $scope.addScmAccount = function (scmAccount) {
        scmAccount.organizationName = scmAccount.organization.name;
        scmAccount.avatarURL = scmAccount.organization.avatarURL;
        scmAccount.repositoryName = scmAccount.repository.name;
        scmAccount.repositoryURL = scmAccount.repository.url;
        ScmService.updateScmAccount(scmAccount).then(function (rs) {
            if (rs.success) {
                $scope.scmAccounts.push(rs.data);
                $scope.scmAccount = rs.data;
                vm.activeLauncher.scmAccountType = rs.data;
                vm.organizations = [];
                vm.repositories = [];
                vm.cardNumber = 0;

                // switch folder if new
                $timeout(function () {
                    const newScmAccountElement = angular.element('.folder-container-' + rs.data.id + ' .folder-container_folder_icon');
                    $scope.manageFolder($scope.scmAccount);
                    $scope.switchFolder(null, newScmAccountElement, true);
                    $scope.needServer = true;
                    $scope.$apply();
                }, 0, false);
            } else {
                messageService.error(rs.message);
            }
        });
    };

    function initAccessToken(code) {
        return $q(function (resolve, reject) {
            ScmService.exchangeCode(code).then(function (rs) {
                if (rs.success) {
                    resolve(rs.data);
                }
            });
        });
    };

    function getCenterWindowLocation(height, width) {
        var dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
        var dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screenY;
        var w = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
        var h = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;
        var left = ((w / 2) - (width / 2)) + dualScreenLeft;
        var top = ((h / 2) - (height / 2)) + dualScreenTop;
        return { 'top': top, 'left': left };
    }

    $scope.build = function (launcher, launcher_form) {
        if (launcher_form.$invalid) {
            // TODO: display error message;
            Object.keys(launcher_form.$error).forEach(key => {
                launcher_form.$error[key].forEach(errEl => errEl.$touched = true)
            });

            return;
        }

        const selectedProvider = getSelectedProvider();
        let providerId;


        const providerModel = extractPlatformSelections();

        //TODO: what if falsy?
        if (selectedProvider && vm.integrations) {
            const selectedIntegration = vm.integrations.find(({ name }) => name.toLowerCase() === selectedProvider.name.toLowerCase())

            if (selectedIntegration) {
                providerId = selectedIntegration.id;
            }
        }

        // merge launcher and provider models here
        const resultModel = { ...providerModel, ...vm.launcherModel };

        launcher.model = JSON.stringify(resultModel, null, 2);
        LauncherService.buildLauncher(launcher, providerId)
            .then(function (response) {
                if (response.success) {
                    messageService.success("Job is in progress");
                    $scope.hide();
                } else {
                    vm.showCIErrorPage();
                }
            });
    };

    function appendLauncher(launcher) {
        vm.launchers.push(launcher);
        const scmAccountIndex = $scope.scmAccounts.indexOfField('id', launcher.scmAccountType.id);
        const scmAccount = $scope.scmAccounts[scmAccountIndex];
        scmAccount.launchers = scmAccount.launchers || [];
        scmAccount.launchers.push(launcher);
    };

    function initWebsocket() {
        const wsName = 'zafira';

        zafiraWebsocket = Stomp.over(new SockJS(API_URL + '/api/websockets'));
        zafiraWebsocket.debug = null;
        zafiraWebsocket.ws.close = function() {};
        zafiraWebsocket.connect({ withCredentials: false }, function () {
            subscriptions.launchers = subscribeLaunchersTopic();
            UtilService.websocketConnected(wsName);
        }, function () {
            UtilService.reconnectWebsocket(wsName, initWebsocket);
        });
    };

    function subscribeLaunchersTopic() {
        return zafiraWebsocket.subscribe('/topic/' + authService.tenant + '.launchers', function (data) {
            const event = getEventFromMessage(data.body);
            const success = event.success;
            const userId = event.userId;

            if (UserService.currentUser.id === userId && success) {
                //remove all launchers of current scm account, except of defaults ones
                if (Array.isArray($scope.scmAccount.launchers) && $scope.scmAccount.launchers.length) {
                    vm.launchers = vm.launchers.filter(launcher => {
                        //skip default Zebrunner's demo launchers to keep them in data collection
                        if (launcher.job && launcher.job.name === 'launcher') {
                            return true;
                        }

                        return !$scope.scmAccount.launchers.find(l => l.id === launcher.id);
                    });
                }
                //add new scanned launchers
                vm.launchers = [...vm.launchers, ...event.launchers];
                //update current scm account
                $scope.scmAccount.launchers = vm.launchers.filter(({ scmAccountType }) => scmAccountType.id === $scope.scmAccount.id);
            } else {
                vm.launcherPreferences = {};
                messageService.error('Unable to scan repository');
            }
            $scope.onScanRepositoryFinish();
            applySavedPreferences();
            $scope.$apply();
        });
    }

    function getEventFromMessage(message) {
        return JSON.parse(message.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
    };

    function disconnectWebsocket() {
        if (zafiraWebsocket && zafiraWebsocket.connected) {
            subscriptions.launchers && subscriptions.launchers.unsubscribe();
            $timeout(function () {
                zafiraWebsocket.disconnect();
            }, 0, false);
            UtilService.websocketConnected('zafira');
        }
    };

    $scope.$on('$destroy', function () {
        disconnectWebsocket();
        finishCheckScannerInProgressTimeout();
    });

    $scope.hide = function (testRun) {
        $mdDialog.hide(testRun);
    };

    $scope.cancel = function () {
        $mdDialog.cancel();
    };

    function initController() {
        resetLauncher(); //TODO: why do we need this?
        const launchersPromise = getAllLaunchers()
            .then(launchers => {
                return vm.launchers = launchers;
            });
        toolsService.fetchIntegrationOfTypeByName('AUTOMATION_SERVER')
            .then(response => {
                if (response.success) {
                    $scope.servers = response.data || [];
                    $scope.needServer = $scope.servers.length > 1;
                }
            });
        getTenantInfo()
            .then((tenant) => {
                isMultitenant = tenant.multitenant;
                return getClientId();
            })
            .then(clientId => $scope.clientId = clientId);
        const scmAccountsPromise = ScmService.getAllScmAccounts()
            .then(function (rs) {
                if (rs.success) {
                    if (rs.data && rs.data.length) {
                        $scope.scmAccounts = rs.data.filter(function (scmAccount) {
                            return scmAccount.repositoryURL;
                        });
                    }
                } else {
                    messageService.error(rs.message);
                }
            });
        const providersConfigPromise = getProvidersConfig();

        $q.all([launchersPromise, scmAccountsPromise, providersConfigPromise])
            .then(data => {
                $scope.scmAccounts.forEach(scmAccount => {
                    scmAccount.launchers = vm.launchers.filter(({ scmAccountType }) => scmAccountType.id === scmAccount.id);
                });
            })
            .finally(() => {
                vm.loadingScm = false;
            });
    }

    /**
     * parses platform's config
     * @param {Object} data - provider's config from JSON
     */
    function initPlatforms(data) {
        if (!data || !data.rootKey) { return; }

        let preselectedPlatform;
        // keep link to the raw config
        vm.platformsConfig = data;
        // extract platforms from config
        vm.platforms = [...vm.platformsConfig.data[vm.platformsConfig.rootKey]]
            //any platform can be disabled in the config using 'disabled' field
            .filter(platform => !platform.disabled);

        // if it is a launcher's config we have to select it's value instead
        if (vm.activeLauncher.hasOwnProperty('parentLauncherId')) {
            const key = vm.launcherRawModel.hasOwnProperty(`uiInternal.${vm.platformsConfig.rootKey}`) ? `uiInternal.${vm.platformsConfig.rootKey}` : vm.platformsConfig.rootKey;
            preselectedPlatform = vm.platforms.find(platform => {
                return platform.value === vm.launcherRawModel[key];
            });
        }
        // if selected launcher has defined type, select first platform with the same type ('job' field)
        else if (vm.activeLauncher.type) {
            // if type has '-web' postfix it should be used as 'web'
            const type = (/-web$/i).test(vm.activeLauncher.type) ? 'web' : vm.activeLauncher.type;

            preselectedPlatform = vm.platforms.find(platform => {
                return Array.isArray(platform.job) && platform.job.includes(type);
            });
        }

        if (preselectedPlatform) {
            vm.platformModel[vm.platformsConfig.rootKey] = preselectedPlatform;
            onPlatformSelect();
        } else {
            checkForUnmatchedCapabilities();
        }
    }

    /**
     * Resets models and (re)builds controls
     */
    function onPlatformSelect() {
        clearPlatformControlsData();
        resetPlatformModel(vm.platformModel[vm.platformsConfig.rootKey]);
        if (vm.platformModel[vm.platformsConfig.rootKey]?.child) {
            prepareChildControl(vm.platformModel[vm.platformsConfig.rootKey]);
        }
        checkForUnmatchedCapabilities();
    }

    function prepareChildControl(parentItem) {
        const data = parentItem.child;
        let defaultItem;
        const key = data.key;
        let childControl;

        data.type = data.type ? data.type : 'select';
        data.label = data.label ? data.label : key;
        childControl = {
            type: data.type,
            key,
            label: data.label,
            data,
        };

        vm.platformControls = [...vm.platformControls, childControl];
        if (Array.isArray(vm.platformsConfig.data[key])) {
            childControl.items = vm.platformsConfig.data[key].filter(child => Array.isArray(data.variants) && data.variants.includes(child.id));
            defaultItem = getDefaultControl(childControl);
        }
        if (data.type === 'select') {
            childControl.onChange = onPlatformControlSelect;
            if (defaultItem) {
                vm.platformModel[key] = defaultItem;
                if (data.versions) {
                    prepareVersionsControl(defaultItem, data);
                } else if (defaultItem.child) {
                    prepareChildControl(defaultItem);
                }
            }
        } else if (data.type === 'input' || data.type === 'file') {
            if (data.type === 'file') {
                childControl.onChange = onFileUpload;
            }
            if (!defaultItem) {
                defaultItem = {
                    value: getControlDefaultValue(data.key),
                }
            }
            vm.platformModel[key] = defaultItem;
            if (defaultItem.child) {
                prepareChildControl(defaultItem);
            }
        }
    }

    function prepareVersionsControl(parentItem, data) {
        let defaultItem;
        const key = `${data.key}-versions`;
        const items = vm.platformsConfig.data[key].filter(child => data.versions.includes(child.id) && child.id.includes(parentItem.id));
        const childControl = {
            key,
            items,
            onChange: onPlatformControlSelect,
            data,
        };

        vm.platformControls = [...vm.platformControls, childControl];
        defaultItem = getDefaultVersionControl(childControl);
        defaultItem && (vm.platformModel[key] = defaultItem);
    }

    function onPlatformControlSelect(control) {
        if (!control) { return; }

        const parentItem = vm.platformModel[control.key];
        const versionsData = parentItem.versions ? parentItem : control.data.versions ? control.data : undefined;

        vm.platformControls = vm.platformControls.slice(0, vm.platformControls.indexOf(control) + 1);
        preparePlatformModel();

        if (versionsData && !control.key.includes('-versions')) {
            prepareVersionsControl(parentItem, versionsData);
        } else if (parentItem.child) {
            prepareChildControl(parentItem);
        }
    }

    function getDefaultControl(childControl) {
        let defaultItem;

        if (!childControl.items.length) {
            return  defaultItem;
        }

        //if we have in the launcher model ($scope.jsonModel) property with the same name as this control's key, try to find appropriate item in childControl
        //and remove that property from launcher model to prevent duplication
        // TODO: we are searching existing value and not expand if absent
        if (vm.launcherRawModel[childControl.key]) {
            if (Array.isArray(vm.launcherRawModel[childControl.key])) {
                defaultItem = childControl.items.find((item) => {
                    return vm.launcherRawModel[childControl.key].includes(item.value);
                });
            } else {
                defaultItem = childControl.items.find((item) => {
                    return item.value === vm.launcherRawModel[childControl.key];
                });
            }
        }
        //select by job (launcher type)
        if (!defaultItem && vm.activeLauncher.type) {
            defaultItem = childControl.items.find(item => Array.isArray(item.job) && item.job.includes(vm.activeLauncher.type));
        }
        //select by config's default value
        if (!defaultItem && childControl.data.default) {
            defaultItem = childControl.items.find(item => item.id === childControl.data.default);
        }
        //select first item in array
        if (!defaultItem) {
            defaultItem = childControl.items[0];
        }

        return defaultItem;
    }

    //TODO: looks like we can get rid of this 'versions' configs because its functionality can be covered by common approach (variants)
    function getDefaultVersionControl(childControl) {
        let defaultItem;

        if (!childControl.items.length) {
            return  defaultItem;
        }

        //if we have in the launcher model ($scope.jsonModel) property with the same name as this control's key, try to find appropriate item in childControl
        //and remove that property from launcher model to prevent duplication
        if (vm.launcherRawModel[childControl.key]) {
            // if (typeof $scope.jsonModel[childControl.key] === 'string') {
            //
            // } else
            if (Array.isArray(vm.launcherRawModel[childControl.key])) {
                defaultItem = childControl.items.find((item) => {
                    return vm.launcherRawModel[childControl.key].includes(item.value);
                });
            } else {
                defaultItem = childControl.items.find((item) => {
                    return item.value === vm.launcherRawModel[childControl.key];
                });
            }

            // Reflect.deleteProperty($scope.jsonModel, childControl.key);
        }
        //select by job (launcher type)
        if (!defaultItem && vm.activeLauncher.type) {
            defaultItem = childControl.items.find(item => Array.isArray(item.job) && item.job.includes(vm.activeLauncher.type));
        }
        //select by config's default value
        if (!defaultItem && childControl.data['default-versions']) {
            if (typeof childControl.data['default-versions'] === 'string') {
                defaultItem = childControl.items.find(item => item.id === childControl.data['default-versions']);
            } else {
                defaultItem = childControl.items.find(item =>  childControl.data['default-versions'].includes(item.id));
            }
        }
        //select first item in array
        if (!defaultItem) {
            defaultItem = childControl.items[0];
        }

        return defaultItem;
    }

    function getControlDefaultValue(key) {
        let value = '';

        if (vm.launcherRawModel.hasOwnProperty(key)) {
            value = vm.launcherRawModel[key];
        }

        return value;
    }

    function preparePlatformModel() {
        const keys = vm.platformControls.map(control => control.key);
        const newModel = {};

        newModel[vm.platformsConfig.rootKey] = vm.platformModel[vm.platformsConfig.rootKey];
        vm.platformModel = keys.reduce((out, key) => {
            out[key] = vm.platformModel[key];

            return out;
        }, newModel);
    }

    function extractPlatformSelections() {
        return Object.keys(vm.platformModel).reduce((accum, key) => {
            if (vm.platformModel[key]) {
                // handle case when launcher has platform param: we need to use its value
                if (
                    key === vm.platformsConfig.rootKey &&
                    vm.launcherRawModel.hasOwnProperty(key) &&
                    vm.launcherRawModel[key] !== vm.platformModel[key].value
                ) {
                    accum[key] = vm.launcherRawModel[key];
                    accum[`uiInternal.${key}`] = vm.platformModel[key].value;
                } else {
                    accum[key] = vm.platformModel[key].value;
                }
            }

            return accum;
        }, {});
    }

    /**
     * Returns value for "None" platform option. Sometimes capability option has the same name as platform's 'rootKey',
     * so the platformModel won't be empty. To make 'None' option active we need to return this value instead of null.
     * @returns {null|*}
     */
    function getNoPlatformValue() {
        // check if platform Model is not empty and its value not a platform from provider's config
        if (vm.platformModel[vm.platformsConfig.rootKey] && !vm.platforms.find(platform => platform === vm.platformModel[vm.platformsConfig.rootKey])) {
            return vm.platformModel[vm.platformsConfig.rootKey];
        }

        return null;
    }

    /**
     * creates platform control object from launcher capability
     * @param {String} key - capability name
     * @param {*} value - capability value
     * @returns {Object} - platform control object
     */
    function createPlatformControl(key, value) {
        const label = key.split('.')[1];
        const control = {
            type: 'input',
            key,
            label,
        };

        if (Array.isArray(value)) {
            control.type = 'select';
            control.items = value.map(item => ({
                id: item,
                name: item,
                value: item,
            }));
        }

        return control;
    }

    function createControl(key, value, label) {
        const control = {
            type: getControlType(value),
            key,
            label,
            value,
        };

        // 1 - is minimal value for such control type
        if (control.type === 'number') {
            const parsedValue = parseInt(control.value, 10);

            control.value = !isNaN(parsedValue) ? parsedValue : 1;
        }

        return control;
    }

    function prepareLauncherControls() {
        const activeProvider = getSelectedProvider();

        vm.launcherControls = Object.keys(vm.launcherRawModel)
            // filter capability params which will be used as provider's
            .filter(key => !(activeProvider && !vm.failedProvider && key.includes('capabilities')) && !key.includes('uiInternal'))
            .map(key => {
                const label = key.includes('capabilities') ? key.split('.')[1] : key;
                let value = vm.launcherRawModel[key];

                if (Array.isArray(value)) {
                    value = value.map(item => ({
                        id: item,
                        name: item,
                        value: item,
                    }));
                }

                return createControl(key, value, label);
            });

        // keep already changed control values
        const cachedModel = vm.launcherModel;

        vm.launcherModel = {};
        // populate model with default values
        vm.launcherControls.forEach(control => {
            let value = control.value;

            if (control.type === 'select') {
                // todo: get default value
                value = value[0].value;
            }

            if (cachedModel.hasOwnProperty(control.key) && cachedModel[control.key] !== value) {
                vm.launcherModel[control.key] = cachedModel[control.key];
            } else {
                vm.launcherModel[control.key] = value;
            }
        });
    }

    /**
     * clears platforms data and related model and controls
     */
    function clearPlatforms() {
        resetPlatformModel();
        vm.platforms = [];
        vm.platformsConfig = null;
        clearPlatformControlsData();
    }

    /**
     * Resets platform controls to empty array
     */
    function clearPlatformControlsData() {
        vm.platformControls = [];
    }

    /**
     * resets platform model and add a platform to it if provided
     * @param {Object} [platform] - platform config data
     */
    function resetPlatformModel(platform) {
        vm.platformModel = {};

        if (platform) {
            vm.platformModel[vm.platformsConfig.rootKey] = platform;
        }
    }

    function getBrowsersConfig(url) {
        return $http.get(`${url}?timestamp=${Date.now()}`);
    }

    function onProviderSelect(selectedProvider) {
        if (vm.chipsCtrl.selectedChip === -1 || selectedProvider !== vm.chipsCtrl.items[vm.chipsCtrl.selectedChip]) {
            handleProviderSelection(selectedProvider);
        } else {
            handleProviderDeselection();
        }
    }

    function handleProviderSelection(provider) {
        if (!vm.chipsCtrl || !provider) { return; }

        const index = vm.chipsCtrl.items.findIndex(({ id }) => {
            return provider.id === id;
        });

        clearPlatforms();
        vm.failedProvider = provider.failed;
        vm.chipsCtrl.selectedChip = index;
        vm.selectedProviderName = provider.name;
        if (!vm.failedProvider && provider.data) {
            initPlatforms(provider.data);
        }
        prepareLauncherControls();
    }

    function handleProviderDeselection() {
        clearPlatforms();
        vm.selectedProviderName = null;
        vm.chipsCtrl && (vm.chipsCtrl.selectedChip = -1);
        prepareLauncherControls();
    }

    function getSelectedProvider() {
        if (!vm.chipsCtrl || vm.chipsCtrl.selectedChip === -1) { return; }

        return vm.chipsCtrl.items[vm.chipsCtrl.selectedChip];
    }

    //handle initial provider selection after chips were rendered
    function selectProviderOnChipsInit(index, ctrl) {
        //save link to chips controller on first chip initialization
        if (index === 0) {
            vm.chipsCtrl = ctrl;
        }
        if (vm.providers.length - 1 === index) {
            if (!isNaN(vm.lastSelectedProvider)) {
                //restore previous selected provider otherwise keep deselected
                if (vm.lastSelectedProvider !== -1) {
                    handleProviderSelection(vm.providers[vm.lastSelectedProvider]);
                }
                vm.lastSelectedProvider = null;
            } else { //if we don't have cached selection we should select first provider
                handleProviderSelection(vm.providers[0]);
            }
        }
    }

    function getProvidersConfig() {
        return $http.get(`${providersConfigURL}?timestamp=${Date.now()}`)
            .then(response => {
                const url = new URL(providersConfigURL);
                const path = url.pathname.substring(0, url.pathname.lastIndexOf('/') + 1);
                const data = response.data || {};
                let providers = data.default || [];

                //merge default and tenant specific providers
                if (Array.isArray(data[authService.tenant])) {
                    const defaultProviders = providers.reduce((out, provider) => {out[provider.id] = provider; return out;}, {});
                    const specificProviders = data[authService.tenant].reduce((out, provider) => {out[provider.id] = provider; return out;}, {});
                    const mergedProviders = {...defaultProviders, ...specificProviders};

                    providers = Object.values(mergedProviders);
                }

                return toolsService.fetchIntegrationOfTypeByName('TEST_AUTOMATION_TOOL')
                    .then(res => {
                        if (res.success) {
                            vm.integrations = res.data || [];

                            const integrationNames = vm.integrations
                                .filter(integration => integration.enabled && integration.connected)
                                .map(item => item.name.toLowerCase());

                            vm.providers = providers
                                //filter providers by available integrations
                                .filter(provider => integrationNames.includes(provider.name.toLowerCase()))
                                //sort providers by priority
                                .sort((a, b) => {
                                    const aPriority = providersPriority[a.name] || providersPriority.default;
                                    const bPriority = providersPriority[b.name] || providersPriority.default;

                                    if (aPriority < bPriority) {
                                        return -1;
                                    }
                                    if (aPriority > bPriority) {
                                        return 1;
                                    }

                                    return 0;
                                });

                            return $q.all(vm.providers.map((config, index) => {
                                if (config.configFile) {
                                    url.pathname = path + config.configFile;

                                    return getBrowsersConfig(url.href)
                                        .then(res => {
                                            config.data = res.data;
                                        })
                                        .catch(() => {
                                            console.error(`Unable to load ${config.name} provider config`);
                                            config.failed = true;
                                        });
                                }

                                return $q.resolve();
                            }));
                        } else {
                            console.error('Unable to get integrations');
                        }
                    })
            })
            .catch(() => {
                console.error('Unable to load the providers config');
                vm.providersFail = true;
            });
    }

    /**
     * handles capability options which come with launcher and not merged with provider's platform config.
     * These options will be transformed to be as platform specific options (upper section on UI)
     */
    function checkForUnmatchedCapabilities() {
        Object.keys(vm.launcherRawModel)
            .filter(key => {
                // we need only capability params
                const isCapability = key.includes('capabilities') && !key.includes('uiInternal');

                // if it's a platform config, we don't need to create a control if any provider's platform is selected
                if (
                    isCapability &&
                    vm.platformsConfig.rootKey === key &&
                    vm.platforms.some(platform => platform === vm.platformModel[vm.platformsConfig.rootKey])
                ) {
                    return;
                }
                // do not create control if already exists
                if (vm.platformControls.find(control => control.key === key)) {
                    return;
                }

                return isCapability;
            })
            .forEach(key => {
                const platformControl = createPlatformControl(key, vm.launcherRawModel[key]);
                const defaultValue = platformControl.type === 'select' ? platformControl.items[0] : vm.launcherRawModel[key] ?? '';

                vm.platformControls.push(platformControl);
                vm.platformModel[key] = { value: defaultValue };
            });
    }

    function cancelFolderManaging() {
        vm.creatingLauncher = false;
        vm.cardNumber = 0;
        $scope.scmAccount = {};
        $scope.needServer = false;
        $scope.currentServerId = null;
        $scope.DEFAULT_TEMPLATES.model = {};
        resetLauncher();
    }

    function prepareLauncherConfigForSave() {
        const providerModel = extractPlatformSelections();
        const resultModel = { ...providerModel, ...vm.launcherModel };

        vm.selectedLauncherConfig = angular.copy(vm.activeLauncher);
        vm.selectedLauncherConfig.name = '';
        vm.selectedLauncherConfig.model = JSON.stringify(resultModel, null, 2);
        vm.cardNumber = 4;
    }

    function saveLauncherConfig() {
        const params = {
            name: vm.selectedLauncherConfig.name,
            params: vm.selectedLauncherConfig.model,
            providerId: vm.integrations.find((item) => item.name.toLowerCase() === vm.selectedProviderName?.toLowerCase())?.id || null,
        };

        LauncherService.saveLauncherConfig(vm.selectedLauncherConfig.id, params)
            .then((rs) => {
                if (rs.success) {
                    const launcherInScope = vm.launchers.find((item) => item.id === vm.selectedLauncherConfig.id);

                    if (!launcherInScope.presets) {
                        launcherInScope.presets = [];
                    }
                    launcherInScope.presets.push(rs.data);
                    vm.chooseSavedLauncherConfig(rs.data);
                    messageService.success('Launcher config was saved');
                } else {
                    messageService.error(rs.message);
                }
            })
            .finally(() => {
                vm.selectedLauncherConfig = null;
            });
    }

    function shouldBeDisplayed(section) {
        switch (section) {
            case 'helper':
                return !vm.isMobile || vm.cardNumber === 0;
            case 'launcher':
                return vm.cardNumber === 3;
            case 'welcome':
                return vm.cardNumber === 0;
            case 'ci-error':
                return vm.cardNumber === 5;
            case 'waiting':
                return $scope.launcherLoaderStatus && ($scope.launcherLoaderStatus.started || $scope.launcherLoaderStatus.finished);
            case 'add-repo':
                return vm.cardNumber === 1 && !$scope.needServer;
            case 'scan-repo':
                return vm.cardNumber === 2 && !vm.creatingLauncher && (!$scope.needServer || ($scope.scmAccount && $scope.scmAccount.launchers && $scope.scmAccount.launchers.length)) && !(vm.activeLauncher && vm.activeLauncher.id);
            case 'edit-launcher':
                return vm.cardNumber === 2 && (!$scope.needServer || ($scope.scmAccount && $scope.scmAccount.launchers && $scope.scmAccount.launchers.length)) && vm.activeLauncher && vm.activeLauncher.id;
            case 'create-launcher':
                return vm.cardNumber === 2 && vm.creatingLauncher && (!$scope.needServer || ($scope.scmAccount && $scope.scmAccount.launchers && $scope.scmAccount.launchers.length)) && !(vm.activeLauncher && vm.activeLauncher.id);
            case 'save-launcher-config':
                return vm.cardNumber === 4 && (!$scope.needServer || ($scope.scmAccount && $scope.scmAccount.launchers && $scope.scmAccount.launchers.length)) && vm.activeLauncher && vm.activeLauncher.id;
            case 'server-select':
                return $scope.needServer && vm.cardNumber !== 0 && !($scope.scmAccount && $scope.scmAccount.launchers && $scope.scmAccount.launchers.length);
            default:
                return false;
        }
    }

    function onFileUpload($file, $invalidFiles, control) {
        if ($invalidFiles?.length) {
            messageService.error(`Use ${vm.appFormats} files ${vm.appMaxSize} max`);
        } else if ($file) {
            vm.platformModel[control.key].file = $file;
            $file.isUploading = true;
            $file.upload = Upload
                .upload({
                    url: `${API_URL}/api/upload?file=`,
                    method: 'POST',
                    headers: {
                        'FileType': 'APP',
                        'Content-Type': $file.type !== '' ? $file.type : 'application/octet-stream',
                    },
                    data: {
                        key: $file.name,
                        'Content-Type': $file.type !== '' ? $file.type : 'application/octet-stream',
                        filename: $file.name,
                        file: $file,
                    }
                })
                .success(response => {
                    $timeout(() => {
                        $file.result = response;
                        vm.platformModel[control.key].value = $file.result.url;
                    }, 0);
                })
                .progress(evt => {
                    $file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
                })
                .error(response => {
                    if (response?.error?.message) {
                        messageService.error(response.error.message);
                    } else {
                        messageService.error('Unable to upload file, please try later');
                    }
                });

            $file.upload
                .finally(() => {
                    $timeout(() => {
                        $file.isUploading = false;
                    }, 0);
                });
        }
    }

    return vm;
};

export default CiHelperController;
