/**
 * @jest-environment jsdom
 */

import { fireEvent, screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then I try to upload a file that is not an image", async () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      //Nécessaire pour init la fonction handleChangeFile (?)
      const newBill = new NewBill({
        document,
      });

      const inputFile = await screen.getByTestId("file");

      const file = new File(["test"], "test.txt", { type: "text/plain" });

      fireEvent.change(inputFile, {
        target: {
          files: [file],
        },
      });

      expect(inputFile.values).toBeFalsy();
    });
  });
});
