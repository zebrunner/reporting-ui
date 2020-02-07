'use strict';

import 'brace';
import 'brace/mode/javascript';
import 'brace/mode/java';
import 'brace/mode/php';
import 'brace/mode/golang';
import 'brace/mode/plain_text';
import 'brace/mode/csharp';
import 'brace/mode/python';
import 'brace/mode/ruby';
import 'brace/theme/eclipse';
import 'angular-ui-ace';

import './access-key-modal.scss';

const AccessKeyModalController = function AccessKeyModalController(
    $mdDialog,
    jsonConfigsService,
    toolsService,
    messageService,
    $timeout,
    $q,
) {
    'ngInject';

    const vm = {
        languages: [],
        isLoading: true,
        aceOptions: {
            useWrapMode: false,
            showGutter: false,
            theme: 'eclipse',
            mode: 'java',
            firstLineNumber: 5,
            rendererOptions: {
                fontSize: '14px',
            },
            onLoad: setEditorInstance,
        },
        aceModel: 'Loading data...',
        lastUpdatedAceModel: '',
        platforms: [],
        platformModel: {},
        accessUrl: '',
        accessUrlLoading: true,
        accessSettings: {},
        failedProvider: false,

        closeModal,
        selectLanguageOnChipsInit,
        onLanguageSelect,
        onPlatformSelect,
        // refreshAccessUrl,
        copyAccessUrl,
        onCodeCopy,
        $onInit: init,
    };

    return vm;

    function init() {
        const initLangsPromise = initLanguages();
        const initAccessUrlPromise = getAccessUrl();

        $q.all([initLangsPromise, initAccessUrlPromise])
            .finally(() => {
                vm.isLoading = false;
                if (vm.languages.length && vm.languages[0].snippet) {
                    $timeout(() => { handleLanguageSelection(vm.languages[0]); }, 0);
                }
            });
    }

    function initLanguages() {
        return jsonConfigsService.getLanguagesConfig()
            .then(res => {
                const languages = res.languages || [];
                const providerConfigUrl = res.providerConfigUrl || '';

                languages.sort((a, b) => a.order - b.order);
                vm.languages = languages;

                const languagesPromises = vm.languages.length ? loadLanguagesSnippets() : [];

                if (providerConfigUrl) {
                    languagesPromises.push(getProvidersConfig(providerConfigUrl));
                } else {
                    vm.failedProvider = true;
                }

                return $q.all(languagesPromises);
            })
            .catch(err => {
                vm.languagesFail = true;
                if (err && err.message) {
                    messageService.error(err.message);
                }
            });
    }

    function getProvidersConfig(providerConfigUrl) {
        return jsonConfigsService.fetchProviderConfig(providerConfigUrl)
            .then(res => {
                if (res.success) {
                    initPlatforms(res.data);
                } else {
                    vm.failedProvider = true;
                }
            });
    }

    function loadLanguagesSnippets() {
        return vm.languages.map(langConfig => {
            return jsonConfigsService.fetchFile(langConfig.snippetURL)
                .then(res => {
                    langConfig.snippet = res.data || '';

                    return langConfig;
                })
                .catch(() => {
                    langConfig.snippet = 'Unable to load snippet for this language.';

                    return langConfig;
                });
        });
    }

    function getAccessUrl() {
        return toolsService.fetchToolSettings('zebrunner')
            .then(res => {
                if (res.success) {
                    const settings = res.data || [];

                    vm.accessSettings = settings.reduce((acc, setting) => {
                        acc[setting.name] = setting.value;

                        return acc;
                    }, {});
                    initAccessUrl();
                } else {
                    messageService.error('Unable to get access config, please contact your administrator');
                }
                vm.accessUrlLoading = false;
            });
    }

    // function refreshAccessUrl() {
    //     // TODO: will be implemented later
    // }

    function initAccessUrl() {
        if (!vm.accessSettings) { return; }
        if (vm.accessSettings.ZEBRUNNER_URL) {
            try {
                const url = new URL(vm.accessSettings.ZEBRUNNER_URL);

                if (vm.accessSettings.ZEBRUNNER_USER) {
                    url.username = vm.accessSettings.ZEBRUNNER_USER;
                }
                if (vm.accessSettings.ZEBRUNNER_PASSWORD) {
                    url.password = vm.accessSettings.ZEBRUNNER_PASSWORD;
                }

                vm.accessUrl = url.href;
            } catch (error) {
                messageService.error('Unable to init Access URL');
            }
        }
    }

    function copyAccessUrl() {
        vm.accessUrl.copyToClipboard();
        messageService.success('Access URL copied to clipboard');
    }

    //handle initial language selection after chips were rendered
    function selectLanguageOnChipsInit(index, ctrl) {
        //save link to chips controller on first chip initialization
        if (index === 0) {
            vm.chipsCtrl = ctrl;
        }
        if (vm.languages.length && vm.languages.length - 1 === index && vm.languages[0].snippet) {
            $timeout(() => { handleLanguageSelection(vm.languages[0]); }, 0);
        }
    }

    function onLanguageSelect(selectedLanguage) {
        if (vm.chipsCtrl.selectedChip === -1 || selectedLanguage !== vm.chipsCtrl.items[vm.chipsCtrl.selectedChip]) {
            handleLanguageSelection(selectedLanguage);
        } else {
            handleLanguageDeselection();
        }
    }

    function handleLanguageSelection(language) {
        if (!vm.chipsCtrl || !language) { return; }

        const index = vm.chipsCtrl.items.findIndex(({ name }) => {
            return language.name === name;
        });
        const mode = language.editorMode || 'ace/mode/plain_text';

        // vm.failedProvider = provider.failed;
        vm.chipsCtrl.selectedChip = index;
        if (vm.aceEditor) {
            vm.aceEditor.getSession().setMode(mode);
        }
        selectDefaultPlatform();
    }

    function handleLanguageDeselection() {
        vm.aceModel = '';
        if (vm.chipsCtrl) {
            vm.chipsCtrl.selectedChip = -1;
        }
    }

    function getSelectedLanguage() {
        if (!vm.chipsCtrl || vm.chipsCtrl.selectedChip === -1) { return; }

        return vm.chipsCtrl.items[vm.chipsCtrl.selectedChip];
    }

    function setEditorInstance(editor) {
        vm.aceEditor = editor;
        // to disable library's warning message in the console https://github.com/angular-ui/ui-ace/issues/104
        vm.aceEditor.$blockScrolling = Infinity;
    }

    function initPlatforms(data) {
        if (!data || !data.rootKey) { return; }

        vm.platformsConfig = data;
        vm.platforms = [...vm.platformsConfig.data[vm.platformsConfig.rootKey]]
            //any platform can be disabled in the config using 'disabled' field
            .filter(platform => !platform.disabled);

        // select first platform by default
        selectDefaultPlatform();
    }

    function onPlatformSelect() {
        clearPlatformControlsData();
        resetPlatformModel(vm.platformModel[vm.platformsConfig.rootKey]);
        if (vm.platformModel[vm.platformsConfig.rootKey] && vm.platformModel[vm.platformsConfig.rootKey].child) {
            prepareChildControl(vm.platformModel[vm.platformsConfig.rootKey]);
            updateEditorModel();
        }
    }

    function selectDefaultPlatform() {
        if (vm.platforms.length) {
            vm.platformModel[vm.platformsConfig.rootKey] = vm.platforms[0];
            onPlatformSelect();
        }
    }

    function clearPlatformControlsData() {
        vm.platformControls = [];
    }

    function resetPlatformModel(platform) {
        vm.platformModel = {};

        if (platform) {
            vm.platformModel[vm.platformsConfig.rootKey] = platform;
        }
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
            index: vm.platformControls.length,
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
        } else if (data.type === 'input') {
            if (!defaultItem) {
                defaultItem = {
                    value: '',
                };
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
            index: vm.platformControls.length,
            data,
        };

        vm.platformControls = [...vm.platformControls, childControl];
        defaultItem = getDefaultVersionControl(childControl);
        if (defaultItem) {
            vm.platformModel[key] = defaultItem;
        }
    }

    function onPlatformControlSelect(control) {
        if (!control) { return; }
        const parentItem = vm.platformModel[control.key];
        const versionsData = parentItem.versions ? parentItem : control.data.versions ? control.data : undefined;

        vm.platformControls = vm.platformControls.slice(0, control.index + 1);
        filterPlatformModel();

        if (versionsData && !control.key.includes('-versions')) {
            prepareVersionsControl(parentItem, versionsData);
        } else if (parentItem.child) {
            prepareChildControl(parentItem);
        }
        updateEditorModel();
    }

    function getDefaultControl(childControl) {
        let defaultItem;

        if (!childControl.items.length) {
            return  defaultItem;
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

    function filterPlatformModel() {
        const keys = vm.platformControls.map(control => control.key);
        const newModel = {};

        newModel[vm.platformsConfig.rootKey] = vm.platformModel[vm.platformsConfig.rootKey];

        vm.platformModel = keys.reduce((out, key) => {
            out[key] = vm.platformModel[key];

            return out;
        }, newModel);
    }

    function updateEditorModel() {
        $timeout(() => {
            const selectedLanguage = getSelectedLanguage();

            if (selectedLanguage && selectedLanguage.snippet) {
                const data = Object.keys(vm.platformModel).reduce((acc, key) => {
                    acc[key] = vm.platformModel[key].value;

                    return acc;
                }, {});

                if (vm.accessSettings.ZEBRUNNER_USER) {
                    data.username = vm.accessSettings.ZEBRUNNER_USER;
                }
                if (vm.accessSettings.ZEBRUNNER_PASSWORD) {
                    data.password = vm.accessSettings.ZEBRUNNER_PASSWORD;
                }

                vm.aceModel = replacePlaceholders(selectedLanguage.snippet, data);
                vm.lastUpdatedAceModel = vm.aceModel;
            }
        }, 0);
    }

    function replacePlaceholders(text, data) {
        return text.replace(/\${([^{}]*)}/g, function (a, b) {
            let replacer = data[`capabilities.${b}`] || data[b];

            if (b === 'platformName') {
                if (replacer === '*') {
                    replacer = 'any';
                }
                replacer = replacer.toUpperCase();
            }

            return replacer && (typeof replacer === 'string' || typeof replacer === 'number') ? replacer : a;
        });
    }

    function onCodeCopy() {
        $timeout(() => {
            vm.aceModel.copyToClipboard();
            messageService.success('Code copied to clipboard');
            $mdDialog.hide();
        }, 0, false);
    }

    function closeModal() {
        $mdDialog.cancel();
    }
};

export default AccessKeyModalController;
