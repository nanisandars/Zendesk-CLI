import { Component, OnInit } from '@angular/core';
import { Router} from '@angular/router';
import {ExceptionsService} from '../Exceptions.service'
@Component({
  selector: 'update-exceptions',
  templateUrl: './update.component.html', 
  inputs: ['userName', 'FilterDays', 'AllResponses']
})
export class UpdateComponent implements OnInit {

   userName: string;
    accesToken: string;
    IntegrationType: string = 'zendesk';
    AllResponses: any;
    ExceptionRecordsList: any;
    ExceptionRecordsListBackUp: any = undefined;
    TokenArchivebutton: boolean = false;
    FilterDays: number;
    SearchRecord: string = "";
    maporder: boolean = true;
    Modalpopup: boolean = false;
    ViewDetails: any;
    modalTitle = "Survey Data"
    PopupPage: Number = 1;
    PopupPagesize: Number = 20;
    showarchive: boolean = true;
    ExceptionDescription: string = "";
    AnswerId: string = "";
    SurveyResponse: any;

    constructor( private route: Router, private exception: ExceptionsService) {

    }

    ngOnInit() {
        this.GetExceptions();
    }

    GetExceptions() {
        var that = this;
        this.exception.GetExceptions(this.userName, this.IntegrationType, 'Update', this.FilterDays).subscribe(
             data=> {
                  let thisdata:any=data;
                this.ExceptionRecordsListBackUp = thisdata._body;
                this.ExceptionRecordsList = this.ExceptionRecordsListBackUp;
            }
        );
    }

    //Archiving  records in tolken
    ArchiveTokenExceptions() {
        this.ExceptionRecordsListBackUp = null;
        var archive: any = [];
        var myJsonString = this.Getselectedids(this.ExceptionRecordsList)
        var that = this;
        //calling api to archive  
        this.exception.ArchiveExceptions(myJsonString, this.userName, this.IntegrationType, 'Update', 'Archive').subscribe(function (data) {
           that.GetExceptions();
        });

    }

    //Enabling or  disabling  Re trigger  in CCZD 
    EnableDisableTrigger() {
        if (this.ExceptionRecordsList == undefined || this.ExceptionRecordsList == null) {
            return false;
        }
        else {

            return !this.ExceptionRecordsList.some(_ => _.trigger);
        }
    }

    //Enabling or  disabling  Re trigger  in CCZD 
    EnableDisableArchive() {
        if (this.ExceptionRecordsList == undefined || this.ExceptionRecordsList == null) {
            return false;
        }
        else {

            return !this.ExceptionRecordsList.some(_ => _.archive);
        }
    }

    //ReTrigger  records 
    RetriggerExceptions() {
        this.ExceptionRecordsListBackUp = null;
        var archive: any = [];
        var myJsonString = this.Getselectedids(this.ExceptionRecordsList)
       
        //calling api to archive  
        this.exception.ManualRetriggerZDCCNotesInserts(myJsonString, this.userName, this.FilterDays).subscribe(data=> {
            this.GetExceptions();
        })

    }

    //retreiving the selected id from the Recordsdata, these id list are used for record archive or retrigger
    Getselectedids(Recordsdata: any) {
        var getIDFromSelectedCheckBox = [];
        for (var recordcounter = 0; recordcounter < Recordsdata.length; recordcounter++) {
            var Record = {
                id: ""
            }
            if (Recordsdata[recordcounter].trigger == true) {
                Record.id = Recordsdata[recordcounter]._Id;
                getIDFromSelectedCheckBox.push(Record)
            }
            else if (Recordsdata[recordcounter].archive == true) {
                Record.id = Recordsdata[recordcounter]._Id;
                getIDFromSelectedCheckBox.push(Record)
            }
        }
        var myJsonString = JSON.stringify(getIDFromSelectedCheckBox);
        return myJsonString
    }

    // Displaying unique date format
    GetDate(Givendate: string) {

        var Newdate = new Date(Givendate);
        var fulldate = Newdate.toLocaleString("en-us",
            {
                month: "short"
            }) + " " + Newdate.getDate() + "," + Newdate.getFullYear() + " " + Newdate.getHours() + ":" + Newdate.getMinutes() + ":" + Newdate.getSeconds()
        return fulldate;
    }
    GetAnswerID(Record: any) {
        var failedrecord = JSON.parse(Record.failedRecord);
        return failedrecord.CCTicket__c;

    }

    //sorting the  exception  records 
    SortRecords(column: string, recordList: any) {
        if (recordList.length == 0)
            return;

        this.maporder = !this.maporder;
        recordList.sort((a, b) => {
            var textA = '';
            var textB = '';
            textA = a[column].toUpperCase();
            textB = b[column].toUpperCase();
            if (this.maporder)
                return (textA > textB) ? -1 : (textA < textB) ? 1 : 0;
            else
                return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
        });
    }

    //searching the exception records
    SearchRecords(recordListBackup: any) {
        if (recordListBackup.length == 0)
            return recordListBackup;
        var searchist = [];
        var columnNames = Object.keys(recordListBackup[0]);
        for (var rowCounter = 0; rowCounter < recordListBackup.length; rowCounter++) {
            var isvalid = false;
            for (var columnCounter = 0; columnCounter < columnNames.length; columnCounter++) {
                var comparestring = recordListBackup[rowCounter][columnNames[columnCounter]] + "";

                if (columnNames[columnCounter] == "dateTime" || columnNames[columnCounter] == "exceptionRaisedOn" || columnNames[columnCounter] == "createDateTime" || columnNames[columnCounter] == "insertedOn") {
                    comparestring = this.GetDate(comparestring) + "";
                }

                if (comparestring.toUpperCase().indexOf(this.SearchRecord.trim().toUpperCase()) >= 0) {
                    isvalid = true;
                    break;
                }
            }
            if (isvalid)
                searchist.push(recordListBackup[rowCounter])
        }

        return searchist;
    }

    /******  Model popup code */
    ShowModal(Record) {
        if (Record.answerId != undefined) {
            this.Modalpopup = true;
            this.ExceptionDescription = Record.exceptionDescription;
            var singleresponse = this.AllResponses.filter(item => item.id == Record.answerId);
            this.SurveyResponse = singleresponse[0].responses;
        }
        else {
            var fRecord = JSON.parse(Record.failedRecord);

            this.Modalpopup = true;
            this.ExceptionDescription = Record.exceptionDescription;
            var singleresponse = this.AllResponses.filter(item => item.id == fRecord.CCTicket__c);
            this.SurveyResponse = singleresponse[0].responses;
        }

    }

    CloseModal() {
        this.Modalpopup = false;
    }
}
