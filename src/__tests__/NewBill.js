/**
 * @jest-environment jsdom
 */

import { screen } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import userEvent from "@testing-library/user-event"

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page",() => {
    test("Then ...",async () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      const inputFile = screen.getByTestId("file");
      console.log(inputFile);
      const testFile = new File(["test"], "..\\__mocks__\\textfile.txt")
      const handleChangeFile = spyOn(inputFile, "onchange");
      userEvent.upload(inputFile, testFile);
      
      console.log(inputFile.files.length);
      expect(handleChangeFile).toHaveBeenCalled();
      expect(inputFile.files.length).toEqual(0);
    })
  })
})
