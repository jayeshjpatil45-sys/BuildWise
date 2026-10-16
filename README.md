# BuildWise

## Construction Site Material & Wastage Management
Community Engagement & Field Project prototype.

## Upload to GitHub
1. Extract this ZIP file.
2. Create or open your GitHub repository.
3. Choose Add file > Upload files.
4. Upload the extracted files (index.html, style.css, app.js and README.md) together. Do not upload only the ZIP.
5. Ensure index.html is at the repository root, then commit the files.
6. To make the website live: Settings > Pages > Deploy from a branch > main > /(root) > Save. If your branch uses a different name, select that branch instead.
7. Once deployment completes, GitHub Pages shows the website address.

This package requires no installation, npm, build step, or server-side code. You can also open index.html directly in a modern browser.

## Features
- Editable site name and location
- Material inventory: received, used, wasted and available quantities
- Material costs, estimated material loss and low-stock warnings
- Separate waste register measured in kilograms and recovery chart
- Community reuse listings and a fieldwork checklist
- Search, filters, CSV downloads and printable reports (choose Save as PDF)
- JSON backup and restore
- Browser storage persistence
- Responsive desktop and mobile layouts

## Using actual fieldwork data
The default site and records are fictional sample data. Open Manage data > Start an empty project, confirm, then enter your own verified observations. Sample data remains labelled until you start an empty project.

## How the calculations work
Available quantity = received - used - wasted, in each material's own unit.
Recovery share = (reuse weight + recycling weight) / total waste weight * 100.
Estimated material loss = sum of wasted inventory quantity * entered cost per unit.
Different inventory units are never added together. Inventory quantities and waste weights are entered independently; the app does not convert or synchronise them.

## Data and limitations
Data stays in the current browser, device and website origin. It is not a shared database. The live demo, a local file and a GitHub Pages copy have separate saved data. Use Download JSON backup and restore to move records between them.

There is no login, verified collector directory, messaging system or automatic collection/donation service. A reuse listing does not contact anyone. Logged recovery routes are plans or observations and do not verify completed processing. Entered costs are estimates. Community reuse should be assessed with the site supervisor.

Keep backups before clearing browser data, reloading samples or replacing a project. If browser storage is unavailable, export a backup before leaving.

## Files
- index.html: page structure
- style.css: responsive styling
- app.js: all functionality and browser storage
- README.md: setup and project notes
