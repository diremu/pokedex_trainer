import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  @Output() toggleSidebar = new EventEmitter<void>();

  /**
   * Handles key up events inside the navbar (debug hook).
   *
   * @param event - The keyboard event emitted by the element
   * @returns void
   */
  keyUphandler(event: Event) {
    console.log(event);
  }

  /**
   * Emits the `toggleSidebar` event to request the app toggle the sidebar.
   *
   * @returns void
   */
  onToggleSidebar() {
    this.toggleSidebar.emit();
  }
}
