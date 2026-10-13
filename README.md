# Rideshare Match

A carpool matching app for students and coworkers who travel the same route. Built for CSCE 3444 (Software Engineering) at UNT, Group 5.

## Team

Priya Giri, Rupesh Bista, Sudip Sharma, Joshua Vadalas

## What works right now

The current version is a simple web page. It has no server and no database yet.

- Post a ride with driver name, from, to, date, and open seats (1 to 8)
- The form checks that driver, from, to, and date are filled in, and it rejects dates in the past
- Search posted rides by pickup or destination
- Rides are saved in your browser (`localStorage`, key `rideshareRides`), so they stay after a refresh but only on your own computer

## What's planned

Sign-up and login with a school or work email, ride matching, messaging, notifications, and the other features in our SRS. Each one is tracked as a task in the Production Plan.

## Run it locally

    git clone https://github.com/unt-csce3444-carpoolcrew/rideshare-match.git
    cd rideshare-match

Then open `index.html` in your browser. Nothing to install.

## Files

| File | What it does |
|---|---|
| `index.html` | The page: "Post a Ride" form and "Find a Ride" search |
| `style.css` | Styling |
| `app.js` | Saves rides, checks the form, and filters the list |

## Working on a task

Pick a task from the Production Plan, keep commits small, and write the message so it says what changed (example: `FR-1: add sign-up form`). Commit from your own GitHub account so your work shows up on the contributors page. If you can't push to the repo, fork it and open a pull request.

## Links

- Trello board: https://trello.com/b/wTjRaDfV/ride-share-match
- SRS, UI designs, UML diagrams, and Production Plan: linked in the course Information Sheet

CSCE 3444, University of North Texas
