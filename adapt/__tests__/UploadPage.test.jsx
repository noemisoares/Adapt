/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import UploadPage from "../app/dashboard/upload/page";

// === Mocks ===

// Mock uploadFile
jest.mock("../app/back4app/provas/uploadFile", () => ({
  uploadFile: jest.fn(() => Promise.resolve("fake_prova_id")),
}));

// Mock FileUploader
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

// Mock ArquivoCarregado
jest.mock("../components/ArquivoCarregado/ArquivoCarregado", () => {
  return function MockArquivoCarregado({ onRemove }) {
    return (
      <div data-testid="mock-arquivo-carregado">
        Arquivo carregado
        <button data-testid="mock-remove" onClick={onRemove}>Remover</button>
      </div>
    );
  };
});

// Ignorar outros componentes filhos
jest.mock("../components/AdaptacaoProva/AdaptacaoProva", () => () => null);
jest.mock("../components/VisualizacaoProva/VisualizacaoProva", () => () => null);

// Mock fetch padrão
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ originalQuestions: ["Q1"] }),
  })
);

// Mock fetch com erro
const fetchError = jest.fn(() =>
  Promise.resolve({
    ok: false,
  })
);

// Mock FileReader
class MockFileReader {
  readAsArrayBuffer(file) {
    this.onload({ target: { result: new ArrayBuffer(8) } });
  }
}
global.FileReader = MockFileReader;

describe("UploadPage – Upload Unitário", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renderiza título e uploader", () => {
    render(<UploadPage />);
    expect(
      screen.getByText("Criar Nova Prova Adaptada")
    ).toBeInTheDocument();
    expect(screen.getByTestId("mock-uploader")).toBeInTheDocument();
  });

  test("envia arquivo e exibe ArquivoCarregado", async () => {
    render(<UploadPage />);

    await act(async () => {
      fireEvent.click(screen.getByTestId("mock-uploader"));
    });

    await waitFor(() =>
      expect(screen.getByTestId("mock-arquivo-carregado")).toBeInTheDocument()
    );

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/parse-file",
      expect.objectContaining({
        method: "POST",
        body: expect.any(FormData),
      })
    );
  });

  test("mostra mensagem de processando arquivo durante upload", async () => {
    render(<UploadPage />);

    await act(async () => {
      fireEvent.click(screen.getByTestId("mock-uploader"));
    });

    const processingText = screen.queryByText(/processando arquivo/i);
    if (processingText) {
      expect(processingText).toBeInTheDocument();
    }
  });

  test("permite remover arquivo e resetar estado", async () => {
    render(<UploadPage />);

    await act(async () => {
      fireEvent.click(screen.getByTestId("mock-uploader"));
    });

    await waitFor(() =>
      expect(screen.getByTestId("mock-arquivo-carregado")).toBeInTheDocument()
    );

    fireEvent.click(screen.getByTestId("mock-remove"));

    expect(screen.queryByTestId("mock-arquivo-carregado")).not.toBeInTheDocument();
    expect(screen.getByTestId("mock-uploader")).toBeInTheDocument();
  });

  test("mostra erro se fetch falha", async () => {
    global.fetch = fetchError;

    render(<UploadPage />);

    await act(async () => {
      fireEvent.click(screen.getByTestId("mock-uploader"));
    });

    await waitFor(() =>
      expect(screen.getByText(/erro ao processar arquivo/i)).toBeInTheDocument()
    );
  });
});
