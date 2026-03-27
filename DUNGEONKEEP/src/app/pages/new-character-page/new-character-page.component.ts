import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';



@Component({
    selector: 'app-new-character-page',
    imports: [CommonModule, RouterLink],
    templateUrl: './new-character-page.component.html',
    styleUrl: './new-character-page.component.scss'
})
export class NewCharacterPageComponent { }
