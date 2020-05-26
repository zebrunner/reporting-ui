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
        }
    };
    let _historyItems = [];
    const vm = {
        activeTestId: null,
        parentTestId: null,
        swiperContainer: null,
        timeMedian: 0,

        $onInit: controllerInit,
        getTimeDiff,
        onSlideClick,

        get isMobile() { return $mdMedia('xs'); },
        get executionHistory() { return _historyItems; },
        set executionHistory(data) {
            data = data || [];

            _historyItems = data;
            this.timeMedian = median(_historyItems.map((item) => (item.elapsed || 0)));
            _historyItems.forEach((item) => item.timeDiff = getTimeDiff(item.elapsed));
        },
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

    function getTimeDiff(time = 0) {
        let out = '';
        let diff = Math.floor(vm.timeMedian && time ?  time * 100 / vm.timeMedian : 0) - 100;

        if (diff) {
            const sign = diff < 0 ? '-' : '+';

            out = `${sign}${Math.abs(diff)}%`;
        }

        return out;
    }

    function median(values){
        if (!values.length) { return 0; }

        values.sort((a = 0, b = 0) => {
            return a - b;
        });

        const half = Math.floor(values.length / 2);

        if (values.length % 2) {
            return values[half];
        }

        return (values[half - 1] + values[half]) / 2.0;
    }

    return vm;
};

export default testExecutionHistoryController;
