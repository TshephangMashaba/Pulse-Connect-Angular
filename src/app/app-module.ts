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
  AdminDashboardComponent

  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RegisterComponent,
    LogInComponent,

  
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideClientHydration(withEventReplay())
  ],
  bootstrap: [App]
})
export class AppModule { }
