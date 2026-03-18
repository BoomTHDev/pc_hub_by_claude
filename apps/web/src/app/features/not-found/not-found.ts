import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EmptyState } from '../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, EmptyState],
  templateUrl: './not-found.html',
})
export class NotFoundPage {}
