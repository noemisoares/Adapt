jest.mock("next/image", () => {
  return function MockedImage({ priority, ...rest }) {
    return <img {...rest} />;
  };
});

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SignUpPage from "../app/signup/page";

// Mock do Parse
const mockSignUp = jest.fn();
beforeAll(() => {
  window.alert = jest.fn();
});

jest.mock("../app/back4app/parseConfig", () => {
  return {
    __esModule: true,
    default: {
      User: function () {
        return {
          set: jest.fn(),
          signUp: mockSignUp
        };
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

// Mock de Image do Next.js
jest.mock("next/image", () => (props) => {
  return <img {...props} />;
});

// Mock footer
jest.mock("../components/Footer/Footer", () => ({
  Footer: () => <div data-testid="footer" />
}));

describe("SignUpPage", () => {

  beforeEach(() => {
    mockSignUp.mockReset();
    pushMock.mockReset();
  });

  test("renderiza os campos do formulário", () => {
    render(<SignUpPage />);

    expect(screen.getByPlaceholderText("Nome de usuário")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("E-mail")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Criar conta/i })).toBeInTheDocument();
  });

  test("permite digitar nos inputs", () => {
    render(<SignUpPage />);

    fireEvent.change(screen.getByPlaceholderText("Nome de usuário"), { target: { value: "will" }});
    fireEvent.change(screen.getByPlaceholderText("E-mail"), { target: { value: "teste@email.com" }});
    fireEvent.change(screen.getByPlaceholderText("Senha"), { target: { value: "123456" }});

    expect(screen.getByPlaceholderText("Nome de usuário").value).toBe("will");
    expect(screen.getByPlaceholderText("E-mail").value).toBe("teste@email.com");
    expect(screen.getByPlaceholderText("Senha").value).toBe("123456");
  });

  test("cria conta com sucesso e redireciona", async () => {
    mockSignUp.mockResolvedValueOnce({});

    render(<SignUpPage />);

    fireEvent.change(screen.getByPlaceholderText("Nome de usuário"), { target: { value: "will" }});
    fireEvent.change(screen.getByPlaceholderText("E-mail"), { target: { value: "will@email.com" }});
    fireEvent.change(screen.getByPlaceholderText("Senha"), { target: { value: "123456" }});

    fireEvent.click(screen.getByRole("button", { name: /Criar conta/i }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledTimes(1);
      expect(pushMock).toHaveBeenCalledWith("/dashboard");
    });
  });

  test("mostra erro quando signUp falha", async () => {
    mockSignUp.mockRejectedValueOnce(new Error("Falha ao criar conta"));

    render(<SignUpPage />);

    fireEvent.change(screen.getByPlaceholderText("Nome de usuário"), { target: { value: "will" }});
    fireEvent.change(screen.getByPlaceholderText("E-mail"), { target: { value: "will@email.com" }});
    fireEvent.change(screen.getByPlaceholderText("Senha"), { target: { value: "123456" }});

    fireEvent.click(screen.getByRole("button", { name: /Criar conta/i }));

    const errorMessage = await screen.findByText("Falha ao criar conta");
    expect(errorMessage).toBeInTheDocument();
  });

});
  test("renderiza o footer", () => {
    render(<SignUpPage />);
    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });