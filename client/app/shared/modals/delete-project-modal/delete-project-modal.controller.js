const deleteProjectModalController = function deleteProjectModalController($mdDialog, project, projects, ProjectService, messageService) {
    'ngInject';

    const vm = {
        closeModal,
        project,
        projects,
        projectToReassign: null,
        projectToDelete: null,
        deleteProject,
    };

    function closeModal() {
        $mdDialog.cancel();
    }

    function hide(rs) {
        $mdDialog.hide(rs);
    };

    function initController() {
        vm.regex = `^${project.name}$`;
    }

    function deleteProject() {
        ProjectService.deleteProject(vm.project.id, vm.projectToReassign)
            .then((res) => {
                if(res.success) {
                    hide(project.id);
                    messageService.success(`Project ${project.name} removed`);
                } else {
                    messageService.error(res.message);
                }
            })
    }

    vm.$onInit = initController;

    return vm;
};

export default deleteProjectModalController;
