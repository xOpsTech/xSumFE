import React, {Fragment} from 'react';
import PropTypes from 'prop-types';
import LazyLoad from 'react-lazy-load';
import {OverlayTrigger, Popover} from 'react-bootstrap';
import ResultViewContainer from '../result-view-container/ResultViewContainer';
import SummaryView from './summary-view/SummaryView';
import SendOneTimeJobEmails from '../send-one-time-job-emails/SendOneTimeJobEmails';
import {Tab, Tabs} from 'react-bootstrap';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/* eslint-disable no-unused-vars */
import Styles from './ScriptTestResultStyles.less';
/* eslint-enable no-unused-vars */

class ScriptTestResult extends React.Component {
    constructor(props) {
        super(props);

        this.handleSelect      = this.handleSelect.bind(this);
        this.createPdfFromHTML = this.createPdfFromHTML.bind(this);
        this.sendEmailPopUp    = this.sendEmailPopUp.bind(this);

        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    // Returns initial props
    getInitialState() {
        var initialState = {
            activeTab: 0,
        };

        return initialState;
    }

    handleSelect(key, e) {

        if (e) {
            this.setState({activeTab: key});
        }

    }

    createPdfFromHTML(e) {
        e.preventDefault();
        const {job} = this.props.jobWithResult;
        const input = document.getElementById('script-results-tabs');
        html2canvas(input).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF();
            pdf.setFontSize(40);
            pdf.text(35, 25, 'Results of ' + job.jobName);
            pdf.addImage(imgData, 'JPEG', 15, 40, 180, 120);
            pdf.save(job.jobName + '.pdf');
        });
    }

    sendEmailPopUp(e) {
        e.preventDefault();
    }

    render() {
        const {jobWithResult, key, selectedTenant, loggedUserObj} = this.props;
        const {activeTab} = this.state;
        const GraphView = (props) => {
            const {key, jobWithResult} = props;
            return (
                <div>
                    <LazyLoad height={345} offsetVertical={300}>
                        <ResultViewContainer
                            jobWithResult={jobWithResult}
                            keyID={key}
                            fieldToDisplay={'responseTime'}
                            chartTitle={'Response Time'}
                            barChartBarClick={this.barChartBarClick}/>
                    </LazyLoad>
                    <LazyLoad height={345} offsetVertical={300}>
                        <ResultViewContainer
                            jobWithResult={jobWithResult}
                            keyID={key}
                            fieldToDisplay={'dnsLookUpTime'}
                            chartTitle={'DNS Time'}
                            barChartBarClick={this.barChartBarClick}/>
                    </LazyLoad>
                    <LazyLoad height={345} offsetVertical={300}>
                        <ResultViewContainer
                            jobWithResult={jobWithResult}
                            keyID={key}
                            fieldToDisplay={'tcpConnectTime'}
                            chartTitle={'TCP Connect Time'}
                            barChartBarClick={this.barChartBarClick}/>
                    </LazyLoad>
                    <LazyLoad height={345} offsetVertical={300}>
                        <ResultViewContainer
                            jobWithResult={jobWithResult}
                            keyID={key}
                            fieldToDisplay={'lastByteRecieveTime'}
                            chartTitle={'Last Byte Recieve Time'}
                            barChartBarClick={this.barChartBarClick}/>
                    </LazyLoad>
                </div>
            );
        };

        const DropDownPopOver = (props) => {
            return(
                <Popover {...props} className="drop-down">
                    {props.children}
                </Popover>
            );
        };

        const EmailPopOver = (
            <DropDownPopOver className="log-out-drop-down">
                <div className="row">
                    <SendOneTimeJobEmails
                        jobWithResult={jobWithResult}
                        selectedTenant={selectedTenant}
                        loggedUserObj={loggedUserObj}/>
                </div>
            </DropDownPopOver>
        );

        return (
            <Fragment>
                <Tabs defaultActiveKey={activeTab}
                    activeKey={activeTab}
                    onSelect={(key, e) => this.handleSelect(key, e)}
                    id="script-results-tabs" className="content-col">
                    <Tab eventKey={0} title={'Graph View'}>
                        <GraphView key={key} jobWithResult={jobWithResult}/>
                    </Tab>
                    <Tab eventKey={1} title={'Summary View'}>
                        <SummaryView selectedTenant={selectedTenant} job={jobWithResult.job}/>
                    </Tab>
                </Tabs>
                <button onClick={(e) => this.createPdfFromHTML(e)}
                    className="btn btn-primary download-btn-col" title="Download as pdf">
                    <i className="fa fa-file-pdf-o"/>
                </button>
                {
                    (loggedUserObj)
                        ? <OverlayTrigger trigger="click" rootClose placement="left" overlay={EmailPopOver}>
                            <button onClick={(e) => this.sendEmailPopUp(e)}
                                className="btn btn-primary download-btn-col" title="Send results through email">
                                <i className="fa fa-envelope"/>
                            </button>
                        </OverlayTrigger>
                        : null
                }

            </Fragment>
        );
    }
}

ScriptTestResult.propTypes = {
    jobWithResult: PropTypes.object,
    selectedTenant: PropTypes.object,
    loggedUserObj: PropTypes.object,
    key: PropTypes.number
};

export default ScriptTestResult;
