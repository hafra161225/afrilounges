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
import { UpdatePassword } from '../services/update-password';

@Component({
  selector: 'app-update-password',
  templateUrl: './update-password.page.html',
  styleUrls: ['./update-password.page.scss'],
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
export class UpdatePasswordPage implements OnInit {
  isLoading: boolean = false;
  updatePassForm: FormGroup;
  afriId: any;

  constructor(private router: Router,
              private formBuilder:FormBuilder,
              private toastController: ToastController,
              private alertController: AlertController,
              private updatePassService: UpdatePassword
            ) { 
                addIcons(allIcons);
                this.updatePassForm= this.formBuilder.group({
                  afriId: ['', Validators.required],
                  oldPass: ['', Validators.required],
                  newPass: ['', Validators.required],
                  confPass: ['', Validators.required]
                });
                
                // then update async
                Preferences.get({ key: 'afriId' }).then(result => {
                  this.afriId= result.value ? JSON.parse(result.value) : null;
                  console.log('afriId from Preferences:', this.afriId);
                  this.updatePassForm.patchValue({
                    afriId: this.afriId,
                  });
                });
              }

  ngOnInit() {
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

  async updatePassword(){
    if (this.updatePassForm.invalid) {
      await this.showToast('Network Error. Please refresh or restart app', 'warning');
      return;
    }
    
    // Get form values
    const formData = this.updatePassForm.value;
    console.log('Great: ', formData);

    const newPass= formData.newPass;
    const confPass= formData.confPass;

    if(newPass !== confPass){
      await this.showToast('You new password and confirmation password are not equal', 'warning');
      return;
    }
    
    this.isLoading = true;
        
    try {

      this.updatePassService.updatePassword(formData).subscribe({
        next: async (response: any) => {
          this.isLoading = false;
          
          if (response && response.success) {
            await this.showToast('Password updated!', 'success');
            this.updatePassForm.reset(); // Reset the form
            // then update async
            Preferences.get({ key: 'afriId' }).then(result => {
              this.afriId= result.value ? JSON.parse(result.value) : null;
              console.log('afriId from Preferences:', this.afriId);
              this.updatePassForm.patchValue({
                afriId: this.afriId,
              });
            });
          } else {
            await this.showToast(response?.message || 'Updating password failed', 'danger');
          }
        },
        error: async (error: any) => {
          // await loading.dismiss();
          this.isLoading = false;
          // console.error('Registration error:', error);
          
          await this.showToast('Updating password failed. Please try again.', 'danger');
        }
      });
      
    } catch (error) {
      // await loading.dismiss();
      this.isLoading = false;
      // console.error('Unexpected error:', error);
      
      await this.showToast('An unexpected error occurred', 'danger');
    }

  }

}
