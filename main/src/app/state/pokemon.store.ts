import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, combineLatest } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError, map, retryWhen, scan, delay, tap, switchMap } from 'rxjs/operators';

export interface Pokemon {
  id: number;
  name: string;
  sprite: string;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  hp: number;
  speed: number;
  total: number;
  types: string[];
}

@Injectable({ providedIn: 'root' })
export class PokemonStore {
  private pokemonSubject = new BehaviorSubject<Pokemon[]>([]);
  pokemon$ = this.pokemonSubject.asObservable();
  private pokemonCache = new Map<string, Pokemon>();

  constructor(private http: HttpClient) {}

  /**
   * Fetches a single Pokémon by name or id from the PokéAPI REST endpoint.
   * Results are cached in the store to avoid redundant network calls.
   *
   * @param name - The Pokémon name or id to fetch
   * @returns Observable<Pokemon | null> - Stream emitting the fetched Pokémon or null on error
   */
  fetchPokemonByName(name: string): Observable<Pokemon | null> {
    const key = String(name).toLowerCase();
    if (this.pokemonCache.has(key)) {
      return of(this.pokemonCache.get(key)!);
    }

    return this.http.get<any>(`https://pokeapi.co/api/v2/pokemon/${key}`).pipe(
      retryWhen(errors =>
        errors.pipe(
          scan((acc, err) => {
            if (acc >= 2) {
              throw err;
            }
            return acc + 1;
          }, 0),
          delay(1000)
        )
      ),
      map(data => {
        const findStat = (statName: string) =>
          data.stats.find((s: any) => s.stat && s.stat.name === statName)?.base_stat || 0;

        const pokemon: Pokemon = {
          id: data.id,
          name: data.name,
          sprite: data.sprites?.front_default || '',
          attack: findStat('attack'),
          defense: findStat('defense'),
          specialAttack: findStat('special-attack'),
          specialDefense: findStat('special-defense'),
          hp: findStat('hp'),
          speed: findStat('speed'),
          total: data.stats.reduce((acc: number, s: any) => acc + (s.base_stat || 0), 0),
          types: (data.types || []).map((t: any) => t.type.name)
        };

        return pokemon;
      }),
      tap(p => p && this.pokemonCache.set(key, p)),
      catchError(err => {
        console.error('Error fetching Pokemon from PokeAPI:', err.message || err);
        return of(null);
      })
    );
  }
  /**
   * Fetches paginated Pokémon from the PokéAPI REST endpoint and resolves
   * individual Pokémon details in parallel.
   *
   * @param limit - Number of Pokémon to fetch per page
   * @param offset - Starting index for pagination
   * @returns Observable<Pokemon[]> - Stream of Pokémon data
   */
  fetchPokemonList(limit: number = 20, offset: number = 0): Observable<Pokemon[]> {
    return this.http.get<any>(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`).pipe(
      map(data => data.results as { name: string; url: string }[]),
      map(results => results.map(r => r.name)),
      map(names => names.map(name => this.fetchPokemonByName(name))),
      switchMap(observables => {
        if (observables.length === 0) return of([]);
        return combineLatest(observables).pipe(
          map((results: (Pokemon | null)[]) => results.filter(p => p !== null) as Pokemon[])
        );
      }),
      catchError(err => {
        console.error('Error fetching Pokemon list:', err);
        return of([]);
      })
    );
  }
  /**
   * Replaces the current stored Pokémon list with a new array.
   *
   * @param pokemon - Array of Pokémon to set in the store
   * @returns void
   */
  setPokemon(pokemon: Pokemon[]) {
    this.pokemonSubject.next(pokemon);
  }

  /**
   * Adds a single Pokémon to the current store list.
   *
   * @param pokemon - The Pokémon object to append
   * @returns void
   */
  addPokemon(pokemon: Pokemon) {
    const current = this.pokemonSubject.value;
    this.pokemonSubject.next([...current, pokemon]);
  }

  /**
   * Returns the current in-memory snapshot of the Pokémon list.
   *
   * @returns Pokemon[] - Current stored Pokémon array
   */
  getSnapshot(): Pokemon[] {
    return this.pokemonSubject.value;
  }

  /**
   * Clears the local Pokémon store.
   *
   * @returns void
   */
  clear(): void {
    this.pokemonSubject.next([]);
  }

  /**
   * Fetches list of all Pokémon types from the PokéAPI.
   *
   * @returns Observable<string[]> - Array of type names
   */
  getAllTypes(): Observable<string[]> {
    return this.http.get<any>('https://pokeapi.co/api/v2/type').pipe(
      map(data => (data.results || []).map((t: any) => t.name)),
      catchError(err => {
        console.error('Error fetching Pokemon types:', err.message || err);
        return of([]);
      })
    );
  }

  /**
   * Returns the total number of Pokémon in the global PokéAPI listing.
   *
   * @returns Observable<number> - Total Pokémon count
   */
  getPokemonCount(): Observable<number> {
    return this.http.get<any>('https://pokeapi.co/api/v2/pokemon?limit=1').pipe(
      map(data => data.count || 0),
      catchError(err => {
        console.error('Error fetching Pokemon count:', err.message || err);
        return of(0);
      })
    );
  }

  /**
   * Fetches the total number of Pokémon for a given type via the type endpoint.
   *
   * @param type - The type name (e.g., 'fire')
   * @returns Observable<number> - The number of Pokémon of that type
   */
  getPokemonCountForType(type: string): Observable<number> {
    const key = String(type).toLowerCase();
    return this.http.get<any>(`https://pokeapi.co/api/v2/type/${key}`).pipe(
      map(data => (data.pokemon || []).length),
      catchError(err => {
        console.error('Error fetching Pokemon count for type:', err.message || err);
        return of(0);
      })
    );
  }

  /**
   * Fetches a page of Pokémon names for a specific type and then resolves
   * the full Pokémon details in parallel.
   *
   * @param type - The Pokémon type (e.g., 'fire')
   * @param limit - Number of Pokémon to return
   * @param offset - Starting index into the type list
   * @returns Observable<Pokemon[]> - Stream of Pokémon for the requested page
   */
  fetchPokemonByType(type: string, limit: number = 20, offset: number = 0): Observable<Pokemon[]> {
    const key = String(type).toLowerCase();
    return this.http.get<any>(`https://pokeapi.co/api/v2/type/${key}`).pipe(
      map(data => (data.pokemon || []).map((p: any) => p.pokemon.name)),
      map((names: string[]) => names.slice(offset, offset + limit)),
      map(names => names.map(name => this.fetchPokemonByName(name))),
      switchMap(observables => {
        if (!observables || observables.length === 0) return of([]);
        return combineLatest(observables).pipe(
          map((results: (Pokemon | null)[]) => results.filter(p => p !== null) as Pokemon[])
        );
      }),
      catchError(err => {
        console.error('Error fetching Pokemon by type:', err.message || err);
        return of([]);
      })
    );
  }
}
