import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { 
        IonContent, IonHeader, IonTitle, 
        IonToolbar, IonIcon, IonList, IonItem,
        IonLabel, IonNote, IonText, IonAvatar,
        IonItemSliding, IonItemOptions, IonItemOption,
        IonButtons, IonButton, ToastController, 
        RefresherCustomEvent, IonSpinner, IonSkeletonText, 
        IonRefresher, IonRefresherContent,
        IonInfiniteScroll, IonInfiniteScrollContent, 
        InfiniteScrollCustomEvent, IonInput, IonModal,
        IonCard, IonCardContent, IonRow, IonCol, 
        IonInputPasswordToggle, AlertController} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import * as allIcons from 'ionicons/icons';
import { Preferences } from '@capacitor/preferences';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { GetProfiles } from '../services/get-profiles';
import { AddProfile } from '../services/add-profile';
import { UpdateProfile } from '../services/update-profile';
import { DeleteProfile } from '../services/delete-profile';

@Component({
  selector: 'app-profiles',
  templateUrl: './profiles.page.html',
  styleUrls: ['./profiles.page.scss'],
  standalone: true,
  schemas: [ CUSTOM_ELEMENTS_SCHEMA],
  imports: [
            IonContent, IonHeader, IonTitle, 
            IonToolbar, CommonModule, FormsModule,
            IonIcon, RouterLink, RouterLinkActive,
            IonList, IonItem, IonLabel, IonNote, 
            IonText, IonAvatar, IonItemSliding, 
            IonItemOptions, IonItemOption, IonButton,
            IonButtons, IonSpinner, IonSkeletonText,
            IonRefresher, IonRefresher, IonRefresherContent,
            IonInfiniteScroll, IonInfiniteScrollContent, 
            IonInput, IonModal,  IonCard, IonCardContent, 
            IonRow, IonCol, ReactiveFormsModule, IonInputPasswordToggle
          ],
  encapsulation: ViewEncapsulation.None, // Add this
})
export class ProfilesPage implements OnInit {
  isLoading: boolean = false;
  isLoadingAdd: boolean= false;
  isLoadingEdit: boolean= false;
  isLoadingDelete: boolean= false;
  addProfileForm: FormGroup;
  editProfileForm: FormGroup;
  deleteProfileForm: FormGroup;
  getProfilesForm: FormGroup;
  offset = 0;
  limit = 20;
  searchQuery: any;
  searchDelay: any;
  searchTerm = '';
  profilesData: any[] = [];
  searchWord: any;
  profilesCount:any;
  afriId: any;
  profileName: any;
  
  isAddModalOpen = false;
  isEditModalOpen = false;
  isDeleteModalOpen= false;

  constructor(private router: Router,
              private formBuilder:FormBuilder,
              private getProfilesServices: GetProfiles,
              private addProfileService: AddProfile,
              private updateProfileService: UpdateProfile,
              private deleteProfileService: DeleteProfile,
              private toastController: ToastController,
              private alertController: AlertController,
            ) {
              addIcons(allIcons);
              this.addProfileForm = this.formBuilder.group({
                name: ['', Validators.required],
                outlet: ['', Validators.required],
                password: ['', Validators.required],
              });

              this.editProfileForm = this.formBuilder.group({
                id: ['', Validators.required],
                name: ['', Validators.required],
                outlet: ['', Validators.required],
                password: ['', Validators.required],
              });

              this.getProfilesForm= this.formBuilder.group({
                SearchQuery: [null],
                offset: [this.offset],
                limit: [this.limit]
              });

              this.deleteProfileForm= this.formBuilder.group({
                profileId: ['', Validators.required]
              });
              
              // then update async
              Preferences.get({ key: 'afriId' }).then(result => {
                this.afriId= result.value ? JSON.parse(result.value) : null;
                console.log('afriId from Preferences:', this.afriId);
                this.loadProfiles();
              });
            }

  ngOnInit() {
  }
  
  async handleRefresh(event: RefresherCustomEvent){
    this.loadProfiles();
    event.target.complete();
  }

  clearSearch() {
    this.searchTerm = '';
    // this.beers = [...this.originalBeers];
    // this.calculateTotalValue();
  }

  onSearchChange(event: any) {
    const value = (event.detail.value || '').trim().toLowerCase();
    this.searchQuery = value;
    console.log('Search Query:', this.searchQuery);
    // Clear previous timer so we wait before sending request
    clearTimeout(this.searchDelay);

    this.searchDelay = setTimeout(() => {
      this.loadProfiles(this.searchQuery);
    }, 400); // waits 400ms after the user stops typing
  }

  closeAddProfileModal() {
    this.isAddModalOpen = false;
  }

  
  closeEditProfileModal() {
    this.isEditModalOpen = false;
  }

  closeDeleteProfileModal(){
    this.isDeleteModalOpen= false
  }
  
  openAddProfileModal() {
    console.log('Button has been clicked');
    this.addProfileForm.reset();
    this.isAddModalOpen = true;
  }

  
  async editProfile(profile: any) {
    this.editProfileForm.patchValue({
      id: profile.profileId,
      name: profile.name,
      outlet: profile.outlet,
      password: profile.password
    });
    this.isEditModalOpen = true;
  }

  async deleteProfile(profile: any){
    this.deleteProfileForm.patchValue({
      profileId: profile.profileId
    })
    console.log('Profile ID: ', profile.profileId);
    this.profileName= profile.name;
    this.isDeleteModalOpen = true;
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

  gotoSettings(){
    this.router.navigate(['/tabs/settings']);
  }

  
  async loadProfiles(searchKeyword: any = null) {
    this.getProfilesForm.patchValue({ SearchQuery: searchKeyword, offset: this.offset, limit: this.limit });

    if (this.getProfilesForm.invalid) {
      await this.showToast('Network Error. Please refresh or restart app', 'warning');
      return;
    }

    this.isLoading = true;
        
    try {
      // Get form values
      const formData = this.getProfilesForm.value;
      console.log('Great: ', formData);

      this.getProfilesServices.getProfiles(formData).subscribe({
        next: async (response: any) => {
          this.isLoading = false;
          
          if (response && response.success) {
            const final= response.data;
            this.profilesCount= response.count;
            console.log(final);
            if(this.profilesCount > 0){
              this.profilesData= (final.posts || final).map((p: any) => {
                return {
                  profileId: p.profileId,
                  name: p.name,
                  outlet: p.outlet,
                  createdAt: p.createdAt,
                };
              });
              this.profilesCount = this.profilesData.length;
            }else{
              this.isLoading= true; 
              this.profilesData= [];
              this.profilesCount = 0;
              this.searchWord= searchKeyword;
              await this.showToast('No results with the word ' + searchKeyword, 'danger');
            }
            console.log('Fetching data success:', response);
          } else {
            this.profilesData= [];
            this.profilesCount= 0;
            await this.showToast(response?.message || 'Fetching data failed', 'danger');
          }
        },
        error: async (error: any) => {
          // await loading.dismiss();
          this.isLoading = true;
          console.error('Fetching data error:', error);

          await this.showToast('Fetching data failed. Please try again.', 'danger');
        }
      });
      
    } catch (error) {
      // await loading.dismiss();
      this.isLoading = true;
      console.error('Unexpected error:', error);
      
      await this.showToast('An unexpected error occurred', 'danger');
    }
  }

  
  async loadMoreProfiles(event: InfiniteScrollCustomEvent){
    
    // Increment offset for pagination
    this.offset += this.limit;
    this.getProfilesForm.patchValue({ offset: this.offset });

    if (this.getProfilesForm.invalid) {
      await this.showToast('Network Error. Please refresh or restart app', 'warning');
      return;
    }
        
    try {
      // Get form values
      const formData = this.getProfilesForm.value;
      console.log('Great: ', formData);

      this.getProfilesServices.getProfiles(formData).subscribe({
        next: async (response: any) => {
          
          if (response && response.success) {
            const final= response.data;
            this.profilesCount= response.count;
            console.log(final);
            if(this.profilesCount > 0){
              this.profilesData= (final.posts || final).map((p: any) => {
                return {
                  profileId: p.profileId,
                  name: p.name,
                  outlet: p.outlet,
                  createdAt: p.createdAt,
                };
              });
              this.profilesCount = this.profilesData.length;
            }else{
              this.profilesData= [];
              this.profilesCount = 0;
              await this.showToast(response?.message || 'There are no more profiles', 'danger');
            }
            console.log('Fetching data success:', response);
          } else {
            this.profilesData= [];
            this.profilesCount= 0;
            await this.showToast(response?.message || 'Fetching data failed', 'danger');
          }
        },
        error: async (error: any) => {
          // await loading.dismiss();
          console.error('Fetching data error:', error);

          await this.showToast('Fetching data failed. Please try again.', 'danger');
        }
      });
      
    } catch (error) {
      // await loading.dismiss();
      console.error('Unexpected error:', error);
      
      await this.showToast('An unexpected error occurred', 'danger');
    }
  }


  async showValidationError() {
    const alert = await this.alertController.create({
      header: 'Validation Error',
      message: 'Please fill in all required fields.',
      buttons: ['OK']
    });
    await alert.present();
  }

  async addNewProfile() {
    // Validate form
    if (!this.addProfileForm.valid) {
      await this.showValidationError();
      return;
    }

    this.isLoadingAdd = true;
        
    try {
      // Get form values
      const formData = this.addProfileForm.value;
      console.log('Great: ', formData);

      this.addProfileService.addProfile(formData).subscribe({
        next: async (response: any) => {
          this.isLoadingAdd = false;
          
          if (response && response.success) {
            await this.showToast('Adding Profile successful!', 'success');
            this.addProfileForm.reset(); // Reset the form
            this.closeAddProfileModal();
            this.loadProfiles();
          } else {
            await this.showToast(response?.message || 'Adding Profile failed', 'danger');
          }
        },
        error: async (error: any) => {
          // await loading.dismiss();
          this.isLoadingAdd = false;
          // console.error('Registration error:', error);
          
          await this.showToast('Adding Profile failed. Please try again.', 'danger');
        }
      });
      
    } catch (error) {
      // await loading.dismiss();
      this.isLoadingAdd = false;
      // console.error('Unexpected error:', error);
      
      await this.showToast('An unexpected error occurred', 'danger');
    }

  }

  async updateProfile(){
    // Validate form
    if (!this.editProfileForm.valid) {
      await this.showValidationError();
      return;
    }

    this.isLoadingEdit = true;
        
    try {
      // Get form values
      const formData = this.editProfileForm.value;
      console.log('Great: ', formData);

      this.updateProfileService.updateProfile(formData).subscribe({
        next: async (response: any) => {
          this.isLoadingEdit = false;
          
          if (response && response.success) {
            await this.showToast('Updating Profile successful!', 'success');
            this.editProfileForm.reset(); // Reset the form
            this.closeEditProfileModal();
            this.loadProfiles();
          } else {
            await this.showToast(response?.message || 'Updating Profile failed', 'danger');
          }
        },
        error: async (error: any) => {
          // await loading.dismiss();
          this.isLoadingEdit = false;
          // console.error('Registration error:', error);
          
          await this.showToast('Updating Profile failed. Please try again.', 'danger');
        }
      });
      
    } catch (error) {
      // await loading.dismiss();
      this.isLoadingEdit = false;
      // console.error('Unexpected error:', error);
      
      await this.showToast('An unexpected error occurred', 'danger');
    }
  }

  async deleteProfileHere(){
    // Validate form
    if (!this.deleteProfileForm.valid) {
      await this.showValidationError();
      return;
    }

    this.isLoadingDelete = true;
        
    try {
      // Get form values
      const formData = this.deleteProfileForm.value;
      console.log('Great: ', formData);

      this.deleteProfileService.deleteProfile(formData).subscribe({
        next: async (response: any) => {
          this.isLoadingDelete = false;
          
          if (response && response.success) {
            await this.showToast('Deleting Profile successful!', 'success');
            this.deleteProfileForm.reset(); // Reset the form
            this.closeDeleteProfileModal();
            this.loadProfiles();
          } else {
            await this.showToast(response?.message || 'Deleting Profile failed', 'danger');
          }
        },
        error: async (error: any) => {
          // await loading.dismiss();
          this.isLoadingDelete = false;
          // console.error('Registration error:', error);
          
          await this.showToast('Deleting Profile failed. Please try again.', 'danger');
        }
      });
      
    } catch (error) {
      // await loading.dismiss();
      this.isLoadingDelete = false;
      // console.error('Unexpected error:', error);
      
      await this.showToast('An unexpected error occurred', 'danger');
    }
  }
}
