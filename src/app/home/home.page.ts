import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  IonHeader, IonToolbar, IonTitle,
  IonContent, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent,
  IonItem, IonLabel, IonInput, IonDatetime,
  IonButton, IonProgressBar, IonRow,
  IonCol, IonIcon, IonSpinner, IonToast
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import * as allIcons from 'ionicons/icons';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    CommonModule, IonHeader, IonToolbar,
    IonTitle, IonContent, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent, IonItem,
    IonLabel, IonInput, IonDatetime, IonButton,
    IonProgressBar, IonRow, IonCol,
    IonIcon, IonSpinner, IonToast, ReactiveFormsModule
  ],
})
export class HomePage implements OnInit {
  summaryForm!: FormGroup;
  currentPage = 1;
  totalPages = 4;
  isLoading= false;

  pageTitles = [
    'Basic Information',
    'Sales Summary',
    'Stock Values',
    'Final Details'
  ];

  pageDescriptions = [
    'Enter the date and outlet/location details',
    'Record sales amounts and distributions',
    'Enter opening and closing stock values',
    'Add preparation and verification details'
  ];

  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private toastController: ToastController
  ) {
    addIcons(allIcons);
  }

  // Custom validator for non-empty strings
  private nonEmptyStringValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value === null || value === undefined || value.trim() === '') {
      return { required: true };
    }
    return null;
  }

  // Toast notification method
  private async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success', duration: number = 3000) {
    const toast = await this.toastController.create({
      message: message,
      duration: duration,
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

  ngOnInit() {
    this.initializeForm();
    this.setupFormCalculations();
  }

  private initializeForm() {
    this.summaryForm = this.formBuilder.group({
      date: [new Date().toISOString(), Validators.required],
      outlet: ['', Validators.required],
      totalSales: [{value: 0, disabled: false}],
      moneyToAgent: [0, [Validators.required, Validators.min(0)]],
      moneyToBank: [0, [Validators.required, Validators.min(0)]],
      cashOnHand: [0, [Validators.required, Validators.min(0)]],
      openingStockValue: [0, [Validators.required, Validators.min(0)]],
      closingStockValue: [0, [Validators.required, Validators.min(0)]],
      profit: [{value: 0, disabled: false}],
      preparedBy: ['', [Validators.required, this.nonEmptyStringValidator]],
      verifiedBy: ['', [Validators.required, this.nonEmptyStringValidator]]
    });
  }

  private setupFormCalculations() {
    // Calculate total sales automatically
    this.summaryForm.get('cashOnHand')?.valueChanges.subscribe(value => {
      console.log('Cash on Hand changed:', value);
      this.calculateTotalSales();
    });
    this.summaryForm.get('moneyToAgent')?.valueChanges.subscribe(value => {
      console.log('Money to Agent changed:', value);
      this.calculateTotalSales();
    });
    this.summaryForm.get('moneyToBank')?.valueChanges.subscribe(value => {
      console.log('Money to Bank changed:', value);
      this.calculateTotalSales();
    });

    // Calculate profit automatically
    this.summaryForm.get('totalSales')?.valueChanges.subscribe(() => this.calculateProfit());
    this.summaryForm.get('openingStockValue')?.valueChanges.subscribe(() => this.calculateProfit());
    this.summaryForm.get('closingStockValue')?.valueChanges.subscribe(() => this.calculateProfit());

    // Debug form field changes
    this.summaryForm.get('preparedBy')?.valueChanges.subscribe(value => {
      console.log('Prepared by changed to:', value);
    });
    this.summaryForm.get('verifiedBy')?.valueChanges.subscribe(value => {
      console.log('Verified by changed to:', value);
    });
  }

  private calculateTotalSales() {
    const cashOnHand = Number(this.summaryForm.get('cashOnHand')?.value) || 0;
    const moneyToAgent = Number(this.summaryForm.get('moneyToAgent')?.value) || 0;
    const moneyToBank = Number(this.summaryForm.get('moneyToBank')?.value) || 0;

    console.log('Calculating Total Sales:', { cashOnHand, moneyToAgent, moneyToBank });

    const totalSales = cashOnHand + moneyToAgent + moneyToBank;
    console.log('Total Sales calculated:', totalSales);

    this.summaryForm.get('totalSales')?.setValue(totalSales);
  }

  private calculateProfit() {
    const totalSales = Number(this.summaryForm.get('totalSales')?.value) || 0;
    const openingStockValue = Number(this.summaryForm.get('openingStockValue')?.value) || 0;
    const closingStockValue = Number(this.summaryForm.get('closingStockValue')?.value) || 0;

    const profit = totalSales - (openingStockValue - closingStockValue);
    this.summaryForm.get('profit')?.setValue(profit);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  canGoNext(): boolean {
    switch (this.currentPage) {
      case 1:
        return (this.summaryForm.get('date')?.valid ?? false) && (this.summaryForm.get('outlet')?.valid ?? false);
      case 2:
        return (this.summaryForm.get('moneyToAgent')?.valid ?? false) &&
               (this.summaryForm.get('moneyToBank')?.valid ?? false) &&
               (this.summaryForm.get('cashOnHand')?.valid ?? false);
      case 3:
        return (this.summaryForm.get('openingStockValue')?.valid ?? false) &&
               (this.summaryForm.get('closingStockValue')?.valid ?? false);
      case 4:
        const preparedByValue = this.summaryForm.get('preparedBy')?.value;
        const verifiedByValue = this.summaryForm.get('verifiedBy')?.value;
        return (this.summaryForm.get('preparedBy')?.valid ?? false) &&
               (this.summaryForm.get('verifiedBy')?.valid ?? false) &&
               preparedByValue?.trim() !== '' &&
               verifiedByValue?.trim() !== '';
      default:
        return false;
    }
  }

  async onSubmit() {
    if (this.summaryForm.valid) {
      this.isLoading = true;

      try {
        // Step 1: Generate PDF
        console.log('Generating PDF...');
        const currentFormData = this.summaryForm.value;
        const pdfBlob = await this.generatePDF(currentFormData);

        // Step 2: Upload to server (with loading state)
        console.log('Uploading to server...');
        const fileName = await this.uploadToServer(pdfBlob);

        // Step 3: Save PDF file locally (after server response)
        console.log('Saving PDF file locally...');
        await this.savePDF(pdfBlob, fileName);

        // Success message
        await this.showToast(`PDF report "${fileName}" has been generated, uploaded to server, and saved locally successfully!`, 'success');

        // Reset form and go back to first page
        this.currentPage = 1;
        this.summaryForm.reset();
        this.initializeForm();

      } catch (error) {
        console.error('Error during report generation:', error);
        await this.showToast('An error occurred while generating the report. Please try again.', 'danger');
      } finally {
        this.isLoading = false;
      }
    } else {
      await this.showToast('Please fill in all required fields correctly.', 'warning');
    }
  }

  getProgress(): number {
    return this.currentPage / this.totalPages;
  }

  async generatePDF(formData: any): Promise<Blob> {

    // Create a new jsPDF instance
    const pdf = new jsPDF();

    // Set font
    pdf.setFont('helvetica');

    // Add title
    pdf.setFontSize(20);
    pdf.setTextColor(40, 40, 40);
    pdf.text('African Lounges - Sales & Stock Summary Report', 20, 30);

    // Add date
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 20, 45);

    let yPosition = 65;

    // Basic Information Table
    pdf.setFontSize(16);
    pdf.setTextColor(60, 60, 60);
    pdf.text('Basic Information', 20, yPosition);
    yPosition += 10;

    // Basic Info Table
    const basicInfoData = [
      ['Field', 'Value'],
      ['Date', new Date(formData.date).toLocaleDateString()],
      ['Outlet/Location', formData.outlet || 'N/A']
    ];

    this.drawTable(pdf, basicInfoData, yPosition, 20);
    yPosition += (basicInfoData.length * 10) + 20;

    // Sales Summary Table
    pdf.setFontSize(16);
    pdf.setTextColor(60, 60, 60);
    pdf.text('Sales Summary', 20, yPosition);
    yPosition += 10;

    const salesData = [
      ['Description', 'Amount (MWK)'],
      ['Total Sales', (formData.totalSales || 0).toLocaleString()],
      ['Money to Agent', (formData.moneyToAgent || 0).toLocaleString()],
      ['Money to Bank', (formData.moneyToBank || 0).toLocaleString()],
      ['Cash on Hand', (formData.cashOnHand || 0).toLocaleString()]
    ];

    this.drawTable(pdf, salesData, yPosition, 20);
    yPosition += (salesData.length * 10) + 20;

    // Stock Value Summary Table
    pdf.setFontSize(16);
    pdf.setTextColor(60, 60, 60);
    pdf.text('Stock Value Summary', 20, yPosition);
    yPosition += 10;

    const stockData = [
      ['Description', 'Amount (MWK)'],
      ['Opening Stock Value', (formData.openingStockValue || 0).toLocaleString()],
      ['Closing Stock Value', (formData.closingStockValue || 0).toLocaleString()],
      ['Profit/Loss', (formData.profit || 0).toLocaleString()]
    ];

    this.drawTable(pdf, stockData, yPosition, 20);
    yPosition += (stockData.length * 10) + 20;

    // Add page break before authorization section
    pdf.addPage();
    yPosition = 30; // Reset Y position for new page

    // Authorization Table
    pdf.setFontSize(16);
    pdf.setTextColor(60, 60, 60);
    pdf.text('Authorization', 20, yPosition);
    yPosition += 10;

    const authData = [
      ['Field', 'Name'],
      ['Prepared by', formData.preparedBy || 'N/A'],
      ['Verified by', formData.verifiedBy || 'N/A']
    ];

    this.drawTable(pdf, authData, yPosition, 20);
    yPosition += (authData.length * 10) + 20;

    // Add footer
    pdf.setFontSize(10);
    pdf.setTextColor(150, 150, 150);
    pdf.text('This report was generated automatically by African Lounges Management System', 20, yPosition);

    // Return the PDF as a Blob
    return pdf.output('blob');
  }

  private drawTable(pdf: jsPDF, data: string[][], startY: number, startX: number) {
    const cellPadding = 5;
    const colWidth = 80;
    const rowHeight = 10;

    // Draw table headers
    pdf.setFontSize(12);
    pdf.setTextColor(255, 255, 255); // White text
    pdf.setFillColor(70, 130, 180); // Steel blue background

    // Header row
    pdf.rect(startX, startY, colWidth * 2, rowHeight, 'F');
    pdf.text(data[0][0], startX + cellPadding, startY + rowHeight - 3);
    pdf.text(data[0][1], startX + colWidth + cellPadding, startY + rowHeight - 3);

    // Draw table rows
    pdf.setTextColor(0, 0, 0); // Black text
    pdf.setFillColor(245, 245, 245); // Light gray background

    for (let i = 1; i < data.length; i++) {
      const y = startY + (i * rowHeight);

      // Alternate row colors
      if (i % 2 === 1) {
        pdf.setFillColor(245, 245, 245);
        pdf.rect(startX, y, colWidth * 2, rowHeight, 'F');
      } else {
        pdf.setFillColor(255, 255, 255);
        pdf.rect(startX, y, colWidth * 2, rowHeight, 'F');
      }

      // Draw cell borders
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(startX, y, colWidth, rowHeight);
      pdf.rect(startX + colWidth, y, colWidth, rowHeight);

      // Add text
      pdf.text(data[i][0], startX + cellPadding, y + rowHeight - 3);
      pdf.text(data[i][1], startX + colWidth + cellPadding, y + rowHeight - 3);
    }
  }

  async savePDF(pdfBlob: Blob, fileName: string): Promise<void> {
    saveAs(pdfBlob, fileName);
  }

  async uploadToServer(pdfBlob: Blob): Promise<string> {
    const fileName = `africanLounges-report-${new Date().toISOString().split('T')[0]}.pdf`;

    const formData = new FormData();
    formData.append('pdf', pdfBlob, fileName);
    formData.append('reportData', JSON.stringify(this.summaryForm.value));
    console.log(formData);

    // Replace with your actual server endpoint
    const serverUrl = 'https://afrilounges.teronsoftwares.com/send-report.php';

    try {
      const response = await this.http.post(serverUrl, formData).toPromise();
      console.log('Upload successful:', response);
      return fileName;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }
}
