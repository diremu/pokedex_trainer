import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { PokedexComponent } from './features/pokedex/pokedex.component';
import { TeamBuilderComponent } from './features/team-builder/team-builder.component';
import { BattleTrackerComponent } from './features/battle-tracker/battle-tracker.component';
import { TrainerProfileComponent } from './features/trainer-profile/trainer-profile.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'pokedex', component: PokedexComponent },
  { path: 'team-builder', component: TeamBuilderComponent },
  { path: 'battles', component: BattleTrackerComponent },
  { path: 'profile', component: TrainerProfileComponent },
  { path: '**', redirectTo: '/home' }
];
