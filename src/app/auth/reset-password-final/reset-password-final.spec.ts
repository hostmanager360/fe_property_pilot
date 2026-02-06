import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResetPasswordFinalComponent } from './reset-password-final';

describe('ResetPasswordFinal', () => {
  let component: ResetPasswordFinalComponent;
  let fixture: ComponentFixture<ResetPasswordFinalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetPasswordFinalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResetPasswordFinalComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
