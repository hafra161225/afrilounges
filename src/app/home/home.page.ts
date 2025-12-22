import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle,
  IonContent, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent,
  IonItem, IonLabel, IonInput, IonDatetime,
  IonButton, IonProgressBar, IonRow,
  IonCol, IonIcon, IonSpinner, IonToast, IonFab, 
  IonFabButton, RefresherCustomEvent, IonRefresher, 
  IonRefresherContent, IonSkeletonText, IonFabList,
  ToastController, AlertController, IonInputPasswordToggle
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import * as allIcons from 'ionicons/icons';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import { GetStock } from '../services/get-stock';
import { AddSale } from '../services/add-sale';
import { Preferences } from '@capacitor/preferences';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  schemas: [ CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule, IonHeader, IonToolbar,
    IonTitle, IonContent, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent, IonItem,
    IonLabel, IonInput, IonButton,
    IonProgressBar, IonRow, IonCol,
    IonIcon, IonSpinner, IonToast, ReactiveFormsModule,
    IonRefresher, IonRefresherContent, IonSkeletonText,IonFab, 
    IonFabButton, IonFabList, IonInputPasswordToggle
  ],
  encapsulation: ViewEncapsulation.None, // Add this
})
export class HomePage implements OnInit {
  summaryForm!: FormGroup;
  loadStockForm: FormGroup;
  currentPage = 1;
  totalPages = 5;
  isLoading = false;
  isGeneratingReport = false;
  offset = 0;
  limit = 5;
  isLoadingStock: boolean= false;
  searchWord: any;
  stockCount:any;
  afriId:any;
  searchQuery: any;
  searchDelay: any;
  
  stockData: any[] = [];
  isLoadingDelete: boolean= false;
  isLoadingDeleting: boolean= false;

  // Beer stock data (in a real app, this would come from a service)
  beerStock = [
    { id: 1, name: 'Castle Lager', type: 'Lager', qty: 35, shots: 25, buyingPrice: 12000, sellingPrice: 15000 },
    { id: 2, name: 'Carlsberg', type: 'Lager', qty: 28, shots: 18, buyingPrice: 11000, sellingPrice: 14000 },
    { id: 3, name: 'Heineken', type: 'Lager', qty: 18, shots: 15, buyingPrice: 13000, sellingPrice: 16000 },
    { id: 4, name: 'Guinness', type: 'Stout', qty: 12, shots: 8, buyingPrice: 15000, sellingPrice: 18000 },
    { id: 5, name: 'Tusker Lager', type: 'Lager', qty: 42, shots: 21, buyingPrice: 10000, sellingPrice: 13000 }
  ];

  filteredBeers = [...this.stockData];
  selectedBeer: any = null;

  pageTitles = [
    'Beer Selection',
    'Quantity & Shots',
    'Payment Method',
    'Checkout',
    'Authentication'
  ];

  pageDescriptions = [
    'Select the beer you want to sell',
    'Enter quantity and shots to sell',
    'Choose your payment method',
    'Review and confirm your sale',
    'Enter your credentials to complete the sale'
  ];

  paymentMethods = [
    { value: 'cash_in_hand', label: 'Cash in Hand', icon: 'cash-outline' },
    { value: 'money_to_agent', label: 'Money to Agent', icon: 'person-outline' },
    { value: 'money_to_bank', label: 'Money to Bank', icon: 'business-outline' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private toastController: ToastController,
    private alertController: AlertController,
    private router: Router,
    private getStockService: GetStock,
    private getAddSaleService: AddSale,
    private cdr: ChangeDetectorRef
  ) {
    addIcons(allIcons);
    this.loadStockForm = this.formBuilder.group({
      SearchQuery: [null],
      offset: [this.offset],
      limit: [this.limit]
    });
  }

  // Custom validator for non-empty strings
  private nonEmptyStringValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value === null || value === undefined || value.trim() === '') {
      return { required: true };
    }
    return null;
  }  

  async handleRefresh(event: RefresherCustomEvent){
    this.loadStock();
    event.target.complete();
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
    this.loadStock();
  }

  private initializeForm() {
    this.summaryForm = this.formBuilder.group({
      // Page 1: Beer Selection
      selectedBeerId: ['', Validators.required],

      // Page 2: Quantity & Shots
      quantity: [0, [Validators.required, Validators.min(0)]],
      shots: [0, [Validators.required, Validators.min(0)]],

      // Page 3: Payment Method
      paymentMethod: ['', Validators.required],

      // Page 4: Checkout
      customerName: [''],
      notes: [''],
      outlet: ['', Validators.required],

      // Page 5: Authentication
      userName: ['', Validators.required],
      password: ['', Validators.required],

      // Calculated fields
      totalAmount: [{value: 0, disabled: true}],
      change: [{value: 0, disabled: true}]
      
    });
  }

  private setupFormCalculations() {
    // Calculate total amount when quantity changes
    this.summaryForm.get('quantity')?.valueChanges.subscribe(() => {
      this.calculateTotalAmount();
    });

    // Watch for beer selection changes
    this.summaryForm.get('selectedBeerId')?.valueChanges.subscribe((beerId) => {
      this.selectedBeer = this.stockData.find(beer => beer.id === beerId);
      if (this.selectedBeer) {
        this.summaryForm.patchValue({ outlet: this.selectedBeer.outlet || '' });
      }
      this.calculateTotalAmount();
    });

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
        return (this.summaryForm.get('selectedBeerId')?.valid ?? false);
      case 2:
        const quantity = this.summaryForm.get('quantity')?.value || 0;
        const shots = this.summaryForm.get('shots')?.value || 0;
        const outlet = this.summaryForm.get('outlet')?.value || null;
        const selectedBeer = this.getSelectedBeer();
        console.log('Outlet set: ', outlet);

        // Check if either quantity or shots is greater than 0 and within available stock
        // Valid if: (quantity > 0 AND shots == 0 AND quantity <= available stock) OR
        //          (shots > 0 AND quantity == 0 AND shots <= available shots)
        const quantityValid = quantity > 0 && shots === 0 && quantity <= (selectedBeer?.qty || 0);
        const shotsValid = shots > 0 && quantity === 0 && shots <= (selectedBeer?.shots || 0);

        return (quantityValid || shotsValid);
      case 3:
        return (this.summaryForm.get('paymentMethod')?.valid ?? false);
      case 4:
        // Checkout page - always allow proceeding
        return true;
      case 5:
        // Authentication page - validate username and password
        return (this.summaryForm.get('userName')?.valid ?? false) &&
               (this.summaryForm.get('password')?.valid ?? false);
      default:
        return false;
    }
  }

  getSelectedBeer() {
    const beerId = this.summaryForm.get('selectedBeerId')?.value;
    return this.stockData.find(beer => beer.id === beerId);
  }

  async onSubmit() {
    if (this.summaryForm.valid) {
      this.isLoading = true;
      this.cdr.detectChanges(); // Force change detection to show loading state immediately

      // Generate today's sales report asynchronously to prevent UI blocking
      const currentFormData = this.summaryForm.value;

      // Use setTimeout to make PDF generation non-blocking
      setTimeout(async () => {
          try {
            const pdfBlob = await this.generateSalesReport(currentFormData);
            console.log('Gaming: ', pdfBlob);
            console.log('Jack: ', currentFormData);

            this.getAddSaleService.addSale(currentFormData, pdfBlob).subscribe({
          next: async (response: any) => {
            console.log('Response', response);
            
            if (response && response.success) {
              this.isLoading = false;
              this.cdr.detectChanges();

              // Step 3: Save PDF file locally (after server response)
              console.log('Saving PDF file locally...');
              await this.saveSalePDF(pdfBlob);

              // Success message
              await this.showToast(`Sale completed! generated and saved.`, 'success');

              // Reset form and go back to first page
              this.currentPage = 1;
              this.summaryForm.reset();
              this.initializeForm();
              this.selectedBeer = null;
              this.filteredBeers = [...this.stockData];
              this.loadStock();

            } else {
              this.isLoading = false;
              this.cdr.detectChanges();
              await this.showToast(response?.message || 'Sale failed', 'danger');
            }
          },
          error: async (error: any) => {
            // await loading.dismiss();
            this.isLoading = false;
            this.cdr.detectChanges();
            // console.error('Registration error:', error);

            await this.showToast('Sale failed. Please try again.', 'danger');
          }
        });

          } catch (pdfError) {
            console.error('PDF generation error:', pdfError);
            this.isLoading = false;
            this.cdr.detectChanges();
            await this.showToast('Error generating sales report. Please try again.', 'danger');
          }
        }, 0); // Execute in next tick to prevent UI blocking
      } else {
       this.isLoading= false;
       this.cdr.detectChanges();
        await this.showToast('Please fill in all required fields correctly.', 'warning');
      }
  }

  onBeerSearch(event: any) {
    const value = (event.detail.value || '').trim().toLowerCase();
    this.searchQuery = value;
    console.log('Search Query:', this.searchQuery);
    // Clear previous timer so we wait before sending request
    clearTimeout(this.searchDelay);

    this.searchDelay = setTimeout(() => {
      this.loadStock(this.searchQuery);
    }, 400); // waits 400ms after the user stops typing
  }

  selectBeer(beer: any) {
    this.summaryForm.patchValue({
      selectedBeerId: beer.id,
      outlet: beer.outlet || ''
    });
    this.selectedBeer = beer;
    this.calculateTotalAmount();
  }

  calculateTotalAmount() {
    const quantity = this.summaryForm.get('quantity')?.value || 0;
    const shots = this.summaryForm.get('shots')?.value || 0;
    const selectedBeer = this.getSelectedBeer();
    if (selectedBeer) {
      const total= 
        shots > 0
          ? selectedBeer.sellingPrice * shots   // spirits / shots-based items
          : quantity * selectedBeer.sellingPrice;          // normal items
      this.summaryForm.patchValue({ totalAmount: total });
    }
  }

  getMaxQuantity(): number {
    return this.selectedBeer?.qty || 0;
  }

  getMaxShots(): number {
    return this.selectedBeer?.shots || 0;
  }

  getPaymentDescription(methodValue: string): string {
    switch (methodValue) {
      case 'cash_in_hand':
        return 'Pay with cash immediately';
      case 'money_to_agent':
        return 'Payment through agent commission';
      case 'money_to_bank':
        return 'Bank transfer payment';
      default:
        return '';
    }
  }

  getPaymentMethodLabel(): string {
    const method = this.paymentMethods.find(m => m.value === this.summaryForm.get('paymentMethod')?.value);
    return method ? method.label : '';
  }

  getProgress(): number {
    return this.currentPage / this.totalPages;
  }

  resetForm() {
    // Reset form to initial state
    this.currentPage = 1;
    this.summaryForm.reset();
    this.initializeForm();

    // Clear selected beer and reset filtered list
    this.selectedBeer = null;
    this.filteredBeers = [...this.stockData];

    // Show confirmation toast
    this.showToast('Form has been reset', 'success');
  }

  async downloadTodaysReport() {
    await this.promptForSignatures();
  }

  async promptForSignatures() {
    const alert = await this.alertController.create({
      header: 'Report Signatures',
      message: 'Please enter the names for report authorization',
      inputs: [
        {
          name: 'preparedBy',
          type: 'text',
          placeholder: 'Prepared by (Full Name)',
          value: this.summaryForm.get('preparedBy')?.value || '',
          attributes: {
            required: true
          }
        },
        {
          name: 'verifiedBy',
          type: 'text',
          placeholder: 'Verified by (Full Name)',
          value: this.summaryForm.get('verifiedBy')?.value || '',
          attributes: {
            required: true
          }
        },
        {
          name: 'outlet',
          type: 'text',
          placeholder: 'Outlet/Location',
          value: this.summaryForm.get('outlet')?.value || '',
          attributes: {
            required: true
          }
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Generate Report',
          handler: async (data) => {
            if (data.preparedBy && data.verifiedBy && data.outlet) {
              // Start processing immediately
              this.performDownloadAndUpload(data.preparedBy, data.verifiedBy, data.outlet);
              return true; // Close alert
            } else {
              this.showToast('All fields (prepared by, verified by, and outlet) are required', 'warning');
              return false; // Keep alert open
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async performDownloadAndUpload(preparedBy: string, verifiedBy: string, outlet: string) {
    try {
      this.isGeneratingReport = true;

      let reportFormData: any = null;

      try {
        // First, try to get report data from server
        const reportData = await this.getReportDataFromServer(preparedBy, verifiedBy, outlet);
        const finishedData = reportData.data;

        // Create report data object directly from server response
        reportFormData = {
          preparedBy: finishedData.preparedBy,
          verifiedBy: finishedData.verifiedBy,
          outlet: outlet,
          cashOnHand: finishedData.cashOnHand,
          moneyToAgent: finishedData.moneyToAgent,
          moneyToBank: finishedData.moneyToBank,
          totalSales: finishedData.totalSales,
          openingStockValue: finishedData.openingStockValue,
          closingStockValue: finishedData.closingStockValue,
          profit: finishedData.profit,
          date: finishedData.date || new Date().toLocaleDateString()
        };
      } catch (serverError) {
        console.warn('Server request failed, falling back to sales report:', serverError);
        // reportFormData remains null, will use sales report
      }

      // Generate PDF - use daily report if server data available, otherwise sales report
      console.log('Data Being sent: ', reportFormData);
      let pdfBlob: Blob;

      if (reportFormData && Object.keys(reportFormData).length > 0) {
        // Generate daily report with server data
        pdfBlob = await this.generateDailyReport(reportFormData);
      } else {
        // Fall back to sales report (individual transaction)
        pdfBlob = await this.generateSalesReport(this.summaryForm.value);
      }

      // Save the PDF using platform-specific method
      const fileName = `sales-report-${new Date().toISOString().split('T')[0]}.pdf`;
      await this.savePDFFile(pdfBlob, fileName);

      // Upload to server (with report data if available)
      await this.uploadToServer(pdfBlob, reportFormData);

      // Show success toast
      this.showToast('Report downloaded and sent to server successfully', 'success');
      this.loadStock();
    } catch (error) {
      console.error('Error processing report:', error);
      this.showToast('Error processing report', 'danger');
    } finally {
      this.isGeneratingReport = false;
    }
  }

  async getReportDataFromServer(preparedBy: string, verifiedBy: string, outlet: string): Promise<any> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    const requestData = {
      preparedBy: preparedBy,
      verifiedBy: verifiedBy,
      outlet: outlet,
      date: today
    };

    try {
      // Replace with your actual server endpoint for getting report data
      const serverUrl = 'https://afrilounges.teronsoftwares.com/generate-report.php';

      const response: any = await this.http.post(serverUrl, requestData).toPromise();
      console.log('Report data received from server:', response);
      const done= response.data;
      return response;
    } catch (error) {
      console.error('Failed to get report data from server:', error);
      throw error;
    }
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  async generateSalesReport(formData: any): Promise<Blob> {
    const selectedBeer = this.stockData.find(beer => beer.id === formData.selectedBeerId);

    // Create a new jsPDF instance
    const pdf = new jsPDF();

    // Set font
    pdf.setFont('helvetica');

    // Add title
    pdf.setFontSize(20);
    pdf.setTextColor(40, 40, 40);
    pdf.text('AfriLounges - Sales Receipt', 20, 30);

    // Add date and time
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    const now = new Date();
    pdf.text(`Date: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, 20, 45);
    pdf.text(`Receipt #: ${Date.now()}`, 20, 52);

    let yPosition = 70;

    // Customer/Sale Information
    pdf.setFontSize(14);
    pdf.setTextColor(60, 60, 60);
    pdf.text('Sale Details', 20, yPosition);
    yPosition += 15;

    // Sale details table
    const saleData = [
      ['Item', 'Details'],
      ['Outlet', selectedBeer?.outlet || 'N/A'],
      ['Beer', selectedBeer?.name || 'N/A'],
      ['Type', selectedBeer?.type || 'N/A'],
      ['Quantity', formData.quantity?.toString() || '0'],
      ['Shots', formData.shots?.toString() || '0'],
      ['Unit Price', `MWK ${selectedBeer?.sellingPrice?.toLocaleString() || '0'}`],
      ['Payment Method', this.getPaymentMethodLabel()]
    ];

    this.drawTable(pdf, saleData, yPosition, 20);
    yPosition += (saleData.length * 10) + 20;

    // Total section
    pdf.setFontSize(16);
    pdf.setTextColor(40, 40, 40);
    if(formData.quantity > 0){
      const totalAm= formData.quantity * selectedBeer?.sellingPrice;
      pdf.text(`Total Amount: MWK ${totalAm?.toLocaleString() || '0'}`, 20, yPosition);
      yPosition += 20;
    }else{
      const totalAmounts= formData.shots * selectedBeer?.sellingPrice;
      pdf.text(`Total Amount: MWK ${totalAmounts?.toLocaleString() || '0'}`, 20, yPosition);
      yPosition += 20;
    }

    // Additional info
    if (formData.customerName) {
      pdf.setFontSize(12);
      pdf.setTextColor(60, 60, 60);
      pdf.text(`Customer: ${formData.customerName}`, 20, yPosition);
      yPosition += 10;
    }

    if (formData.notes) {
      pdf.text(`Notes: ${formData.notes}`, 20, yPosition);
      yPosition += 10;
    }

    // Footer
    pdf.setFontSize(10);
    pdf.setTextColor(150, 150, 150);
    pdf.text('Thank you for your business! - AfriLounges Management System', 20, yPosition);

    // Return the PDF as a Blob
    return pdf.output('blob');
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
    await this.savePDFFile(pdfBlob, fileName);
  }

  async saveSalePDF(pdfBlob: Blob): Promise<void> {
    const now = new Date();
    const fileName =
      `sale-receipt_${now.getFullYear()}-` +
      `${String(now.getMonth() + 1).padStart(2, '0')}-` +
      `${String(now.getDate()).padStart(2, '0')}_` +
      `${String(now.getHours()).padStart(2, '0')}-` +
      `${String(now.getMinutes()).padStart(2, '0')}-` +
      `${String(now.getSeconds()).padStart(2, '0')}.pdf`;

    await this.savePDFFile(pdfBlob, fileName);
  }

  async generateDailyReport(reportData: any): Promise<Blob> {
    // Create a new jsPDF instance
    const pdf = new jsPDF();

    // Set font
    pdf.setFont('helvetica');

    // Add header with background
    pdf.setFillColor(70, 130, 180); // Steel blue background
    pdf.rect(0, 0, 210, 25, 'F');

    // Add title with white text
    pdf.setFontSize(22);
    pdf.setTextColor(255, 255, 255);
    pdf.text('AfriLounges - Daily Report', 20, 18);

    // Add date and outlet with white text
    pdf.setFontSize(10);
    pdf.text(`Report Date: ${reportData.date || new Date().toLocaleDateString()}`, 20, 25);
    pdf.text(`Outlet: ${reportData.outlet || 'N/A'}`, 80, 25);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 140, 25);

    let yPosition = 40;

    // Financial Summary Section
    pdf.setFontSize(16);
    pdf.setTextColor(70, 130, 180);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Financial Summary', 20, yPosition);
    yPosition += 8;

    // Add a line under the section title
    pdf.setDrawColor(70, 130, 180);
    pdf.setLineWidth(0.5);
    pdf.line(20, yPosition, 190, yPosition);
    yPosition += 12;

    // Financial data table
    const financialData = [
      ['Description', 'Amount'],
      ['Cash On Hand', `MWK ${reportData.cashOnHand?.toLocaleString() || '0'}`],
      ['Money to Agent', `MWK ${reportData.moneyToAgent?.toLocaleString() || '0'}`],
      ['Money to Bank', `MWK ${reportData.moneyToBank?.toLocaleString() || '0'}`],
      ['Total Sales', `MWK ${reportData.totalSales?.toLocaleString() || '0'}`]
    ];

    this.drawDailyReportTable(pdf, financialData, yPosition, 20);
    yPosition += (financialData.length * 12) + 20;

    // Stock Summary Section
    pdf.setFontSize(16);
    pdf.setTextColor(70, 130, 180);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Stock Summary', 20, yPosition);
    yPosition += 8;

    // Add a line under the section title
    pdf.setDrawColor(70, 130, 180);
    pdf.setLineWidth(0.5);
    pdf.line(20, yPosition, 190, yPosition);
    yPosition += 12;

    const stockData = [
      ['Description', 'Value'],
      ['Opening Stock Value', `MWK ${reportData.openingStockValue?.toLocaleString() || '0'}`],
      ['Closing Stock Value', `MWK ${reportData.closingStockValue?.toLocaleString() || '0'}`],
      ['Profit', `MWK ${reportData.profit?.toLocaleString() || '0'}`]
    ];

    this.drawDailyReportTable(pdf, stockData, yPosition, 20);
    yPosition += (stockData.length * 12) + 25;

    // Authorization Section
    pdf.setFontSize(16);
    pdf.setTextColor(70, 130, 180);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Authorization', 20, yPosition);
    yPosition += 8;

    // Add a line under the section title
    pdf.setDrawColor(70, 130, 180);
    pdf.setLineWidth(0.5);
    pdf.line(20, yPosition, 190, yPosition);
    yPosition += 12;

    const authData = [
      ['Role', 'Name'],
      ['Prepared by', reportData.preparedBy || ''],
      ['Verified by', reportData.verifiedBy || '']
    ];

    this.drawDailyReportTable(pdf, authData, yPosition, 20);
    yPosition += (authData.length * 12) + 20;

    // Add footer
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.setFont('helvetica', 'normal');
    pdf.text('This report was generated automatically by AfriLounges Management System', 20, yPosition);
    yPosition += 5;
    pdf.text('© 2024 AfriLounges - All rights reserved', 20, yPosition);

    return pdf.output('blob');
  }

  drawDailyReportTable(pdf: any, data: string[][], startY: number, startX: number) {
    const cellPadding = 5;
    const colWidth = 80;
    const rowHeight = 12;
    const numCols = data[0]?.length || 2;

    // Draw table headers
    pdf.setFontSize(12);
    pdf.setTextColor(255, 255, 255); // White text
    pdf.setFillColor(70, 130, 180); // Steel blue background

    // Header row
    pdf.rect(startX, startY, colWidth * numCols, rowHeight, 'F');
    for (let col = 0; col < numCols; col++) {
      pdf.text(data[0][col], startX + col * colWidth + cellPadding, startY + rowHeight - 3);
    }

    // Draw table rows
    pdf.setTextColor(0, 0, 0); // Black text

    for (let i = 1; i < data.length; i++) {
      const y = startY + (i * rowHeight);

      // Alternate row colors
      if (i % 2 === 1) {
        pdf.setFillColor(245, 245, 245); // Light gray background
        pdf.rect(startX, y, colWidth * numCols, rowHeight, 'F');
      } else {
        pdf.setFillColor(255, 255, 255); // White background
        pdf.rect(startX, y, colWidth * numCols, rowHeight, 'F');
      }

      // Draw cell borders and add text
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.1);

      for (let col = 0; col < numCols; col++) {
        const x = startX + col * colWidth;
        pdf.rect(x, y, colWidth, rowHeight);

        // Add text with proper alignment
        const cellText = data[i][col] || '';
        if (col === 0) {
          // Left align labels
          pdf.text(cellText, x + cellPadding, y + rowHeight - 3);
        } else {
          // Right align values (numbers)
          pdf.text(cellText, x + colWidth - cellPadding, y + rowHeight - 3, { align: 'right' });
        }
      }
    }
  }

  async savePDFFile(pdfBlob: Blob, fileName: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      // Mobile app - use Capacitor Filesystem
      try {
        if (!fileName.endsWith('.pdf')) {
          fileName += '.pdf';
        }
        fileName = fileName
                  .replace(/\.pdf$/i, '')      // remove .pdf if exists
                  .replace(/[^a-zA-Z0-9_-]/g, '_') // REMOVE ALL unsafe chars
                  + '.pdf';
                  
        // Convert blob to base64
        const base64Data = await this.blobToBase64(pdfBlob);

        // 🔥 CRITICAL FIX: remove data:application/pdf;base64,
        const cleanBase64 = base64Data;

        console.log({
                      fileName,
                      fileNameLength: fileName.length,
                      base64Length: cleanBase64.length,
                      blobSize: pdfBlob.size
                    });

        // Try different directories in order of preference
        let result: { uri: string; [key: string]: any } | undefined;
        const directoriesToTry = [
          { dir: Directory.Cache, name: 'Cache' }
        ];

        // Special handling for mobile - try downloads folder first
        if (Capacitor.isNativePlatform()) {
          try {
            console.log('Trying to save to Downloads folder...');
            // Try to save directly to Downloads subfolder
            result = await Filesystem.writeFile({
              path: `Downloads/${fileName}`,
              data: cleanBase64,
              directory: Directory.ExternalStorage
            });
            console.log('Successfully saved to Downloads folder');
          } catch (downloadsError) {
            console.warn('Downloads folder failed, trying external storage root:', downloadsError);
            try {
              // Fallback to external storage root
              result = await Filesystem.writeFile({
                path: fileName,
                data: cleanBase64,
                directory: Directory.ExternalStorage
              });
              console.log('Successfully saved to external storage');
            } catch (externalError) {
              console.warn('External storage also failed:', externalError);
              // Continue with regular directory attempts
            }
          }
        }

        // If external storage didn't work (or we're not on Android), try other directories
        if (!result) {
          for (const { dir, name } of directoriesToTry) {
            try {
              console.log(`Attempting to save to ${name} directory...`);
              result = await Filesystem.writeFile({
                path: fileName,
                data: cleanBase64,
                directory: dir
              });
              console.log(`Successfully saved to ${name} directory`);
              break;
            } catch (error) {
              console.warn(`Failed to save to ${name} directory:`, error);
            if (dir === Directory.Cache) {
              // If all directories fail, throw the last error
              throw new Error(`Failed to save PDF to any accessible directory. Last error: ${error}`);
            }
            }
          }
        }

        // Ensure result is defined (TypeScript safety check)
        if (!result) {
          throw new Error('Failed to save file to any directory');
        }

        // Try to share the file, with fallback options
        try {
          await Share.share({
            title: 'AfriLounges Report',
            text: 'Your report has been downloaded',
            url: result.uri,
            dialogTitle: 'Share Report'
          });
          console.log('File shared successfully via filesystem');
        } catch (shareError) {
          console.warn('Filesystem sharing failed, trying alternative method:', shareError);

          // Fallback: Try to share using a data URL
          try {
            const dataUrl = `data:application/pdf;base64,${cleanBase64}`;
            await Share.share({
              title: 'AfriLounges Report',
              text: 'Your report has been generated',
              url: dataUrl,
              dialogTitle: 'Share Report'
            });
            console.log('File shared successfully via data URL');
          } catch (dataUrlError) {
            console.error('Data URL sharing also failed:', dataUrlError);
            // Final fallback: Just show a success message
            this.showToast('Report saved successfully! Check your device storage.', 'success');
          }
        }

        console.log('File saved successfully on mobile:', result.uri);
        console.log('File path:', result.uri);
        console.log('Full result object:', result);
      } catch (error) {
        console.error('Error saving file on mobile:', error);
        throw error;
      }
    } else {
      // Web browser - use file-saver
      saveAs(pdfBlob, fileName);
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onerror = () => reject(new Error('Failed to read blob'));

      reader.onloadend = () => {
        const result = reader.result as string;

        if (!result || !result.includes(',')) {
          reject(new Error('Invalid base64 result'));
          return;
        }

        // ✅ Return CLEAN base64 only (no data: header)
        resolve(result.split(',')[1]);
      };

      reader.readAsDataURL(blob);
    });
  }


  async uploadToServer(pdfBlob: Blob, formData?: any): Promise<string> {
    const fileName = `africanLounges-report-${new Date().toISOString().split('T')[0]}.pdf`;

    const uploadFormData = new FormData();
    uploadFormData.append('pdf', pdfBlob, fileName);
    uploadFormData.append('reportData', JSON.stringify(formData || this.summaryForm.value));
    console.log(uploadFormData);

    // Replace with your actual server endpoint
    const serverUrl = 'https://afrilounges.teronsoftwares.com/send-report.php';

    try {
      const response = await this.http.post(serverUrl, uploadFormData).toPromise();
      console.log('Upload successful:', response);
      return fileName;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

   
  async loadStock(searchKeyword: any = null) {
    this.loadStockForm.patchValue({ SearchQuery: searchKeyword, offset: this.offset, limit: this.limit });

    if (this.loadStockForm.invalid) {
      await this.showToast('Network Error. Please refresh or restart app', 'warning');
      return;
    }

    this.isLoadingStock = true;
        
    try {
      // Get form values
      const formData = this.loadStockForm.value;
      console.log('Great: ', formData);

      this.getStockService.getStock(formData).subscribe({
        next: async (response: any) => {
          this.isLoadingStock = false;
          
          if (response && response.success) {
            const final= response.data;
            this.stockCount= response.count;
            console.log(final);
            if(this.stockCount > 0){
              this.stockData= (final.posts || final).map((p: any) => {
                return {
                  id: p.itemId,
                  name: p.name,
                  type: p.type,
                  qty: p.qty,
                  shots: p.shots,
                  buyingPrice: p.buyingPrice,
                  sellingPrice: p.sellingPrice,
                  profitMargin: p.profitMargin,
                  outlet: p.outlet,
                  createdAt: p.createdAt,
                };
              });
              this.stockCount = this.stockData.length;
            }else{
              this.stockData= [];
              this.stockCount = 0;
              this.searchWord= searchKeyword;
              await this.showToast('No results with the word ' + searchKeyword, 'danger');
            }
            console.log('Fetching data success:', response);
          } else {
            this.stockData= [];
            this.stockCount= 0;
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
