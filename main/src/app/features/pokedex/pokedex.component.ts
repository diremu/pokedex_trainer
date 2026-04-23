import { Component, AfterViewInit, ViewChild, ElementRef, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PokemonStore, Pokemon } from '../../state/pokemon.store';
import { BehaviorSubject, fromEvent, combineLatest, Observable } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, startWith, tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PokemonSelectors } from '../../state/pokemon.selector';

@Component({
  selector: 'app-pokedex',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pokedex.component.html',
  styleUrl: './pokedex.component.scss'
})
export class PokedexComponent implements OnInit, AfterViewInit {
  pokemon$: Observable<Pokemon[]>;
  types$: Observable<string[]>;

  private selectors: PokemonSelectors;
  private selectedType$ = new BehaviorSubject<string>('All Types');

  pageSize = 20;
  currentPage = 0;
  totalPages = 1;
  totalItems = 0;

  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';

  @ViewChild('searchInput', { static: true }) searchInput!: ElementRef<HTMLInputElement>;

  /**
   * Component constructor — prepares selectors and type observables.
   *
   * @param pokemonStore - Store providing Pokémon data and API helpers
   * @param destroyRef - Angular destroy ref for RxJS cleanup
   */
  constructor(private pokemonStore: PokemonStore, private destroyRef: DestroyRef) {
    this.selectors = new PokemonSelectors(this.pokemonStore);

    this.types$ = this.pokemonStore.getAllTypes().pipe(
      map(types => ['All Types', ...types.map((t: string) => this.capitalize(t))])
    );

    this.pokemon$ = combineLatest([
      this.selectors.searchResults$,
      this.selectedType$.pipe(startWith('All Types'))
    ]).pipe(
      map(([list, type]) => {
        let items = Array.isArray(list) ? [...list] : [];
        if (type && type !== 'All Types') {
          const tLower = type.toLowerCase();
          items = items.filter(p => p.types.map(x => x.toLowerCase()).includes(tLower));
        }

        if (this.sortColumn) {
          items.sort((a: Pokemon, b: Pokemon) => {
            let aVal: any = (a as any)[this.sortColumn as string];
            let bVal: any = (b as any)[this.sortColumn as string];
            if (Array.isArray(aVal)) aVal = aVal[0] || '';
            if (Array.isArray(bVal)) bVal = bVal[0] || '';
            if (typeof aVal === 'string') {
              return this.sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            return this.sortDirection === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
          });
        }

        this.totalItems = items.length;
        return items;
      })
    );
  }

  /**
   * Lifecycle hook: initializes pagination by fetching the total Pokémon count
   * and loading the first page.
   *
   * @returns void
   */
  ngOnInit(): void {
    this.pokemonStore.getPokemonCount().subscribe(count => {
      this.totalPages = Math.max(1, Math.ceil(count / this.pageSize));
      this.loadPage(0);
    });
  }

  /**
   * Lifecycle hook: wires the search input to the selector's search term stream
   * with debounce and distinctUntilChanged for efficient filtering.
   *
   * @returns void
   */
  ngAfterViewInit(): void {
    fromEvent(this.searchInput.nativeElement, 'input')
      .pipe(
        map((e: any) => e.target.value as string),
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(term => this.selectors.setSearchTerm(term));
  }

  /**
   * Capitalizes the first character of a string.
   *
   * @param s - The input string to capitalize
   * @returns string - Capitalized string or empty string for falsy input
   */
  private capitalize(s: string) {
    return s && s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }
  /**
   * Handler for type selection changes from the UI. Updates the selected
   * type, recomputes total pages (global or per-type) and loads the first page.
   *
   * @param value - The selected type value (e.g. 'Fire' or 'All Types')
   * @returns void
   */
  onTypeSelected(value: string) {
    this.selectedType$.next(value);
    const sel = value;
    if (!sel || sel === 'All Types') {
      this.pokemonStore.getPokemonCount().subscribe(count => {
        this.totalPages = Math.max(1, Math.ceil(count / this.pageSize));
        this.loadPage(0);
      });
    } else {
      const key = sel.toLowerCase();
      this.pokemonStore.getPokemonCountForType(key).subscribe(count => {
        this.totalPages = Math.max(1, Math.ceil(count / this.pageSize));
        this.loadPage(0);
      });
    }
  }

  /**
   * Sorts the currently visible list by the given column and direction.
   * Single-click handlers call with 'asc', double-click handlers call with 'desc'.
   *
   * @param column - The Pokémon field to sort by (e.g. 'hp', 'attack')
   * @param dir - 'asc' or 'desc' for sort direction
   * @returns void
   */
  onHeaderClick(column: string, dir: 'asc' | 'desc') {
    if (column === 'types') return;
    this.sortColumn = column;
    this.sortDirection = dir;
    this.selectedType$.next(this.selectedType$.value);
  }

  /**
   * Loads a page of Pokémon from the store/API. If a type is selected the
   * type-specific endpoint is used; otherwise the global list endpoint is used.
   *
   * @param page - Zero-based page index to load
   * @returns void
   */
  loadPage(page: number) {
    if (page < 0 || (this.totalPages && page >= this.totalPages)) return;
    const sel = this.selectedType$.value;
    if (!sel || sel === 'All Types') {
      this.pokemonStore.fetchPokemonList(this.pageSize, page * this.pageSize).subscribe(pokemon => {
        this.pokemonStore.setPokemon(pokemon);
        this.currentPage = page;
      });
    } else {
      this.pokemonStore.fetchPokemonByType(sel.toLowerCase(), this.pageSize, page * this.pageSize).subscribe(pokemon => {
        this.pokemonStore.setPokemon(pokemon);
        this.currentPage = page;
      });
    }
  }

  /**
   * Advances to the next page, if available.
   *
   * @returns void
   */
  nextPage() {
    this.loadPage(this.currentPage + 1);
  }

  /**
   * Goes back to the previous page, if available.
   *
   * @returns void
   */
  prevPage() {
    this.loadPage(this.currentPage - 1);
  }
}
