import { TestBed } from '@angular/core/testing';

import { GetDailyReports } from './get-daily-reports';

describe('GetDailyReports', () => {
  let service: GetDailyReports;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GetDailyReports);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
