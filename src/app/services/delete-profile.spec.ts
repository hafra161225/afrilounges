import { TestBed } from '@angular/core/testing';

import { DeleteProfile } from './delete-profile';

describe('DeleteProfile', () => {
  let service: DeleteProfile;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DeleteProfile);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
