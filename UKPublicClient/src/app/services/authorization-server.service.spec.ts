import { TestBed } from "@angular/core/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { AuthorizationServerService } from "./authorization-server.service";

describe("AuthorizationServerService", () => {
  let service: AuthorizationServerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ]
    });
    service = TestBed.inject(AuthorizationServerService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should call authentication endpoint on authorization server", () => {

  });
});
