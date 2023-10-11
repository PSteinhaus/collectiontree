import { Component, Input } from '@angular/core';
import { Node } from 'ngx-edu-sharing-api/lib/api/models';
import { NgIf } from '@angular/common';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-collection-view',
  templateUrl: './collection-view.component.html',
  styleUrls: ['./collection-view.component.scss'],
  standalone: true,
  imports: [ NgIf, MatListModule ]
})
export class CollectionViewComponent {
  @Input() collection: Node | null = null;

  public get creatorName() : string {
    let name = this.collection?.createdBy?.firstName;
    if (name !== undefined) {
      name += " ";
    }
    if (this.collection?.createdBy?.lastName !== undefined) {
      if (name === undefined) {
        name = this.collection.createdBy.lastName;
      } else {
        name += this.collection.createdBy.lastName;
      }
    }
    if (name === undefined) {
      name = "unbekannt"
    }
    return name;
  }
}
