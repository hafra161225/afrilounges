import { TestBed } from '@angular/core/testing';

import { DeleteStock } from './delete-stock';

describe('DeleteStock', () => {
  let service: DeleteStock;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DeleteStock);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
