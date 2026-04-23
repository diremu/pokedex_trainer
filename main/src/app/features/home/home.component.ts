import { Component , signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  name = signal("Ash")
  /**
   * Simple navigator/debug helper invoked from the home view.
   *
   * @param event - The DOM event that triggered navigation
   * @returns void
   */
  navigator(event: Event) {
    console.log(event);
  }
}
