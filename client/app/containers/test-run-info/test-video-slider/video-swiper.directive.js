'use strict';

// import Swiper from 'swiper';
// Import Swiper and modules
import { Swiper, Navigation } from 'swiper/js/swiper.esm.js';

// Install modules
Swiper.use([Navigation]);

const videoSwiperDirective = function videoSwiper(
    $timeout,
) {
    'ngInject';

    return {
        restrict: 'A',
        scope: {
            swiperOptions: '<',
            onSliderChange: '&',
            activeSlideIndex: '<',
            slidesData: '<',
        },
        link: ($scope, $element) => {
            const swiperContainer = $element[0];
            let swiperInstance;

            $timeout(() => {
                initSwiper();
            }, 0);
            $scope.$on('$destroy', () => {
                destroySwiper();
            });
            $scope.$watch('activeSlideIndex', (newValue) => {
                if (swiperInstance && swiperInstance.activeIndex !== newValue) {
                    swiperInstance.slideTo(newValue);
                }
            });
            $scope.$watch('slidesData', (newValue, oldValue) => {
                if (newValue) {
                    if (newValue.length > 1) {
                        if (!swiperInstance) {
                            initSwiper();
                        } else {
                            swiperInstance.update();
                        }
                    } else {
                        destroySwiper();
                    }
                } else {
                    destroySwiper();
                }
            });

            function destroySwiper() {
                if (swiperInstance) {
                    swiperInstance.destroy();
                }
            }

            function initSwiper() {
                if (typeof Swiper !== 'function') { return; }

                swiperInstance = new Swiper(swiperContainer, $scope.swiperOptions);
                swiperInstance.on('slideChange', () => {
                    $scope.onSliderChange({ $indexes: {
                            activeIndex: swiperInstance.activeIndex,
                            previousIndex: swiperInstance.previousIndex,
                        }});
                });
            }
        },
    };
};

export default videoSwiperDirective;

