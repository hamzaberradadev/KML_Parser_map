import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from './home-page/home-page.component';
import { MapComponent } from './map/map.component';
const routes: Routes = [
  {path: 'Home', component: HomePageComponent},
  {path: 'Map', component: MapComponent},
  {path: '**', redirectTo: 'Map', pathMatch: 'full'},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
