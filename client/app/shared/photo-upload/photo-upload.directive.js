'use strict';

import template from './photo-upload.html';

const photoUploadDirective = function (
    $timeout,
    messageService,
) {
    'ngInject';

    return {
        restrict: 'E',
        template,
        require: 'ngModel',
        replace: true,
        transclude: true,
        scope: {
            ngModel: '=',
            areaType: '@',
            otherType: '@',
            acceptType: '@',
        },
        link: function ($scope, iElement, iAttrs, ngModel) {
            const inputElement = iElement[0].querySelector('input[type="file"]');
            let canRecognize = false;

            if (!inputElement) {
                console.warn('Missed required input element');
                return;
            }

            $scope.myImage = '';
            $scope.myCroppedImage = '';
            $scope.fileName = '';

            function handleFileSelect(evt) {
                const file = evt.currentTarget.files[0];

                // handle as image by default
                if(!$scope.otherType) {
                    // Allowed only .PNG, JPG images 2Mb max
                    if ($scope.acceptType && !$scope.acceptType.split(/,\s*/).includes(file.type) || file.size > 2097152) {
                        messageService.error('Use .PNG, .JPG images 2Mb max');
                        resetState();

                        return;
                    }
                    const reader = new FileReader();

                    $scope.fileName = file.name;
                    reader.onload = function (evt) {
                        $scope.imageLoading = true;
                        $scope.$apply(function($scope){
                            $scope.myImage=evt.target.result;
                        });
                        $scope.imageLoading = false;
                    };
                    reader.readAsDataURL(file);
                } else {
                    const reader = new FileReader();

                    $scope.fileName = file.name;
                    reader.onload = function (evt) {
                        $scope.$apply(function($scope){
                            $scope.file=evt.target.result;
                        });
                        ngModel.$setViewValue(fileToFormData(file));
                    };
                    reader.readAsText(file);
                }
            }

            function resetState() {
                inputElement.value = '';
                $scope.fileName = 'Click or drop here';
            }

            $timeout(function () {
                angular.element(inputElement).on('change',handleFileSelect);
            }, 100);

            function dataURItoBlob(dataURI) {
                var binary = atob(dataURI.split(',')[1]);
                var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
                var array = [];
                for(var i = 0; i < binary.length; i++) {
                    array.push(binary.charCodeAt(i));
                }
                return new Blob([new Uint8Array(array)], {type: mimeString});
            }

            function textToBlob(data) {
                return new Blob([data], { type: 'application/json' });
            }

            function blobToFormData() {
                var formData = new FormData();
                var croppedImage = dataURItoBlob($scope.myCroppedImage);
                formData.append('file', croppedImage, $scope.fileName);
                return formData;
            }

            function fileToFormData(file) {
                var formData = new FormData();
                var blobFile = textToBlob(file);
                formData.append('file', blobFile, $scope.fileName);
                return formData;
            }

            $scope.onChange = function (event) {
                if(canRecognize) {
                    $timeout(function () {
                        ngModel.$setViewValue(blobToFormData());
                    }, 0);
                }
            };

            $scope.onDone = function () {
                canRecognize = true;
                $scope.onChange();
            };
        }
    };
};

export default photoUploadDirective;
