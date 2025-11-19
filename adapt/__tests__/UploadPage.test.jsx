/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UploadPage from "/workspaces/Adapt/adapt/app/dashboard/upload/page.js";

// ==== MOCKS OBRIGATÓRIOS ====

// Mock Parse
jest.mock("../app/back4app/parseConfig", () => ({
  Object: {
    extend: () => function () {},
  },
  Query: jest.fn(() => ({
    get: jest.fn(),
  })),
  File: jest.fn(() => ({
    save: jest.fn(),
    url: () => "https://fake-url.com/file.pdf",
  })),
}));

// Mock uploadFile
jest.mock("../app/back4app/provas/uploadFile", () => ({
  uploadFile: jest.fn(() => Promise.resolve("fake_prova_id")),
}));

// Mock dos componentes filhos – IMPORTANTÍSSIMO°
jest.mock("../components/FileUploader/FileUploader", () => {
  return function MockUploader({ onFileSelect }) {
    return (
      <button
        data-testid="mock-uploader"
        onClick={() => {
          const mockFile = new File(["conteudo"], "arquivo.docx", {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          });
          onFileSelect(mockFile);
        }}
      >
        Enviar arquivo fake
      </button>
    );
  };
});

jest.mock("../components/ArquivoCarregado/ArquivoCarregado.js", () => {
  return function MockArquivoCarregado() {
    return <div data-testid="mock-arquivo-carregado">Arquivo carregado</div>;
  };
});

jest.mock("../components/AdaptacaoProva/AdaptacaoProva.js", () => {
  return function MockAdaptacaoProva({ onAdapted }) {
    return (
      <button
        data-testid="mock-adaptar"
        onClick={() => onAdapted({ adaptedQuestions: ["Questão 1 adaptada"] })}
      >
        Adaptar
      </button>
    );
  };
});

jest.mock("../components/VisualizacaoProva/VisualizacaoProva.js", () => {
  return function MockVisualizacaoProva() {
    return <div data-testid="mock-visualizacao">Visualização</div>;
  };
});

// Mock global fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ originalQuestions: ["Q1"] }),
    blob: () => new Blob(["PDF CONTENT"]),
  })
);

describe("UploadPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renderiza título principal", () => {
    render(<UploadPage />);
    expect(screen.getByText("Criar Nova Prova Adaptada")).toBeInTheDocument();
  });

  test("permite enviar arquivo e exibe componentes dependentes", async () => {
    render(<UploadPage />);

    // clica no mock de upload
    fireEvent.click(screen.getByTestId("mock-uploader"));

    // arquivo deve ser carregado
    expect(await screen.findByTestId("mock-arquivo-carregado")).toBeInTheDocument();

    // visualização deve aparecer
    expect(screen.getByTestId("mock-visualizacao")).toBeInTheDocument();
  });

  test("permite adaptar e habilita botão de baixar PDF", async () => {
    render(<UploadPage />);

    // envia arquivo
    fireEvent.click(screen.getByTestId("mock-uploader"));
    await screen.findByTestId("mock-arquivo-carregado");

    // dispara adaptação
    fireEvent.click(screen.getByTestId("mock-adaptar"));

    const downloadBtn = screen.getByRole("button", {
      name: "Baixar Prova Adaptada",
    });

    expect(downloadBtn).not.toBeDisabled();
  });
});
