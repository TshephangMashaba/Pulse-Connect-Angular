import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from './home-page/home-page.component';
import { RegisterComponent } from './register/register.component';
import { LogInComponent } from './log-in/log-in.component';
import { UserDashboardComponent } from './user-dashboard/user-dashboard.component';
import { CoursesComponent } from './courses/courses.component';
import { CertificatesComponent } from './certificates/certificates.component';
import { CommunityComponent } from './community/community.component';
import { CourseViewComponent } from './course-view/course-view.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { CourseManagementComponent } from './course-management/course-management.component';
import { ManageCommunityComponent } from './manage-community/manage-community.component';
import { ProfileSettingsComponent } from './profile-settings/profile-settings.component';
import { ContactComponent } from './contact/contact.component';
import { CoursesAdvertComponent } from './courses-advert/courses-advert.component';
import { AdminSettingsComponent } from './admin-settings/admin-settings.component';
import { UsersManagementComponent } from './users-management/users-management.component';
import { AnalyticsComponent } from './analytics/analytics.component';

const routes: Routes = [
  { 
    path: 'home',
    component: HomePageComponent 
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: 'login',
    component: LogInComponent
  },
  {
    path: 'my-dashboard',
    component: UserDashboardComponent
  },
  {
    path: 'certificates',
    component: CertificatesComponent
  },
  {
    path: 'community',
    component: CommunityComponent
  },
  { path: 'courses',
    component: CoursesComponent
  },

  { path: 'course/:id',
    component: CourseViewComponent
  },
  {
    path: 'admin-dashboard',
    component: AdminDashboardComponent
  },
  {
    path: 'manage-courses',
    component: CourseManagementComponent
  },
  {
    path: 'manage-community',
    component: ManageCommunityComponent
  },
  {
    path: 'profile-settings',
    component: ProfileSettingsComponent
  },
  {
    path: 'contact',
    component: ContactComponent
  },
{
  path: 'courses-enroll',
  component: CoursesAdvertComponent
},
{
  path: 'admin-setting',
  component: AdminSettingsComponent
},
{
  path: 'users-management',
  component: UsersManagementComponent
},
{
  path: 'analytics',
  component: AnalyticsComponent
}



];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
