import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, ViewEncapsulation  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
        IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
        IonCardTitle, IonCardContent, IonIcon, IonButton, IonButtons,
        IonItem, IonInput, IonAlert, IonBadge, IonModal, IonSelect, IonSelectOption,
        IonLabel, IonSpinner, IonSkeletonText, IonRefresher, IonRefresherContent,
        IonInfiniteScroll, IonInfiniteScrollContent, InfiniteScrollCustomEvent,
        RefresherCustomEvent, IonGrid, IonRow, IonCol, IonFab, IonFabButton,
        IonCardSubtitle, ToastController
      } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, statsChartOutline, documentTextOutline, logOutOutline, beerOutline, searchOutline, closeOutline } from 'ionicons/icons';
import { Preferences } from '@capacitor/preferences';
import { GetStock } from 'src/app/services/get-stock';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  schemas: [ CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent, IonGrid, IonRow, IonCol, IonIcon, 
    IonButton, IonFab, IonFabButton, IonBadge, IonItem, IonInput, IonCardSubtitle, IonButtons,
    IonLabel, IonSpinner, IonSkeletonText, IonRefresher, IonRefresherContent,
    IonInfiniteScroll, IonInfiniteScrollContent,
  ],
  encapsulation: ViewEncapsulation.None, // Add this
})
export class DashboardPage implements OnInit {
  isLoading: boolean = false;
  loadStockForm: FormGroup;
  offset = 0;
  limit = 10;
  isLoadingStock: boolean= false;
  searchWord: any;
  stockCount:any;
  afriId:any;
  searchQuery: any;
  searchDelay: any;
  
  stockData: any[] = [];
  isLoadingDelete: boolean= false;
  isLoadingDeleting: boolean= false;

  originalBeers = [
    {
      name: 'Castle Lager',
      type: 'Lager',
      qty: 50,
      shots: 25,
      buyingPrice: 12000,
      sellingPrice: 15000
    },
    {
      name: 'Carlsberg',
      type: 'Lager',
      qty: 35,
      shots: 18,
      buyingPrice: 11000,
      sellingPrice: 14000
    },
    {
      name: 'Heineken',
      type: 'Lager',
      qty: 28,
      shots: 14,
      buyingPrice: 13000,
      sellingPrice: 16000
    },
    {
      name: 'Guinness',
      type: 'Stout',
      qty: 20,
      shots: 10,
      buyingPrice: 15000,
      sellingPrice: 18000
    },
    {
      name: 'Tusker Lager',
      type: 'Lager',
      qty: 42,
      shots: 21,
      buyingPrice: 10000,
      sellingPrice: 13000
    }
  ];

  beers = [...this.originalBeers]; // Filtered beers for display
  searchTerm = '';
  totalValue = 0;
  isLargeScreen = true; // Default to true for SSR compatibility

  constructor(private router: Router,
              private formBuilder: FormBuilder,
              private getStockService: GetStock,
              private toastController: ToastController
            ) {
              addIcons({ addOutline, statsChartOutline, documentTextOutline, logOutOutline, beerOutline, searchOutline, closeOutline });
              this.loadStockForm = this.formBuilder.group({
                SearchQuery: [null],
                offset: [this.offset],
                limit: [this.limit]
              });
              // then update async
              Preferences.get({ key: 'afriId' }).then(result => {
                this.afriId= result.value ? JSON.parse(result.value) : null;
                console.log('afriId from Preferences:', this.afriId);
                this.loadStock();
              });

            }

  ngOnInit() {
    this.calculateTotalValue();
    this.checkScreenSize();

    // Listen for window resize events
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        this.checkScreenSize();
      });
    }
  }
  
  async handleRefresh(event: RefresherCustomEvent){
    this.loadStock();
    event.target.complete();
  }

  checkScreenSize() {
    if (typeof window !== 'undefined') {
      // Consider large screen if width is 768px or more (tablet and desktop)
      this.isLargeScreen = window.innerWidth >= 768;
    }
  }

  filterBeers() {
    if (!this.searchTerm) {
      this.beers = [...this.originalBeers];
    } else {
      this.beers = this.originalBeers.filter(beer =>
        beer.name.toLowerCase().includes(this.searchTerm) ||
        beer.type.toLowerCase().includes(this.searchTerm)
      );
    }
    this.calculateTotalValue();
  }

  clearSearch() {
    this.searchTerm = '';
    this.beers = [...this.originalBeers];
    this.calculateTotalValue();
  }

  navigateToForm() {
    this.router.navigate(['/home']);
  }

  navigateToStocks() {
    this.router.navigate(['/tabs/stocks']);
  }

  logout() {
    this.router.navigate(['/login']);
  }

  getStockStatus(qty: number): string {
    if (qty <= 20) return 'low';
    if (qty <= 35) return 'medium';
    return 'good';
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'low': return 'danger';
      case 'medium': return 'warning';
      case 'good': return 'success';
      default: return 'primary';
    }
  }

  calculateMargin(buyingPrice: number, sellingPrice: number): number {
    return ((sellingPrice - buyingPrice) / buyingPrice) * 100;
  }

  calculateTotalValue() {
    this.totalValue = this.beers.reduce((sum, beer) => sum + (beer.qty * beer.sellingPrice), 0);
  }

  
  onSearchChange(event: any) {
    const value = (event.detail.value || '').trim().toLowerCase();
    this.searchQuery = value;
    console.log('Search Query:', this.searchQuery);
    // Clear previous timer so we wait before sending request
    clearTimeout(this.searchDelay);

    this.searchDelay = setTimeout(() => {
      this.loadStock(this.searchQuery);
    }, 400); // waits 400ms after the user stops typing
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
                  itemId: p.itemId,
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
              this.calculateTotalValue();
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

  async loadMoreStock(event: InfiniteScrollCustomEvent){
    
    // Increment offset for pagination
    this.offset += this.limit;
    this.loadStockForm.patchValue({ offset: this.offset });

    if (this.loadStockForm.invalid) {
      await this.showToast('Network Error. Please refresh or restart app', 'warning');
      return;
    }
        
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
                  itemId: p.itemId,
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
              this.calculateTotalValue();
            }else{
              this.stockData= [];
              this.stockCount = 0;
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
