'use strict';

import testRunCard from './test-run-card.directive';

import './test-run-card.scss'

export const testRunCardModule = angular.module('testRunCard', [])
    .directive({ testRunCard })
    .name;
