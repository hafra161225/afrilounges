import { TestBed } from '@angular/core/testing';

import { GetProfiles } from './get-profiles';

describe('GetProfiles', () => {
  let service: GetProfiles;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GetProfiles);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
