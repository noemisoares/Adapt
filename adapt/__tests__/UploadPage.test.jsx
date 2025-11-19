import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UploadPage from "../app/dashboard/upload/page";

// Mock do uploadFile
jest.mock("../app/back4app/provas/uploadFile", () => ({
  uploadFile: jest.fn(() => Promise.resolve("fake_prova_id")),
}));

// Mock do FileUploader
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

// Mock do ArquivoCarregado
jest.mock("../components/ArquivoCarregado/ArquivoCarregado", () => {
  return function MockArquivoCarregado() {
    return <div data-testid="mock-arquivo-carregado">Arquivo carregado</div>;
  };
});

// Ignora os outros componentes
jest.mock("../components/AdaptacaoProva/AdaptacaoProva", () => () => null);
jest.mock("../components/VisualizacaoProva/VisualizacaoProva", () => () => null);

// Mock do fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ originalQuestions: ["Q1"] }),
  })
);

// Mock do FileReader
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

    fireEvent.click(screen.getByTestId("mock-uploader"));

    await waitFor(() => {
      expect(screen.getByTestId("mock-arquivo-carregado")).toBeInTheDocument();
    });

    // Confirma que fetch foi chamado corretamente
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/parse-file",
      expect.objectContaining({
        method: "POST",
        body: expect.any(FormData),
      })
    );
  });
});
