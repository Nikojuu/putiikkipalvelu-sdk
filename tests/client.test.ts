import { describe, it, expect } from "vitest";
import { createStorefrontClient } from "../src/client.js";

describe("createStorefrontClient", () => {
  it("should create a client with required config", () => {
    const client = createStorefrontClient({
      apiKey: "test-api-key-12345678",
      baseUrl: "https://api.example.com/v1",
    });

    expect(client).toBeDefined();
    expect(client.baseUrl).toBe("https://api.example.com/v1");
  });

  it("should mask the API key", () => {
    const client = createStorefrontClient({
      apiKey: "test-api-key-12345678",
      baseUrl: "https://api.example.com/v1",
    });

    expect(client.apiKey).toBe("test-api...");
    expect(client.apiKey).not.toContain("12345678");
  });

  it("should remove trailing slash from baseUrl", () => {
    const client = createStorefrontClient({
      apiKey: "test-api-key",
      baseUrl: "https://api.example.com/v1/",
    });

    expect(client.baseUrl).toBe("https://api.example.com/v1");
  });

  it("should throw error if apiKey is missing", () => {
    expect(() =>
      createStorefrontClient({
        apiKey: "",
        baseUrl: "https://api.example.com/v1",
      })
    ).toThrow("apiKey is required");
  });

  it("should throw error if baseUrl is missing", () => {
    expect(() =>
      createStorefrontClient({
        apiKey: "test-api-key",
        baseUrl: "",
      })
    ).toThrow("baseUrl is required");
  });
});
