export default function TutorialsSliderController() {
    'ngInject';

    return {
        slides: null,
        slideIndex: 0,
        changeSlide,
        get transform() {
            return `translateX(-${this.slideIndex * 100}%)`;
        },

        prev() {
            const newIndex = this.slideIndex - 1;
            this.changeSlide(newIndex < 0 ? this.slides.length - 1 : newIndex);
        },
        next() {
            this.changeSlide((this.slideIndex + 1) % this.slides.length);
        },
    };

    function changeSlide(index) {
        this.slideIndex = index;
        this.change({index: this.slideIndex});
    }
}
