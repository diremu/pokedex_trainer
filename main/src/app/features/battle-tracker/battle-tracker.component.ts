import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrainerStore } from '../../state/trainer.store';

@Component({
  selector: 'app-battle-tracker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './battle-tracker.component.html',
  styleUrl: './battle-tracker.component.scss'
})
export class BattleTrackerComponent implements OnInit {
  /**
   * Expose battles stream from the store via a getter to avoid initialization-order errors.
   */
  get battles$() {
    return this.trainerStore.battles$;
  }

  /**
   * Expose profile stream from the store via a getter to avoid initialization-order errors.
   */
  get profile$() {
    return this.trainerStore.profile$;
  }

  constructor(private trainerStore: TrainerStore) {}

  /**
   * Component init lifecycle: loads the trainer profile (teams, battles, stats).
   * Defaults to trainer id '1' when no active trainer is set.
   *
   * @returns void
   */
  ngOnInit(): void {
    // default to trainer id 1 if none selected yet
    this.trainerStore.loadTrainerProfile('1');
  }
}
