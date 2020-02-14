export default function SessionsSwitcherController() {
    'ngInject';

    const vm = {
        switcherState: 'runs',
        toggleTestsView,
    };

    function toggleTestsView() {
        return vm.onChange({ $value: vm.switcherState });
    }

    return vm;
}
