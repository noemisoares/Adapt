/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UploadPage from "../app/dashboard/upload/page";
import Parse from "parse/dist/parse.min.js";

// === Mocks dos componentes ===
jest.mock("../components/FileUploader/FileUploader", () => {
  return function MockUploader({ onFileSelect }) {
    return (
      <button
        data-testid="mock-uploader"
        onClick={() => {
          const mockFile = new File(["conteudo"], "arquivo.pdf", {
            type: "application/pdf",
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

jest.mock("../components/AdaptacaoProva/AdaptacaoProva", () => ({ onAdapted }) => (
  <button
    data-testid="mock-adaptar"
    onClick={() => onAdapted({ adaptedQuestions: ["Q1 adaptada"] })}
  >
    Adaptar
  </button>
));

jest.mock("../components/VisualizacaoProva/VisualizacaoProva", () => () => null);

// === Mocks globais ===
global.fetch = jest.fn((url) => {
  if (url === "/api/parse-file") {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          originalQuestions: ["Q1", "Q2"], // retorna questões para passar no upload
        }),
    });
  }

  if (url === "/api/generate-pdf") {
    return Promise.resolve({
      ok: true,
      blob: () => Promise.resolve(new Blob(["fake pdf"], { type: "application/pdf" })),
    });
  }

  return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
});

global.URL.createObjectURL = jest.fn(() => "blob:fake-url");
window.alert = jest.fn();

// === Mock Parse ===
const mockSave = jest.fn().mockResolvedValue(true);

const mockProvaObj = {
  get: jest.fn((field) =>
    field === "arquivoOriginalUrl" ? "https://fakeurl.com/original.pdf" : null
  ),
  set: jest.fn(),
  save: mockSave,
};

const mockGet = jest.fn().mockResolvedValue(mockProvaObj);

jest.spyOn(Parse, "Query").mockImplementation(() => ({
  get: mockGet,
}));

jest.spyOn(Parse, "File").mockImplementation((name, blob) => ({
  save: mockSave,
  url: () => `https://fakeurl.com/${name}`,
}));

// === Testes completos ===
describe("UploadPage – Handle Download PDF", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Fluxo de sucesso – gerar e baixar PDF adaptado", async () => {
    render(<UploadPage />);

    fireEvent.click(screen.getByTestId("mock-uploader"));
    await screen.findByTestId("mock-arquivo-carregado");

    fireEvent.click(screen.getByTestId("mock-adaptar"));

    const button = screen.getByText("Baixar Prova Adaptada");
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/generate-pdf",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith(
        "✅ Prova adaptada gerada e baixada com sucesso!"
      );
    });
  });

  test("Alerta quando arquivo original não encontrado", async () => {
    mockGet.mockResolvedValueOnce({
      get: jest.fn(() => null),
      set: jest.fn(),
      save: mockSave,
    });

    render(<UploadPage />);
    fireEvent.click(screen.getByTestId("mock-uploader"));
    await screen.findByTestId("mock-arquivo-carregado");
    fireEvent.click(screen.getByTestId("mock-adaptar"));

    const button = screen.getByText("Baixar Prova Adaptada");
    fireEvent.click(button);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        "URL do arquivo original não encontrada. Refaça o upload."
      );
    });
  });

  test("Alerta quando nenhuma questão adaptada encontrada", async () => {
    render(<UploadPage />);
    fireEvent.click(screen.getByTestId("mock-uploader"));
    await screen.findByTestId("mock-arquivo-carregado");

    // Forçar adaptedData vazio simulando adaptação sem questões
    fireEvent.click(screen.getByTestId("mock-adaptar"));
    const button = screen.getByText("Baixar Prova Adaptada");
    fireEvent.click(button);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining("Nenhuma questão adaptada encontrada")
      );
    });
  });

  test("Erro ao gerar PDF (fetch.ok = false)", async () => {
    global.fetch.mockImplementationOnce((url) => {
      if (url === "/api/parse-file") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ originalQuestions: ["Q1"] }),
        });
      }
      if (url === "/api/generate-pdf") return Promise.resolve({ ok: false });
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<UploadPage />);
    fireEvent.click(screen.getByTestId("mock-uploader"));
    await screen.findByTestId("mock-arquivo-carregado");
    fireEvent.click(screen.getByTestId("mock-adaptar"));

    const button = screen.getByText("Baixar Prova Adaptada");
    fireEvent.click(button);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        "Erro ao gerar prova adaptada: Erro ao gerar PDF."
      );
    });
  });
});
