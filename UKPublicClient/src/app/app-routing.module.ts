import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { AuthenticateComponent } from "./authenticate/authenticate.component";
import { CommonModule } from "@angular/common";

const routes: Routes = [{
    path: "**",
    component: AuthenticateComponent
  },
  {
    path: "callback",
    component: AuthenticateComponent
}];

@NgModule({
  imports: [CommonModule, RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
