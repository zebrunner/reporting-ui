(function () {
    'use strict';

    angular
        .module('app.services')
        .service('DashboardService', DashboardService);

    function DashboardService(
        $httpMock,
        $q,
        UtilService,
        authService,
        ) {

        'ngInject';

        let dashboards = [];

        const service = {

            GetDashboards: GetDashboards,
            RetrieveDashboards: RetrieveDashboards,
            GetDashboardByTitle: GetDashboardByTitle,
            CreateDashboard: CreateDashboard,
            UpdateDashboard: UpdateDashboard,
            UpdateDashboardOrders: UpdateDashboardOrders,
            DeleteDashboard: DeleteDashboard,
            CreateDashboardAttribute: CreateDashboardAttribute,
            CreateDashboardAttributes: CreateDashboardAttributes,
            UpdateDashboardAttribute: UpdateDashboardAttribute,
            DeleteDashboardAttribute: DeleteDashboardAttribute,
            GetDashboardById: GetDashboardById,
            AddDashboardWidget: AddDashboardWidget,
            UpdateDashboardWidget: UpdateDashboardWidget,
            UpdateDashboardWidgets: UpdateDashboardWidgets,
            DeleteDashboardWidget: DeleteDashboardWidget,
            SendDashboardByEmail: SendDashboardByEmail,
            GetWidgets: GetWidgets,
            CreateWidget: CreateWidget,
            UpdateWidget: UpdateWidget,
            DeleteWidget: DeleteWidget,
            ExecuteWidgetSQL: ExecuteWidgetSQL,

            GetWidgetTemplates: GetWidgetTemplates,
            PrepareWidgetTemplate: PrepareWidgetTemplate,
            ExecuteWidgetTemplateSQL: ExecuteWidgetTemplateSQL,

            get dashboards() {
                return dashboards;
            },
            set dashboards(data) {
                dashboards = data;
            }
        };

        return service;

        function GetDashboards(hidden) {
            var config = { params : {} };
            if(hidden)
                config.params.hidden = hidden;
         	return $httpMock.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/dashboards`, config)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to load dashboards'));
        }

        function GetDashboardByTitle(title) {
            const config = { params : {} };
            if (title) {
                config.params.title = title;
            }

            return $httpMock.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/dashboards/title`, config)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to load dashboards'));
        }

        function CreateDashboard(dashboard) {
            return $httpMock.post(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/dashboards`, dashboard)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to create dashboard'));
        }

        function UpdateDashboard(dashboard) {
            return $httpMock.put(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/dashboards'`, dashboard)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to update dashboard'));
        }

        function UpdateDashboardOrders(positions) {
            return $httpMock.put(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/dashboards/order`, positions)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to update dashboards order'));
        }

        function DeleteDashboard(id) {
            return $httpMock.delete(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/dashboards/${id}`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to delete dashboard'));
        }

        function CreateDashboardAttribute(dashboardId, attribute) {
            return $httpMock.post(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/dashboards/${dashboardId}/attributes`, attribute)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to create dashboard attribute'));
        }

        function CreateDashboardAttributes(dashboardId, attributes) {
            return $httpMock.post(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/dashboards/${dashboardId}/attributes/queries`, attributes)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to create dashboard attributes'));
        }

        function UpdateDashboardAttribute(dashboardId, attribute) {
            return $httpMock.put(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/dashboards/${dashboardId}/attributes`, attribute)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to update dashboard attribute'));
        }

        function DeleteDashboardAttribute(dashboardId, attributeId) {
            return $httpMock.delete(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/dashboards/${dashboardId}/attributes/${attributeId}`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to delete dashboard attribute'));
        }

        function GetDashboardById(id) {
        	return $httpMock.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/dashboards/${id}`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to load dashboard'));
        }

        function AddDashboardWidget(dashboardId, widget) {
            return $httpMock.post(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/dashboards/${dashboardId}/widgets`, widget)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to add widget to dashboard'));
        }

        function UpdateDashboardWidget(dashboardId, widget) {
            return $httpMock.put(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/dashboards/${dashboardId}/widgets`, widget)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to update widget on dashboard'));
        }

        function UpdateDashboardWidgets(dashboardId, widgets) {
            return $httpMock.put(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/dashboards/${dashboardId}/widgets/all`, widgets)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to update widgets on dashboard'));
        }

        function DeleteDashboardWidget(dashboardId, widgetId) {
            return $httpMock.delete(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/dashboards/${dashboardId}/widgets/${widgetId}`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to delete widget from dashboard'));
        }

        function SendDashboardByEmail(multipart, email) {
            const config = { headers: { 'Content-Type': undefined }, transformRequest : angular.identity };

            multipart.append('email', new Blob([JSON.stringify(email)], { type: 'application/json' }));

            return $httpMock.post(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/dashboards/email?file=`, multipart, config)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to send dashboard by email'));
        }

        function GetWidgets() {
        	return $httpMock.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/widgets`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to load widgets'));
        }

        function CreateWidget(widget) {
            return $httpMock.post(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/widgets`, widget)
                .then(UtilService.handleSuccess, (response) => UtilService.handleCreateWidgetError(response));
        }

        function UpdateWidget(widget) {
            return $httpMock.put(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/widgets`, widget)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to update widget'));
        }

        function DeleteWidget(id) {
            return $httpMock.delete(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/widgets/${id}`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to delete widget'));
        }

        function ExecuteWidgetSQL(params, sqlAdapter) {
        	return $httpMock.post(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/widgets/sql${params}`, sqlAdapter)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to load chart'));
        }

        function GetWidgetTemplates() {
            return $httpMock.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/widgets/templates`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to load widget templates'));
        }

        function PrepareWidgetTemplate(id) {
            return $httpMock.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/widgets/templates/${id}/prepare`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to prepare widget template'));
        }

        function ExecuteWidgetTemplateSQL(queryParams, sqlTemplateAdapter) {
            const url = UtilService.buildURL(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/widgets/templates/sql`, queryParams);

            return $httpMock.post(url, sqlTemplateAdapter)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to load chart'));
        }

        function RetrieveDashboards(hidden) {
            return $q(function (resolve, reject) {
                if (hidden || hasHiddenDashboardPermission()) {
                    GetDashboards().then(function (rs) {
                        if (rs.success) {
                            dashboards = rs.data;
                            resolve(dashboards);
                        } else {
                            reject(rs.message);
                        }
                    });
                }
                else {
                    GetDashboards(true).then(function (rs) {
                        if (rs.success) {
                            dashboards = rs.data;
                            resolve(dashboards);
                        } else {
                            reject(rs.message);
                        }
                    });
                }
            });
        }

        function hasHiddenDashboardPermission(){
            return authService.userHasAnyPermission(['VIEW_HIDDEN_DASHBOARDS']);
        }

    }
})();
