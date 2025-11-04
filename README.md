This started from attempting to create a custom game mode when Battlefield portal originally launched and I found I was running into several problem with specific functions not working.

I decided to just program all my game systems from scratch including scoreboards, general gamemode scoring, objective updates, capture points, capture point UI, and some modlib functions that needed fixing.

I was hoping to release all of this code once I had finished my project but have just been too busy recently and forgotten all about it so deciding to release it now. Even if it isn't 100% complete, someone might find a use for it.

I have gutted all elements from my game mode and just left the general stuff. I did some quick testing, as much as I can do with bots, and everything still seems to be working.

The moblib functions that I fixed are:
- FilteredArray
- WaitUntil
- GetPlayersInTeam

Here is a quick overview of each class:

## Game Controller: 
The top level of the game mode, controls everything from Map, Players, Scoreboards, etc

## Map
Contains Map specific items, such as capture points.

## Scoreboard
Contains all details for the scoreboard

## Player Controller:
Responsible for everything to do with players, including adding the player to the list of players, setting up their UI, and providing each player a unique ID.

## Player
Represents a player in game. Has a unique ID, a mod.player, a UI Controller, Stats

## Player Stats 
Contains all the stats for a player e.g. Kills, assists, deaths etc. Includes function for updating each stat and the scoreboard.

## Player UI Controller
Controls the UI for each individual player which include:
- Game mode UI
- Objective Update UI
- Capture Point UI

## Game Mode UI
Responsible for setting up, updating, and toggling the Game mode UI.
This is the UI displayed at the top including current score and capture point states.

## Objective UI
This is responsible for setting up, updating, and toggling the Objective UI.
The Objective UI involves two types of notifications: 
- Info - Which displays a blue message at the top of the screen
- Alert - Which displays a red message at the top of the screen

## Capture Point
This contains all information and logic for a capture point.
It has the functionality to display a capturing UI when a player has entered the capture point.
This UI updates in real time based on:
- The capture progress
- The amount of players from each team currently on the objective

It also includes functionality to spawn vechiles once the flag is captured.

## Capture Point UI
Displays all the information neede when capturing a flag including:
- The capture progress
- The amount of players from each team currently on the objective, also represented by a bar of which the blue:red ratio changes based on the ratio of players from each team.

The UI will also reflect the capture progress when the capture flag "bleeds", when it has not been captured and no players are stood on the flag.
