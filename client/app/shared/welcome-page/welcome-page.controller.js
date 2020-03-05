export default function welcomePageController($state,
    UserService,
    windowWidthService,
    messageService,
    pageTitleService,
    ) {
    'ngInject'

    const vm = {
        onViewChange,
        switcherState: 'runs',
        showRunsCardContent: false,
        showSessionsCardContent: false,

        get currentTitle() { return pageTitleService.pageTitle },
        get currentUser() { return UserService.currentUser; },
        get isMobile() { return windowWidthService.isMobile(); },
    }

    function onViewChange(state) {
        const param = {name: 'DEFAULT_TEST_VIEW', value: state};
        const prevState = vm.switcherState;

        return UserService.updateUserPreference(UserService.currentUser.id, param).then(rs => {
            if (rs.success) {
                UserService.currentUser.testsView = state;
                $state.go(`tests.${state}`);
            } else {
                vm.switcherState = prevState;
                messageService.error(rs.message);
            }
        });
    }

    return vm;
}