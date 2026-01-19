import { TestBed } from '@angular/core/testing';

import { PrevisioneGuadagnoService } from './previsione-guadagno-service';

describe('PrevisioneGuadagnoService', () => {
  let service: PrevisioneGuadagnoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PrevisioneGuadagnoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
