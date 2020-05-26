import { TestBed } from '@angular/core/testing';

import { ProtectedResourceService } from './protected-resource.service';

describe('ProtectedResourceService', () => {
  let service: ProtectedResourceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProtectedResourceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
