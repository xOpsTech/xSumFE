import React, {Fragment} from 'react';

import LoadingScreen from '../../common/loading-screen/LoadingScreen';
import ErrorMessageComponent from '../../common/error-message-component/ErrorMessageComponent';
import NavContainer from '../../common/nav-container/NavContainer';
import LeftNav from '../../common/left-nav/LeftNav';
import userApi from '../../../api/userApi';
import tenantApi from '../../../api/tenantApi';

import * as AppConstants from '../../../constants/AppConstants';
import * as Config from '../../../config/config';
import * as UIHelper from '../../../common/UIHelper';
import * as MessageConstants from '../../../constants/MessageConstants';

/* eslint-disable no-unused-vars */
import Styles from './SettingsStyles.less';
/* eslint-enable no-unused-vars */

class SettingsView extends React.Component {
    constructor(props) {
        super(props);

        this.updateMailClick = this.updateMailClick.bind(this);
        this.redirectToAddUser = this.redirectToAddUser.bind(this);
        this.leftNavStateUpdate = this.leftNavStateUpdate.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.dropDownClick = this.dropDownClick.bind(this);
        this.tenantDropDown = this.tenantDropDown.bind(this);

        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    componentDidMount() {
        document.title = 'Settings - ' + AppConstants.PRODUCT_NAME;
        document.getElementById("background-video").style.display = 'none';
    }

    componentWillMount() {
        var siteLoginCookie = UIHelper.getCookie(AppConstants.SITE_LOGIN_COOKIE);

        if (siteLoginCookie) {
            var loggedUserObject = JSON.parse(siteLoginCookie);
            this.setState({loggedUserObj: loggedUserObject});

            this.getLoggedUserData(loggedUserObject);
        } else {
            UIHelper.redirectTo(AppConstants.LOGIN_ROUTE);
        }

        this.setState({isLeftNavCollapse: UIHelper.getLeftState()});
    }

    // Returns initial props
    getInitialState() {
        var initialState = {
            isLoading: false,
            loadingMessage: '',
            loggedUserObj: null,
            isLeftNavCollapse: false,
            tenantList: [],
            selectedTenant: {
                email: {value: '', error: {}},
                password: {value: '', error: {}},
                name: {value: '', error: {}},
                warning_alert_count: { value: '', error: {}},
                critical_alert_count: { value: '', error: {}}
            },
            selectedTenantIndex: 0
        };

        return initialState;
    }

    getLoggedUserData(loggedUserObj) {
        UIHelper.getUserData(loggedUserObj, this, this.getAllTenantsData);
    }

    getAllTenantsData(user, context) {
        var urlToGetTenantData = Config.API_URL + AppConstants.GET_TENANT_DATA_API;

        if (user.isSuperUser) {
            urlToGetTenantData = Config.API_URL + AppConstants.GET_ALL_USERS_WITH_TENANTS_API;
        }
        context.setState({isLoading: true, loadingMessage: MessageConstants.FETCHING_TENANTS});
        tenantApi.getAllTenantsFrom(urlToGetTenantData, {userID: user._id}).then((data) => {

            var tenantList = [];

            for (var i = 0; i < data.length; i++) {
                var tenant = data[i];
                tenant.email = {value: data[i].email, error: {}};
                tenant.password = {value: '', error: {}};
                tenant.name = {value: data[i].name, error: {}};
                tenant.warning_alert_limit = {value: '', error: {}};
                tenant.critical_alert_limit = {value: '', error: {}};
                tenantList.push(tenant);
            }

            if (user.isSuperUser) {
                var selectedTenantID = UIHelper.getLocalStorageValue(AppConstants.SELECTED_TENANT_ID);
                var selectedTenant;
                var selectedTenantIndex = 0;

                if (selectedTenantID) {

                    for (let tenant of data) {

                        if (tenant._id === selectedTenantID) {
                            selectedTenant = tenant;
                            break;
                        }

                        selectedTenantIndex++;
                    }

                } else {
                    selectedTenant = data[0];
                }

                context.setState (
                    {
                        isLoading: false,
                        loadingMessage: '',
                        selectedTenant: selectedTenant,
                        selectedTenantIndex: selectedTenantIndex,
                        tenantList: data
                    }
                );

            } else {

                context.setState (
                    {
                        isLoading: false,
                        loadingMessage: '',
                        tenantList: tenantList,
                        selectedTenant: tenantList[0]
                    }
                );

            }

        });
    }

    handleChange(e, stateObj) {
        e.preventDefault();
        this.setState(stateObj);
    }

    updateMailClick(e) {
        e.preventDefault();

        this.setState({isLoading: true, loadingMessage: MessageConstants.UPDATE_TENANT});
        var {selectedTenant, loggedUserObj} = this.state;

        var emailSettingToInsert = {
            id: selectedTenant._id,
            email: selectedTenant.email.value,
            password: selectedTenant.password.value,
            name: selectedTenant.name.value,
            warning_alert_limit: selectedTenant.warning_alert_limit.value,
            critical_alert_limit: selectedTenant.critical_alert_limit.value
        };

        var urlToUpdateTenant = Config.API_URL + AppConstants.ADD_TENANT_EMAIL_SETTING_DATA_API;
        tenantApi.saveTenant(urlToUpdateTenant, emailSettingToInsert).then((response) => {
            this.setState(
                {
                    isLoading: false,
                    loadingMessage: '',
                }
            );
        });
    }

    redirectToAddUser() {
        UIHelper.redirectTo(AppConstants.USER_VIEW_ROUTE, {});
    }

    leftNavStateUpdate() {
        this.setState({isLeftNavCollapse: !this.state.isLeftNavCollapse});
    }

    dropDownClick(stateObject) {
        this.setState(stateObject);
    }

    tenantDropDown(stateObject, selectedIndex) {
        this.state.loggedUserObj.isSuperUser &&
            UIHelper.setLocalStorageValue(AppConstants.SELECTED_TENANT_ID, stateObject.selectedTenant._id);
        let selectedTenantObj = {
            selectedTenantIndex: parseInt(selectedIndex),
            selectedTenant: {
                _id: stateObject.selectedTenant._id,
                email: {value: stateObject.selectedTenant.email, error: {}},
                password: {value: '', error: {}},
                name: {value: stateObject.selectedTenant.name, error: {}},
                warning_alert_count: {value: '', error: {}},
                critical_alert_count: {value: '', error: {}}
            }
        };
        this.setState(selectedTenantObj);
    }

    render() {
        const {
            isLoading,
            loadingMessage,
            loggedUserObj,
            isLeftNavCollapse,
            tenantList,
            selectedTenant,
            selectedTenantIndex
        } = this.state;

        return (
            <Fragment>
                <LoadingScreen isDisplay={isLoading} message={loadingMessage}/>
                <LeftNav
                    selectedIndex={AppConstants.SETTINGS_INDEX}
                    isFixedLeftNav={true}
                    leftNavStateUpdate={this.leftNavStateUpdate}
                    isSubSectionExpand={true}/>
                {
                    (loggedUserObj)
                        ? <NavContainer
                              loggedUserObj={loggedUserObj}
                              isFixedNav={true}
                              tenantDropDown={this.tenantDropDown}/>
                        : <div className="sign-in-button">
                              <button onClick={() => {UIHelper.redirectTo(AppConstants.LOGIN_ROUTE);}}
                                  className="btn btn-primary btn-sm log-out-drop-down--li--button">
                                  Sign in
                              </button>
                          </div>
                }
                <div className="site-edit-container">
                    <div className = {
                        'table-container-div ' +
                        ((isLeftNavCollapse) ? 'collapse-left-navigation' : 'expand-left-navigation')}>
                        <div className="row alert-list-wrap-div">
                            <h1 className="site-add-title">
                                Settings
                            </h1>
                        </div>

                        <div className="row alert-list-wrap-div settings-section">
                            <div className="row">
                                <div className="col-sm-3 alert-label-column section-head">
                                    <h4 className="site-add-title">
                                        Account Settings
                                    </h4>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-sm-3 alert-label-column">
                                    <div className="form-group label-text">
                                        <label className="control-label">Account ID</label>
                                    </div>
                                </div>
                                <div className="col-sm-9">
                                    <div className="form-group">
                                        <select className="form-control form-control-sm form-group"
                                            value={selectedTenantIndex}
                                            onChange={(e) => this.dropDownClick(
                                                {
                                                    selectedTenant: tenantList[e.target.value],
                                                    selectedTenantIndex: e.target.value
                                                })
                                            }>
                                            {
                                                tenantList.map((tenant, i) => {
                                                    return <option key={'tenant_' + i} value={i}>
                                                                {tenant._id}
                                                           </option>;
                                                })
                                            }
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-sm-3 alert-label-column">
                                    <div className="form-group label-text">
                                        <label className="control-label">Account Name</label>
                                    </div>
                                </div>
                                <div className="col-sm-9">
                                    <div className="form-group has-feedback label-div">
                                        <input
                                            value={selectedTenant.name.value}
                                            onChange={(e) => {
                                                selectedTenant.name = {
                                                    value: e.target.value
                                                }
                                                this.handleChange(e, {selectedTenant});
                                            }}
                                            className="form-control"
                                            id="tenantNameInput"
                                            placeholder="Account Name"/>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="row alert-list-wrap-div settings-section">
                            <div className="row">
                                <div className="col-sm-3 alert-label-column section-head">
                                    <h4 className="site-add-title">
                                        Email Settings
                                    </h4>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-sm-3 alert-label-column">
                                    <div className="form-group label-text">
                                        <label className="control-label">Account's Email</label>
                                    </div>
                                </div>
                                <div className="col-sm-9">
                                    <div className={
                                        'form-group has-feedback ' +
                                        ((selectedTenant.email.error.hasError !== undefined)
                                            ? ((selectedTenant.email.error.hasError) ? 'has-error' : 'has-success') : '')
                                        }>
                                        <input
                                            value={selectedTenant.email.value}
                                            onChange={(e) => {
                                                selectedTenant.email =  {
                                                    value: e.target.value,
                                                    error: {
                                                        hasError: UIHelper.isEmailHasError(e.target.value),
                                                        name: MessageConstants.EMAIL_ERROR
                                                    }
                                                }
                                                this.handleChange(e, {selectedTenant});
                                            }}
                                            type="text"
                                            className="form-control"
                                            id="userEmailInput"
                                            placeholder="EMAIL"/>
                                        <ErrorMessageComponent error={selectedTenant.email.error}/>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-sm-3 alert-label-column">
                                    <div className="form-group label-text">
                                        <label className="control-label">Email Password</label>
                                    </div>
                                </div>
                                <div className="col-sm-9">
                                    <div className="form-group">
                                        <input
                                            value={selectedTenant.password.value}
                                            onChange={(e) => {
                                                selectedTenant.password = {
                                                    value: e.target.value
                                                }
                                                this.handleChange(e, {selectedTenant});
                                            }}
                                            type="password"
                                            className="form-control"
                                            id="passwordInput"
                                            placeholder="Password"/>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="row alert-list-wrap-div settings-section">
                            <div className="row">
                                <div className="col-sm-3 alert-label-column section-head">
                                    <h4 className="site-add-title">
                                        Alert Settings
                                    </h4>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-sm-3 alert-label-column">
                                    <div className="form-group label-text">
                                        <label className="control-label">Email Warning Alert count</label>
                                    </div>
                                </div>
                                <div className="col-sm-3">
                                    <div className="form-group">
                                        <input
                                            type="number" value={''}
                                            className="form-control"
                                            onChange={(e) => {
                                                selectedTenant.warning_alert_limit = {
                                                    value: e.target.value
                                                }
                                                this.handleChange(e, {selectedTenant});
                                            }}
                                            id="tenantWarningAlertCount"
                                            placeholder="Warning Alert count" />
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-sm-3 alert-label-column">
                                    <div className="form-group label-text">
                                        <label className="control-label">Email Critical Alert count</label>
                                    </div>
                                </div>
                                <div className="col-sm-3">
                                    <div className="form-group has-feedback label-div">
                                        <input
                                            type="number" value={''}
                                              onChange={(e) => {
                                                selectedTenant.critical_alert_limit = {
                                                    value: e.target.value
                                                }
                                                this.handleChange(e, {selectedTenant});
                                            }}
                                            className="form-control"
                                            id="tenantCriticalAlertCount"
                                            placeholder="Critical Alert count" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="row alert-list-wrap-div">
                            {
                                (loggedUserObj.permissions && loggedUserObj.permissions.canUpdate)
                                    ? <div className="row">
                                        <div className="col-sm-4 alert-label-column">
                                        </div>
                                        <div className="col-sm-3 alert-label-column">
                                            <div className="form-group">
                                                <button
                                                    className="btn btn-primary form-control button-all-caps-text"
                                                    onClick={(e) => this.updateMailClick(e)}>
                                                    Save Settings
                                                </button>
                                            </div>
                                        </div>
                                     </div>
                                    : null
                            }
                        </div>
                    </div>
                </div>
            </Fragment>
        );
    }
}

SettingsView.propTypes = {
};

export default SettingsView;
