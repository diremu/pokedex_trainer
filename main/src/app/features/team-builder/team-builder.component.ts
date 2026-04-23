
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PokemonStore, Pokemon } from '../../state/pokemon.store';
import { TrainerStore } from '../../state/trainer.store';

@Component({
  selector: 'app-team-builder',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './team-builder.component.html',
  styleUrl: './team-builder.component.scss'
})
export class TeamBuilderComponent implements OnInit {
  /**
   * Teams stream from the TrainerStore. Exposed via getter to avoid
   * initialization-order diagnostics when the DI happens.
   */
  get teams$() {
    return this.trainerStore.teams$;
  }

  selectedSlots: (number | null)[] = [null, null, null, null, null, null];
  slotDetails: (Pokemon | null)[] = [null, null, null, null, null, null];

  constructor(private trainerStore: TrainerStore, private pokemonStore: PokemonStore) {}

  ngOnInit(): void {
    this.trainerStore.loadTrainerProfile('1');
  }

  /**
   * Prompt for and add a Pokémon to the given roster slot.
   * Uses `PokemonStore.fetchPokemonByName` to resolve details and updates the local slot state.
   *
   * @param index - Slot index (0-5)
   * @returns void
   */
  addPokemonToSlot(index: number) {
    const nameOrId = prompt('Enter Pokémon name or id to add to slot ' + (index + 1));
    if (!nameOrId) return;

    this.pokemonStore.fetchPokemonByName(nameOrId).subscribe(p => {
      if (!p) {
        alert('Pokémon not found');
        return;
      }
      this.selectedSlots[index] = p.id;
      this.slotDetails[index] = p;
    });
  }

  /**
   * Remove a Pokémon from the specified slot.
   *
   * @param index - Slot index to clear
   * @returns void
   */
  removeFromSlot(index: number) {
    this.selectedSlots[index] = null;
    this.slotDetails[index] = null;
  }

  /**
   * Load an existing team into the roster editor.
   * Fetches Pokémon details for each slot as needed.
   *
   * @param team - Team object from the store
   * @returns void
   */
  loadTeam(team: any) {
    for (let i = 0; i < 6; i++) {
      const pid = team.pokemon && team.pokemon[i];
      if (pid) {
        this.selectedSlots[i] = Number(pid);
        this.pokemonStore.fetchPokemonByName(String(pid)).subscribe(p => (this.slotDetails[i] = p));
      } else {
        this.selectedSlots[i] = null;
        this.slotDetails[i] = null;
      }
    }
  }

  /**
   * Save the currently assembled team using an optimistic server mutation.
   * Prompts for a team name if one is not provided.
   *
   * @returns void
   */
  saveTeam() {
    const pokemonIds = this.selectedSlots.filter(s => s !== null).map(s => Number(s));
    if (pokemonIds.length === 0) {
      alert('Select at least one Pokémon for your team');
      return;
    }

    const name = prompt('Team name', 'New Team');
    if (!name) return;

    // Using optimistic create helper in TrainerStore
    this.trainerStore.createTeamOptimistic('1', name, pokemonIds);
    // Optionally clear editor after save
  }
}
