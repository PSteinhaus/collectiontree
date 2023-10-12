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
import { Output, EventEmitter } from '@angular/core';
import { MatRippleModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from 'src/environments/environment';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';

export class TreeNode {
  public children: Array<TreeNode> | undefined;
  public isLoading: boolean = false;
  constructor(
    public node: Node,
    public level: number,
  ) {}

  public get title() { return this.node.title; }
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

/** Object responsible for listening to changes in the tree, specifically when expansions
 *  are toggled.
 *  Adds/removes the relevant nodes and requests them from the backend if necessary.*/
class DynamicDataSource implements DataSource<TreeNode> {
  /** A stream that we can push our tree changes to */
  dataChange = new BehaviorSubject<TreeNode[]>([]);

  constructor(
    private _treeControl: FlatTreeControl<TreeNode>,
    private _nodeFetcher: TreeNodeFetcherService,
    private _snackBar: MatSnackBar,
    private _isExpandable: (tNode: TreeNode) => boolean,
  ) {}

  /** Holds the state of the tree */
  get data(): TreeNode[] {
    return this.dataChange.value;
  }
  set data(value: TreeNode[]) {
    this._treeControl.dataNodes = value;
    this.dataChange.next(value);
  }

  connect(collectionViewer: CollectionViewer): Observable<readonly TreeNode[]> {
    // listen to changes to the list of expanded nodes and react
    this._treeControl.expansionModel.changed.subscribe(change => {
      if (
        (change as SelectionChange<TreeNode>).added ||
        (change as SelectionChange<TreeNode>).removed
      ) {
        this.handleTreeControl(change as SelectionChange<TreeNode>);
      }
    });
    // Merge the collectionViewer stream with our own one, so that the resulting stream emits
    // both when the tree changes as well as when we make it update. 
    // The Observable always returns this.data, as this is where we choose
    // to store the truth of the tree.
    return merge(collectionViewer.viewChange, this.dataChange).pipe(map(() => this.data));
  }
  disconnect(_collectionViewer: CollectionViewer): void {}
  
  /** Get the sub-collections of a collection from the backend. */
  fetchNodeChildren(tNode: TreeNode) {
    const t = this;
    tNode.isLoading = true;
    this._nodeFetcher.getChildren(tNode.node.ref.id, tNode.level + 1).subscribe({
      next(tNodes) {
        tNode.children = tNodes;
        tNode.isLoading = false;
        // directly add the loaded collections to the tree, just below the parent node
        const index = t.data.indexOf(tNode);
        t.data.splice(index + 1, 0, ...tNode.children);
        // notify the tree of the change
        t.dataChange.next(t.data);
      },
      error(_err) {
        tNode.isLoading = false;
        t._snackBar.open(`Die Untersammlungen der Sammlung ${tNode.title} konnten nicht geladen werden.`, 'Ok', {
          verticalPosition: 'top'
        });
      },
    })
  }

  /** Reacts to toggled tree nodes by toggling their representations. */
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

  /** Adds or removes the children of a node, depending on whether it was expanded. */
  toggleNode(tNode: TreeNode, expand: boolean) {
    const index = this.data.indexOf(tNode);
    if (!this._isExpandable(tNode) || index < 0) {
      return;
    }
    
    if (expand) {
      // fetch the sub-collections and add them to the tree
      this.fetchNodeChildren(tNode);
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
  imports: [MatTreeModule, MatButtonModule, MatIconModule, NgIf, MatProgressBarModule, MatRippleModule, MatSnackBarModule, MatProgressSpinnerModule, MatCardModule],
})
export class TreeViewComponent implements OnInit {
  constructor(private _nodeFetcher: TreeNodeFetcherService, private _snackBar: MatSnackBar) {
    this.treeControl = new FlatTreeControl<TreeNode>(this.getLevel, this.isExpandable);
    this.dataSource = new DynamicDataSource(this.treeControl, _nodeFetcher, _snackBar, this.isExpandable);
  }
  
  treeControl: FlatTreeControl<TreeNode>;
  dataSource: DynamicDataSource;
  isLoading = true;

  getLevel = (tNode: TreeNode) => tNode.level;
  isExpandable = (tNode: TreeNode) => tNode.node?.collection?.childCollectionsCount !== undefined && tNode.node?.collection?.childCollectionsCount > 0;

  ngOnInit(): void {
    // get the root collections to seed the data
    const ds = this.dataSource;
    const sBar = this._snackBar;
    const t = this;
    this._nodeFetcher.getChildren(environment.rootCollectionID, 1).subscribe({
      next(tNodeArray) { 
        ds.data = tNodeArray;
        t.isLoading = false;
      },
      error(_err) {
        sBar.open('Sammlungen konnten nicht geladen werden.', 'Ok', {
          verticalPosition: 'top'
        });
      },
    })
  }

  selectedNode: TreeNode | null = null;
  selectNode(tNode: TreeNode) {
    if (this.selectedNode == tNode) {
      this.selectedNode = null;
      this.nodeSelectionEvent.emit(null);
    } else {
      this.selectedNode = tNode;
      this.nodeSelectionEvent.emit(tNode.node);
    }
  }

  @Output() nodeSelectionEvent = new EventEmitter<Node | null>();
}