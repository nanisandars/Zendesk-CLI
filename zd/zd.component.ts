import { Component, OnInit, ChangeDetectionStrategy, ViewChild, EventEmitter, Output} from '@angular/core';
import { Router, } from '@angular/router';
import { CCZDService } from '../cczd.service';

@Component({
	selector: 'ZDSettings',
	templateUrl: './zd.component.html',
	providers: [CCZDService],
	inputs: ['userName', 'CCMappings', 'APIKey', 'Questionslist'],
	outputs: ['PostIntegration']
})

export class ZDComponent implements OnInit {
	/**
	 * userName, CCMappings are the inputs for this components
	 * userName logged in user name
	 * CCMappings output of CC API (api/UserData/ input is key)  
	 */
	public PostIntegration = new EventEmitter();
	public userName: string;
	public CCMappings: any;
	public CCAccesToken: string = '';
	public Postmapping = new EventEmitter();

	//CC Life time API Key
	APIKey: string;
	ZDKey: string = '';
	ZDURL: string = '';
	ZDEmail: string = '';
	ZendeskKey: string = "integrations.zendesk";
	Questionslist: any;
	showloading: boolean = false;
	ZDFields: any = undefined;
	existingCCTags: any = undefined;
	existingCCKeys: any = undefined;
	showmappings = true;
	//Valid data type types mappings of CC Tags and ZD Fields, Tags and  ZD Fields are mapped by comparing their dataypes with this Json string
	fieldMapConstraint: any = {
		"TEXT": "text|||subject|||description",
		"MULTILINETEXT": "textarea|||subject|||description",
		"MULTISELECT": "textarea",
		"NUMBER": "integer|||decimal",
		"STAR-5": "integer|||decimal",
		"SMILE-5": "integer|||decimal",
		"SCALE": "integer|||decimal",
		"SELECT": "tagger|||priority|||tickettype",
		"DATE": "date"
	};

	defaultCCTags: string = "#name##subject##description##email##mobile#";

	// ZD Fields that are  not displayed  in ZD fields dropdown in UI.
	hidelist: string = "#assignee#ccticket#priority#type#subject#description#group#status#npsscore#"

	Tagmapping: any = [];
	Tagmappingbackup: any = [];
	EnableDisablemap: any = [];
	searchKey: string = "";
	Field: string = "";
	Message: string = '';
	ZDCredentials: boolean = true;
	maporder: boolean = true;
	InsertEditid: string = "";
	InsertError: string = '';
	Tagdata: string = "";
	PopupMessage: string = "";
	PopupAction: string = "";
	modalTitle: string = "";
	samplemodal: boolean = false;


	constructor(private cczd: CCZDService, private route: Router) {
		this.showloading = true;
	}

	ngOnInit() {
		if (this.CCMappings == null) {
			this.ZDCredentials = false;
			this.showloading = false;
			//Retreiving ZD Credentials  From webapi if already authenticated
			this.cczd.getZendeskcredentials(this.userName).subscribe(data => {
				let thisdata: any = data;

				if (thisdata.zdurl != undefined) {

					this.ZDURL = thisdata.zdurl;
					this.ZDKey = thisdata.zdapiKey;
					this.ZDEmail = thisdata.zdEmail;
					this.Connect(true);
				}
				return;
			});
		}
		if (this.CCMappings != null)
			this.CCMappings = JSON.parse(this.CCMappings);
		this.ZDCredentials = false;

		if (this.CCMappings != null) {
			if (this.CCMappings.integrationdetails == null)
				this.CCMappings = JSON.parse(this.CCMappings);
			if (this.CCMappings.integrationdetails == null)
				return;
			this.initparameters();
			this.getTicketFields();//Retreiving ZD ticket fields
		}
		else {
			this.showloading = false;
		}
	}

	initparameters() {
		var integrationDetails = (this.CCMappings.integrationdetails) ? this.CCMappings.integrationdetails : this.CCMappings.integrationDetails;
		this.ZDURL = integrationDetails.split("|")[0];
		this.ZDKey = integrationDetails.split("|")[1];
		this.ZDEmail = integrationDetails.split("|")[2];
	}

	//This method is used to authenticate and fetch the ticket fields from Zendesk
	getTicketFields() {


		this.cczd.IsCCUserZDAuthenticated(this.userName, this.ZendeskKey).subscribe(data => {
			let thisdata: any = data;

			if (thisdata._body.message == "authenticated") {
				this.Connect(false);
				this.ZDCredentials = true;

			}
			this.showloading = false;
		});

	}

	//This methods is used to get the latest tag information from CC
	GetExistingTags() {
		var finalarray = [];
		var QuestionsArray = [];
		var missingTags = this.defaultCCTags;
		var tagslist = [];
		var that = this;

		this.Questionslist.forEach(function (singleQuestion, index) {

			if (singleQuestion.questionTags != null && singleQuestion.questionTags.length != 0) {

				if (that.defaultCCTags.indexOf("#" + singleQuestion.questionTags[0].toLowerCase() + "#") < 0) {
					tagslist.push(singleQuestion.questionTags[0].toLowerCase())
					QuestionsArray[singleQuestion.questionTags[0].toLowerCase()] = singleQuestion.questionTags[0].toLowerCase() + '::' + singleQuestion.displayType + '::' + singleQuestion.id;
				}
				else
					missingTags = missingTags.replace("#" + singleQuestion.questionTags[0].toLowerCase() + "#", ",");
			}
		});

		//sortings the tags 
		tagslist.sort(function (a: string, b: string) {
			return (a.toUpperCase() > b.toUpperCase()) ? -1 : (a.toUpperCase() < b.toUpperCase()) ? 1 : 0;
		});

		tagslist.reverse();

		var tagdata = [];
		for (var singltag of tagslist) {
			if (singltag.toLowerCase() == "nps")
				continue;
			tagdata[singltag] = QuestionsArray[singltag];
		}

		finalarray.push(tagdata);
		finalarray.push(missingTags.replace(/#/gi, ',').replace(/,,/gi, ',').replace(/^,|,$/gm, ''));
		return finalarray;

	}

	/**
	 Assigns  the mapping from  CC to Tagmapping object
	if any tags are removed in CC UI manually those tags are removed from  the  Mapping list using  'SkipRemovedTagsinCC' method
	*/

	LoadMappings() {
		this.showloading = false;
		var that = this;
		this.Tagmappingbackup = null;

		if (this.ZDFields) {
			if (this.CCMappings != null) {
				this.Tagmappingbackup = this.CCMappings.mappings;

				this.existingCCTags = this.GetExistingTags()[0];
				this.existingCCKeys = Object.keys(this.existingCCTags);

				this.Tagmappingbackup = this.cczd.SkipRemovedTagsinCC(this.Questionslist, this.Tagmappingbackup);

				this.Tagmapping = this.Tagmappingbackup;

			}
			else {
				this.Tagmappingbackup = null;
			}
			this.Tagmapping = this.Tagmappingbackup;
		}
		else {
			this.ZDCredentials = false;
		}
	}

	//This method is used to display the default tag mappings between CC and ZD
	loadDefaultMapping() {

		var that = this;
		var qustionsString = JSON.stringify(that.Questionslist).toLowerCase();

		that.Questionslist.filter(function (obj) {
			if (obj["questionTags"] != null && obj["questionTags"].length > 0) {
				var tagName = obj["questionTags"][0].toLowerCase();
				var defaultType = obj["displayType"];
				var Qid = obj["id"];

				if (that.defaultCCTags.indexOf("#" + tagName + "#") >= 0 && tagName != 'nps') {
					that.AddNewMapping(that.Tagmappingbackup, tagName, tagName, Qid);
				}
			}
		});
	}

	//This method is used to format the Mappings in the CC API (User Data) Input Format
	prepareIntegrationData() {
		var integrationData = {
			"integrationdetails": this.ZDURL + "|" + this.ZDKey + "|" + this.ZDEmail,
			"mappings": this.Tagmappingbackup,
			"mappingsbackup": this.Tagmappingbackup,
			"username": this.userName,
			"ccapikey": this.APIKey
		};
		return integrationData;
	}

	//This method is used to save or post the default mappings
	saveDefaultMapping() {

		this.cczd.saveDefaultMappingsAndCredentials(this.ZendeskKey, JSON.stringify(this.prepareIntegrationData())).subscribe(
			data => {
				this.existingCCTags = this.GetExistingTags()[0];
				this.existingCCKeys = Object.keys(this.existingCCTags);
				this.ZDCredentials = true;
				this.showloading = false;
			}, Error => {
				this.existingCCTags = this.GetExistingTags()[0];
				this.existingCCKeys = Object.keys(this.existingCCTags);
				this.ZDCredentials = true;
				this.showloading = false;
			}
		)

	}

	//This method is used to authenticate the systems
	Connect(loadDefaultMapping: boolean) {
		this.showloading = true;
		this.ZDFields = null;
		this.Message = "";
		var that = this;

		this.ZDKey = this.ZDKey.trim();
		this.ZDURL = this.ZDURL.trim();
		this.ZDEmail = this.ZDEmail.trim();

		if (this.ZDKey == "" || this.ZDKey == undefined) {
			this.Message = "Please enter Zendesk  Key ";
			this.showloading = false;
			return;
		}
		if (this.ZDURL == "" || this.ZDURL == undefined) {
			this.Message = "Please enter Zendesk URL ";
			this.showloading = false;
			return;
		}
		if (this.ZDEmail == "" || this.ZDEmail == undefined) {
			this.Message = "Please enter Zendesk Admin Email ";
			this.showloading = false;
			return;
		}

		this.cczd.Connect2ZD(this.ZDKey, this.ZDURL, this.ZDEmail, this.APIKey, this.userName).subscribe
			(
			data => {
				let thisdata: any = data;

				if (thisdata._body == null || thisdata._body.length == 0) {
					this.ZDCredentials = false;
					this.VanishingMessage("Please enter valid Zen Desk Admin API Key,Zen Desk URL or Zen Desk Email");
					return;
				}
				this.ZDFields = thisdata._body;

				this.sortZDFields();

				let existtags: string = (this.GetExistingTags()[1]);


				if (existtags.replace(",", "") != "") {
					this.Message = "Please create the following  question tags: ";
					this.Message += existtags;
					this.showloading = false;
					this.showmappings = false;
					return;
				}
				else {
					if (loadDefaultMapping) {
						this.loadDefaultMapping();
						this.saveDefaultMapping();
					}
					else {
						this.LoadMappings();
					}
				}

			}, Error => {
				this.VanishingMessage("Please enter valid Zen Desk Admin API Key,Zen Desk URL or Zen Desk Email");
			}
			);

	}

	//Message that vanishes after 5 seconds
	VanishingMessage(message: string) {
		var that = this;
		this.Message = message;
		this.showloading = false;
		setTimeout(function () {
			that.Message = "";
		}, 5000);
	}

	//Sorting zd fields in alphabetical order
	sortZDFields() {
		var Fieldlist = [];
		for (var {title: n } of this.ZDFields) {
			Fieldlist.push(n);
		}
		Fieldlist.sort(function (a: string, b: string) {

			return (a.toUpperCase() > b.toUpperCase()) ? -1 : (a.toUpperCase() < b.toUpperCase()) ? 1 : 0;
		});

		Fieldlist.reverse();
		var ZDlist = []
		for (var singlefield of Fieldlist) {
			for (var singleZDfield of this.ZDFields) {
				let zdfield: string = singleZDfield.title;

				if (this.hidelist.indexOf("#" + zdfield.toLowerCase() + "#") >= 0)
					continue;
				if (singlefield == singleZDfield.title) {
					ZDlist.push(singleZDfield)
				}
			}

		}
		this.ZDFields = ZDlist;
	}

	/**
	* Verifies if  given mapping exist or not
	* QuestionId: Given Question ID
	* field: Field name of givne integration type
	* mapid: Mapping id of the given mapping, if the  given mapping is fresh then the mapid is empty , 
	* so same function can be used to check mapping both on adding maps and editing maps
	* Tagmappinglist: Mapping list  backup list that  is not effected by search 
	* Return empty string on success else error string is returned
	* Note: Then function return error message unique to all type of integrations, a string 'integrationtype' is returned for field case errors, that string has to be replaced with the respective integration type  Eg: integrationtype field=> zendesk field
	*  */

	IsThisMappingExist(QuestionId: string, field: String, mapId: string, Tagmappinglist: any) {
		var QuestionTagcount = 0;
		var FieldCount = 0;

		if (QuestionId.trim() == "" && field.trim() == "") {
			return "Please Select any Question Tag and Zen Desk Field";

		}
		else if (QuestionId.trim() == "") {
			return "Please Select a Question Tag";

		}
		else if (field.trim() == "") {
			return "Please Select a Zen Desk Field";
		}

		for (var count = 0; count < Tagmappinglist.length; count++) {
			if ((Tagmappinglist[count].QtnID.toUpperCase() == QuestionId.toUpperCase()) && (Tagmappinglist[count]._Id != mapId) && (Tagmappinglist[count].disabled == "false")) {
				QuestionTagcount++;

			}
			if ((Tagmappinglist[count].Field.toUpperCase() == field.toUpperCase()) && (Tagmappinglist[count]._Id.toUpperCase() != mapId.toUpperCase()) && (Tagmappinglist[count].disabled == "false")) {
				FieldCount++;
			}

		}
		if (QuestionTagcount >= 1) {
			return "Question Tag already used";
		}
		if (FieldCount >= 1) {
			return "Zen Desk Field  already used";
		}
		return "";
	}

	/**
	 * Adds new mapping to the existing mapping 
	 * Tagmappingbackup:Complete Mapping list backup, not effected by search
	 * QuestionTag: Given Question tag
	 * field: Field name of given integration type
	 * QuestionID:Question id of the selected tag
	 * 
	 *  */
	AddNewMapping(Tagmappingbackup: any, QuestionTag: string, field: String, QuestionID: string) {

		var today = new Date();
		var _id = "tag_" + Math.floor((Math.random() * 1000000000) + 1) + "" + today.getMonth() + "" + today.getDate() + "" + today.getHours() + "" + today.getMilliseconds();
		var singlemap = { "_Id": _id, "Tag": QuestionTag.toLowerCase(), "QtnID": QuestionID, "Field": field.toLowerCase(), "disabled": "false", time: today };
		this.Tagmappingbackup.push(singlemap);
		this.SearchMap();

		return "";

	}

	/**
	 * Adds new  mapping  or editing the existing mapping, if mapid is empty then  AddNewMapping method is called else editing of the mapping is done.
	 * Tagmappingbackup:Complete Mapping list backup, not effected by search in UI
	 * Tagmappinglist: Mapping list to display in UI, effected by search in UI
	 * QuestionTag: Given Question tag
	 * field: Field name of given integration type
	 * mapid: Mapping id, empty string for new mapping(incase of adding)
	 * QuestionID:Question id of the selected tag
	 * searchkey:  Key used for search, not used in editing, but used to assign the exact mapping to Mapping list(to display in UI) with modified values  from mapping backup list if search is in use, so the same modificataion done to backup list are reflected in display list
	 *  */
	AddorEditmapping(Tagmappingbackup: any, Tagmappinglist: any, QuestionTag: string, field: string, mapid: string, QuestionID: string, searchkey: string) {

		var message = this.IsThisMappingExist(QuestionID, field, mapid, Tagmappingbackup)
		if (message != "")
			return message;
		if (mapid == "") {

			this.AddNewMapping(Tagmappingbackup, QuestionTag, field, QuestionID);
			this.SearchMap();
		}
		else {

			Tagmappinglist = this.EditTagFieldMapping(mapid, QuestionTag + '::' + QuestionID, field, 'false', Tagmappingbackup, searchkey)
		}
		return "";
	}

	// Method is used to validate the data types of the mappings, as per CC provided information
	validateMappings(Tagdata: any, Field: string) {
		var displayType = Tagdata.split("::")[1].toUpperCase();
		var ZDType = Field.split("::")[0];

		if (this.fieldMapConstraint[displayType] == null) {
			if (!(ZDType.toUpperCase() == "CUSTOM_TEXT")) {
				this.InsertError = 'This CC Tag must be matched with a ZD Field which is of type CUSTOM_TEXT';
				return false;
			}
		}
		else {
			if (this.fieldMapConstraint[displayType].toUpperCase().indexOf(ZDType.toUpperCase()) >= 0) {
				return true;
			}
			else {
				this.InsertError = 'CC Tag data type and ZD Field data type are not matched.';
				return false;
			}
		}
		return true;
	}

	//Insert for CC to ZD Tag- field mapping 
	AddMapping(Tagdata: any, Field: string) {
		if (Tagdata == "" && Field == "") {
			this.InsertError = "Please Select any Question Tag and Field";
			return;
		}
		else if (Tagdata == "") {
			this.InsertError = "Please Select a Question Tag";
			return;
		}
		else if (Field == "") {
			this.InsertError = "Please Select a Zendesk Field";
			return;
		}

		var res = Tagdata.split("::");
		var tag = res[0];
		var displayType = res[1].toUpperCase();
		var qid = res[2];
		var ZDField = Field.split("::")[1];

		var validationresult = this.validateMappings(Tagdata, Field);
		if (validationresult) {
			this.InsertError = this.AddorEditmapping(this.Tagmappingbackup, this.Tagmapping, tag, ZDField, this.InsertEditid, qid, this.searchKey);
		}
		if (this.InsertError != "")
			return;

		//Posting  mapping data and Inegration type to Parent component		
		this.InsertEditid = "";
		this.Field = "";
		this.Tagdata = "";

		if (this.CCMappings == null) {
			this.CCMappings = this.prepareIntegrationData();
		}
		else {
			this.LogTheMapping();
		}

		this.PostIntegration.emit({ mapping: this.CCMappings, value: this.ZendeskKey });
		this.CancelEdit();
	}

	/**
	 * 
	 * Editing the selected map to given details , this function is used  to enable, disable, update the seleceted mapping
	 * _id: Mapping id
	 *   Field: Field name of givne integration type
	 *  isDisabled:  is mapping  disabled or not
	 *   Tagmapping: Mapping list used as backup that contains all the  mapping, irrespective of search parameter
	 *   searchkey: Key used for search, not used in editing, but used to assign the exact mapping to Mapping list(to display in UI) with modified values  from mapping backup list if search is in use, so the same modificataion done to backup list are reflected in display list
	*/
	EditTagFieldMapping(_id: string, Questiontag: string, Field: string, isDisabled: string, Tagmappingbackup: any, searchkey: string) {

		var res = Questiontag.split("::");
		var tag = res[0];
		var Fieldarr = Field.split("::");
		var qid = res[1];
		for (var counterbkp = 0; counterbkp < Tagmappingbackup.length; counterbkp++) {

			if (Tagmappingbackup[counterbkp]._Id != _id)
				continue;
			if (tag != '') {
				Tagmappingbackup[counterbkp].Tag = tag;
			}
			if (qid != '') {
				Tagmappingbackup[counterbkp].QtnID = res[1];
			}
			if (Field != '') {
				Tagmappingbackup[counterbkp].Field = Fieldarr[0];
			}
			if (isDisabled != '') {
				Tagmappingbackup[counterbkp].disabled = isDisabled;
			}
		}
		this.LogTheMapping();
		this.SearchMap();
	}

	// Used to maintain the previous mapping backup with date and time
	LogTheMapping() {
		if (this.CCMappings == null)
			this.CCMappings = [];
		this.CCMappings.ZDAPIKey = this.ZDKey;
		this.CCMappings.ZDURL = this.ZDURL;
		this.CCMappings.mappings = this.Tagmappingbackup;
		for (var counterbkp = 0; counterbkp < this.Tagmappingbackup.length; counterbkp++) {
			this.Tagmappingbackup[counterbkp].time = new Date();
			if (this.CCMappings.mappingsBackup == null)
				this.CCMappings.mappingsBackup = [];
			this.CCMappings.mappingsBackup.push(this.Tagmappingbackup[counterbkp]);
		}
		this.PostIntegration.emit({ mapping: this.CCMappings, value: this.ZendeskKey });
	}

	//To display information in Pop up
	ShowinPopup(map: any, Action: string) {
		this.PopupAction = Action;
		this.samplemodal = true;
		switch (Action) {
			case "Edit": this.EnableDisablemap = map;
				this.PopupMessage = "Are you sure you want to edit?";
				this.modalTitle = "Edit Dialog";
				break;
			case "Enable": this.EnableDisablemap = map;
				this.PopupMessage = "Are you sure you want to enable?";
				this.modalTitle = "Enable Dialog";
				break;
			case "Disable": this.EnableDisablemap = map;
				this.PopupMessage = "Are you sure you want to disable?";
				this.modalTitle = "Disable Dialog";
				break;
		}
	}

	ngModalClose() {
		this.samplemodal = false;
		this.PopupMessage = "";
	}

	ConfirmAction() {
		this.samplemodal = false;
		switch (this.PopupAction) {
			case "Edit": this.EditInsertMap();
				break;
			case "Enable": this.EnableInsertMapping();
				break;
			case "Disable": this.DisableInsertMapping();
		}
	}

	//To fetch the respective edited tag data
	GetTagOnEdit(Questionid: string) {
		var questionobject = this.Questionslist.filter(item => item.id == Questionid);
		var Tagslist = questionobject[0].questionTags;
		var locationslist = questionobject[0].displayLocation;
		if (locationslist.length == 0) {
			return Object.keys(this.existingCCTags);
		}
		var LocationQuestions = this.Questionslist.filter(item => item.displayLocation.some(r => locationslist.includes(r)));
		LocationQuestions.forEach((singlequestion: any) => { Tagslist = Tagslist.concat(singlequestion.questionTags) });
		LocationQuestions = this.Questionslist.filter(item => (item.displayLocation.length === 0));
		LocationQuestions.forEach((singlequestion: any) => { Tagslist = Tagslist.concat(singlequestion.questionTags) });

		var finaltagslist = [];
		Tagslist.sort(function (a: string, b: string) {
			return (a.toLowerCase() > b.toLowerCase()) ? -1 : (a.toLowerCase() < b.toLowerCase()) ? 1 : 0;
		});

		Tagslist.reverse();

		Tagslist.forEach((singleTag: any) => {
			if (this.defaultCCTags.toUpperCase().indexOf(singleTag.toUpperCase()) == -1) {
				if (finaltagslist.indexOf(singleTag.toLowerCase()) < 0 && singleTag.toLowerCase() != "nps") {
					finaltagslist.push(singleTag.toLowerCase());

				}
			}
		});
		return finaltagslist;
	}

	//Editing mapping 
	EditInsertMap() {
		var map = this.EnableDisablemap;
		var selectedFieldType = this.ZDFields.filter(item => item.title.toLowerCase() == map["Field"].toLowerCase());
		this.InsertError = "";
		this.Message = '';
		this.existingCCKeys = null;
		this.existingCCKeys = this.GetTagOnEdit(map.QtnID);
		var ZDDrpValue = selectedFieldType[0].type + '::' + map["Field"];
		this.Field = ZDDrpValue;

		//storing the id of the mapping selected for edit
		this.InsertEditid = map._Id;
		this.Tagdata = "";
	}

	//Disable  Tag- field mapping
	DisableInsertMapping() {
		this.InsertError = "";
		this.Message = '';
		this.EditTagFieldMapping(this.EnableDisablemap._Id, this.EnableDisablemap.Tag + '::' + this.EnableDisablemap.QtnID, this.EnableDisablemap.Field, 'true', this.Tagmappingbackup, this.searchKey);
		this.CancelEdit();
	}

	//Enable  Tag- field mapping
	EnableInsertMapping() {
		var id = this.EnableDisablemap._Id;
		var QuestionTag = this.EnableDisablemap.Tag;
		var ZDField = this.EnableDisablemap.Field;
		this.InsertError = this.IsThisMappingExist(this.EnableDisablemap.QtnID, ZDField, id, this.Tagmappingbackup);
		this.Message = '';
		if (this.InsertError != "") {
			this.InsertError = "Question tag/Zen Desk Field already used, cannot be enabled";
			return;
		}
		this.EditTagFieldMapping(this.EnableDisablemap._Id, this.EnableDisablemap.Tag + '::' + this.EnableDisablemap.QtnID, this.EnableDisablemap.Field, 'false', this.Tagmappingbackup, this.searchKey);
		this.CancelEdit();
	}

	//Cancel Popup
	CancelEdit() {
		this.existingCCTags = this.GetExistingTags()[0];
		this.existingCCKeys = Object.keys(this.existingCCTags);
		this.InsertEditid = "";
		this.InsertError = "";
		this.Tagdata = "";
		this.Message = "";
	}

	//Search the mapping
	SearchMap() {
		this.InsertError = "";
		this.Tagmapping = this.Tagmappingbackup.filter((item) => item.Tag.toUpperCase().indexOf(this.searchKey.toUpperCase().trim()) > -1 || item.Field.toUpperCase().indexOf(this.searchKey.toUpperCase().trim()) > -1);
	}

	/**
	 * Sorting the map based on the given column
	 * column: Column to sort on
	 * Maporder: order of sorting, ascending or descending, common  for  all columns    
	 */
	SortMap(column: string) {
		this.maporder = !this.maporder;
		this.Tagmapping.sort((a, b) => {
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
}