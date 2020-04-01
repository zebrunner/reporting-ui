'use strict'

const blurfiltertDirective = function() {
    'ngInject';

    return {
        restrict: 'A',
        link: function($scope, $elem, $attrs) {
            const blurRadius = $attrs.blurRadius || '1px';
            const targetElement = $elem[0];

            $attrs.$observe('blurActive', function(value){
                if (value === 'true') {
                    targetElement.style.filter = `blur(${blurRadius})`;
                    targetElement.classList.add('_blur-active');
                } else {
                    targetElement.style.filter = null;
                    targetElement.classList.remove('_blur-active');
                }
            })
        }
    }
}

export default blurfiltertDirective;
