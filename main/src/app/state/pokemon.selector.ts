import { BehaviorSubject, combineLatest, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, switchMap, shareReplay } from 'rxjs/operators';
import { Pokemon, PokemonStore } from './pokemon.store';

export class PokemonSelectors {
  private sortColumn$ = new BehaviorSubject<string | null>(null);
  private sortDirection$ = new BehaviorSubject<'asc' | 'desc'>('asc');
  private searchTerm$ = new BehaviorSubject<string>('');

  constructor(private store: PokemonStore) {}

  /**
   * Observable of the raw Pokémon array from the store.
   *
   * @returns Observable<Pokemon[]> - Stream of the stored Pokémon list
   */
  get all$() {
    return this.store.pokemon$.pipe(distinctUntilChanged());
  }

  /**
   * Returns a sorted view of the store's Pokémon according to the active
   * sort column and direction.
   *
   * @returns Observable<Pokemon[]> - Stream of sorted Pokémon arrays
   */
  get sortedPokemon$() {
    return combineLatest([
      this.store.pokemon$,
      this.sortColumn$,
      this.sortDirection$
    ]).pipe(
      map(([pokemon, column, direction]) => {
        if (!column) return pokemon;
        return [...pokemon].sort((a: Pokemon, b: Pokemon) => {
          const aVal = a[column as keyof Pokemon] as any;
          const bVal = b[column as keyof Pokemon] as any;
          if (typeof aVal === 'string') {
            return direction === 'asc'
              ? (aVal as string).localeCompare(bVal as string)
              : (bVal as string).localeCompare(aVal as string);
          }
          return direction === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
        });
      }),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
    );
  }


  /**
   * Observable of search results derived from the `searchTerm$` stream.
   * If a name matches locally the snapshot is returned, otherwise attempts
   * to fetch by name from the API.
   *
   * @returns Observable<Pokemon[]> - Stream of Pokémon matching the search
   */
  get searchResults$() {
    return this.searchTerm$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        const q = term.trim().toLowerCase();
        if (!q) return this.store.pokemon$;

        const snapshot = this.store.getSnapshot();
        const filtered = snapshot.filter(p => p.name.toLowerCase().includes(q));
        if (filtered.length) return of(filtered);

        return this.store.fetchPokemonByName(q).pipe(
          map(p => (p ? [p] : []))
        );
      }),
      shareReplay(1)
    );
  }

  // Expensive derived data: type effectiveness calculated and cached
  /**
   * Derived data mapping types to their occurrence counts in the store.
   *
   * @returns Observable<Record<string, number>> - Map of type -> count
   */
  get typeEffectiveness$() {
    return this.store.pokemon$.pipe(
      map(pokemons => {
        const counters: Record<string, number> = {};
        pokemons.forEach(p => p.types.forEach(t => counters[t] = (counters[t] || 0) + 1));
        return counters;
      }),
      shareReplay(1)
    );
  }

  /**
   * Sets the active sort column. If the same column is selected twice the
   * sort direction toggles between ascending and descending.
   *
   * @param column - The column name to sort by (e.g. 'hp', 'attack')
   * @returns void
   */
  setSortBy(column: string) {
    const current = this.sortColumn$.value;
    if (current === column) {
      const dir = this.sortDirection$.value === 'asc' ? 'desc' : 'asc';
      this.sortDirection$.next(dir);
    } else {
      this.sortColumn$.next(column);
      this.sortDirection$.next('asc');
    }
  }

  /**
   * Pushes a new search term into the selector pipeline.
   *
   * @param term - The search string to apply
   * @returns void
   */
  setSearchTerm(term: string) {
    this.searchTerm$.next(term);
  }

  /**
   * Returns an observable of Pokémon filtered by the given type.
   *
   * @param type - The type name to filter by (e.g. 'water')
   * @returns Observable<Pokemon[]> - Stream of Pokémon matching the type
   */
  byType(type: string) {
    return this.store.pokemon$.pipe(
      map(pokemon => pokemon.filter(p => p.types.includes(type))),
      distinctUntilChanged()
    );
  }

  /**
   * Returns the Pokémon array sorted by name ascending.
   *
   * @returns Observable<Pokemon[]> - Stream of Pokémon sorted by name
   */
  get sortedByName$() {
    return this.store.pokemon$.pipe(
      map(pokemon => [...pokemon].sort((a, b) => a.name.localeCompare(b.name))),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
    );
  }
}
