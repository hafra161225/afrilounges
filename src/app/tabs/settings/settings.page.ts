import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, ViewEncapsulation } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonList, IonItem, IonLabel, IonIcon,
  IonToggle, IonButton, IonAlert
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  personOutline, notificationsOutline, moonOutline, languageOutline,
  informationCircleOutline, logOutOutline, keyOutline, shieldOutline
} from 'ionicons/icons';
import { Preferences } from '@capacitor/preferences';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  schemas: [ CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent, IonList, IonItem, IonLabel, IonIcon,
    IonToggle, IonButton, IonAlert
  ],
  encapsulation: ViewEncapsulation.None, // Add this
})
export class SettingsPage implements OnInit {

  darkMode = false;
  notifications = true;
  autoBackup = true;

  constructor(private router: Router) {
    addIcons({
      personOutline, notificationsOutline, moonOutline, languageOutline,
      informationCircleOutline, logOutOutline, keyOutline, shieldOutline
    });
  }

  ngOnInit() {}

  toggleDarkMode() {
    console.log('Dark mode toggled:', this.darkMode);
    // Implement dark mode toggle logic
  }

  toggleNotifications() {
    console.log('Notifications toggled:', this.notifications);
    // Implement notification toggle logic
  }

  toggleAutoBackup() {
    console.log('Auto backup toggled:', this.autoBackup);
    // Implement auto backup toggle logic
  }

  changePassword() {
    console.log('Change password clicked');
    // Implement change password logic
  }

  viewProfile() {
    console.log('View profile clicked');
    // Implement view profile logic
  }

  privacySettings() {
    console.log('Privacy settings clicked');
    // Implement privacy settings logic
  }

  aboutApp() {
    console.log('About app clicked');
    // Implement about app logic
  }

  async logout() {
    await Preferences.clear();
    this.router.navigate(['/login']);
  }
}
