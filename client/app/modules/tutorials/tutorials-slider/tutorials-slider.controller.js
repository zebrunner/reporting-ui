export default function TutorialsSliderController($scope, $window) {
    'ngInject';

    return {
        slides: null,
        slideIndex: 0,

        get activeSlide() {
            return this.slides && this.slides[this.slideIndex];
        },

        get transform() {
            return `translateX(-${this.slideIndex * 100}%)`;
        },

        changeSlide,
        prev,
        next,

        $onInit() {
            $window.addEventListener('keyup', arrowsHandler.bind(this));
        },

        $onDestroy() {
            $window.removeEventListener('keyup', arrowsHandler);
        },
    };

    function arrowsHandler(event) {
        // 37 - leftArrow
        // 39 - rightArrow
        const keyCode = event.which || event.keyCode;

        $scope.$apply(() => {
            switch (keyCode) {
                case 37: return this.prev();
                case 39: return this.next();
            }
        });
    }

    function prev() {
        const newIndex = this.slideIndex - 1;
        this.changeSlide(newIndex < 0 ? this.slides.length - 1 : newIndex);
    }

    function next() {
        this.changeSlide((this.slideIndex + 1) % this.slides.length);
    }

    function changeSlide(index) {
        this.slideIndex = index;
        this.change({index: this.slideIndex});
        $scope.$broadcast('slide-changed', index);
    }
}
