/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

import router from "../app/Router.js";
import Bills from "../containers/Bills.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      //Une icône est en surbrillance via la classe "active-icon"
      expect(windowIcon.classList.contains("active-icon")).toBeTruthy();
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });

  describe("Given that I'm on the bills page", () => {
    beforeEach(() => {
      //Initialisation de la navigation
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      //Initialisation du HTML
      document.body.innerHTML = BillsUI({ data: bills });

      //Initialisation d'un objet Bills pour le JS
      new Bills({
        document,
        onNavigate,
      });
    });

    describe("Given that I click on the New Bill button", () => {
      test("Then the new bill page should open", () => {
        fireEvent(
          screen.getByTestId("btn-new-bill"),
          new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
          })
        );

        expect(screen.getByTestId("form-new-bill")).toBeInTheDocument();
      });
    });
  });
});
