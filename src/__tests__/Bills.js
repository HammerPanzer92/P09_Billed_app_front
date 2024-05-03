/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";
import Bills from "../containers/Bills.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    //Test sur la surbrillance de l'icône des factures dans la barre latéral
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

    //Test sur l'ordre d'affichage des factures
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

  //Groupe de tests sur la page de facture
  describe("Given that I'm on the bills page", () => {
    //Initialisation de la page avant chaque test
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

    //Test de la navigation vers la page pour créé une nouvelle facture
    describe("Given that I click on the New Bill button", () => {
      test("Then the new bill page should open", () => {
        //Création d'un event click
        fireEvent(
          screen.getByTestId("btn-new-bill"),
          new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
          })
        );

        //Si ce form est dans le document, alors on a bien changé de page
        expect(screen.getByTestId("form-new-bill")).toBeInTheDocument();
      });
    });

    //Test pour l'affichage de la modal d'affichage de la facture
    describe("When I click on the eye icon button", () => {
      test("Then the modal should open", () => {
        //Mock de la fonction d'affichage de modal
        $.fn.modal = jest.fn();

        fireEvent(
          screen.getAllByTestId("icon-eye")[0],
          new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
          })
        );

        const modal = screen.getByTestId("modaleFile");

        //Vérification de la modale via "toBeVisible"
        expect(modal).toBeVisible();
      });
    });
  });

  describe("Given I am a user logged in as an employee", () => {

    //Code erreur HTTP
    const ERROR_404 = 404;
    const ERROR_500 = 500;

    //Initialisation faite avant touts les tests (une fois pour tout les tests, contrairement a beforeEach qui est exécuté pour chaque)
    beforeAll(() => {

      //Stockage du Mock dans le stockage local de la page
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });

      //Création d'un utilisateur mocké
      window.localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" })
      );

      //Création du document
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);

      // Initialisation du routeur
      router();
    });

    // Fonction simulant une erreur d'API
    const mockApiError = (errorCode) => {

      // On mock le stockage afin de générer une erreur dans l'API avec le code souhaité
      mockStore.bills.list = jest
        .fn()
        .mockRejectedValue(new Error(`Erreur ${errorCode}`));

      //Navigation vers la page des factures
      window.onNavigate(ROUTES_PATH.Bills);

      //Création de la vue avec l'erreur d'API
      document.body.innerHTML = BillsUI({ error: `Erreur ${errorCode}` });
    };

    // roupe de tests pour la navigation vers la page des factures
    describe("When I navigate to the Bills page", () => {

      //Test de récupération des factures via l'API mocké
      test("Then retrieval of invoices via API mocked in GET", async () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
      
        //Création d'un objet de class "Bills" avec accès aux données mockés
        const mockedBills = new Bills({
          document,
          onNavigate,
          store: mockStore,
        });

        //Récupération des factures mockés via l'objet
        const bills = await mockedBills.getBills();

        //Si la liste n'est pas vide, alors on a récupéré les factuers
        expect(bills.length != 0).toBeTruthy();
      });

      // roupe de tests des erreurs de l'API
      describe("When an error occurs on the API", () => {

        //Simulation d'une erreur 404 (fichier non trouvé) de l'API
        test(`Then retrieving invoices from an API and failing with error message ${ERROR_404}`, async () => {

          //Génération d'une erreur 404 via la fonction mocké
          mockApiError(ERROR_404);
          await new Promise(process.nextTick);
          const message = await screen.getByText(/Erreur 404/);
          expect(message).toBeTruthy();
        });

        //Simulation d'une erreur 500 (erreur interne du serveur) de l'API
        test(`Then retrieving messages from an API and failing with error message ${ERROR_500}`, async () => {
          //Générration de l'erreur via la fonction mocké
          mockApiError(ERROR_500);
          await new Promise(process.nextTick);
          const message = await screen.getByText(/Erreur 500/);
          expect(message).toBeTruthy();
        });
      });
    });
  });
});
