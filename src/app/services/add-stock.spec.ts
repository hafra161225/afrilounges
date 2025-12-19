import { TestBed } from '@angular/core/testing';

import { AddStock } from './add-stock';

describe('AddStock', () => {
  let service: AddStock;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AddStock);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
