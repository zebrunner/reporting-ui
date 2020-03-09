'use strict';

const infiniteScrollDirective = function (
    $document,
    $window,
) {
    'ngInject';

    const options = {
        scrollThreshold: 150,
    };

    return {
        restrict: 'A',
        link: function($scope, $elem, $attrs) {
            let scrollableElemSelector = $attrs.scrollableElem;
            let scrollableElem;
            const onScroll = throttle(scrollHandler);

            if (scrollableElemSelector) {
                scrollableElem = $document[0].querySelector(scrollableElemSelector);
            }
            if (scrollableElem) {
                bindScrollWatchEvents(true);
            }

            $scope.$on('$destroy', function() {
                if (scrollableElem) {
                    bindScrollWatchEvents();
                }
            });

            // observing for changes if scrollable element selector was changed by resizing/orientation changing
            $attrs.$observe('scrollableElem', function(value){
                if (scrollableElemSelector !== value) {
                    scrollableElemSelector = value;

                    // change scrollableElem and rebind listeners
                    bindScrollWatchEvents();
                    scrollableElem = $document[0].querySelector(scrollableElemSelector);
                    bindScrollWatchEvents(true);
                }
            });

            function scrollHandler() {
                const distance = getElementBottomDistance();

                // distance will be small or even negative in the end of the scrolling
                if (distance <= options.scrollThreshold) {
                    // apply and eval
                    $scope.$apply(function() {
                        $scope.$eval($attrs.scrollCb);
                    });
                }
            }

            function bindScrollWatchEvents(isBind) {
                const addRemove = isBind ? 'addEventListener' : 'removeEventListener';

                scrollableElem[ addRemove ]('scroll', onScroll);
                $window[ addRemove ]('resize', onScroll);
            }

            function throttle(fn, threshold = 200) {
                let last, timeout;

                return function(...args) {
                    let now = +new Date();
                    const trigger = function() {
                        last = now;
                        fn.apply( this, args );
                    }.bind(this);
                    if (last && now < last + threshold) {
                        // hold on to it
                        clearTimeout(timeout);
                        timeout = setTimeout(trigger, threshold);
                    } else {
                        trigger();
                    }
                };
            }

            function getElementBottomDistance() {
                const bottom = scrollableElem.scrollHeight;
                const scrollY = scrollableElem.scrollTop + scrollableElem.clientHeight;

                return bottom - scrollY;
            }
        }
    };
};

export default infiniteScrollDirective;
