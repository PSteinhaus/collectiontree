import { Component, Injectable, OnInit } from '@angular/core';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Node } from 'ngx-edu-sharing-api/lib/api/models';
import { CollectionFetcherService } from '../services/collection-fetcher.service';
import { BehaviorSubject, map, merge, Observable } from 'rxjs';
import { CollectionViewer, DataSource, SelectionChange } from '@angular/cdk/collections';
import { NgIf } from '@angular/common';

export class TreeNode {
  public children: Array<TreeNode> | undefined;
  public isLoading: boolean = false;
  constructor(
    public node: Node,
    public level: number,
  ) {}

  public get name() { return this.node.name; }
}

@Injectable({
  providedIn: 'root'
})
class TreeNodeFetcherService {
  constructor(private collectionFetcher: CollectionFetcherService) {}

  /** Returns tree nodes corresponding to all child collections of the given tree node.
   *  Enter `null` to receive the collections at root level. */
  getChildren(parentCollectionID: string, newlevel: number) {
    return this.collectionFetcher.getChildren(parentCollectionID).pipe(
      map(nodes => nodes.map(
        node => {
          const tNode = new TreeNode(node, newlevel);
          return tNode;
        }
      ))
    )
  }
}

class DynamicDataSource implements DataSource<TreeNode> {
  dataChange = new BehaviorSubject<TreeNode[]>([]);

  get data(): TreeNode[] {
    return this.dataChange.value;
  }
  set data(value: TreeNode[]) {
    this._treeControl.dataNodes = value;
    this.dataChange.next(value);
  }

  constructor(
    private _treeControl: FlatTreeControl<TreeNode>,
    private _nodeFetcher: TreeNodeFetcherService,
  ) {}

  connect(collectionViewer: CollectionViewer): Observable<readonly TreeNode[]> {
    this._treeControl.expansionModel.changed.subscribe(change => {
      if (
        (change as SelectionChange<TreeNode>).added ||
        (change as SelectionChange<TreeNode>).removed
      ) {
        this.handleTreeControl(change as SelectionChange<TreeNode>);
      }
    });

    return merge(collectionViewer.viewChange, this.dataChange).pipe(map(() => this.data));
  }
  disconnect(collectionViewer: CollectionViewer): void {}
  
  fetchNodeChildren(tNode: TreeNode) {
    const t = this;
    tNode.isLoading = true;
    this._nodeFetcher.getChildren(tNode.node.ref.id, tNode.level + 1).subscribe({
      next(tNodes) {
        tNode.children = tNodes;
        console.log('children: ',tNodes);
        tNode.isLoading = false;
        // notify the tree of the change
        t.dataChange.next(t.data);
        console.log('data: ', t.data)
      }
    })
  }

  handleTreeControl(change: SelectionChange<TreeNode>) {
    if (change.added) {
      change.added.forEach(tNode => this.toggleNode(tNode, true));
    }
    if (change.removed) {
      change.removed
        .slice()
        .reverse()
        .forEach(tNode => this.toggleNode(tNode, false))
    }
  }

  toggleNode(tNode: TreeNode, expand: boolean) {
    const index = this.data.indexOf(tNode);
    if (tNode.children === undefined || index < 0) {
      return;
    }
    
    if (expand) {
      // now that they get visible the children need to fetch their own children
      tNode.children.forEach(childNode => this.fetchNodeChildren(childNode));
      this.data.splice(index + 1, 0, ...tNode.children);
    } else {
      let count = 0;
      for (
        let i = index + 1;
        i < this.data.length && this.data[i].level > tNode.level;
        i++, count++
      ) {}
      this.data.splice(index + 1, count);
    }

    // notify the tree of the change
    this.dataChange.next(this.data);
  }
}

@Component({
  selector: 'app-tree-view',
  templateUrl: './tree-view.component.html',
  styleUrls: ['./tree-view.component.scss'],
  standalone: true,
  imports: [MatTreeModule, MatButtonModule, MatIconModule, NgIf, MatProgressBarModule],
})
export class TreeViewComponent implements OnInit {
  constructor(private nodeFetcher: TreeNodeFetcherService) {
    this.treeControl = new FlatTreeControl<TreeNode>(this.getLevel, this.isExpandable);
    this.dataSource = new DynamicDataSource(this.treeControl, nodeFetcher);
  }
  
  treeControl: FlatTreeControl<TreeNode>;
  dataSource: DynamicDataSource;

  getLevel = (tNode: TreeNode) => tNode.level;
  isExpandable = (tNode: TreeNode) => tNode.children !== undefined && tNode.children.length > 0;

  ngOnInit(): void {
    // get the root collections to seed the data
    const ds = this.dataSource
    this.nodeFetcher.getChildren('-root-', 1).subscribe({
      next(tNodeArray) { 
        // fetch the grand children, so that the user sees which nodes are expandable
        tNodeArray.forEach( tNode => ds.fetchNodeChildren(tNode) )
        ds.data = tNodeArray;
      }
    })
  }

  hasChildren = (_: number, tNode: TreeNode) => tNode.children !== undefined && tNode.children.length > 0;
}