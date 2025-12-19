import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AddSale {

  private baseUrl = 'https://afrilounges.teronsoftwares.com/';

  constructor(private http: HttpClient) {}

  addSale(userData: any, pdfBlob: Blob): Observable<any> {
    const formData = new FormData();

    // Append PDF file
    formData.append(
      'pdf',
      pdfBlob,
      `sales_report_${Date.now()}.pdf`
    );

    // Append form fields
    Object.keys(userData).forEach(key => {
      if (userData[key] !== null && userData[key] !== undefined) {
        formData.append(key, userData[key]);
      }
    });

    const fullUrl = `${this.baseUrl}add-sale.php`;

    // ⚠️ Do NOT set headers here
    return this.http.post(fullUrl, formData);
  }
  
}
