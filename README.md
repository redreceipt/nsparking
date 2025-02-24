# Church Parking Tracker

A real-time web app to help church parking volunteers track empty spaces across multiple lots.

## Features

- Add or remove parking lots dynamically.
- Edit lot names, empty spaces, and max capacity with a simple click-to-edit interface.
- Increment/decrement empty spaces with buttons.
- Displays the percentage of total spaces filled across all lots.
- Updates sync in real-time for all users via WebSockets.

## Setup

1. **Clone the repo**: `git clone <your-repo-url>`
2. **Install dependencies**: `cd <project-folder> && npm install`
3. **Run locally**: `node server.js`
   - Open `http://localhost:3000` in your browser.
4. **Deploy to Heroku**:
   - `heroku create <app-name>`
   - `git push heroku main`
   - Open the Heroku app URL.

## Files

- `server.js`: Node.js server with Socket.IO for real-time updates.
- `public/index.html`: Main webpage structure.
- `public/styles.css`: Styling for the UI.
- `public/script.js`: Client-side logic and DOM updates.

## Requirements

- Node.js
- npm
- Heroku CLI (for deployment)

## Usage

- Click "Add New Lot" to create a new lot.
- Click ✎ icons to edit names, empty spaces, or max capacity (saves on blur or Enter).
- Use +/- buttons to adjust empty spaces (capped at max capacity).
- Click "Remove" to delete a lot.
- "Reset All to Empty" sets all lots to their max capacity.

Built with love by Michael Neeley for any church parking team!
