import { TestBed } from '@angular/core/testing';

import { GetStock } from './get-stock';

describe('GetStock', () => {
  let service: GetStock;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GetStock);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
