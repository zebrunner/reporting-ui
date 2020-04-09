'use strict';

export default function welcomePageController (
    $mdMedia,
    $state,
    UserService,
    messageService,
    pageTitleService,
) {
    'ngInject';

    const vm = {
        onViewChange,
        switcherState: 'runs',
        showRunsCardContent: false,
        showSessionsCardContent: false,

        get currentTitle() { return pageTitleService.pageTitle; },
        get isMobile() { return $mdMedia('xs'); },
    };

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
