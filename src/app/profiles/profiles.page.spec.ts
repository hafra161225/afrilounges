import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfilesPage } from './profiles.page';

describe('ProfilesPage', () => {
  let component: ProfilesPage;
  let fixture: ComponentFixture<ProfilesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfilesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
