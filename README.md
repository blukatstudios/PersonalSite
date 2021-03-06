# Personal Site

This site is slowly being converted into a FOSS D&D campaign management site.
Profiles are managed via SQLite, but most of the world data is managed via a collection of json files. This is primarily to make the data easy to manually edit. 

This site is intended for use by less than 50 users, and as such optimizations are eschewed in interest of faster dev time and easier maintenance.

## Getting started

1. Clone the repo
2. `npm install`
3. `npm run install`
4. Edit the json files in data/
5. `npm run start`

### Maps
Paper maps are easiest to create, but digital maps are easier to share and store.
As an admin, you can access the /cities route to add and update the state of the world's cities and regions. The world is composed of regions that contain cities and have coordinates in an overworld map. The /map page displays a single region at a time, defaulting to the region at coords [0,0]. Each city exists somewhere inside a region between [0,0] and [100, 100].

### Factions Screen
The world contains factions, some of them are controlled by third parties.
The factions/ route allows an admin to edit what factions exist, and which users they are associated with.
