import { Routes } from '@angular/router';
import { Products } from './products/products';
import { Orders } from './orders/orders';
import { Customers } from './customers/customers';
import { Reports } from './reports/reports';
import { Inventory } from './inventory/inventory';

export const routes: Routes = [

    {path:"products",component:Products},
    {path:"orders",component:Orders},
    {path:"customers",component:Customers},
    {path:"reports",component:Reports},
    {path:"inventory",component:Inventory},
];
