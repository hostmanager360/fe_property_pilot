import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TenantFirstAccess } from './tenant-first-access';

describe('TenantFirstAccess', () => {
  let component: TenantFirstAccess;
  let fixture: ComponentFixture<TenantFirstAccess>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TenantFirstAccess]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TenantFirstAccess);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
