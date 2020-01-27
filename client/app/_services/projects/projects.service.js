(function () {
    'use strict';

    angular.module('app.services')
        .service('projectsService', projectsService);

    function projectsService($cookies) {
        'ngInject';

        let _selectedProject;
        const service = {
            get selectedProject() { return getSelectedProject(); },
            set selectedProject(project) { return setSelectedProject(project); },
            resetSelectedProject,
        };

        function getSelectedProject() {
            if (typeof _selectedProject === 'undefined') {
                _selectedProject = $cookies.getObject('project');
            }

            return _selectedProject;
        }

        function setSelectedProject(project) {
            if (!project) {
                return resetSelectedProject();
            }

            _selectedProject = project;
            $cookies.putObject('project', _selectedProject);

            return true;
        }

        function resetSelectedProject() {
            _selectedProject = null;
            $cookies.remove('project');

            return true;
        }

        return service;
    }
})();
