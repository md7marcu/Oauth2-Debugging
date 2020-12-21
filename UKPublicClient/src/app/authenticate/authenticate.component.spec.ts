import { TestBed, async } from "@angular/core/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { AuthenticateComponent } from "./authenticate.component";
import { HttpClientTestingModule } from "@angular/common/http/testing";

describe("AuthenticateComponent", () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule
      ],
      declarations: [
        AuthenticateComponent
      ],
    }).compileComponents();
  }));

  it("should create the app", () => {
    const fixture = TestBed.createComponent(AuthenticateComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'UKPublicClient'`, () => {
    const fixture = TestBed.createComponent(AuthenticateComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual("UKPublicClient");
  });
});
