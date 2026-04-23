import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { NavbarComponent } from './layout/navbar/navbar.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, SidebarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = signal('pokedex-trainers');
  sidebarOpen = false;

  /**
   * Toggles the application sidebar open/closed state.
   *
   * @returns void - Updates the `sidebarOpen` signal to the opposite value
   */
  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  /**
   * Closes the application sidebar.
   *
   * @returns void - Sets the `sidebarOpen` signal to false
   */
  closeSidebar() {
    this.sidebarOpen = false;
  }
}
