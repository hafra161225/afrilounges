import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, ViewEncapsulation  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonIcon, IonButton, IonButtons,
  IonItem, IonInput, IonAlert, IonBadge, IonModal, IonSelect, IonSelectOption,
  IonLabel, IonSpinner, IonSkeletonText, IonRefresher, IonRefresherContent,
  IonInfiniteScroll, IonInfiniteScrollContent, InfiniteScrollCustomEvent,
  RefresherCustomEvent, AlertController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import * as allIcons from 'ionicons/icons';
import { AddStock } from '../../services/add-stock';
import { GetStock } from '../../services/get-stock';
import { DeleteStock } from '../../services/delete-stock';
import { UpdateStock } from '../../services/update-stock';
import { Preferences } from '@capacitor/preferences';

@Component({
  selector: 'app-stocks',
  templateUrl: './stocks.page.html',
  styleUrls: ['./stocks.page.scss'],
  standalone: true,
  schemas: [ CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule, IonHeader, IonToolbar, IonTitle, IonContent,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonIcon,
    IonButton, IonButtons, IonItem, IonInput, IonAlert, IonBadge,
    IonModal, IonSelect, IonSelectOption, IonLabel, ReactiveFormsModule,
    IonSpinner, FormsModule, IonSkeletonText, IonRefresher, IonRefresherContent,
    IonInfiniteScroll, IonInfiniteScrollContent,
  ],
  encapsulation: ViewEncapsulation.None, // Add this
})
export class StocksPage implements OnInit {
  isLoading: boolean = false;
  addStockForm: FormGroup;
  loadStockForm: FormGroup;
  deleteStockForm: FormGroup;
  editStockForm: FormGroup;
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

  originalStockItems = [
    {
      id: 1,
      name: 'Beer (Crates)',
      type: 'Beverage',
      qty: 35,
      shots: 25,
      buyingPrice: 12000,
      sellingPrice: 15000,
      value: 525000,
      status: 'good'
    },
    {
      id: 2,
      name: 'Soft Drinks (Cases)',
      type: 'Beverage',
      qty: 28,
      shots: 18,
      buyingPrice: 8000,
      sellingPrice: 10000,
      value: 280000,
      status: 'good'
    },
    {
      id: 3,
      name: 'Snacks (Boxes)',
      type: 'Food',
      qty: 18,
      shots: 15,
      buyingPrice: 15000,
      sellingPrice: 18000,
      value: 324000,
      status: 'normal'
    },
    {
      id: 4,
      name: 'Wine (Bottles)',
      type: 'Beverage',
      qty: 12,
      shots: 8,
      buyingPrice: 25000,
      sellingPrice: 30000,
      value: 360000,
      status: 'low'
    }
  ];

  stockItems = [...this.originalStockItems]; // Filtered items for display
  searchTerm = '';
  totalValue = 0;
  isLargeScreen = true; // Default to true for SSR compatibility

  // Modal and form properties
  isAddModalOpen = false;
  isEditModalOpen = false;
  editingItem: any = null;
  newItem = {
    name: '',
    type: '',
    qty: null,
    shots: null,
    buyingPrice: null,
    sellingPrice: null
  };

  itemTypes = [
    { value: 'local-beers', label: 'Local Beers' },
    { value: 'spirits', label: 'Spirits' },
    { value: 'minerals', label: 'Minerals' },
    { value: 'wine', label: 'Wine' },
    { value: 'whisky-shots', label: 'Whisky Shots' }
  ];

  constructor(
    private alertController: AlertController,
    private toastController: ToastController,
    private addStockService: AddStock,
    private getStockService: GetStock,
    private deleteStockService: DeleteStock,
    private updateStockService: UpdateStock,
    private formBuilder: FormBuilder
  ) {
    addIcons(allIcons);
    this.addStockForm = this.formBuilder.group({
      outlet: ['', Validators.required],
      name: ['', Validators.required],
      type: ['', Validators.required],
      qty: ['', Validators.required],
      shots: ['', Validators.required],
      buyingPrice: ['', Validators.required],
      sellingPrice: ['', Validators.required],
    });

    this.editStockForm = this.formBuilder.group({
      itemId: ['', Validators.required],
      outlet: ['', Validators.required],
      name: ['', Validators.required],
      type: ['', Validators.required],
      qty: ['', Validators.required],
      shots: ['', Validators.required],
      buyingPrice: ['', Validators.required],
      sellingPrice: ['', Validators.required],
    });

    
    this.loadStockForm = this.formBuilder.group({
      SearchQuery: [null],
      offset: [this.offset],
      limit: [this.limit]
    });

    this.deleteStockForm= this.formBuilder.group({
      itemId: [null],
    });

    // then update async
    Preferences.get({ key: 'afriId' }).then(result => {
      this.afriId= result.value ? JSON.parse(result.value) : null;
      console.log('afriId from Preferences:', this.afriId);
      this.loadStock();
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

  calculateTotalValue() {
    this.totalValue = this.stockData.reduce((sum, item) => {
      const qty = Number(item.qty) || 0;
      const shots = Number(item.shots) || 0;
      const price = Number(item.sellingPrice) || 0;

      const itemTotal =
        shots > 0
          ? price * shots * qty   // spirits / shots-based items
          : price * qty;          // normal items

      return sum + itemTotal;
    }, 0);
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

  filterStocks() {
    if (!this.searchTerm) {
      this.stockItems = [...this.originalStockItems];
    } else {
      this.stockItems = this.originalStockItems.filter(item =>
        item.name.toLowerCase().includes(this.searchTerm)
      );
    }
    this.calculateTotalValue();
  }

  clearSearch() {
    this.searchTerm = '';
    this.stockItems = [...this.originalStockItems];
    this.calculateTotalValue();
  }

  async editStockItem(item: any) {
    this.editingItem = item;
    this.editStockForm.patchValue({
      outlet: item.outlet,
      itemId: item.itemId,
      name: item.name,
      type: item.type,
      qty: item.qty,
      shots: item.shots,
      buyingPrice: item.buyingPrice,
      sellingPrice: item.sellingPrice
    });
    this.isEditModalOpen = true;
  }

  getStatusFromDifference(difference: number): string {
    if (difference < -10) return 'low';
    if (difference < -5) return 'normal';
    return 'high';
  }

  refreshStocks() {
    // Simulate refreshing stock data
    console.log('Refreshing stock data...');
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'low': return 'danger';
      case 'normal': return 'success';
      case 'high': return 'primary';
      default: return 'primary';
    }
  }

  getStockStatus(qty: number): string {
    if (qty <= 15) return 'low';
    if (qty <= 25) return 'medium';
    return 'good';
  }

  calculateMargin(buyingPrice: number, sellingPrice: number): number {
    return ((sellingPrice - buyingPrice) / buyingPrice) * 100;
  }

  async deleteStockItem(item: any) {
    // Create the alert with a placeholder message
    const alert = await this.alertController.create({
      header: 'Delete Stock Item',
      message: `Are you sure you want to delete "${item.name}"?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            // Instead of closing the alert, start deletion
            this.confirmDelete(item.itemId, alert);
            return false; // Important: keep alert open
          }
        }
      ]
    });

    await alert.present();
  }

  async confirmDelete(item: any, alert: any) {
    // Update alert to show deleting state
    alert.message = `Deleting "${item.name}"...`;
    this.isLoadingDelete = true;

    this.deleteStockForm.patchValue({ itemId: item });

    if (this.deleteStockForm.invalid) {
      await this.showToast('Network Error. Please refresh or restart app', 'warning');
      this.isLoadingDelete = false;
      await alert.dismiss();
      return;
    }

    const formDatum = this.deleteStockForm.value;
    console.log('Great: ', formDatum);
    this.deleteStockService.deleteStock(formDatum).subscribe({
      next: async (response: any) => {
        this.isLoadingDelete = false;

        if (response && response.success) {
          await this.showToast('Deleting successful!', 'success');
          this.deleteStockForm.reset();
          setTimeout(() => {
            this.loadStock();
          }, 2000);
        } else {
          await this.showToast(response?.message || 'Deleting failed', 'danger');
        }

        await alert.dismiss(); // Close alert after response
      },
      error: async (error: any) => {
        this.isLoadingDelete = false;
        await this.showToast('Deleting failed. Please try again.', 'danger');
        await alert.dismiss(); // Close alert on error
      }
    });
  }

  openAddItemModal() {
    this.resetNewItemForm();
    this.isAddModalOpen = true;
  }

  closeEditModal() {
    this.isEditModalOpen = false;
    this.editingItem = null;
    this.editStockForm.reset();
  }

  closeAddItemModal() {
    this.isAddModalOpen = false;
  }

  closeUpdateItemModal() {
    this.isEditModalOpen = false;
    // this.resetNewItemForm();
  }

  resetNewItemForm() {
    this.newItem = {
      name: '',
      type: '',
      qty: null,
      shots: null,
      buyingPrice: null,
      sellingPrice: null
    };
  }

  async saveEditItem() {
    if (!this.editStockForm.valid) {
      await this.showValidationError();
      return;
    }

    this.isLoading = true;
        
    try {
      // Get form values
      const formData = this.editStockForm.value;
      console.log('Great: ', formData);

      this.updateStockService.updateStock(formData).subscribe({
        next: async (response: any) => {
          this.isLoading = false;
          
          if (response && response.success) {
            await this.showToast('Stock update successful!', 'success');
            this.editStockForm.reset(); // Reset the form
            this.closeUpdateItemModal();
            this.loadStock();
          } else {
            await this.showToast(response?.message || 'Stock update failed', 'danger');
          }
        },
        error: async (error: any) => {
          // await loading.dismiss();
          this.isLoading = false;
          // console.error('Registration error:', error);
          
          await this.showToast('Stock update failed. Please try again.', 'danger');
        }
      });
      
    } catch (error) {
      // await loading.dismiss();
      this.isLoading = false;
      // console.error('Unexpected error:', error);
      
      await this.showToast('An unexpected error occurred', 'danger');
    }

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

  async addNewItem() {
    // Validate form
    if (!this.addStockForm.valid) {
      await this.showValidationError();
      return;
    }

    this.isLoading = true;
        
    try {
      // Get form values
      const formData = this.addStockForm.value;
      console.log('Great: ', formData);

      this.addStockService.addStock(formData).subscribe({
        next: async (response: any) => {
          this.isLoading = false;
          
          if (response && response.success) {
            await this.showToast('Login successful!', 'success');
            this.addStockForm.reset(); // Reset the form
            this.closeAddItemModal();
          } else {
            await this.showToast(response?.message || 'Login failed', 'danger');
          }
        },
        error: async (error: any) => {
          // await loading.dismiss();
          this.isLoading = false;
          // console.error('Registration error:', error);
          
          await this.showToast('Login failed. Please try again.', 'danger');
        }
      });
      
    } catch (error) {
      // await loading.dismiss();
      this.isLoading = false;
      // console.error('Unexpected error:', error);
      
      await this.showToast('An unexpected error occurred', 'danger');
    }

  }

  getTypeLabel(typeValue: string): string {
    const type = this.itemTypes.find(t => t.value === typeValue);
    return type ? type.label : typeValue;
  }

  async showValidationError() {
    const alert = await this.alertController.create({
      header: 'Validation Error',
      message: 'Please fill in all required fields.',
      buttons: ['OK']
    });
    await alert.present();
  }

  async showSuccessToast() {
    const toast = await this.toastController.create({
      message: 'Item added successfully!',
      duration: 2000,
      color: 'success',
      position: 'top'
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
