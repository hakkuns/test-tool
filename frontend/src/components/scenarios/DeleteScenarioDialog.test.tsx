import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteScenarioDialog } from "./DeleteScenarioDialog";

describe("DeleteScenarioDialog", () => {
  it("should not render when closed", () => {
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn();

    render(
      <DeleteScenarioDialog
        open={false}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />
    );

    expect(
      screen.queryByText("シナリオを削除しますか？")
    ).not.toBeInTheDocument();
  });

  it("should render when open", () => {
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn();

    render(
      <DeleteScenarioDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />
    );

    expect(screen.getByText("シナリオを削除しますか？")).toBeInTheDocument();
    expect(
      screen.getByText(
        "この操作は取り消せません。シナリオのデータが完全に削除されます。"
      )
    ).toBeInTheDocument();
  });

  it("should call onConfirm when delete button is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn();

    render(
      <DeleteScenarioDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />
    );

    const deleteButton = screen.getByRole("button", { name: "削除" });
    await user.click(deleteButton);

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("should call onOpenChange when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn();

    render(
      <DeleteScenarioDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />
    );

    const cancelButton = screen.getByRole("button", { name: "キャンセル" });
    await user.click(cancelButton);

    // AlertDialogCancelは自動的にonOpenChange(false)を呼ぶ
    expect(onOpenChange).toHaveBeenCalled();
  });
});
