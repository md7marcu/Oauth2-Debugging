import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { AuthenticateComponent } from "./authenticate/authenticate.component";

const routes: Routes = [{
    path: "**",
    component: AuthenticateComponent
  },
  {
    path: "callback",
    component: AuthenticateComponent
}];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
