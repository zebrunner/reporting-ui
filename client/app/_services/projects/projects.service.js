(function () {
    'use strict';

    angular.module('app.services')
        .service('projectsService', projectsService);

    function projectsService($cookieStore) {
        'ngInject';

        let _selectedProject;
        const service = {
            get selectedProject() { return getSelectedProject(); },
            set selectedProject(project) { return setSelectedProject(project); },
        }

        function getSelectedProject() {
            if (typeof _selectedProject === 'undefined') {
                _selectedProject = $cookieStore.get('project');
            }

            return _selectedProject;
        }

        function setSelectedProject(project) {
            if (!project) {
                return resetSelectedProject();
            }

            _selectedProject = project;
            $cookieStore.put('project', _selectedProject);

            return true;
        }

        function resetSelectedProject() {
            _selectedProject = null;
            $cookieStore.remove('project');

            return true;
        }

        return service;
    }
})();
