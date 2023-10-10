import { TestBed } from '@angular/core/testing';

import { CollectionFetcherService } from './collection-fetcher.service';

describe('CollectionFetcherService', () => {
  let service: CollectionFetcherService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CollectionFetcherService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
