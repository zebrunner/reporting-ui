export function TutorialsModalController($mdDialog, tutorials) {
    'ngInject';
    return {
        currentSlideIndex: 0,
        tutorials,

        get activeSlide() {
            return tutorials[this.currentSlideIndex];
        },

        cancel,
    };

    function cancel() {
        $mdDialog.cancel();
    }
}
