// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient } from "@trpc/client";
import { observable } from "@trpc/server/observable";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TRPCProvider } from "@karakeep/shared-react/trpc";
import type { ZBookmarkList } from "@karakeep/shared/types/lists";
import type { AppRouter } from "@karakeep/trpc/routers/_app";

import { ManageCollaboratorsModal } from "./ManageCollaboratorsModal";

vi.mock("@/lib/i18n/client", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@/components/ui/sonner", () => ({ toast: vi.fn() }));

const suggestion = {
  id: "user-2",
  name: "Previous Collaborator",
  email: "previous@example.com",
};
const list: ZBookmarkList = {
  id: "list-1",
  name: "Target",
  icon: "📚",
  type: "manual",
  description: null,
  query: null,
  parentId: null,
  public: false,
  userRole: "owner",
  hasCollaborators: false,
};

function renderModal({
  open = true,
  readOnly = false,
  suggestions = [suggestion],
} = {}) {
  const request = vi.fn((path: string, _input: unknown) => {
    switch (path) {
      case "lists.getCollaborators":
        return { collaborators: [], owner: null };
      case "lists.getCollaboratorSuggestions":
        return suggestions;
      case "lists.addCollaborator":
        return { invitationId: "invitation-1" };
      default:
        throw new Error(`Unexpected request: ${path}`);
    }
  });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const trpcClient = createTRPCClient<AppRouter>({
    links: [
      () =>
        ({ op }) =>
          observable((observer) => {
            observer.next({ result: { data: request(op.path, op.input) } });
            observer.complete();
          }),
    ],
  });
  render(
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        <ManageCollaboratorsModal
          list={list}
          open={open}
          setOpen={vi.fn()}
          readOnly={readOnly}
        />
      </TRPCProvider>
    </QueryClientProvider>,
  );
  return request;
}

afterEach(cleanup);
beforeEach(() => {
  // Radix Select uses these browser APIs, which jsdom does not implement.
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
});

describe("ManageCollaboratorsModal", () => {
  it("fills the email from a previous collaborator and sends a normal invitation", async () => {
    const request = renderModal();
    const selector = await screen.findByRole("combobox", {
      name: "lists.collaborators.choose_previous",
    });
    fireEvent.keyDown(selector, { key: "ArrowDown" });
    fireEvent.click(
      await screen.findByRole("option", { name: /Previous Collaborator/ }),
    );

    expect(
      (
        screen.getByPlaceholderText(
          "lists.collaborators.enter_email",
        ) as HTMLInputElement
      ).value,
    ).toBe(suggestion.email);
    expect(
      request.mock.calls.filter(([path]) => path === "lists.addCollaborator"),
    ).toHaveLength(0);
    fireEvent.click(
      screen.getByRole("button", { name: "lists.collaborators.add" }),
    );
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith("lists.addCollaborator", {
        listId: list.id,
        email: suggestion.email,
        role: "viewer",
      }),
    );
    await waitFor(() =>
      expect(
        (
          screen.getByPlaceholderText(
            "lists.collaborators.enter_email",
          ) as HTMLInputElement
        ).value,
      ).toBe(""),
    );
  });

  it("keeps manual email entry when there are no suggestions", async () => {
    const request = renderModal({ suggestions: [] });
    const input = screen.getByPlaceholderText(
      "lists.collaborators.enter_email",
    );
    fireEvent.change(input, { target: { value: "manual@example.com" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith("lists.addCollaborator", {
        listId: list.id,
        email: "manual@example.com",
        role: "viewer",
      }),
    );
    expect(
      screen.queryByRole("combobox", {
        name: "lists.collaborators.choose_previous",
      }),
    ).toBeNull();
  });

  it("does not fetch or show suggestions in read-only mode", async () => {
    const request = renderModal({ readOnly: true });
    await screen.findByText("lists.collaborators.no_collaborators_readonly");
    expect(request.mock.calls.map(([path]) => path)).toEqual([
      "lists.getCollaborators",
    ]);
    expect(
      screen.queryByRole("combobox", {
        name: "lists.collaborators.choose_previous",
      }),
    ).toBeNull();
  });

  it("does not fetch suggestions while closed", () => {
    const request = renderModal({ open: false });
    expect(request).not.toHaveBeenCalled();
  });
});
