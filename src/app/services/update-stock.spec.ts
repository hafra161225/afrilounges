import { TestBed } from '@angular/core/testing';

import { UpdateStock } from './update-stock';

describe('UpdateStock', () => {
  let service: UpdateStock;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UpdateStock);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
