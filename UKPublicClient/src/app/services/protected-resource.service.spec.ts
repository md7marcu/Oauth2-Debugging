import { TestBed } from "@angular/core/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ProtectedResourceService } from "./protected-resource.service";

describe("ProtectedResourceService", () => {
  let service: ProtectedResourceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ]
    });
    service = TestBed.inject(ProtectedResourceService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
