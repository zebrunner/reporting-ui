export function CompanySettingsProvider() {
    const local = {
        companyLogo: {
            name: 'COMPANY_LOGO_URL',
            value: '',
        }
    };

    return {
        initCompanyLogo() {
            if (localStorage.getItem('companyLogoUrl')) {
                local.companyLogo.value = localStorage.getItem('companyLogoUrl');
            }
        },
        $get(
            $httpMock,
            UtilService,
        ) {
            'ngInject';

            return {
                fetchCompanyLogo,
                updateCompanyLogo,

                get companyLogoUrl() {
                    // to support old absolute path and new relative
                    // if url isn't relative and apiHost is specified add this host
                    if (!local.companyLogo.value.startsWith('http') && $httpMock.apiHost) {
                        return `${$httpMock.apiHost}${local.companyLogo.value}`;
                    }

                    return local.companyLogo.value;
                },
                set companyLogoUrl(url) {
                    local.companyLogo.value = url;
                    storeCompanyLogoUrl();
                },
                get companyLogo() { return local.companyLogo; },
                set companyLogo(logoData) {
                    local.companyLogo = logoData;
                    storeCompanyLogoUrl();
                },
            };

            function fetchCompanyLogo() {
                return $httpMock.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/settings/companyLogo`)
                    .then(UtilService.handleSuccess, UtilService.handleError('Unable to get company logo URL'));
            }

            function updateCompanyLogo(logoData) {
                return $httpMock.put(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/settings`, logoData)
                    .then(UtilService.handleSuccess, UtilService.handleError('Unable to update company logo'));
            }

            function storeCompanyLogoUrl() {
                if (local.companyLogo.value) {
                    localStorage.setItem('companyLogoUrl', local.companyLogo.value);
                } else {
                    localStorage.removeItem('companyLogoUrl');
                }
            }
        }
    };
}
