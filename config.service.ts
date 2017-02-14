import { Injectable } from '@angular/core';
import { Http, Jsonp, Response, URLSearchParams } from '@angular/http';
import { Headers, RequestOptions } from '@angular/http';

@Injectable()
export class ConfigService {
    HttpURL: string = "https://cxapiconnect.getcloudcherry.com/";
    constructor(private http: Http, private jsonp: Jsonp) { }

    //Retreives data from given webapi url
    FetchData(Weburl: string) {
        Weburl = this.HttpURL + Weburl;
        let params = new URLSearchParams();
        params.set('callback', 'JSONP_CALLBACK');
        return this.jsonp.get(Weburl, { search: params });
    }

    //Retreives data from given CC url
    CCAPIGet(Weburl: string, AccessToken: string) {
        var storeToken: any;
        var logError: any;
        var headers = new Headers();
        headers.append('Accept', 'application/json');
        headers.append('Authorization', 'Bearer ' + AccessToken);
        return this.http.get(Weburl, { headers: headers });
    }

    //Posts data to given CC url
    CCAPIPost(body: any, Weburl: string, AccessToken: string) {

        var headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.append("Authorization", 'Bearer ' + AccessToken);
        return this.http.post(Weburl, JSON.stringify(body), { headers: headers });
    }

    //Authenticating CC with the given username and password
    CCauthenticate(username: string, password: string) {
        var storeToken: any;
        var logError: any;
        var body = '';//`username=${username}&password=${password}`;
        body = 'grant_type=password&username=' + username + '&password=' + password + ''
        var headers = new Headers();
        headers.append('Content-Type', 'application/x-www-form-urlencoded');
        return this.http.post('https://manage.getcloudcherry.com/api/LoginToken', body, { headers: headers });
    }
}