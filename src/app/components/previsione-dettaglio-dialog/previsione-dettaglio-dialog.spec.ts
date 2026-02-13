import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrevisioneDettaglioDialogComponent } from './previsione-dettaglio-dialog';


describe('PrevisioneDettaglioDialog', () => {
  let component: PrevisioneDettaglioDialogComponent;
  let fixture: ComponentFixture<PrevisioneDettaglioDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrevisioneDettaglioDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrevisioneDettaglioDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
