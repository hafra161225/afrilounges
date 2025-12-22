import { TestBed } from '@angular/core/testing';

import { UpdatePassword } from './update-password';

describe('UpdatePassword', () => {
  let service: UpdatePassword;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UpdatePassword);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
