import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GetDailyReports {
  private baseUrl = 'https://afrilounges.teronsoftwares.com/'; // Your PHP server URL

  constructor(private http: HttpClient) { }

  getDailyReports(userData: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const fullUrl = `${this.baseUrl}get-daily-reports.php`;
    console.log('Payload received: ', userData);
    
    return this.http.post(fullUrl, userData, { headers });
  }
  
}
