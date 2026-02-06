import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserFirstAccess } from './user-first-access';

describe('UserFirsAccess', () => {
  let component: UserFirstAccess;
  let fixture: ComponentFixture<UserFirstAccess>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserFirstAccess]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserFirstAccess);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
