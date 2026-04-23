
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrainerStore } from '../../state/trainer.store';

@Component({
  selector: 'app-trainer-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trainer-profile.component.html',
  styleUrl: './trainer-profile.component.scss'
})
export class TrainerProfileComponent implements OnInit {
  /**
   * Expose trainer profile observable via getter to avoid DI initialization order issues.
   */
  get profile$() {
    return this.trainerStore.profile$;
  }

  constructor(private trainerStore: TrainerStore) {}

  /**
   * Component initialization: load the trainer profile into the store.
   *
   * @returns void
   */
  ngOnInit(): void {
    this.trainerStore.loadTrainerProfile('1');
  }
}
