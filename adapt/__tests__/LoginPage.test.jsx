import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "../app/login/page";

// Mock alert
beforeAll(() => {
  window.alert = jest.fn();
});

// Mock do Parse
const mockLogIn = jest.fn();

jest.mock("../app/back4app/parseConfig", () => {
  return {
    __esModule: true,
    default: {
      User: {
        logIn: (...args) => mockLogIn(...args)
      }
    }
  };
});

// Mock do router do Next.js
const pushMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock
  })
}));

// Mock Next/Image
jest.mock("next/image", () => {
  return function MockedImage({ priority, ...rest }) {
    return <img {...rest} />;
  };
});

// Mock Footer
jest.mock("../components/Footer/Footer", () => ({
  Footer: () => <div data-testid="footer" />
}));

describe("LoginPage", () => {

  beforeEach(() => {
    mockLogIn.mockReset();
    pushMock.mockReset();
  });

  test("renderiza os campos do formulário", () => {
    render(<LoginPage />);

    expect(
      screen.getByPlaceholderText("Digite seu nome de usuário")
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Digite sua senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Entrar/i })).toBeInTheDocument();
  });

  test("permite digitar nos inputs", () => {
    render(<LoginPage />);

    fireEvent.change(
      screen.getByPlaceholderText("Digite seu nome de usuário"),
      { target: { value: "will" } }
    );

    fireEvent.change(screen.getByPlaceholderText("Digite sua senha"), {
      target: { value: "123456" }
    });

    expect(
      screen.getByPlaceholderText("Digite seu nome de usuário").value
    ).toBe("will");

    expect(screen.getByPlaceholderText("Digite sua senha").value).toBe(
      "123456"
    );
  });

  test("realiza login com sucesso e redireciona", async () => {
    mockLogIn.mockResolvedValueOnce({});

    render(<LoginPage />);

    fireEvent.change(
      screen.getByPlaceholderText("Digite seu nome de usuário"),
      { target: { value: "will" } }
    );

    fireEvent.change(screen.getByPlaceholderText("Digite sua senha"), {
      target: { value: "123456" }
    });

    fireEvent.click(screen.getByRole("button", { name: /Entrar/i }));

    await waitFor(() => {
      expect(mockLogIn).toHaveBeenCalledWith("will", "123456");
      expect(pushMock).toHaveBeenCalledWith("/dashboard");
    });
  });

  test("mostra erro quando login falha", async () => {
    mockLogIn.mockRejectedValueOnce(new Error("Erro"));

    render(<LoginPage />);

    fireEvent.change(
      screen.getByPlaceholderText("Digite seu nome de usuário"),
      { target: { value: "will" } }
    );

    fireEvent.change(screen.getByPlaceholderText("Digite sua senha"), {
      target: { value: "123456" }
    });

    fireEvent.click(screen.getByRole("button", { name: /Entrar/i }));

    const errorMsg = await screen.findByText("Usuário ou senha incorretos.");
    expect(errorMsg).toBeInTheDocument();
  });

  test("renderiza o footer", () => {
    render(<LoginPage />);
    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });

});
