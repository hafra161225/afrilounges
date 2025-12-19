import { TestBed } from '@angular/core/testing';

import { AddSale } from './add-sale';

describe('AddSale', () => {
  let service: AddSale;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AddSale);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
