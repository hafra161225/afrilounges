import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonIcon, IonButton, IonButtons,
  IonItem, IonInput, IonAlert, IonBadge, IonModal, IonSelect, IonSelectOption,
  IonLabel, IonSpinner, IonSkeletonText, IonRefresher, IonRefresherContent,
  IonInfiniteScroll, IonInfiniteScrollContent, InfiniteScrollCustomEvent,
  RefresherCustomEvent, IonFab, IonFabButton, ToastController
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import * as allIcons from 'ionicons/icons';
import { GetDailyReports } from '../../services/get-daily-reports';
import { Preferences } from '@capacitor/preferences';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.page.html',
  styleUrls: ['./reports.page.scss'],
  standalone: true,
  schemas: [ CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule, IonHeader, IonToolbar, IonTitle, IonContent,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonIcon,
    IonButton, IonButtons, IonItem, IonInput, IonAlert, IonBadge,
    IonModal, IonSelect, IonSelectOption, IonLabel, ReactiveFormsModule,
    IonSpinner, FormsModule, IonSkeletonText, IonRefresher, IonRefresherContent,
    IonInfiniteScroll, IonInfiniteScrollContent, IonFab, IonFabButton
  ],
  encapsulation: ViewEncapsulation.None, // Add this
})
export class ReportsPage implements OnInit {
  isLoading: boolean = false;
  loadReportForm: FormGroup;
  offset = 0;
  limit = 10;
  isLoadingStock: boolean= false;
  searchWord: any;
  reportCount:any;
  afriId:any;
  searchQuery: any;
  searchDelay: any;
  
  reportData: any[] = [];
  isLoadingDelete: boolean= false;
  isLoadingDeleting: boolean= false;

  reports = [
    {
      id: 1,
      title: 'Daily Sales Report - Dec 17, 2024',
      date: '2024-12-17',
      status: 'completed',
      totalSales: 50000,
      format: 'PDF',
      type: 'Daily'
    },
    {
      id: 2,
      title: 'Weekly Summary - Week 50, 2024',
      date: '2024-12-15',
      status: 'completed',
      totalSales: 280000,
      format: 'PDF',
      type: 'Weekly'
    },
    {
      id: 3,
      title: 'Monthly Report - November 2024',
      date: '2024-11-30',
      status: 'processing',
      totalSales: 1200000,
      format: 'PDF',
      type: 'Monthly'
    }
  ];

  isLargeScreen = true; // Default to true for SSR compatibility

  constructor(private router: Router,
              private formBuilder: FormBuilder,
              private getDailyReports: GetDailyReports,
              private toastController: ToastController,
              private http: HttpClient
            ) {
              addIcons(allIcons); 
              this.loadReportForm = this.formBuilder.group({
                offset: [this.offset],
                limit: [this.limit]
              });
              // then update async
              Preferences.get({ key: 'afriId' }).then(result => {
                this.afriId= result.value ? JSON.parse(result.value) : null;
                console.log('afriId from Preferences:', this.afriId);
                this.loadReports();
              });
            }

  ngOnInit() {
    this.checkScreenSize();

    // Listen for window resize events
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        this.checkScreenSize();
      });
    }
  }

  checkScreenSize() {
    if (typeof window !== 'undefined') {
      // Consider large screen if width is 768px or more (tablet and desktop)
      this.isLargeScreen = window.innerWidth >= 768;
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'warning';
      case 'failed':
        return 'danger';
      default:
        return 'medium';
    }
  }

  navigateToForm() {
    this.router.navigate(['/home']);
  }

  viewReport(report: any) {
    console.log('Viewing report:', report);
    // Implement report viewing logic
  }
  
  async handleRefresh(event: RefresherCustomEvent){
    this.loadReports();
    event.target.complete();
  }

  downloadReport(report: any) {
    if (!report?.pdf) {
      console.error('Invalid PDF file path');
      return;
    }

    // Ensure full URL
    const pdfUrl = report.pdf.startsWith('http')
      ? report.pdf
      : `https://afrilounges.teronsoftwares/${report.pdf}`;

    // Create a temporary anchor tag
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.target = '_blank';      // open in new tab
    link.rel = 'noopener';       // security best practice
    link.download = '';          // hint browser to download

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  
  private async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'top',
      buttons: [
        {
          text: 'OK',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  async loadReports(){
    if (this.loadReportForm.invalid) {
      await this.showToast('Network Error. Please refresh or restart app', 'warning');
      return;
    }

    this.isLoadingStock = true;        
    try {
      // Get form values
      const formData = this.loadReportForm.value;
      console.log('Great: ', formData);

      this.getDailyReports.getDailyReports(formData).subscribe({
        next: async (response: any) => {
          this.isLoadingStock = false;
          
          if (response && response.success) {
            const final= response.data;
            this.reportCount= response.count;
            console.log(final);
            if(this.reportCount > 0){
              this.reportData= (final.posts || final).map((p: any) => {
                return {
                  pdf: p.pdf_file,
                  date: p.created_at,
                  status: 'completed'
                };
              });
              this.reportCount = this.reportData.length;
            }else{
              this.reportData= [];
              this.reportCount = 0;
              await this.showToast('No results with the word ', 'danger');
            }
            console.log('Fetching data success:', response);
          } else {
            this.reportData= [];
            this.reportCount= 0;
            // await this.showToast(response?.message || 'Fetching data failed', 'danger');
          }
        },
        error: async (error: any) => {
          // await loading.dismiss();
          this.isLoadingStock = true;
          console.error('Fetching data error:', error);

          await this.showToast('Fetching data failed. Please try again.', 'danger');
        }
      });
      
    } catch (error) {
      // await loading.dismiss();
      this.isLoadingStock = true;
      console.error('Unexpected error:', error);
      
      await this.showToast('An unexpected error occurred', 'danger');
    }

  }

  
  async loadMoreReports(event: InfiniteScrollCustomEvent){
      
      // Increment offset for pagination
      this.offset += this.limit;
      this.loadReportForm.patchValue({ offset: this.offset });
  
      if (this.loadReportForm.invalid) {
        await this.showToast('Network Error. Please refresh or restart app', 'warning');
        return;
      }
  
      try {
        // Get form values
        const formData = this.loadReportForm.value;
        console.log('Great: ', formData);

        this.getDailyReports.getDailyReports(formData).subscribe({
          next: async (response: any) => {
            this.isLoadingStock = false;
            
            if (response && response.success) {
              const final= response.data;
              this.reportCount= response.count;
              console.log(final);
              if(this.reportCount > 0){
                this.reportData= (final.posts || final).map((p: any) => {
                  return {
                    pdf: p.pdf_file,
                    date: p.created_at,
                    status: 'completed'
                  };
                });
                this.reportCount = this.reportData.length;
              }else{
                this.reportData= [];
                this.reportCount = 0;
                await this.showToast('No results with the word ', 'danger');
              }
              console.log('Fetching data success:', response);
            } else {
              this.reportData= [];
              this.reportCount= 0;
              // await this.showToast(response?.message || 'Fetching data failed', 'danger');
            }
          },
          error: async (error: any) => {
            // await loading.dismiss();
            this.isLoadingStock = true;
            console.error('Fetching data error:', error);

            await this.showToast('Fetching data failed. Please try again.', 'danger');
          }
        });
        
      } catch (error) {
        // await loading.dismiss();
        this.isLoadingStock = true;
        console.error('Unexpected error:', error);
        
        await this.showToast('An unexpected error occurred', 'danger');
      }

    }
}
