import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, 
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, 
  IonItem, IonLabel, IonInput, IonButton,
  IonIcon, IonSpinner, IonToast, IonRow, IonCol,
  IonFab, IonFabButton, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logInOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { Login } from '../services/login';
import { Preferences } from '@capacitor/preferences';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  schemas: [ CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, 
    IonCardHeader, IonCardTitle, IonCardContent, IonItem, 
    IonLabel, IonInput, IonButton, IonIcon, IonSpinner, 
    IonToast, IonRow, IonCol, ReactiveFormsModule, 
    CommonModule, IonFab, IonFabButton
  ],
  encapsulation: ViewEncapsulation.None, // Add this
})
export class LoginPage implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  showPassword = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private toastController: ToastController,
    private loginService: Login
  ) {
    addIcons({ logInOutline, eyeOutline, eyeOffOutline });
  }

  ngOnInit() {
    this.initializeForm();
  }

  private initializeForm() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // 2025-12-17 12:19:35

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

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
        
      try {
        // Get form values
        const formData = this.loginForm.value;
        console.log('Great: ', formData);

        this.loginService.login(formData).subscribe({
          next: async (response: any) => {
            this.isLoading = false;
            console.log('Response', response);
            
            if (response && response.success) {
              await this.showToast('Login successful!', 'success');
              this.loginForm.reset(); // Reset the form

              // if a user did not confirm email
              if(response.afriId){
                // console.log('Got user ID:', response.stepOne);
                await Preferences.set({
                  key: 'afriId',
                  value: JSON.stringify(response.afriId),
                });
                setTimeout(() => {
                  this.router.navigateByUrl('/dashboard');
                }, 2000);
              }

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
    } else {
      await this.showToast('Please fill in all required fields correctly.', 'warning');
    }
  }

  private async performLogin(credentials: { email: string; password: string }) {
    // Simulate API call - replace with actual authentication logic
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Mock authentication logic
        if (credentials.email === 'admin@africanlounges.com' && credentials.password === 'password123') {
          resolve({ success: true });
        } else {
          reject({ success: false, message: 'Invalid credentials' });
        }
      }, 2000); // Simulate network delay
    });
  }

  navigateToHome() {
    this.router.navigate(['/home']);
  }
}
