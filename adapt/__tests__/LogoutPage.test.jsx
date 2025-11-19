/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from "@testing-library/react";
import LogoutPage from "../app/logout/page";

// Mock do Parse
jest.mock("../app/back4app/parseConfig", () => ({
  User: {
    logOut: jest.fn(() => Promise.resolve()),
  },
}));

// Mock do useRouter do Next.js
const pushMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe("LogoutPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("exibe mensagem de saída e chama logout e redirecionamento", async () => {
    render(<LogoutPage />);

    // Verifica se o texto aparece
    expect(screen.getByText("Saindo...")).toBeInTheDocument();

    // Espera o logout e push serem chamados
    await waitFor(() => {
      const Parse = require("../app/back4app/parseConfig");
      expect(Parse.User.logOut).toHaveBeenCalled();
      expect(pushMock).toHaveBeenCalledWith("/");
    });
  });
});
