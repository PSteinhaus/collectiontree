import { Injectable } from '@angular/core';
import { CollectionService } from 'ngx-edu-sharing-api';
import { Observable, map } from 'rxjs';
import { Node } from 'ngx-edu-sharing-api/lib/api/models';

@Injectable({
  providedIn: 'root'
})
export class CollectionFetcherService {

  constructor(private collectionService: CollectionService) { }

  /** Returns all child collections of the given node. Enter `null` to receive the collections at root level. */
  getChildren(parentCollectionID: string) : Observable<Array<Node>> {
    return this.collectionService.getSubCollections(
      parentCollectionID,
      { repository: '-home-' },
    )
  }
}
