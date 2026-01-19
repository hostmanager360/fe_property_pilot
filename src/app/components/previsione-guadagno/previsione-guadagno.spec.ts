import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrevisioneGuadagno } from './previsione-guadagno';

describe('PrevisioneGuadagno', () => {
  let component: PrevisioneGuadagno;
  let fixture: ComponentFixture<PrevisioneGuadagno>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrevisioneGuadagno]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrevisioneGuadagno);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
