import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { HomePageComponent } from './home-page/home-page.component';
import { NavBarComponent } from './UI Folder/nav-bar/nav-bar.component';
import { RegisterComponent } from './register/register.component';
import { log } from 'console';
import { LogInComponent } from './log-in/log-in.component';
import { UserDashboardComponent } from './user-dashboard/user-dashboard.component';
import { CoursesComponent } from './courses/courses.component';
import { CertificatesComponent } from './certificates/certificates.component';
import { CommunityComponent } from './community/community.component';
import { CourseViewComponent } from './course-view/course-view.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { CourseManagementComponent } from './course-management/course-management.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterLink, RouterModule, RouterOutlet } from '@angular/router';
import { UserNavComponent } from './UI Folder/user-nav/user-nav.component';
import { TestComponent } from './test/test.component';
import { AdminNavComponent } from './UI Folder/nav-bar/admin-nav/admin-nav.component';
import { ManageCommunityComponent } from './manage-community/manage-community.component';
import { FileSaverModule } from 'ngx-filesaver';



@NgModule({
  declarations: [

    App,
    HomePageComponent,
    NavBarComponent,
    UserDashboardComponent,
  CoursesComponent,
  CertificatesComponent,
  CommunityComponent,
  CourseViewComponent,
  AdminDashboardComponent,
  CourseManagementComponent,
      LogInComponent,
      UserNavComponent,
      TestComponent,
      AdminNavComponent,
      ManageCommunityComponent,
   

  ],
  imports: [
  BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    HttpClientModule,
    RouterModule,
    RouterOutlet,
   FileSaverModule,
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideClientHydration(withEventReplay())
  ],
  bootstrap: [App]
})
export class AppModule { }
