import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Login {
  private baseUrl = 'https://afrilounges.teronsoftwares.com/'; // Your PHP server URL

  constructor(private http: HttpClient) { }

  login(userData: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const fullUrl = `${this.baseUrl}login.php`;
    
    return this.http.post(fullUrl, userData, { headers });
  }
  
}
