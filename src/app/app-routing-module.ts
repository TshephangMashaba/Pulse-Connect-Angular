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
    path: 'courses',
    component: CoursesComponent
  },
  {
    path: 'certificates',
    component: CertificatesComponent
  },
  {
    path: 'community',
    component: CommunityComponent
  },
  {
    path: 'course-view', //needs to be id
    component: CourseViewComponent
  },
  {
    path: 'admin-dashboard',
    component: AdminDashboardComponent
  },
  {
    path: 'manage-courses',
    component: CourseManagementComponent
  }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
