import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TargetApiSection } from "./TargetApiSection";

describe("TargetApiSection", () => {
  const defaultProps = {
    method: "GET" as const,
    url: "",
    onMethodChange: vi.fn(),
    onUrlChange: vi.fn(),
  };

  it("should render target api section with labels", () => {
    render(<TargetApiSection {...defaultProps} />);

    expect(screen.getByText("対象API")).toBeInTheDocument();
    expect(screen.getByText(/このシナリオでテストする対象のAPIエンドポイント/)).toBeInTheDocument();
    expect(screen.getByLabelText(/HTTPメソッド/)).toBeInTheDocument();
    expect(screen.getByLabelText(/URL/)).toBeInTheDocument();
  });

  it("should display current method value", () => {
    render(<TargetApiSection {...defaultProps} method="POST" />);

    expect(screen.getByText("POST")).toBeInTheDocument();
  });

  it("should display current url value", () => {
    render(
      <TargetApiSection
        {...defaultProps}
        url="http://localhost:8080/api/users"
      />
    );

    const urlInput = screen.getByLabelText(/URL/) as HTMLInputElement;
    expect(urlInput.value).toBe("http://localhost:8080/api/users");
  });

  it("should call onUrlChange when url input changes", async () => {
    const user = userEvent.setup();
    const onUrlChange = vi.fn();

    render(<TargetApiSection {...defaultProps} onUrlChange={onUrlChange} />);

    const urlInput = screen.getByLabelText(/URL/);
    await user.type(urlInput, "http://localhost:3000/api");

    expect(onUrlChange).toHaveBeenCalled();
  });

  it("should render url input as required", () => {
    render(<TargetApiSection {...defaultProps} />);

    const urlInput = screen.getByLabelText(/URL/);
    expect(urlInput).toBeRequired();
  });

  it("should display url placeholder", () => {
    render(<TargetApiSection {...defaultProps} />);

    expect(
      screen.getByPlaceholderText("http://localhost:8080/api/users")
    ).toBeInTheDocument();
  });

  it("should display url helper text", () => {
    render(<TargetApiSection {...defaultProps} />);

    expect(
      screen.getByText(/完全なURL.*http:\/\/またはhttps:\/\/から始まる/)
    ).toBeInTheDocument();
  });

  it("should call onMethodChange when method is selected", async () => {
    const user = userEvent.setup();
    const onMethodChange = vi.fn();

    render(
      <TargetApiSection {...defaultProps} onMethodChange={onMethodChange} />
    );

    // Open the select dropdown
    const selectTrigger = screen.getByRole("combobox");
    await user.click(selectTrigger);

    // Click on POST option
    const postOption = screen.getByRole("option", { name: "POST" });
    await user.click(postOption);

    expect(onMethodChange).toHaveBeenCalledWith("POST");
  });

  it("should display all HTTP method options", async () => {
    const user = userEvent.setup();

    render(<TargetApiSection {...defaultProps} />);

    // Open the select dropdown
    const selectTrigger = screen.getByRole("combobox");
    await user.click(selectTrigger);

    // Check all methods are present
    expect(screen.getByRole("option", { name: "GET" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "POST" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "PUT" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "DELETE" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "PATCH" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "HEAD" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "OPTIONS" })).toBeInTheDocument();
  });

  it("should handle different HTTP methods", async () => {
    const { rerender } = render(<TargetApiSection {...defaultProps} method="GET" />);
    expect(screen.getByText("GET")).toBeInTheDocument();

    rerender(<TargetApiSection {...defaultProps} method="POST" />);
    expect(screen.getByText("POST")).toBeInTheDocument();

    rerender(<TargetApiSection {...defaultProps} method="PUT" />);
    expect(screen.getByText("PUT")).toBeInTheDocument();

    rerender(<TargetApiSection {...defaultProps} method="DELETE" />);
    expect(screen.getByText("DELETE")).toBeInTheDocument();

    rerender(<TargetApiSection {...defaultProps} method="PATCH" />);
    expect(screen.getByText("PATCH")).toBeInTheDocument();

    rerender(<TargetApiSection {...defaultProps} method="HEAD" />);
    expect(screen.getByText("HEAD")).toBeInTheDocument();

    rerender(<TargetApiSection {...defaultProps} method="OPTIONS" />);
    expect(screen.getByText("OPTIONS")).toBeInTheDocument();
  });

  it("should handle url changes correctly", async () => {
    const user = userEvent.setup();
    const onUrlChange = vi.fn();

    render(<TargetApiSection {...defaultProps} onUrlChange={onUrlChange} />);

    const urlInput = screen.getByLabelText(/URL/);

    await user.clear(urlInput);
    await user.type(urlInput, "https://api.example.com/endpoint");

    expect(onUrlChange).toHaveBeenCalled();
  });

  it("should render method select with proper id", () => {
    render(<TargetApiSection {...defaultProps} />);

    const select = screen.getByRole("combobox");
    expect(select).toHaveAttribute("id", "targetApiMethod");
  });

  it("should render url input with proper id", () => {
    render(<TargetApiSection {...defaultProps} />);

    const urlInput = screen.getByLabelText(/URL/);
    expect(urlInput).toHaveAttribute("id", "targetApiUrl");
  });

  it("should handle empty url value", () => {
    render(<TargetApiSection {...defaultProps} url="" />);

    const urlInput = screen.getByLabelText(/URL/) as HTMLInputElement;
    expect(urlInput.value).toBe("");
  });
});
