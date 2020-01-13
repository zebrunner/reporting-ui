import { tutorialsSliderComponent } from './tutorials-slider';
import { youtubeDirective } from './youtube.directive';
import { TutorialsProvider } from './tutorials.provider';
import { TutorialsRunner } from './tutorials.runner';

import './tutorials.styles.scss';

export const TutorialsModule = angular.module('tutorials', [
    'ngAnimate',
    'ui.router',
    'ngMaterial',
])

    .run(TutorialsRunner)
    .provider('Tutorials', TutorialsProvider)
    .component('tutorialsSlider', tutorialsSliderComponent)
    .directive('youtube', youtubeDirective)

    .name;
