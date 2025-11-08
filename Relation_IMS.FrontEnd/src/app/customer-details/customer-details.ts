import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-customer-details',
  imports: [],
  templateUrl: './customer-details.html',
  styleUrl: './customer-details.css',
})
export class CustomerDetails {

  customerId! : number;
  constructor(private route:ActivatedRoute){}
  
  async ngOnInit(){
    this.customerId = Number(this.route.snapshot.paramMap.get('id'));
    console.log(this.customerId);
  }

}
