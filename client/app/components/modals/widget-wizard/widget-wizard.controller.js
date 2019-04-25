const widgetWizardController = function WidgetWizardController($scope, $mdDialog, $q, $location, $widget, $mapper, DashboardService, UtilService, projectsService, widget, dashboard, currentUserId) {

    'ngInject';

    $scope.START_MODE = widget && widget.id ? 'UPDATE' : 'NEW';
    var MODE = $scope.START_MODE === 'UPDATE' ? 'UPDATE' : 'ADD';

    const CARDS = {
        currentItem: 0,
        items: [
            {
                index: 1,
                stepCount: 1,
                id: 'choose-create',
                title: 'Choose widget',
                nextDisabled: function (form) {
                    return ! $scope.widget.widgetTemplate;
                },
                onBackClick: function() {
                },
                onLoad: function () {
                    if(! $scope.widgets) {
                        DashboardService.GetWidgets().then(function (rs) {
                            if (rs.success) {
                                $scope.widgets = rs.data.filter(function (widget) {
                                    return widget.widgetTemplate;
                                });
                                updateWidgetsToAdd();
                            } else {
                                alertify.error(rs.message);
                            }
                        });
                    }
                },
                need: function (template, widgetId) {
                    return ! widgetId && ! template;
                },
                scValue: 'title'
            },
            {
                index: 2,
                stepCount: 1,
                id: 'choose',
                title: 'Choose template',
                nextDisabled: function (form) {
                    return ! $scope.widget.widgetTemplate;
                },
                onBackClick: function() {
                },
                onLoad: function () {
                    if(! $scope.templates) {
                        DashboardService.GetWidgetTemplates().then(function (rs) {
                            if (rs.success) {
                                $scope.templates = rs.data;
                            } else {
                                alertify.error(rs.message);
                            }
                        });
                    }
                },
                need: function (template, widgetId) {
                    return ! widgetId;
                },
                scValue: 'name'
            },
            {
                index: 3,
                stepCount: 2,
                id: 'set',
                title: 'Set parameters',
                nextDisabled: function (form) {
                    return form.params.$invalid;
                },
                onBackClick: function() {
                },
                onLoad: function () {
                    if(widget.id) {
                        initLegendConfigObject();
                    }
                },
                need: function (template) {
                    return template.paramsConfig;
                }
            },
            {
                index: 4,
                stepCount: 3,
                id: 'save',
                title: 'Save',
                nextDisabled: function (form) {
                },
                onLoad: function () {
                    initLegendConfigObject();
                }
            }
        ]
    };

    $scope.chartActions = [];

    function initLegendConfigObject() {
        $scope.widgetBuilder.legendConfigObject = $widget.buildLegend($scope.widget);
        if($scope.widgetBuilder.legendConfigObject.legend) {
            $scope.widgetBuilder.legendConfigObject.legend.forEach(function (legendName) {
                $scope.onLegendChange(legendName);
            });
        }
    };

    $scope.deleteWidget = function (widget) {
        var confirmedDelete = confirm('Would you like to delete widget "' + widget.title + '" ?');
        if (confirmedDelete) {
            DashboardService.DeleteWidget(widget.id).then(function (rs) {
                if (rs.success) {
                    $scope.widgets.splice($scope.widgets.indexOfId(widget.id), 1);
                    if(dashboard.widgets.indexOfId(widget.id) >= 0) {
                        dashboard.widgets.splice(dashboard.widgets.indexOfId(widget.id), 1);
                    }
                    updateWidgetsToAdd();
                    alertify.success("Widget deleted");
                }
                else {
                    alertify.error(rs.message);
                }
            });
        }
    };

    function prepareWidgetTemplate(id) {
        return $q(function (resolve, reject) {

            DashboardService.PrepareWidgetTemplate(id).then(function (rs) {
                if(rs.success) {
                    resolve(rs.data);
                } else {
                    reject(rs.message);
                }
            });
        });
    };

    function updateWidgetsToAdd () {
        if($scope.widgets && dashboard.widgets) {
            dashboard.widgets.forEach(function(w) {
                var widgetIndex = $scope.widgets.indexOfField('id', w.id);
                if(widgetIndex !== -1) {
                    $scope.widgets[widgetIndex].existing = true;
                }
            });
        }
    };

    $scope.widget = {};
    $scope.widgetBuilder = {};

    $scope.onChange = function() {
        return $q(function (resolve, reject) {
            $scope.widgetBuilder = {};
            prepareWidgetTemplate($scope.widget.widgetTemplate.id).then(function (rs) {
                $scope.widget.widgetTemplate = rs;
                $scope.buildConfigs();
                resolve();
            }, function (rs) {
                alertify.error(rs);
                reject();
            });
        });
    };

    $scope.tempData = {
        widget: {}
    };

    $scope.onWidgetChange = function() {
        if($scope.tempData.widget.id) {
            $scope.widget = $scope.tempData.widget;
            MODE = $scope.widget.existing ? 'UPDATE' : 'ADD';
            return $scope.onChange();
        }
    };

    $scope.buildConfigs = function(form) {
        if(! form || form.$valid) {
            $scope.widget.widgetTemplate.chartConfig = replaceFontSize($scope.widget.widgetTemplate.chartConfig);
            $scope.executeWidget($scope.widget, dashboard.attributes);

            $scope.echartConfig.previousTemplate = $scope.echartConfig.currentTemplate ? $scope.echartConfig.currentTemplate : undefined;
            $scope.echartConfig.currentTemplate = $scope.widget.widgetTemplate;
            if ($scope.echartConfig.clear && $scope.echartConfig.previousTemplate && $scope.echartConfig.previousTemplate.type !== $scope.echartConfig.currentTemplate.type) {
                $scope.echartConfig.clear();
            }
        }
    };

    $scope.switchInputEnabled = function(paramValue) {
        if(! widget.id) {
            if (paramValue.input_enabled) {
                paramValue.value = getFirstValue(paramValue);
            } else {
                paramValue.value = getEmptyValue(paramValue);
            }
        } else {
            if (paramValue.input_enabled) {
                paramValue.value = paramValue.oldValue ? paramValue.oldValue : getFirstValue(paramValue);
            } else {
                paramValue.oldValue = paramValue.oldValue || angular.copy(paramValue.value);
                paramValue.value = getEmptyValue(paramValue);
            }
        }
    };

    function getFirstValue(paramValue) {
        return paramValue.values ?  paramValue.values.length ? paramValue.multiple ?  [paramValue.values[0]] : paramValue.values[0] : [] : '';
    };

    function getEmptyValue(paramValue) {
        return paramValue.multiple ? [] : '';
    };

    $scope.hasEmptyOptionalParams = function (revert) {
        var result = false;
        angular.forEach($scope.widgetBuilder.paramsConfigObject, function (value, key) {
            var predicate = revert ? value.input_enabled : ! value.input_enabled;
            if(! value.required && predicate) {
                result = true;
                return;
            }
        });
        return result;
    };

    function replaceFontSize(chartConfStr) {
        if(! chartConfStr)
            return;
        return chartConfStr.replace(/.{1}fontSize.{1} *: *(\d+)/, '"fontSize": 6');
    }

    $scope.echartConfig = {
        previousTemplate: undefined,
        currentTemplate: undefined
    };

    $scope.executeWidget = function(widget, attributes, isTable) {

        isTable = isTable || widget.widgetTemplate ? widget.widgetTemplate.type === 'TABLE' : false;

        if(! $scope.widgetBuilder.paramsConfigObject) {
            $scope.widgetBuilder.paramsConfigObject = $widget.build($scope.widget, dashboard, currentUserId);
        }

        var sqlTemplateAdapter = {
            "templateId": widget.widgetTemplate.id,
            "paramsConfig": $mapper.map($scope.widgetBuilder.paramsConfigObject, function (value) {
                return value.value;
            })
        };

        DashboardService.ExecuteWidgetTemplateSQL(getQueryParams(false), sqlTemplateAdapter).then(function (rs) {
            if (rs.success) {
                var data = rs.data;
                var columns = {};
                if(! widget.widgetTemplate.chartConfig) {
                    for (var j = 0; j < data.length; j++) {
                        if (data[j] !== null) {
                            if (j === 0) {
                                columns = Object.keys(data[j]);
                            }
                        }
                    }
                } else {
                    columns = JSON.parse(widget.widgetTemplate.chartConfig).columns;
                }
                widget.widgetTemplate.model = isTable ? {"columns" : columns} : JSON.parse(widget.widgetTemplate.chartConfig);
                widget.data = {
                    dataset: data
                };
            }
            else {
                alertify.error(rs.message);
            }
        });
    };

    $scope.asString = function (value) {
        if (value) {
            value = value.toString();
        }
        return value;
    };

    function getQueryParams(showStacktrace){
        return {'stackTraceRequired': showStacktrace};
    };

    $scope.onLegendChange = function (legendName) {
        if(['TABLE'].indexOf($scope.widget.widgetTemplate.type) === -1) {
            $scope.chartActions.push({
                type: $scope.widgetBuilder.legendConfigObject.legendItems[legendName] ? 'legendSelect' : 'legendUnSelect',
                name: legendName
            });
        }
    };

    $scope.createWidget = function () {
        var widgetType = prepareWidget();
        DashboardService.CreateWidget(widgetType).then(function (rs) {
            if(rs.success) {
                alertify.success('Widget was created');
                $scope.hide('CREATE', rs.data);
            } else {
                alertify.error(rs.message);
            }
        });
    };

    $scope.updateWidget = function () {
        var widgetType = prepareWidget();
        Reflect.deleteProperty($scope.widget, "model");
        DashboardService.UpdateWidget(widgetType).then(function (rs) {
            if(rs.success) {
                if(MODE === 'ADD') {
                    alertify.success('Widget was added');
                    $scope.hide('ADD', rs.data);
                } else {
                    alertify.success('Widget was updated');
                    $scope.hide('UPDATE', rs.data);
                }
            } else {
                alertify.error(rs.message);
            }
        });
    };

    function prepareWidget() {
        $scope.widget.paramsConfig = JSON.stringify($mapper.map($scope.widgetBuilder.paramsConfigObject, function (value) {
            return value.value;
        }), null, 2);
        if($scope.widgetBuilder.legendConfigObject && $scope.widgetBuilder.legendConfigObject.legendItems) {
            $scope.widget.legendConfig = JSON.stringify($scope.widgetBuilder.legendConfigObject.legendItems, null, 2);
        }
        if(angular.isObject($scope.widget.location)) {
            $scope.widget.location = JSON.stringify($scope.widget.location);
        }
        return $scope.widget;
    };

    $scope.next = function () {
        initCard(getNextCard());
    };

    $scope.back = function () {
        $scope.card = getPreviousCard();
        $scope.card.onBackClick();
    };

    function getNextCard() {
        var card = CARDS.items[CARDS.currentItem];
        if(! $scope.isLastCard()) {
            CARDS.currentItem++;
            card = CARDS.items[CARDS.currentItem];
            if (! isCardNeed(card)) {
                getNextCard();
                return CARDS.items[CARDS.currentItem];
            }
            return card;
        }
        return card;
    };

    $scope.isFirstCard = function () {
        return $scope.getCurrentCard() <= 0;
    };

    $scope.isLastCard = function () {
        return $scope.getCurrentCard() + 1 >= CARDS.items.length;
    };

    $scope.getCurrentCard = function () {
        return CARDS.currentItem;
    };

    function getPreviousCard() {
        var card = CARDS.items[CARDS.currentItem];
        if(! $scope.isFirstCard()) {
            CARDS.currentItem--;
            card = CARDS.items[CARDS.currentItem];
            if (! isCardNeed(card)) {
                getPreviousCard();
                return CARDS.items[CARDS.currentItem];
            }
            return card;
        }
    };

    function isCardNeed(card) {
        return !card.need || card.need($scope.widget.widgetTemplate, $scope.widget.id);
    };

    function initCard(card) {
        $scope.sc = {};
        $scope.card = card;
        CARDS.currentItem = card.index - 1;
        card.onLoad();
    };

    $scope.createWidgetMode = function() {
        $scope.widget = {};
        $scope.tempData.widget = {};
        var card = getNextCard();
        if(widget.id) {
            $scope.widget = angular.copy(widget);
            $scope.onChange().then(function (rs) {
                CARDS.currentItem = getNextCard().index - 1;
                initCard(card);
            });
        } else {
            initCard(card);
        }
    };

    $scope.backToWidgetsMode = function() {
        $scope.onWidgetChange();
        var card = getPreviousCard();
        initCard(card);
    };

    $scope.hide = function (action, widget) {
        $mdDialog.hide({"action": action, "widget": widget});
    };

    $scope.cancel = function () {
        $mdDialog.cancel();
    };

    (function initController() {
        if(widget.id) {
            $scope.widget = angular.copy(widget);
            $scope.onChange().then(function (rs) {
                CARDS.currentItem = getNextCard().index - 1;
                initCard(CARDS.items[CARDS.currentItem]);
            });
        } else {
            initCard(CARDS.items[CARDS.currentItem]);
        }
    })();
};

export default widgetWizardController;
