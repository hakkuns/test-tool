import { describe, it, expect } from "vitest";
import { getMethodColor } from "./httpMethodUtils";

describe("getMethodColor", () => {
  it("should return blue for GET", () => {
    expect(getMethodColor("GET")).toBe(
      "bg-blue-500 text-white border-blue-500"
    );
  });

  it("should return green for POST", () => {
    expect(getMethodColor("POST")).toBe(
      "bg-green-500 text-white border-green-500"
    );
  });

  it("should return yellow for PUT", () => {
    expect(getMethodColor("PUT")).toBe(
      "bg-yellow-500 text-white border-yellow-500"
    );
  });

  it("should return purple for PATCH", () => {
    expect(getMethodColor("PATCH")).toBe(
      "bg-purple-500 text-white border-purple-500"
    );
  });

  it("should return red for DELETE", () => {
    expect(getMethodColor("DELETE")).toBe(
      "bg-red-500 text-white border-red-500"
    );
  });

  it("should return gray for unknown methods", () => {
    expect(getMethodColor("UNKNOWN")).toBe(
      "bg-gray-500 text-white border-gray-500"
    );
    expect(getMethodColor("")).toBe("bg-gray-500 text-white border-gray-500");
  });
});
