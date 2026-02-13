import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrevisioniListComponent } from './previsioni-list-component';

describe('PrevisioniListComponent', () => {
  let component: PrevisioniListComponent;
  let fixture: ComponentFixture<PrevisioniListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrevisioniListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrevisioniListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
