import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { inject, NgZone } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

export const loginGuard: CanActivateFn = async (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const router = inject(Router);
  const ngZone = inject(NgZone);

  // Get the user ID from Preferences
  const { value } = await Preferences.get({ key: 'afriId' });
  const afriId = value ? JSON.parse(value) : null;
  
 if (afriId) { 
    // User needs to confirm → allow access
    return true;
  } else {
    // No confId → redirect to login
    ngZone.run(() => router.navigate(['/login']));
    return false;
  }
};
 