import { TestBed } from '@angular/core/testing';

import { AddProfile } from './add-profile';

describe('AddProfile', () => {
  let service: AddProfile;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AddProfile);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
