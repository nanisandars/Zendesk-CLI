import { Injectable } from '@angular/core';
import { Jsonp, URLSearchParams } from '@angular/http';
import { Http, Response } from '@angular/http';
import { Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { ConfigService } from './config.service';

@Injectable()
// For all required API calls
export class ExceptionsService {

	constructor(private jsonp: Jsonp, private http: Http, private configService: ConfigService) {

	}
	/**
	 * Retreives all types of exceptions  based on the given input parameters
	 */
	GetExceptions(ccUserName: string, integrationType: string, exceptionType: string, FilterDays: number) {

		var enddate = new Date();
		var startdate = new Date()
		startdate.setDate(startdate.getUTCDate() - FilterDays);
		let Weburl = '';
		let parameters = 'Username=' + ccUserName + '&integrationType=' + integrationType;
		parameters += '&Exceptiontype=' + exceptionType + '&startDate=' + this.GetFormattedDate(startdate) + '&endDate=' + this.GetFormattedDate(enddate);
		Weburl = encodeURI(this.configService.HttpURL + '/api/Sentry/GetGivenExceptionData?' + parameters);
		return this.FetchData(Weburl);
	}
	/**
	 * This method returns date  in MM/DD/YYYY format
	 */
	GetFormattedDate(currentDt: Date) {
		var mm = currentDt.getMonth() + 1;
		var dd = currentDt.getDate();
		var yyyy = currentDt.getFullYear();
		var date = mm + '/' + dd + '/' + yyyy;
		return date;
	}

	/**
	 * Moves the given  source exception record into given  destination exception type.(mostly used to move the records to Archive category)
	 */
	ArchiveExceptions(Recordlist: string, ccUserName: string, integrationType: string, sourceExceptionType: string, DestinationExceptionType: string) {


		let Weburl = '';
		let parameters = 'userName=' + ccUserName + '&sourceExceptionType=' + sourceExceptionType;
		parameters += '&DestinationExceptionType=' + DestinationExceptionType + '&integrationType=' + integrationType;
		Weburl = this.configService.HttpURL + '/api/Sentry/ArchiveExceptions?' + parameters;
		return this.postdata(Recordlist, Weburl);
	}


	/**
	 * Retriggering  records in create category for zendesk
	 */
	ManualRetriggerZDTicketInserts(Recordlist: string, ccUsername: string, FilterDays: number) {
		var enddate = new Date();
		var startdate = new Date()
		startdate.setDate(startdate.getUTCDate() - FilterDays);
		let Weburl = '';
		let parameters = 'userName=' + ccUsername + '';
		Weburl = this.configService.HttpURL + '/api/CCZDRetry/ManualTriggerZDTicketInserts?' + parameters;
		return this.postdata(Recordlist, Weburl);
	}
	/**
	 * Retriggering  records in upate category for zendesk
	 */
	ManualRetriggerZDCCNotesInserts(Recordlist: string, ccUserName: string, FilterDays: number) {
		var enddate = new Date();
		var startdate = new Date()
		startdate.setDate(startdate.getUTCDate() - FilterDays);
		let Weburl = '';
		let parameters = 'userName=' + ccUserName + '';
		Weburl = this.configService.HttpURL + 'api/CCZDRetry/ManualTriggerCCNotesInserts?' + parameters;
		return this.postdata(Recordlist, Weburl);

	}
	/**
	 * Retreives data from given webapi URL
	 */
	FetchData(Weburl: string)  {

		let params = new URLSearchParams();
		params.set('search', '');
		params.set('action', '');
		params.set('format', 'json');
		params.set('callback', 'JSONP_CALLBACK');
		return this.jsonp.get(Weburl, { search: params });

	}
	/**
	 * Posts data to  given webapi URL
	 */
	postdata(body: string, Weburl: string) {

		let params = new URLSearchParams();
		params.set('search', '');
		params.set('action', '');
		params.set('format', 'json');
		params.set('callback', 'JSONP_CALLBACK');
		return this.http.post(Weburl, body, { search: params });

	}



}
