import { combineLatest } from 'rxjs';
import { map, distinctUntilChanged, shareReplay } from 'rxjs/operators';
import { TrainerStore } from './trainer.store';

export class TrainerSelectors {
  constructor(private store: TrainerStore) {}

  trainer$ = this.store.trainer$.pipe(distinctUntilChanged());
  teams$ = this.store.teams$.pipe(distinctUntilChanged());
  battles$ = this.store.battles$.pipe(distinctUntilChanged());

  /**
   * Method to calculate the winrate of the trainer
   * @returns Observable<number> - Stream emitting the winrate as a decimal (e.g., 0.75 for 75%)
   */
  winRate$ = this.store.battles$.pipe(
    map(battles => {
      if (!battles.length) return 0;
      const wins = battles.filter(b => b.result === 'WIN').length;
      return wins / battles.length;
    }),
    distinctUntilChanged()
  );

  /**
   * Method to calculate the wins, losses and draes of the trainer
   * @returns Observable<{ wins: number; losses: number; draws: number }> - Stream emitting an object with the counts of wins, losses and draws
   */
  battleStats$ = this.store.battles$.pipe(
    map(battles => {
      const wins = battles.filter(b => b.result === 'WIN').length;
      const losses = battles.filter(b => b.result === 'LOSS').length;
      const draws = battles.filter(b => b.result === 'DRAW').length;

      return { wins, losses, draws };
    }),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
    shareReplay(1)
  );
  /**
   * Method to calculate the teams with the number of battles they have participated in
   * @returns Observable<(Team & { battles: number })[]> - Stream emitting an array of teams with an additional 'battles' property indicating the number of battles each team has participated in
   */
  teamsWithCounts$ = combineLatest([
    this.store.teams$,
    this.store.battles$
  ]).pipe(
    map(([teams, battles]) =>
      teams.map(team => ({
        ...team,
        battles: battles.filter(b => b.trainerId === team.trainerId).length
      }))
    ),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
    shareReplay(1)
  );
}