(function () {
    'use strict';

    angular.module('app.services')
        .service('projectsService', projectsService);

    function projectsService() {
        'ngInject';

        let _selectedProject;
        const service = {
            get selectedProject() { return getSelectedProject(); },
            set selectedProject(project) { return setSelectedProject(project); },
            resetSelectedProject,
        };

        function getSelectedProject() {
            if (typeof _selectedProject === 'undefined' && localStorage.getItem('project')) {
                _selectedProject = JSON.parse(localStorage.getItem('project'));
            }

            return _selectedProject;
        }

        function setSelectedProject(project) {
            if (!project) {
                return resetSelectedProject();
            }

            _selectedProject = project;
            localStorage.setItem('project', JSON.stringify(_selectedProject));

            return true;
        }

        function resetSelectedProject() {
            _selectedProject = null;
            localStorage.removeItem('project');

            return true;
        }

        return service;
    }
})();
