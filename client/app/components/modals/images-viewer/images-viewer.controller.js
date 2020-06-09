'use strict';

const ImagesViewerController = function ImagesViewerController(
    $scope,
    $mdDialog,
    $q,
    ArtifactService,
    $timeout,
    activeArtifactId,
    TestRunService,
    test,
    fullScreenService,
) {
    'ngInject';

    const local = {
        imgContainerCssClass: 'images-viewer__viewport',
        imgWrapperCssClass: 'images-viewer__img-wrapper',
        imgCssClass: 'images-viewer__img',
        imgCssActiveClass: '_active',
        zoom: {
            value: 1,
            min: 1,
            max: 5,
            step: 1,
            factor: 1.1
        },
        dimensions: null,
        container: null,
        imageWrapElem: null,
        lastZoomDelta: 0,
        destroyed: false,
    };
    const vm = {
        test: null,
        artifacts: [],
        mainSizesLoading: true,
        activeArtifactId: null,
        isFullScreenMode: false,
        setActiveArtifact,
        downloadImages,
        switchFullscreenMode,
        selectNextArtifact,
        selectPrevArtifact,
        closeModal,
        zoom,
        newActiveElem: null,
    };

    function downloadImages() {
        ArtifactService.downloadArtifacts({
            data: [vm.test],
            field: 'imageArtifacts',
        });
    }

    function setActiveArtifact(id, force) {
        if (vm.activeArtifactId === id && !force) { return; }

        const activeElem = document.getElementById(vm.activeArtifactId);
        vm.newActiveElem = document.getElementById(id);
        vm.activeArtifactId = id;
        activeElem && activeElem.classList.remove(local.imgCssActiveClass);
        vm.newActiveElem && vm.newActiveElem.classList.add(local.imgCssActiveClass);
    }

    function selectNextArtifact() {
        const currentIndex = vm.artifacts.findIndex(({id}) => id === vm.activeArtifactId);
        const nextIndex = currentIndex !== vm.artifacts.length - 1 ? currentIndex + 1 : 0;

        setActiveArtifact(vm.artifacts[nextIndex].id);
    }

    function selectPrevArtifact() {
        const currentIndex = vm.artifacts.findIndex(({id}) => id === vm.activeArtifactId);
        const lastIndex = vm.artifacts.length - 1;
        const nextIndex = currentIndex !== 0 ? currentIndex - 1 : lastIndex;

        setActiveArtifact(vm.artifacts[nextIndex].id);
    }

    function keyAction(keyCodeNumber) {
        var LEFT = 37,
            UP = 38,
            RIGHT = 39,
            DOWN = 40,
            ESC = 27,
            F_KEY = 70,
            S_KEY = 83;

        switch (keyCodeNumber) {
            case LEFT:
                vm.selectPrevArtifact();
                $scope.$apply();
                break;
            case UP:
                break;
            case RIGHT:
                vm.selectNextArtifact();
                $scope.$apply();
                break;
            case DOWN:
                break;
            case ESC:
                vm.closeModal();
                break;
            case F_KEY:
                vm.switchFullscreenMode();
                break;
            case S_KEY:
                vm.downloadImages([vm.test], 'imageArtifacts');
                break;
            default:
                break;
        }
    }

    function checkKeycode(event) {
        const keyDownEvent = event || window.event;
        const keycode = (keyDownEvent.which) ? keyDownEvent.which : keyDownEvent.keyCode;

        keyAction(keycode);

        return true;
    }

    function addKeydownListener() {
        document.addEventListener('keydown', checkKeycode);
    }

    function removeKeydownListener() {
        document.removeEventListener('keydown', checkKeycode);
    }

    function switchFullscreenMode(forceQuit) {
        if (vm.mainSizesLoading) { return; }

        if (!fullScreenService.isFullscreenActive() && !forceQuit) {  // current working methods
            fullScreenService.requestFullscreen(document.documentElement);
        } else {
            fullScreenService.exitFullscreen();
        }
    }

    function closeModal() {
        removeListeners();
        vm.isFullScreenMode && vm.switchFullscreenMode(true);
        $mdDialog.cancel();
        local.destroyed = true;
    }

    function initController() {
        vm.test = test;
        vm.artifacts = vm.test.imageArtifacts;
        vm.activeArtifactId = activeArtifactId;

        $timeout(() => {
            initGallery();
            registerListeners();
            loadImages();
        });
    }

    function registerListeners() {
        addKeydownListener();
        addFullscreenModeListener();
        addResizeListener();
    }

    function removeListeners() {
        removeKeydownListener();
        removeFullscreenModeListener();
        removeResizeListener();
    }

    function addResizeListener() {
        $(window).on('resize', resizeHandler);
    }

    function removeResizeListener() {
        $(window).off('resize', resizeHandler);
    }

    function addFullscreenModeListener() {
        $(document).on('mozfullscreenchange webkitfullscreenchange fullscreenchange', fullscreenModeChangeHandler);
    }

    function removeFullscreenModeListener() {
        $(document).off('mozfullscreenchange webkitfullscreenchange fullscreenchange', fullscreenModeChangeHandler);
    }

    function resizeHandler() {
        $timeout(() => {
            initSizes();
        }, 500);
    }

    function fullscreenModeChangeHandler() {
        vm.isFullScreenMode = !vm.isFullScreenMode;

        if (vm.isFullScreenMode) {
            document.body.classList.add('_modal-in-fullscreen');
        } else {
            document.body.classList.remove('_modal-in-fullscreen');
        }
        $timeout(() => {
            initSizes();
        }, 500);
    }

    function loadImages() {
        const $imgContainer = $(`.${local.imgWrapperCssClass}`);
        const promises = vm.artifacts.map((artifact, index) => {
            //if image is already loaded
            if (artifact.imageElem) {
                handleLoadedImage(artifact, index, $imgContainer);

                return $q.resolve(true);
            }

            return loadImage(artifact.link)
                .then((imageElem) => {
                    // $scope.testsss.imageArtifacts[index].imageElem = imageElem;
                    artifact.imageElem = imageElem;
                    handleLoadedImage(artifact, index, $imgContainer);
                    // return imageElem;

                    return true;
                })
                .catch(() => {
                    let icon = createBrokenIcon();

                    handleBrokenImage(icon, artifact, index, $imgContainer);
                })
        });

        return $q.all(promises);
    }

    function handleLoadedImage(artifact, index, $imgContainer) {
        getImagesDimentions(artifact.imageElem);
        artifact.imageElem.classList.add(local.imgCssClass);
        artifact.imageElem.setAttribute('id', artifact.id);

        if (vm.activeArtifactId) {
            artifact.id === vm.activeArtifactId && artifact.imageElem.classList.add(local.imgCssActiveClass);
        } else if (index === 0) {
            artifact.imageElem.classList.add(local.imgCssActiveClass);
            vm.activeArtifactId = artifact.id;
        }
        $timeout(() => {
            initSizes();
            $imgContainer.append(artifact.imageElem);

            if (!vm.newActiveElem) {
                vm.setActiveArtifact(vm.activeArtifactId, true);
            }
        }, 500)
    }

    function handleBrokenImage(icon, artifact, index, $imgContainer) {
        icon.setAttribute('id', artifact.id);
        if (vm.activeArtifactId) {
            artifact.id === vm.activeArtifactId && icon.classList.add(local.imgCssActiveClass);
        } else if (index === 0) {
            icon.classList.add('_active');
            vm.activeArtifactId = artifact.id;
        }
        $imgContainer.append(icon);

        if (!vm.newActiveElem) {
            vm.setActiveArtifact(vm.activeArtifactId, true);
        }
    }

    function createBrokenIcon() {
        let icon = document.createElement('i');
        icon.innerText = 'broken_image';

        icon.classList.add('material-icons');
        icon.classList.add(local.imgCssClass);

        return icon;
    }

    function loadImage(imageUrl) {
        const defer = $q.defer();
        const image = new Image();

        image.onload = () => {
            defer.resolve(image);
        };
        image.onerror = () => {
            defer.reject(image);
        };

        image.src = imageUrl;

        return defer.promise;
    }

    function getImagesDimentions(imgElem) {
        vm.mainSizesLoading = false;
        const imageWidth = imgElem.width;
        const imageHeight = imgElem.height;
        const imageRatio = precisionRound(imageHeight / imageWidth, 2);

        if (!local.dimensions || imageRatio > local.dimensions.imageRatio) {
            local.dimensions = {
                imageWidth,
                imageHeight,
                imageRatio,
            };
        }
    }

    function precisionRound(value, precision) {
        const factor = Math.pow(10, precision);

        return Math.round(value * factor) / factor;
    }

    function initGallery() {
        local.container = document.querySelector(`.${local.imgContainerCssClass}`);
        local.imageWrapElem = document.querySelector(`.${local.imgWrapperCssClass}`);
    }

    function initSizes() {
        const rect = local.container.getBoundingClientRect();
        const containerRatio = precisionRound(rect.height / rect.width, 2);

        local.dimensions.containerHeight = rect.height;
        local.dimensions.containerWidth = rect.width;

        switch(true) {
            case 1 > containerRatio && containerRatio > local.dimensions.imageRatio:
            case local.dimensions.imageRatio < 1 && 1 < containerRatio:
            case containerRatio > local.dimensions.imageRatio && local.dimensions.imageRatio > 1:
                local.dimensions.imageWrapElemWidth = rect.width;
                local.dimensions.imageWrapElemHeight = rect.width * local.dimensions.imageRatio;
                break;
            default:
                local.dimensions.imageWrapElemHeight = rect.height;
                local.dimensions.imageWrapElemWidth = rect.height / local.dimensions.imageRatio;
        }

        local.imageWrapElem.style.width = `${local.dimensions.imageWrapElemWidth}px`;
        local.imageWrapElem.style.height = `${local.dimensions.imageWrapElemHeight}px`;

    }

    function zoom(zoomIn) {
        if (vm.mainSizesLoading) { return; }

        const prevZoom = local.zoom.value;

        if (!zoomIn) {
            local.zoom.value /= local.zoom.factor;
        } else {
            local.zoom.value *= local.zoom.factor;
        }

        local.zoom.value = precisionRound(local.zoom.value, 2);
        local.zoom.value = clamp(local.zoom.value, local.zoom.min, local.zoom.max);
        changeZoom(precisionRound(local.zoom.value - prevZoom, 2));
    }

    function changeZoom(zoomDelta) {
        if (local.lastZoomDelta === zoomDelta) { return; }

        const rect = local.container.getBoundingClientRect();
        const imageWrapperRect = document.querySelector('.' + local.imgWrapperCssClass).getBoundingClientRect();
        let newWidth =  precisionRound(imageWrapperRect.width * (1 + zoomDelta), 2);
        let newHeight = precisionRound(imageWrapperRect.height * (1 + zoomDelta), 2);
        const scrollLeft = (newWidth - rect.width) / 2;
        const scrollTopOffset = imageWrapperRect.height * zoomDelta / 2;

        if (newWidth < local.dimensions.imageWrapElemWidth) {
            newWidth =  local.dimensions.imageWrapElemWidth;
            newHeight =  local.dimensions.imageWrapElemHeight;
            local.zoom.value = 1;
        }
        local.imageWrapElem.style.width = `${newWidth}px`;
        local.imageWrapElem.style.height = `${newHeight}px`;
        local.container.scrollLeft = scrollLeft;
        local.container.scrollTop = local.container.scrollTop + scrollTopOffset;

        vm.lastZoomDelta = zoomDelta;
    }

    function clamp(value, min, max) {
        return value < min ? min : (value > max ? max : value);
    }

    vm.$onInit = initController;

    return vm;
};

export default ImagesViewerController;
