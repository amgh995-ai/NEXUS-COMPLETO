import { render, screen } from "@testing-library/react";
import App from "./App";

test("muestra la pantalla de login cuando no hay sesión", () => {
  localStorage.clear();
  render(<App />);
  expect(screen.getByText(/iniciar sesión/i)).toBeInTheDocument();
});
