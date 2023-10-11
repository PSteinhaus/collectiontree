import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EduSharingApiModule } from 'ngx-edu-sharing-api';
import { environment } from 'src/environments/environment';
import { TreeViewComponent } from "./tree-view/tree-view.component";
import { CollectionViewComponent } from './collection-view/collection-view.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';

@NgModule({
    declarations: [
        AppComponent,
    ],
    providers: [ HttpClientModule ],
    bootstrap: [AppComponent],
    imports: [
        BrowserModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        EduSharingApiModule.forRoot({ rootUrl: environment.eduSharingApiUrl }),
        TreeViewComponent,
        HttpClientModule,
        MatSidenavModule,
        MatCardModule,
        MatListModule,
        CollectionViewComponent
    ]
})
export class AppModule { }
