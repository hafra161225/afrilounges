import { TestBed } from '@angular/core/testing';

import { UpdateProfile } from './update-profile';

describe('UpdateProfile', () => {
  let service: UpdateProfile;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UpdateProfile);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
