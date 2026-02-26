import { TestBed } from '@angular/core/testing';

import { Loger } from './loger';

describe('Loger', () => {
  let service: Loger;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Loger);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
