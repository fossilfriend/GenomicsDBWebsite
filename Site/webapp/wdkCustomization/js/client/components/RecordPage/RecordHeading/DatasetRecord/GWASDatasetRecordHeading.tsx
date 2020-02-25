import React, { useRef, useEffect, useCallback, useState } from 'react';
import { connect, useDispatch } from 'react-redux';
import { HeaderRecordActions } from './../Shared';
import * as gr from './../../types';
import { resolveJsonInput } from '../../../../util/jsonParse';

import { HelpIcon } from 'wdk-client/Components';

import WdkService, { useWdkEffect } from 'wdk-client/Service/WdkService';
import { SubmissionMetadata, submitQuestion, updateParamValue, updateActiveQuestion } from 'wdk-client/Actions/QuestionActions';

import { QuestionState, QuestionWithMappedParameters } from 'wdk-client/StoreModules/QuestionStoreModule';
//import { useHistory } from 'react-router-dom';


const SEARCH_NAME = "gwas_stats";
const ACCESSION_PARAM_NAME = "gwas_accession";
const DATASET_PARAM_NAME = "gwas_dataset";
const PVALUE_PARAM_NAME = "pvalue";

interface StoreProps  {
	externalUrls: { [key: string]: any },
	webAppUrl: string;
	questionState: QuestionState;
}

interface IRecordHeading {
	record: gr.GWASDatasetRecord;
	recordClass: { [key: string]: any };
	headerActions: gr.HeaderActions[];
}

interface SearchProps {
	accession: string;
	dataset: string;
	questionState: QuestionState;
}

type GWASDatasetRecord = StoreProps & gr.GWASDatasetRecord;


const GWASDatasetSearchHelp: React.SFC<any> = props => {
	return (
		<div>
			<p>Set the adjusted p-value threshold for GWAS significant. The search will return all genes supported by an 
				p-value &le; the specified threshold.</p>
			<p>p-values may be specified in decimal (e.g., 0.000003) or scientific (e.g., 3e-6 or 3^-6 or 3 x 10^-6) notation.</p>
			<p>For exome array studies a p-value threshold of 1e-3 is recommended.</p>
		</div>
	)
}



const GWASDatasetSearch: React.FC<SearchProps> = props => {
	const { accession, dataset, questionState } = props;
	//const [activeQuestion, setActionQuestion] = useState(null);

	const submissionMetadata: SubmissionMetadata = { type: 'create-strategy' };
	const dispatch = useDispatch();

	let handleSubmit = useCallback(
		(event: React.FormEvent) => {
			event.preventDefault();
			dispatch(submitQuestion({ searchName: SEARCH_NAME, submissionMetadata }));
		}, [SEARCH_NAME, submissionMetadata]
	);

	let handleChange = useCallback (
		(event) => {
			dispatch(updateParamValue({searchName: SEARCH_NAME,
				parameter: questionState.question.parametersByName[PVALUE_PARAM_NAME],
				paramValues: questionState.paramValues,
				paramValue: event.target.value
			}));
		}, []
	);

	return (
		<form className="form-inline" onSubmit={handleSubmit}>
			<input type="hidden" name={ACCESSION_PARAM_NAME} value={accession} />
			<input type="hidden" name={DATASET_PARAM_NAME} value={dataset} />
		
			<div className="input-group mb-3">
				<div className="input-group-prepend">
					Mine this dataset 
				</div>
				<input
					type="text"
					className="form-control input-sm"
					onFocus={e => e.target.select()}
					name={PVALUE_PARAM_NAME}
					defaultValue='5e-8'
					placeholder={'5e-8'}
					onChange={handleChange}
				/>
				<div className="input-group-append">
					<button className="btn btn-outline-secondary" type="submit"><i className="fa fa-search" /></button>
				</div>
				<span className="help-block"><HelpIcon><GWASDatasetSearchHelp /></HelpIcon></span>
			</div>
		</form>
	);
}

const GWASDatasetRecordSummary: React.SFC<IRecordHeading & StoreProps> = props => {
	const { record, recordClass, headerActions, externalUrls, questionState } = props;

	const dispatch = useDispatch();
	useEffect(() => {
		dispatch(updateActiveQuestion({
		  searchName: SEARCH_NAME,
		  autoRun: false,
		  initialParamData: undefined,
		  stepId: undefined
		}))
	  }, []);

	return <React.Fragment>
		<div className="record-summary-container dataset-record-summary-container">
			<div>
				<HeaderRecordActions
					record={record}
					recordClass={recordClass}
					headerActions={headerActions}
				/>
				<h1 className="record-heading">Dataset: {record.attributes.name} </h1>
			</div>
			<h2>
				{record.attributes.is_adsp && <strong>&nbsp;{resolveJsonInput(record.attributes.is_adsp)}</strong>}
			</h2>
			<ul>

				<li><h5 className="dataset-subtitle">{record.attributes.description}</h5></li>
				<li><span className="label">Category:</span> {recordClass.displayName}</li>
				<li><span className="label">Explore related datasets:</span>{resolveJsonInput(record.attributes.accession_link)} </li>
				<GWASDatasetSearch  questionState={questionState} accession={record.attributes.niagads_accession} dataset={record.displayName} ></GWASDatasetSearch>
			</ul>
		</div>
	</React.Fragment>
}


const enhance = connect<StoreProps, any, IRecordHeading>(
	(state: any) => ({ 
		externalUrls: state.globalData.siteConfig.externalUrls, 
		webAppUrl: state.globalData.siteConfig.webAppUrl,
		questionState: (state.question.questions[SEARCH_NAME] || {}) as QuestionState, })
);

export default enhance(GWASDatasetRecordSummary);
