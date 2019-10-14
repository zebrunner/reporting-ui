'use strict';

import toolsService from './tools/tools.service';
import progressbarService from './progressbar/progressbar.service';
import messageService from './messages/message.service';
import mainMenuService from './main-menu/main-menu.service';
import ArtifactService from './artifact.service';

angular.module('app.services', [])
    .service({ ArtifactService})
    .service({ toolsService })
    .service({ messageService })
    .service({ mainMenuService })
    .service({ progressbarService });

require('./auth.intercepter');
require('./utils/HttpMockResolver');
require('./utils/TableExpandUtil');
require('./utils/testrun.storage');
require('./utils/widget.util');
require('./window-width/window-width.service');
require('./auth.service');
require('./certification.service');
require('./config.service');
require('./dashboard.service');
require('./download.service');
require('./filter.service');
require('./group.service');
require('./invitation.service');
require('./job.service');
require('./launcher.service');
require('./modals.service');
require('./permission.service');
require('./project.service');
require('./utils/mapper.util');
require('./scm.service');
require('./setting.provider');
require('./setting.service');
require('./slack.service');
require('./test.service');
require('./testcase.service');
require('./testrun.service');
require('./testsruns.service');
require('./integrations.service');
require('./upload.service');
require('./user.service');
require('./util.service');
require('./view.service');
require('./projects/projects.service');
