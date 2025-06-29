import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EligibilityComponent } from './components/eligibility/eligibility.component';
import { StatsComponent } from './components/stats/stats.component';

const routes: Routes = [
  { path: '', component: EligibilityComponent },
  { path: 'stats', component: StatsComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }