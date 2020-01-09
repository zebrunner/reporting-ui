export default function TutorialsSliderController() {
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
    };

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
    }
}
