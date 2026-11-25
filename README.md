# Shoe Point
A single-register shoe shop checkout in React. Each sale creates a customer ticket ID and bill ID. Reprints retain both. History lives in the browser profile on this computer. Clearing site data deletes history.

## Run on Windows
Install Node.js 22 LTS or newer. Extract the whole archive, open a terminal in the shoe-counter folder and run:
```sh
npm ci
npm run dev
```
Open the localhost URL printed in the terminal in desktop Chrome. Set your shop name and paper width in Printer settings. Enter each shoe, number of pairs, unit price and the cash received. Click Print receipt, then Start next sale.

## Connect a printer
Direct printing requires ESC/POS compatibility. Check the label or manual for model and transport.
- Bluetooth Classic (SPP): turn on the printer, pair it in Windows Bluetooth settings, then select Bluetooth Classic / serial port in the app and choose the printer's outgoing serial port. Chrome may display the port name only. You can enter the model from the sticker in Printer settings.
- BLE: select Bluetooth Low Energy and choose the printer. The app reads its advertised name and available model information. For a custom ESC/POS profile, enter the vendor's full service and writable characteristic UUIDs.
- Windows driver: install the printer using its driver and leave the app's direct connection disconnected. Click Print receipt and choose it in the system print dialog. Select matching paper width, 100% scale, no margins and disable headers and footers.
- The status describes the direct connection. After a transmission error check the paper before reprinting from history. The Shoe Point letterhead and Urdu return policy are sent as ESC/POS GS v 0 raster graphics. Direct item text uses ASCII. Use the system print dialog for other scripts.
- Hardware commissioning: enter items priced at Rs 2,499.99, 3,750.00 and 1,800.50, each with quantity 1. Receive Rs 8,500. The slip should show Rs 8,050.49 total and Rs 449.51 change. Reprint and compare both IDs, then disconnect the printer and check the status.

## Project commands
npm test runs the calculation and receipt-format tests. npm run build regenerates dist. Serve the production files at the site root over HTTPS or localhost.
