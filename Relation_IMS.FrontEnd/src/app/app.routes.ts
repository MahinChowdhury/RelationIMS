import { Routes } from '@angular/router';
import { Products } from './products/products';
import { Orders } from './orders/orders';
import {CustomersComponent } from './customers/customers';
import { Reports } from './reports/reports';
import { Inventory } from './inventory/inventory';
import { ProductDetails } from './product-details/product-details';
import { CustomerDetails } from './customer-details/customer-details';

export const routes: Routes = [

    {path:"products",component:Products},
    {path:"products/:id",component:ProductDetails},
    {path:"orders",component:Orders},
    {path:"customers",component:CustomersComponent},
    {path:"customers/:id",component:CustomerDetails},
    {path:"reports",component:Reports},
    {path:"inventory",component:Inventory},
];
