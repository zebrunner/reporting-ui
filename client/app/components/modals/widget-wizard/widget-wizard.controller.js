const widgetWizardController = function WidgetWizardController($scope, $mdDialog, $q, $location, $widget, $mapper, DashboardService, UtilService, projectsService, widget, dashboard, currentUserId, messageService) {

    'ngInject';

    $scope.START_MODE = widget && widget.id ? 'UPDATE' : 'NEW';
    var MODE = $scope.START_MODE === 'UPDATE' ? 'UPDATE' : 'ADD';

    const CARDS = {
        WIDGET_TEMPLATE: {
            index: 1,
            id: 'choose',
            title: 'Choose template',
            nextDisabled: function (form) {
                return !$scope.widget.widgetTemplate;
            },
            onLoad: function () {
                if(! $scope.templates) {
                    DashboardService.GetWidgetTemplates().then(function (rs) {
                        if (rs.success) {
                            $scope.templates = rs.data;
                        } else {
                            messageService.error(rs.message);
                        }
                    });
                }
            },
            scValue: 'name'
        },
        WIDGET: {
            index: 2,
            id: 'choose-create',
            title: 'Choose widget',
            nextDisabled: function (form) {
                return !$scope.widget.widgetTemplate;
            },
            onLoad: function () {
                if(! $scope.widgets) {
                    DashboardService.GetWidgets().then(function (rs) {
                        if (rs.success) {
                            $scope.widgets = rs.data.filter(function (widget) {
                                return widget.widgetTemplate && ! widget.widgetTemplate.hidden;
                            });
                            updateWidgetsToAdd();
                        } else {
                            messageService.error(rs.message);
                        }
                    });
                }
            },
            scValue: 'title'
        },
        CONFIG: {
            index: 3,
            stepCount: 1,
            id: 'set',
            title: 'Set parameters',
            nextDisabled: function (form) {
                return form.params.$invalid;
            },
            onLoad: function () {
                if(widget.id) {
                    initLegendConfigObject();
                }
            }
        },
        INFO: {
            index: 4,
            stepCount: 2,
            id: 'save',
            title: 'Save',
            nextDisabled: function (form) {
            },
            onLoad: function () {
                if(MODE === 'UPDATE') {
                    if(! DashboardService.dashboards.length) {
                        DashboardService.RetrieveDashboards().then(function (rs) {
                            $scope.dashboards = filterDashboards();
                        });
                    } else {
                        $scope.dashboards = filterDashboards();
                    }
                }
                initLegendConfigObject();
            }
        }
    };

    const CARDS_QUEUE = {
        QUEUE: {
            NEW: [CARDS.WIDGET_TEMPLATE, CARDS.WIDGET, CARDS.CONFIG, CARDS.INFO],
            UPDATE: [CARDS.WIDGET, CARDS.CONFIG, CARDS.INFO]
        },
        STORED_WAY: []
    };

    function filterDashboards() {
        return DashboardService.dashboards.filter(function (d) {
            return d.id !== dashboard.id && d.widgets && d.widgets.indexOfField('id', $scope.widget.id) !== -1;
        });
    };

    function initCard(card) {
        $scope.sc = {};
        card.onLoad();
        $scope.card = card;
    }

    $scope.getCardById = function(id) {
        $scope.widget = {};
        $scope.tempData.widget = {};
        const card = getCardById(id);
        initCard(card);
        CARDS_QUEUE.STORED_WAY = [card];
    };

    $scope.isCardWithId = function(id) {
        return $scope.card.id === id;
    };

    function getCardById(id) {
        const index = CARDS_QUEUE.QUEUE[$scope.START_MODE].indexOfField('id', id);
        return  CARDS_QUEUE.QUEUE[$scope.START_MODE][index];
    };

    $scope.clearSearch = function() {
        $scope.sc[$scope.card.scValue] = "";
    }

    $scope.next = function() {
        const nextCard = getNextCard();
        initCard(nextCard);
        return nextCard;
    };

    $scope.back = function () {
        const prevCard = getPreviousCard();
        initCard(prevCard);
        return prevCard;
    };

    function getNextCard() {
        if($scope.isLastCard()) {
            return $scope.card;
        }
        let currCardIndex = $scope.card ? CARDS_QUEUE.QUEUE[$scope.START_MODE].indexOfField('index', $scope.card.index) : -1;
        let nextCard;
        while(!nextCard || ($scope.card && $scope.card.stepCount === nextCard.stepCount)) {
            currCardIndex ++;
            nextCard = CARDS_QUEUE.QUEUE[$scope.START_MODE][currCardIndex];
        }
        CARDS_QUEUE.STORED_WAY.push(nextCard);
        return nextCard;
    };

    function getPreviousCard() {
        if($scope.isFirstCard()) {
            return $scope.card;
        }
        CARDS_QUEUE.STORED_WAY.pop();
        return CARDS_QUEUE.STORED_WAY[CARDS_QUEUE.STORED_WAY.length - 1]
    };

    $scope.isLastCard = function() {
        if(! $scope.card) {
            return false;
        }
        const lastCard = CARDS_QUEUE.QUEUE[$scope.START_MODE][CARDS_QUEUE.QUEUE[$scope.START_MODE].length - 1];
        return lastCard.index === $scope.card.index;
    };

    $scope.isFirstCard = function() {
        if($scope.card) {
            return false;
        }
        const firstCard = CARDS_QUEUE.QUEUE[$scope.START_MODE][0];
        return firstCard.index === $scope.card.index;
    };

    $scope.isNextButtonPresent = function() {
        return ! $scope.isLastCard();
    };

    $scope.isBackButtonPresent = function() {
        let cardIndices = $scope.START_MODE === 'NEW' ? [3, 4] : [4];
        return ! $scope.isFirstCard() && cardIndices.indexOf($scope.card.index) !== -1;
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

    $scope.addToDashboard = function() {
        $scope.hide('ADD', $scope.widget);
    };

    $scope.removeWidgetFromDashboard = function(widget) {
        const confirmedDelete = confirm('Would you like to remove widget "' + widget.title + '" from dashboard ?');
        if (confirmedDelete) {
            DashboardService.DeleteDashboardWidget(dashboard.id, widget.id).then(function (rs) {
                if(rs.success) {
                    dashboard.widgets.splice(dashboard.widgets.indexOfId(widget.id), 1);
                    const deletedWidgetIndex = $scope.widgets.indexOfField('id', widget.id);
                    $scope.widgets[deletedWidgetIndex].existing = false;
                    messageService.success('Widget was successfully deleted from dashboard');
                } else {
                    messageService.error(rs.message);
                }
            });
        }
    };

    $scope.deleteWidget = function (widget) {
        const confirmedDelete = confirm('Would you like to delete widget "' + widget.title + '" ?');
        if (confirmedDelete) {
            DashboardService.DeleteWidget(widget.id).then(function (rs) {
                if (rs.success) {
                    $scope.widgets.splice($scope.widgets.indexOfId(widget.id), 1);
                    if(dashboard.widgets.indexOfId(widget.id) >= 0) {
                        dashboard.widgets.splice(dashboard.widgets.indexOfId(widget.id), 1);
                    }
                    updateWidgetsToAdd();
                    messageService.success("Widget deleted");
                }
                else {
                    messageService.error(rs.message);
                }
            });
        }
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
                messageService.error(rs);
                reject();
            });
        });
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

    $scope.buildConfigs = function(form) {
        if(! form || form.$valid) {
            $scope.widget.widgetTemplate.chartConfig = replaceFontSize($scope.widget.widgetTemplate.chartConfig);
            $scope.executeWidget($scope.widget, dashboard.attributes);

            $scope.echartConfig.previousTemplate = $scope.echartConfig.currentTemplate ? $scope.echartConfig.currentTemplate : undefined;
            $scope.echartConfig.currentTemplate = $scope.widget.widgetTemplate;
            if ($scope.echartConfig.clear && $scope.echartConfig.previousTemplate && $scope.echartConfig.previousTemplate.type !== $scope.echartConfig.currentTemplate.type) {
                $scope.echartConfig.clear();
            }
            if ($scope.echartConfig.isDisposed && !$scope.echartConfig.isDisposed()) {
                $scope.echartConfig.dispose();
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

    $scope.executeWidget = function(widget, attributes, isTable) {

        isTable = isTable || widget.widgetTemplate ? widget.widgetTemplate.type === 'TABLE' : false;

        if(! $scope.widgetBuilder.paramsConfigObject) {
            $scope.widgetBuilder.paramsConfigObject = build($scope.widget, dashboard, currentUserId);
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
                } else if(widget.widgetTemplate.type === 'TABLE') {
                    columns = JSON.parse(widget.widgetTemplate.chartConfig).columns;
                }
                widget.widgetTemplate.model = isTable ? {"columns" : columns} : widget.widgetTemplate.chartConfig;
                widget.data = {
                    dataset: data
                };
            }
            else {
                messageService.error(rs.message);
            }
        });
    };

    function build(widget, dashboard, currentUserId) {
        let paramsConfigObject = $widget.build(widget, dashboard, currentUserId);
        enableInputs(paramsConfigObject);
        return paramsConfigObject;
    };

    function enableInputs(paramsConfigObject) {
        angular.forEach(paramsConfigObject, function (paramValue, paramName) {
            paramValue.input_enabled = paramValue.multiple ? !! paramValue.value && !! paramValue.value.length : ['title'].indexOf(paramValue.type) !== -1 ? false : !! paramValue.value;
        });
    };

    $scope.hasEmptyOptionalParams = function (revert) {
        var result = false;
        angular.forEach($scope.widgetBuilder.paramsConfigObject, function (value, key) {
            var predicate = revert ? value.input_enabled === true : value.input_enabled === false;
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
                messageService.success('Widget was created');
                $scope.hide('CREATE', rs.data);
            } else {
                messageService.error(rs.message);
            }
        });
    };

    $scope.updateWidget = function () {
        var widgetType = prepareWidget();
        Reflect.deleteProperty($scope.widget, "model");
        DashboardService.UpdateWidget(widgetType).then(function (rs) {
            if(rs.success) {
                if(MODE === 'ADD') {
                    messageService.success('Widget was added');
                    $scope.hide('ADD', rs.data);
                } else {
                    messageService.success('Widget was updated');
                    $scope.hide('UPDATE', rs.data);
                }
            } else {
                messageService.error(rs.message);
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

    $scope.hide = function (action, widget) {
        $mdDialog.hide({"action": action, "widget": widget});
    };

    $scope.cancel = function () {
        $mdDialog.cancel();
    };

    (function initController() {
        if($scope.START_MODE === 'UPDATE') {
            $scope.card = getCardById('set');
            CARDS_QUEUE.STORED_WAY.push($scope.card);
            $scope.widget = angular.copy(widget);
            $scope.onChange().then(function (rs) {
                initCard($scope.card);
            });
        } else {
            $scope.next();
        }
    })();

};

export default widgetWizardController;
