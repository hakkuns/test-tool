import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BasicInfoSection } from "./BasicInfoSection";

describe("BasicInfoSection", () => {
  const defaultProps = {
    name: "",
    description: "",
    tags: [],
    tagInput: "",
    onNameChange: vi.fn(),
    onDescriptionChange: vi.fn(),
    onTagInputChange: vi.fn(),
    onAddTag: vi.fn(),
    onRemoveTag: vi.fn(),
  };

  it("should render basic info section with labels", () => {
    render(<BasicInfoSection {...defaultProps} />);

    expect(screen.getByText("基本情報")).toBeInTheDocument();
    expect(screen.getByLabelText(/シナリオ名/)).toBeInTheDocument();
    expect(screen.getByLabelText(/説明/)).toBeInTheDocument();
    expect(screen.getByText("タグ")).toBeInTheDocument();
  });

  it("should display name with character count", () => {
    render(<BasicInfoSection {...defaultProps} name="Test Scenario" />);

    expect(screen.getByText(/シナリオ名.*\(13\/100\)/)).toBeInTheDocument();
  });

  it("should display description with character count", () => {
    render(
      <BasicInfoSection {...defaultProps} description="Test description" />
    );

    expect(screen.getByText(/説明.*\(16\/500\)/)).toBeInTheDocument();
  });

  it("should call onNameChange when name input changes", async () => {
    const user = userEvent.setup();
    const onNameChange = vi.fn();

    render(<BasicInfoSection {...defaultProps} onNameChange={onNameChange} />);

    const nameInput = screen.getByLabelText(/シナリオ名/);
    await user.type(nameInput, "New Name");

    expect(onNameChange).toHaveBeenCalledTimes(8); // "New Name" = 8 characters
    expect(onNameChange).toHaveBeenLastCalledWith(expect.stringContaining("New Name"));
  });

  it("should call onDescriptionChange when description input changes", async () => {
    const user = userEvent.setup();
    const onDescriptionChange = vi.fn();

    render(
      <BasicInfoSection
        {...defaultProps}
        onDescriptionChange={onDescriptionChange}
      />
    );

    const descriptionInput = screen.getByLabelText(/説明/);
    await user.type(descriptionInput, "New description");

    expect(onDescriptionChange).toHaveBeenCalled();
  });

  it("should enforce name maxLength of 100", () => {
    render(<BasicInfoSection {...defaultProps} />);

    const nameInput = screen.getByLabelText(/シナリオ名/) as HTMLInputElement;
    expect(nameInput).toHaveAttribute("maxLength", "100");
  });

  it("should enforce description maxLength of 500", () => {
    render(<BasicInfoSection {...defaultProps} />);

    const descriptionInput = screen.getByLabelText(/説明/) as HTMLTextAreaElement;
    expect(descriptionInput).toHaveAttribute("maxLength", "500");
  });

  it("should display tags", () => {
    const tags = ["tag1", "tag2", "tag3"];
    render(<BasicInfoSection {...defaultProps} tags={tags} />);

    expect(screen.getByText(/tag1/)).toBeInTheDocument();
    expect(screen.getByText(/tag2/)).toBeInTheDocument();
    expect(screen.getByText(/tag3/)).toBeInTheDocument();
  });

  it("should call onTagInputChange when tag input changes", async () => {
    const user = userEvent.setup();
    const onTagInputChange = vi.fn();

    render(
      <BasicInfoSection
        {...defaultProps}
        onTagInputChange={onTagInputChange}
      />
    );

    const tagInput = screen.getByPlaceholderText("タグを入力してEnter");
    await user.type(tagInput, "newtag");

    expect(onTagInputChange).toHaveBeenCalled();
  });

  it("should call onAddTag when add button is clicked", async () => {
    const user = userEvent.setup();
    const onAddTag = vi.fn();

    render(<BasicInfoSection {...defaultProps} onAddTag={onAddTag} />);

    const addButton = screen.getByRole("button", { name: "追加" });
    await user.click(addButton);

    expect(onAddTag).toHaveBeenCalledOnce();
  });

  it("should call onAddTag when Enter key is pressed in tag input", async () => {
    const user = userEvent.setup();
    const onAddTag = vi.fn();

    render(<BasicInfoSection {...defaultProps} onAddTag={onAddTag} />);

    const tagInput = screen.getByPlaceholderText("タグを入力してEnter");
    await user.type(tagInput, "{Enter}");

    expect(onAddTag).toHaveBeenCalledOnce();
  });

  it("should call onRemoveTag when tag is clicked", async () => {
    const user = userEvent.setup();
    const onRemoveTag = vi.fn();
    const tags = ["tag1", "tag2"];

    render(
      <BasicInfoSection {...defaultProps} tags={tags} onRemoveTag={onRemoveTag} />
    );

    const tag1 = screen.getByText(/tag1 ×/);
    await user.click(tag1);

    expect(onRemoveTag).toHaveBeenCalledWith("tag1");
  });

  it("should display tag input value", () => {
    render(<BasicInfoSection {...defaultProps} tagInput="current tag" />);

    const tagInput = screen.getByPlaceholderText("タグを入力してEnter") as HTMLInputElement;
    expect(tagInput.value).toBe("current tag");
  });

  it("should render name input as required", () => {
    render(<BasicInfoSection {...defaultProps} />);

    const nameInput = screen.getByLabelText(/シナリオ名/);
    expect(nameInput).toBeRequired();
  });

  it("should render description input as optional", () => {
    render(<BasicInfoSection {...defaultProps} />);

    const descriptionInput = screen.getByLabelText(/説明/);
    expect(descriptionInput).not.toBeRequired();
  });

  it("should handle empty tags array", () => {
    render(<BasicInfoSection {...defaultProps} tags={[]} />);

    expect(screen.getByText("タグ")).toBeInTheDocument();
    // No tag elements should be rendered
    expect(screen.queryByText(/×/)).not.toBeInTheDocument();
  });

  it("should prevent default on Enter key in tag input", async () => {
    const user = userEvent.setup();
    const onAddTag = vi.fn();

    render(<BasicInfoSection {...defaultProps} onAddTag={onAddTag} />);

    const tagInput = screen.getByPlaceholderText("タグを入力してEnter");

    // Simulate Enter key press
    await user.click(tagInput);
    await user.keyboard("{Enter}");

    expect(onAddTag).toHaveBeenCalledOnce();
  });

  it("should render placeholder text correctly", () => {
    render(<BasicInfoSection {...defaultProps} />);

    expect(screen.getByPlaceholderText("ユーザー登録テスト")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("このシナリオの概要を入力...")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("タグを入力してEnter")).toBeInTheDocument();
  });
});
