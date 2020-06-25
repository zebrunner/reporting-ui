'use strict';

const testVideoSliderController = function testVideoSliderController(
    $timeout,
    fullScreenService,
) {
    'ngInject';

    return {
        swiperOptions: {
            allowTouchMove: false,
            initialSlide: 0,
            longSwipesMs: 500,
            mousewheel: {
                forceToAxis: true,
            },
            observer: true,
            observeParents: true,
            observeSlideChildren: true,
            shortSwipes: false,
            slidesPerView: 1,
            navigation: {
                nextEl: '.test-video-slider__nav-btn._next',
                prevEl: '.test-video-slider__nav-btn._prev',
                disabledClass: '_disabled',
                hiddenClass: '_hidden',
            },
        },

        onSliderChange,
        toggleVNCFullScreen,
    };

    function onSliderChange(e) {
        const prevDriver = this.drivers[e.previousIndex];

        $timeout(() => {
            handlePrevDriver(prevDriver);

            this.onDriverChange({
                $drivers: {
                    prevDriverIndex: e.previousIndex,
                    activeDriverIndex: e.activeIndex,
                },
            });
        }, 300); // 300 - is slider's default transition duration
    }

    // if there is a video, pause it
    function handlePrevDriver(driver) {
        if (!driver) { return; }

        if (driver.type === 'video') {
            const videoElem = document.querySelector(`#driver-${driver.id} video`);

            if (videoElem && !videoElem.paused) {
                videoElem.pause();
            }
        }
    }

    function toggleVNCFullScreen(e) {
        const vncElem = e.target.closest('.vnc-player');

        if (vncElem && fullScreenService.isFullscreenEnabled()) {
            if (!fullScreenService.isFullscreenActive()) {
                fullScreenService.requestFullscreen(vncElem);
            } else {
                fullScreenService.exitFullscreen();
            }
        }
    }
};

export default testVideoSliderController;
