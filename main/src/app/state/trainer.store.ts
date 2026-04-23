import { Injectable } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map, retryWhen, scan, delay, catchError } from 'rxjs/operators';

export interface Trainer {
  id: string;
  name: string;
}

export interface Team {
  id: string;
  trainerId: string;
  name: string;
  pokemon: number[];
}

export interface Battle {
  id: string;
  trainerId: string;
  result: 'WIN' | 'LOSS' | 'DRAW';
  opponentName?: string;
  teamId?: string | null;
  date?: string;
  scoreTrainer?: number;
  scoreOpponent?: number;
}

@Injectable({ providedIn: 'root' })
export class TrainerStore {
  private trainerSubject = new BehaviorSubject<Trainer | null>(null);
  trainer$ = this.trainerSubject.asObservable();

  private teamsSubject = new BehaviorSubject<Team[]>([]);
  teams$ = this.teamsSubject.asObservable();

  private battlesSubject = new BehaviorSubject<Battle[]>([]);
  battles$ = this.battlesSubject.asObservable();

  private profileSubject = new BehaviorSubject<any | null>(null);
  profile$ = this.profileSubject.asObservable();

  constructor(private http: HttpClient) {}
  /**
   * Sets the current trainer in the store.
   *
   * @param trainer - Trainer object to store
   * @returns void
   */
  setTrainer(trainer: Trainer) {
    this.trainerSubject.next(trainer);
  }

  /**
   * Replaces the teams list in the store.
   *
   * @param teams - Array of Team objects
   * @returns void
   */
  setTeams(teams: Team[]) {
    this.teamsSubject.next(teams);
  }

  /**
   * Appends a team to the current teams array.
   *
   * @param team - Team object to add
   * @returns void
   */
  addTeam(team: Team) {
    this.teamsSubject.next([...this.teamsSubject.value, team]);
  }

  /**
   * Updates an existing team in the store by id.
   *
   * @param updated - The updated Team object
   * @returns void
   */
  updateTeam(updated: Team) {
    const teams = this.teamsSubject.value.map(t =>
      t.id === updated.id ? updated : t
    );
    this.teamsSubject.next(teams);
  }

  /**
   * Removes a team by id from the store.
   *
   * @param id - The id of the team to delete
   * @returns void
   */
  deleteTeam(id: string) {
    this.teamsSubject.next(
      this.teamsSubject.value.filter(t => t.id !== id)
    );
  }

  /**
   * Replaces the stored battle list.
   *
   * @param battles - Array of Battle objects
   * @returns void
   */
  setBattles(battles: Battle[]) {
    this.battlesSubject.next(battles);
  }

  /**
   * Appends a battle entry to the current battles array.
   *
   * @param battle - Battle object to add
   * @returns void
   */
  addBattle(battle: Battle) {
    this.battlesSubject.next([...this.battlesSubject.value, battle]);
  }

  // Optimistic create: immediately add team, rollback on error
  /**
   * Creates a team optimistically: adds a temporary team to the store,
   * attempts the GraphQL mutation, and rolls back on error.
   *
   * @param trainerId - The trainer's id
   * @param name - The team name
   * @param pokemon - Array of Pokémon ids for the team
   * @returns void
   */
  createTeamOptimistic(trainerId: string, name: string, pokemon: number[]) {
    const tempId = `temp-${Date.now()}`;
    const optimistic: Team = { id: tempId, trainerId, name, pokemon };
    this.addTeam(optimistic);

    if (!this.http) {
      // No HttpClient available (unit tests or server-less), return
      return;
    }

    const mutation = `mutation CreateTeam($trainerId: ID!, $name: String!, $pokemon: [Int!]) { createTeam(trainerId: $trainerId, name: $name, description: \"\", pokemon: $pokemon) { id trainerId name pokemon } }`;
    const body = { query: mutation, variables: { trainerId, name, pokemon } };

    this.http.post<any>('http://localhost:4000/graphql', body).pipe(
      retryWhen(errors =>
        errors.pipe(
          scan((acc, err) => {
            if (acc >= 2) throw err;
            return acc + 1;
          }, 0),
          delay(1000)
        )
      ),
      map(res => res?.data?.createTeam)
    ).subscribe({
      next: (created: any) => {
        if (created) {
          this.updateTeam({
            id: String(created.id),
            trainerId: String(created.trainerId),
            name: created.name,
            pokemon: created.pokemon
          });
        }
      },
      error: (err) => {
        console.error('createTeam failed, rolling back optimistic update', err);
        this.deleteTeam(tempId);
      }
    });
  }

  /**
   * Loads a trainer profile (including teams and battles) from the GraphQL API
   * and updates the local store subjects.
   *
   * @param id - Trainer id (string or number)
   */
  loadTrainerProfile(id: string | number) {
    const query = `query GetTrainerProfile($id: ID!) {\n      getTrainerProfile(id: $id) {\n        id\n        name\n        title\n        avatar\n        stats { totalBattles wins losses winRate currentStreak }\n        teams { id trainerId name pokemon createdAt updatedAt }\n        battles { id trainerId opponentId opponentName teamId result date }\n      }\n    }`;

    const body = { query, variables: { id: String(id) } };

    this.http.post<any>('http://localhost:4000/graphql', body).pipe(
      map(res => res?.data?.getTrainerProfile || null),
      catchError(err => {
        console.error('Error loading trainer profile:', err);
        return of(null);
      })
    ).subscribe(profile => {
      if (!profile) return;

      this.profileSubject.next(profile);
      this.trainerSubject.next({ id: String(profile.id), name: profile.name });

      const teams = (profile.teams || []).map((t: any) => ({
        id: String(t.id),
        trainerId: String(t.trainerId ?? t.trainer_id ?? profile.id),
        name: t.name,
        pokemon: (t.pokemon || []).map((p: any) => Number(p))
      }));

      this.teamsSubject.next(teams);

      const battles = (profile.battles || []).map((b: any) => ({
        id: String(b.id),
        trainerId: String(b.trainerId ?? b.trainer_id ?? profile.id),
        result: (b.result || '').toUpperCase(),
        opponentName: b.opponentName || b.opponent_name || '',
        teamId: b.teamId || b.team_id || null,
        date: b.date || ''
      }));

      this.battlesSubject.next(battles);
    });
  }
}