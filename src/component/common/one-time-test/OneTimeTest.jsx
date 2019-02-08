import React, {Fragment} from 'react';

import ErrorMessageComponent from '../error-message-component/ErrorMessageComponent';
import LoadingScreen from '../loading-screen/LoadingScreen';
import ModalContainer from '../modal-container/ModalContainer';
import urlApi from '../../../api/urlApi';

import * as AppConstants from '../../../constants/AppConstants';
import * as Config from '../../../config/config';
import * as MessageConstants from '../../../constants/MessageConstants';
import * as UIHelper from '../../../common/UIHelper';

/* eslint-disable no-unused-vars */
import Styles from './OneTimeTestStyles.less';
/* eslint-enable no-unused-vars */

class OneTimeTest extends React.Component {
    constructor(props) {
        super(props);

        this.handleChange    = this.handleChange.bind(this);
        this.searchKeyPress  = this.searchKeyPress.bind(this);
        this.searchClick     = this.searchClick.bind(this);
        this.searchURL       = this.searchURL.bind(this);
        this.setStorageValue = this.setStorageValue.bind(this);
        this.insertToDB      = this.insertToDB.bind(this);
        this.loopToCheckUrl  = this.loopToCheckUrl.bind(this);
        this.viewResult      = this.viewResult.bind(this);
        this.modalYesClick   = this.modalYesClick.bind(this);
        this.modalNoClick    = this.modalNoClick.bind(this);
        this.modalOkClick    = this.modalOkClick.bind(this);
        this.dropDownClick   = this.dropDownClick.bind(this);

        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    componentWillMount() {

        let storageID = UIHelper.getLocalStorageValue(AppConstants.STORAGE_ID);

        if (storageID) {
            this.setState({isModalVisible: true});
        }

    }

    // Returns initial props
    getInitialState() {
        var initialState = {
            urlObject : {value:'', error: {}},
            isLoading: false,
            result: {isResultRecieved: false, resultUrl: '', searchedUrl: ''},
            isModalVisible: false,
            isAlertVisible: false,
            modalTitle: '',
            securityProtocol: AppConstants.SECURITY_ARRAY[0].value
        };

        return initialState;
    }

    handleChange(e, stateObj) {
        e.preventDefault();
        this.setState(stateObj);
    }

    searchKeyPress(e) {

        if(e.key == 'Enter') {
            this.searchURL();
        }

    }

    searchClick() {

        if (!this.state.isLoading) {
            this.setState({result: {isResultRecieved: false, url: '', searchedUrl: ''}});
            this.searchURL();
        }

    }

    searchURL() {

        if (this.state.urlObject.error.hasError !== undefined && !this.state.urlObject.error.hasError) {
            let storageID = UIHelper.getLocalStorageValue(AppConstants.STORAGE_ID);

            if (storageID) {
                UIHelper.removeLocalStorageValue(AppConstants.STORAGE_ID);
            } else {
                let randomHash = UIHelper.getRandomHexaValue();

                // Store in backend
                this.insertToDB(randomHash);
            }
        }

    }

    insertToDB(randomHash) {
        let {urlObject, loggedUserObj, securityProtocol} = this.state;

        var url, urlObj;

        // Check user logged in or not
        if (loggedUserObj) {
            url = Config.API_URL + AppConstants.URL_INSERT_LOGGED_USER_API;
            urlObj = {
                hashID: randomHash,
                urlValue: urlObject.value,
                userEmail: loggedUserObj.email,
                securityProtocol: securityProtocol
            };
        } else {
            url = Config.API_URL + AppConstants.URL_INSERT_API;
            urlObj = {
                hashID: randomHash,
                urlValue: urlObject.value,
                securityProtocol: securityProtocol
            };
        }

        this.setState({isLoading: true});

        urlApi.setUrlData(url, urlObj).then((json) => {

            // Store hash in browser
            this.setStorageValue(randomHash);

            if (json.status !== AppConstants.URL_NEW_STATE) {
                this.setState({isLoading: false});
            } else {
                this.loopToCheckUrl();
            }

        }).catch((error) => {
            this.setState({isLoading: false, isAlertVisible: true, modalTitle: error});
        });
    }

    setStorageValue(randomHash) {
        UIHelper.setLocalStorageValue(AppConstants.STORAGE_ID, randomHash);
    }

    loopToCheckUrl() {
        var secondsToSendReq = 2;
        var intervalUrl = setInterval(() => {

            let storageID = UIHelper.getLocalStorageValue(AppConstants.STORAGE_ID);

            if (storageID) {
                var url = Config.API_URL + AppConstants.URL_GET_API;
                urlApi.getUrlData(url, {hashID: storageID}).then((data) => {

                    if (data[0].status === AppConstants.URL_DONE_STATE) {
                        this.setState({isLoading: false});
                        UIHelper.removeLocalStorageValue(AppConstants.STORAGE_ID);
                        clearInterval(intervalUrl);
                        this.setState({
                            result: {
                                isResultRecieved: true,
                                resultID: data[0].resultID,
                                searchedUrl: data[0].securityProtocol + data[0].urlValue
                            }
                        });
                    }
                });
            }

        }, 1000 * secondsToSendReq);
    }

    viewResult(e, result) {
        e.preventDefault();
        var objectToPass;

        if (this.state.loggedUserObj) {
            objectToPass = {
                userObj: JSON.stringify(this.state.loggedUserObj),
                resultID: result.resultID
            };
        } else {
            objectToPass = {
                resultID: result.resultID
            };
        }

        UIHelper.redirectTo(AppConstants.SITE_RESULT_ROUTE, objectToPass);
    }

    modalYesClick() {
        this.setState({isModalVisible:false});
        this.setState({isLoading: true});
        this.loopToCheckUrl();
    }

    modalNoClick() {
        this.setState({isModalVisible: false});
        UIHelper.removeLocalStorageValue(AppConstants.STORAGE_ID);
    }

    modalOkClick() {
        this.setState({isAlertVisible: false, modalTitle: ''});
    }

    dropDownClick(stateObject) {
        this.setState(stateObject);
    }

    render() {
        const {urlObject, result, isLoading, isModalVisible, isAlertVisible, modalTitle, securityProtocol} = this.state;
        return (
            <Fragment>
                <ModalContainer
                    title={MessageConstants.SEARCH_URL_WARNING_MESSAGE}
                    yesClick={this.modalYesClick}
                    noClick={this.modalNoClick}
                    isModalVisible={isModalVisible}
                    modalType={AppConstants.CONFIRMATION_MODAL}/>
                <ModalContainer
                    title={modalTitle}
                    okClick={this.modalOkClick}
                    isModalVisible={isAlertVisible}
                    modalType={AppConstants.ALERT_MODAL}/>
                <LoadingScreen isDisplay={isLoading} message={MessageConstants.LOADING_MESSAGE}/>
                <h3 className="search-text">
                    Run a one-time test
                </h3>
                <form name="site-add-form">
                    <div className="row without-margin">
                        <div className="col-sm-3">
                            <select className="custom-select"
                                value={securityProtocol}
                                onChange={(e) => this.dropDownClick({securityProtocol: e.target.value})}>
                                {
                                    AppConstants.SECURITY_ARRAY.map((security, i) => {
                                        return (
                                            <option key={'security_' + i} value={security.value}>
                                                {security.textValue}
                                            </option>
                                        );
                                    })
                                }
                            </select>
                        </div>
                        <div className="col-sm-9">
                            <div className={
                                    'input-group has-feedback ' +
                                    ((urlObject.error.hasError !== undefined)
                                        ? ((urlObject.error.hasError) ? 'has-error' : 'has-success') : '')
                                }>
                                <input
                                    value={urlObject.value}
                                    onChange={(e) => this.handleChange(e, {
                                        urlObject: {
                                            value: e.target.value,
                                            error: {
                                                hasError: UIHelper.isUrlHasError(e.target.value),
                                                name: MessageConstants.URL_ERROR
                                            }
                                        }
                                    })}
                                    onKeyPress={this.searchKeyPress}
                                    type="text"
                                    disabled={(isLoading)? 'disabled' : ''}
                                    className="form-control"
                                    id="urlObjectInput"
                                    placeholder="ENTER WEBSITE URL"/>
                                <span className="input-group-addon"
                                    onClick={this.searchClick}>
                                    <i className="glyphicon glyphicon-search"></i>
                                </span>
                            </div>
                            <ErrorMessageComponent error={urlObject.error}/>
                        </div>
                    </div>
                    {
                        result.isResultRecieved
                            ? <div className="result-container">
                                  <a className="btn btn-primary" href="#"
                                      onClick={(e) => this.viewResult(e, result)}>
                                      View Result for {result.searchedUrl}
                                  </a>
                              </div>
                            : null
                    }
                </form>
            </Fragment>
        );
    }
}

OneTimeTest.propTypes = {
};

export default OneTimeTest;
