/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import mockStore from "../__mocks__/store.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import userEvent from "@testing-library/user-event";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    //Test de la surbrillance de l'icône
    test("Then the new bill icon should be highlighted", async () => {
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
      window.onNavigate(ROUTES_PATH.NewBill);

      await waitFor(() => screen.getByTestId("icon-mail"));
      const iconMail = screen.getByTestId("icon-mail");

      expect(iconMail.classList.contains("active-icon")).toBeTruthy();
    });

    //Test d'envoie d'un fichier qui n'est pas une image
    test("Then I try to upload a file that is not an image", async () => {
      //Création de la page
      const html = NewBillUI();
      document.body.innerHTML = html;

      //Nécessaire pour init la fonction handleChangeFile
      const newbill = new NewBill({
        document,
      });

      //Récupération de l'input
      const inputFile = await screen.getByTestId("file");

      //Création d'un fichier text
      const file = new File(["test"], "test.txt", { type: "text/plain" });

      //Simulation d'envoie de fichier
      fireEvent.change(inputFile, {
        target: {
          files: [file],
        },
      });

      //Si la propriété fileUrl de newbill est null, alors le fichier n'a pas été enregistré et un message d'erreur devrait s'afficher sur la page
      //Note : l'erreur "invalid file" dans la console est normale
      expect(newbill.fileUrl).toBeNull();
      expect(screen.getByTestId("errorMsg")).toBeVisible();
    });

    //Test d'envoie d'un fichier est une image
    test("Then I can upload a file of the correct type", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      document.body.innerHTML = NewBillUI();

      var newBill = new NewBill({
        document,
        onNavigate: onNavigate,
        store: mockStore,
      });
      const inputFile = await screen.findByTestId("file");

      const file = new File(["test"], "test.jpg", { type: "image/jpg" });

      userEvent.upload(inputFile, file);

      expect(inputFile.files.length).toEqual(1);

      expect(inputFile.files[0].name).toBe("test.jpg");

      console.log("url : " + newBill.fileUrl);

      // Vérifier si le nom de fichier dans newBill correspond à "file.jpg".
      expect(newBill.fileName).toBe("test.jpg");
    });

    // Test de soumission d'une nouvelle facture et redirection vers "Bills"
    test("Submitting a correct form should call handleSubmit method and redirect user on Bill page", async () => {
      // Navigation et soumission du formulaire
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
      });

      const handleSubmitSpy = jest.spyOn(newBill, "handleSubmit");

      const formNewBill = screen.getByTestId("form-new-bill");
      formNewBill.addEventListener("submit", newBill.handleSubmit);

      const inputExpenseType = screen.getByTestId("expense-type");
      const inputExpenseName = screen.getByTestId("expense-name");
      const inputDatepicker = screen.getByTestId("datepicker");
      const inputAmount = screen.getByTestId("amount");
      const inputVAT = screen.getByTestId("vat");
      const inputPCT = screen.getByTestId("pct");
      const inputCommentary = screen.getByTestId("commentary");
      const inputFile = screen.getByTestId("file");

      // Données à insérer
      const inputData = {
        type: "Transports",
        name: "TestForm",
        datepicker: "2023-04-24",
        amount: "1000",
        vat: "20",
        pct: "20",
        commentary: "Test Mocked Data",
        file: new File(["test"], "testForm.jpeg", { type: "image/jpeg" }),
      };

      console.log("Form test")

      // Insérer les données simulées
      fireEvent.change(inputExpenseType, {
        target: { value: inputData.type },
      });
      fireEvent.change(inputExpenseName, {
        target: { value: inputData.name },
      });
      fireEvent.change(inputDatepicker, {
        target: { value: inputData.datepicker },
      });
      fireEvent.change(inputAmount, { target: { value: inputData.amount } });
      fireEvent.change(inputVAT, { target: { value: inputData.vat } });
      fireEvent.change(inputPCT, { target: { value: inputData.pct } });
      fireEvent.change(inputCommentary, {
        target: { value: inputData.commentary },
      });
      userEvent.upload(inputFile, inputData.file);

      // Vérifier les valeurs insérées
      expect(inputExpenseType.value).toBe(inputData.type);
      expect(inputExpenseName.value).toBe(inputData.name);
      expect(inputDatepicker.value).toBe(inputData.datepicker);
      expect(inputAmount.value).toBe(inputData.amount);
      expect(inputVAT.value).toBe(inputData.vat);
      expect(inputPCT.value).toBe(inputData.pct);
      expect(inputCommentary.value).toBe(inputData.commentary);
      expect(inputFile.files[0]).toBe(inputData.file);

      fireEvent.submit(formNewBill);

      await waitFor(() => screen.getByText("Mes notes de frais"));
      expect(screen.getByText("Mes notes de frais")).toBeTruthy();
      expect(handleSubmitSpy).toHaveBeenCalled();
    });
  });
});
