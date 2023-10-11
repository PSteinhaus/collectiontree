import { Component, OnInit } from '@angular/core';
import { Node } from 'ngx-edu-sharing-api/lib/api/models';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  selection: Node | null = null;

  setSelection(selectedNode: Node | null) {
    this.selection = selectedNode;
  }

  public isMobileLayout = false;
  ngOnInit() {
    const mobileCheck = (w: Window) => w.innerWidth <= 991;
    this.isMobileLayout = mobileCheck(window);
    window.onresize = () => this.isMobileLayout = mobileCheck(window);
  }
}
