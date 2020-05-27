'use strict';

import Swiper from 'swiper';

const testExecutionHistoryController = function testExecutionHistoryController(
    $mdMedia,
    $timeout,
    UtilService,
) {
    'ngInject';

    const swiperOptions = {
        freeMode: true,
        initialSlide: 0,
        longSwipesMs: 500,
        mousewheel: {
            forceToAxis: true,
        },
        observer: true,
        shortSwipes: false,
        slidesPerView: 'auto',

        on: {
            click: swiperClickHandler,
        },
    };
    const vm = {
        activeTestId: null,
        executionHistory: [],
        parentTestId: null,
        swiperContainer: null,
        timeMedian: 0,

        $onInit: controllerInit,
        onSlideClick,

        get isMobile() { return $mdMedia('xs'); },
    };

    function controllerInit() {
        $timeout(() => {
            vm.swiperContainer = document.querySelector('.swiper-container');
            initSwiper();
        }, 0);
    }

    function swiperClickHandler(e) {
        const slideElem = e.target.closest('.swiper-slide');

        if (slideElem) {
            const id = parseInt(slideElem.getAttribute('id'), 10);
            const historyItem = vm.executionHistory.find(({ testId }) => testId === id);

            if (historyItem) {
                onSlideClick(historyItem);
            }
        }
    }

    function onSlideClick(historyItem) {
        if (historyItem.testId === vm.activeTestId) { return; }

        vm.onTestSelect({ $historyItem: historyItem });
    }

    function initSwiper() {
        if (!vm.swiperContainer || typeof Swiper !== 'function') { return; }

        swiperOptions.initialSlide = vm.executionHistory.length ? vm.executionHistory.length - 1 : 0;
        swiperOptions.navigation = !UtilService.isTouchDevice() ? {
            nextEl: '.swiper-nav-btn._next',
            prevEl: '.swiper-nav-btn._prev',
            disabledClass: '_disabled',
        } : {};
        vm.swiper = new Swiper(vm.swiperContainer, swiperOptions);
    }

    return vm;
};

export default testExecutionHistoryController;
