import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AddStock {
  private baseUrl = 'https://afrilounges.teronsoftwares.com/'; // Your PHP server URL

  constructor(private http: HttpClient) { }

  addStock(userData: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const fullUrl = `${this.baseUrl}add-stock.php`;
    
    return this.http.post(fullUrl, userData, { headers });
  }
  
}
