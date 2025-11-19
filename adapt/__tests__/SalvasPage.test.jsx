/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SalvasPage from "../app/dashboard/salvas/page";

// Mocks das funções do backend
jest.mock("@/app/back4app/provas/getProvasUser", () => ({
  getProvasUser: jest.fn(() =>
    Promise.resolve([
      {
        id: "1",
        titulo: "Prova Teste",
        criadoEm: new Date("2025-01-01"),
        arquivoUrl: "https://fake-url.com/prova.pdf",
      },
    ])
  ),
}));

jest.mock("@/app/back4app/provas/deleteProvas", () => ({
  deleteProva: jest.fn(() => Promise.resolve()),
}));

// Mock do alert e confirm
window.alert = jest.fn();
window.confirm = jest.fn(() => true); // sempre confirma

describe("SalvasPage – Excluir Prova", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("exclui prova ao clicar no botão e confirmar", async () => {
    const { deleteProva } = require("@/app/back4app/provas/deleteProvas");

    render(<SalvasPage />);

    // Espera a prova ser carregada
    const provaTitulo = await screen.findByText("Prova Teste");
    expect(provaTitulo).toBeInTheDocument();

    // Clica no botão Excluir
    const deleteBtn = screen.getByText("Excluir");
    fireEvent.click(deleteBtn);

    // Verifica se o confirm foi chamado
    expect(window.confirm).toHaveBeenCalledWith(
      'Deseja realmente excluir "Prova Teste"?'
    );

    // Espera que a função deleteProva seja chamada
    await waitFor(() => expect(deleteProva).toHaveBeenCalledWith("1"));

    // Espera que o alert de sucesso seja exibido
    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(
        "Prova excluída com sucesso!"
      )
    );

    // Verifica que a prova não está mais no DOM
    await waitFor(() =>
      expect(screen.queryByText("Prova Teste")).not.toBeInTheDocument()
    );
  });
});
