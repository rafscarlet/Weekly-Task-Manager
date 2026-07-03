import { Component } from '@angular/core';


export type Category = {
  name: string;
  color: string;
};

@Component({
  selector: 'app-config',
  imports: [],
  templateUrl: './config.html',
  styleUrl: './config.css',
})
export class Config {

  categories: Category[] = [
    {name: 'Work', color: '#FF5733'},
    {name: 'Personal', color: '#73FEEF'},
  ];
}
