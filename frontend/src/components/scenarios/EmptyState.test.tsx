import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  describe("no-scenarios type", () => {
    it("should render empty state with create button", () => {
      const onCreateScenario = vi.fn();

      render(
        <EmptyState type="no-scenarios" onCreateScenario={onCreateScenario} />
      );

      expect(screen.getByText("シナリオがまだありません")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /最初のシナリオを作成/i })
      ).toBeInTheDocument();
    });

    it("should call onCreateScenario when button is clicked", async () => {
      const user = userEvent.setup();
      const onCreateScenario = vi.fn();

      render(
        <EmptyState type="no-scenarios" onCreateScenario={onCreateScenario} />
      );

      const button = screen.getByRole("button", {
        name: /最初のシナリオを作成/i,
      });
      await user.click(button);

      expect(onCreateScenario).toHaveBeenCalledOnce();
    });
  });

  describe("no-results type", () => {
    it("should render no results state with clear button", () => {
      const onClearFilters = vi.fn();

      render(<EmptyState type="no-results" onClearFilters={onClearFilters} />);

      expect(
        screen.getByText("条件に一致するシナリオが見つかりませんでした")
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /検索条件をクリア/i })
      ).toBeInTheDocument();
    });

    it("should call onClearFilters when button is clicked", async () => {
      const user = userEvent.setup();
      const onClearFilters = vi.fn();

      render(<EmptyState type="no-results" onClearFilters={onClearFilters} />);

      const button = screen.getByRole("button", {
        name: /検索条件をクリア/i,
      });
      await user.click(button);

      expect(onClearFilters).toHaveBeenCalledOnce();
    });
  });
});
