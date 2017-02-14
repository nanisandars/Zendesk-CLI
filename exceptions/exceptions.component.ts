import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {ExceptionsService} from '../Exceptions.service';
import {GeneralExceptions } from '../general-exceptions/general-exceptions.component';
import{FieldLevelComponent } from '../field-level/field-level.component';
@Component({
  selector: 'Exceptions',
  templateUrl: './exceptions.component.html',
  providers:[ExceptionsService],
    inputs: ['userName', 'CCAccesToken', 'FilterDays', 'AllResponses']
  
})
export class ExceptionsComponent implements OnInit {

 IntegrationType = "zendesk";
  AllResponses: any;
  userName: string = '';
  FilterDays: number;
  public CCAccesToken: string = '';
  selectedTabid: number = 0;
  filterObj: any;
  constructor( private route: Router, private exception: ExceptionsService) {


    var beforedate = new Date();
    var afterdate = new Date();

    afterdate.setDate(afterdate.getUTCDate() - this.FilterDays);
    this.filterObj = {
      "afterdate": afterdate,
      "beforedate": beforedate

    };


  }
  ngOnInit() {

  }
  //Enabling the selected Tab
  DisplayMenu(tabid: number) {
    this.selectedTabid = tabid;

  }

  //Navigation to Settings
  NavigatetoSettings() {

    var page = 'settings';

    this.route.navigateByUrl(`/Filter/${this.userName}/${this.CCAccesToken}/${page}`);

  }

  //sNeeds to be replaced with CC API (api/answers)
  GetAllResponses(filter: any, CCAccesToken: string) {
    // return this.parent.GetAllresponses(filter, CCAccesToken)


  }

}
