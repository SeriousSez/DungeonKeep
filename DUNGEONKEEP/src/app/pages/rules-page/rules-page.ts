import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { rulesBrowseLinks, rulesEntries, rulesResourceLinks } from '../../data/rules-links';

@Component({
  selector: 'app-rules-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './rules-page.html',
  styleUrl: './rules-page.scss',
})
export class RulesPage {
  readonly rulesEntries = rulesEntries;
  readonly rulesBrowseLinks = rulesBrowseLinks;
  readonly rulesResourceLinks = rulesResourceLinks;
}
