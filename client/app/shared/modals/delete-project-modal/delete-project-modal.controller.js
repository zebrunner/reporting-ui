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

    function initController() {
        vm.regex = `^${project.name}$`;
    }

    function deleteProject() {
        ProjectService.deleteProjectWithReassign(vm.project.id, vm.projectToReassign)
            .then((res) => {
                if(res.success) {
                    vm.closeModal();
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
