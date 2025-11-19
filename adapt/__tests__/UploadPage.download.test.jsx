/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UploadPage from "../app/dashboard/upload/page";

// === Mocks essenciais ===
jest.mock("../components/FileUploader/FileUploader", () => {
  return function MockUploader({ onFileSelect }) {
    return (
      <button
        data-testid="mock-uploader"
        onClick={() => {
          const mockFile = new File(["conteudo"], "arquivo.docx", {
            type:
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          });
          onFileSelect(mockFile);
        }}
      >
        Enviar arquivo
      </button>
    );
  };
});

jest.mock("../components/ArquivoCarregado/ArquivoCarregado", () => {
  return function MockArquivoCarregado() {
    return <div data-testid="mock-arquivo-carregado">Arquivo carregado</div>;
  };
});

// ✅ Aqui entra o seu mock de AdaptacaoProva
jest.mock("../components/AdaptacaoProva/AdaptacaoProva", () => ({ onAdapted }) => (
  <button
    data-testid="mock-adaptar"
    onClick={() => onAdapted({ adaptedQuestions: ["Q1 adaptada"] })}
  >
    Adaptar
  </button>
));

// Ignorar outros componentes filhos
jest.mock("../components/VisualizacaoProva/VisualizacaoProva", () => () => null);

// Mock global fetch, URL.createObjectURL e alert
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    blob: () => Promise.resolve(new Blob(["fake pdf"], { type: "application/pdf" })),
  })
);
global.URL.createObjectURL = jest.fn(() => "blob:fake-url");
window.alert = jest.fn();

// === Testes ===
describe("UploadPage – Baixar Prova Adaptada", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Baixar Prova Adaptada", async () => {
    render(<UploadPage />);

    // Seleciona arquivo
    fireEvent.click(screen.getByTestId("mock-uploader"));
    await screen.findByTestId("mock-arquivo-carregado");

    // Simula adaptação
    fireEvent.click(screen.getByTestId("mock-adaptar"));

    // Agora o botão existe
    const button = screen.getByText("Baixar Prova Adaptada");
    expect(button).toBeInTheDocument();

    // Dispara download
    fireEvent.click(button);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/generate-pdf",
        expect.any(Object)
      );
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith(
        " Prova adaptada gerada e baixada com sucesso!"
      );
    });
  });
});
