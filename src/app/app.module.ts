import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EduSharingApiModule } from 'ngx-edu-sharing-api';
import { environment } from 'src/environments/environment';
import { TreeViewComponent } from "./tree-view/tree-view.component";

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
    ]
})
export class AppModule { }
