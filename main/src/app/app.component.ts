import { Component, signal } from '@angular/core';
// import { animate, style, transition, trigger } from '@angular/animation';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="app-container">
    <aside class="sidebar">
      <div class="trainer-profile">
        <img
          src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/1.png"
          alt="Trainer"
        />
        <h3>Ash Ketchum</h3>
        <span class="badge-count">Rank: Master</span>
      </div>
      <nav>
        <button class="nav-item active">Pokédex</button>
        <button class="nav-item">Team Builder</button>
        <button class="nav-item">Battle Logs</button>
      </nav>
    </aside>

    <main class="main-content">
      <header class="top-nav">
        <input
          type="text"
          placeholder="Search Pokémon (e.g. Pikachu)..."
          class="search-bar"
        />
      </header>

      <section class="content-body">
        <h2>Pokédex Database</h2>
        <div class="placeholder-grid">
          <p>Click a Pokémon to see the Slide-In Detail Panel.</p>
          <button (click)="isDetailOpen.set(true)">View Pikachu Details</button>
        </div>
      </section>
    </main>

    @if (isDetailOpen()) {
      <div class="detail-panel" @slideInOut>
        <button class="close-btn" (click)="isDetailOpen.set(false)">x</button>
        <h2>Pokémon Details</h2>
      </div>
    }
  </div>`,
  styleUrl: './app.component.scss',
  // animations: [
  //   trigger('slideInOut', [
  //     transition(':enter', [
  //       style({ transform: 'translateX(100%)' }),
  //       animate('300ms ease-out', style({ transform: 'translateX(0%)' })),
  //     ]),
  //     transition(':leave', [
  //       animate('200ms ease-in', style({ transform: 'translateX(100%)' })),
  //     ]),
  //   ]),
  // ],
})
export class AppComponent {
  isDetailOpen = signal(false);
}
