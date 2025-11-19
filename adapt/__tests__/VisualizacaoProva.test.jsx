/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import VisualizacaoProva from "../components/VisualizacaoProva/VisualizacaoProva";

describe("VisualizacaoProva", () => {
  test("exibe mensagem quando não há questões", () => {
    render(<VisualizacaoProva parsedQuestions={[]} originalQuestions={[]} />);
    expect(screen.getByText(/nenhuma questão identificada ainda/i)).toBeInTheDocument();
  });

  test("renderiza questões do parsedQuestions quando existem", () => {
    const parsedQuestions = [
      { id: 1, text: "Qual é a capital da França?" },
      { id: 2, text: "Quanto é 2+2?" },
    ];

    render(<VisualizacaoProva parsedQuestions={parsedQuestions} originalQuestions={[]} />);

    expect(screen.getByText(/questão 1/i)).toBeInTheDocument();
    expect(screen.getByText(/qual é a capital da frança\?/i)).toBeInTheDocument();
    expect(screen.getByText(/questão 2/i)).toBeInTheDocument();
    expect(screen.getByText(/quanto é 2\+2\?/i)).toBeInTheDocument();
  });

  test("usa originalQuestions se parsedQuestions não existir", () => {
    const originalQuestions = [
      { id: "a", text: "Pergunta original?" },
    ];

    render(<VisualizacaoProva parsedQuestions={null} originalQuestions={originalQuestions} />);

    expect(screen.getByText(/questão 1/i)).toBeInTheDocument();
    expect(screen.getByText(/pergunta original\?/i)).toBeInTheDocument();
  });
});
