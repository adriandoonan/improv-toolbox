Improv toolbox should provide a lot of information for improv performers and trainers as well as tools that can mainly be used during practice and coaching sessions.

Later features could include creating lesson plans, keeping notes on sessions and scheduling.

## tech stack and conventions

- astro, preferring content collections
- deployed on cloudflare
- web components
- svelte components preferred when best solution
- pwa, local and mobile first
- functional programming only
- tools are discrete components so that collaborators can add a tool as long as the front matter is correct and it works
- content is added in markdown, named fields in front matter

## key sections

- exercises
- warm-ups
- forms
- tools

For the content sections the user should be able to list, filter and view detail pages for each element. A user should be able to favourite elements and be able to filter by favourites in the list page.

When on a detail page, if there is a matching tool, it should be possible to run the tool directly from the page. For example, for an exercise with a thirty second stare start and then a one minute scene, there should be a timer that has a thirty second and then one minute timers. For an excersise about playing emotions, there should be a suggestion component, pre filtered to only select from a collection of emotions, same for whatever, like the seven deadly sins, only the seven sins should be possible suggestions. For a form like Gauss form, there should be a Gauss timer.

On the details page a user should be able to add their own notes in markdown format that will be displayed alongside our own information on this element.

Users should also be able to submit new elements for the database

## tools

### timers

The toolbox should offer different timers, all timers should block a phone from going to sleep while they are active and should not stop being active until user interaction or one minute after the timer has reached 0.

- standard timer
- Gauss timer
- looping timer
- custom interval timer (eg Harold, Decon 'ideal' timing )

### suggestions

A user should be able to get suggestions for their sets. The default should be a word taken from a library of simple words. a user should also be able to select categories of suggestion to get suggestions for different things. examples include emotions, to get a suggestion from a list of emotions, location, to get a suggestion that is a location, song lyrics to get a list of song lyrics, to get a suggestion that is a line of a song, song names, to get a suggestion from a list of song or album names, poem names, to get a suggestion from a list of poem names, poem line, to get a suggestion that is the line of a poem, and so on.

Collaborators to the app should be able to add new word lists easily.

### Jam groupaliser

The jam groupaliser allows the user to run a jam set. Data is stored completely locally using indexedDB and never sent to the cloud.

We expect around 50 people to attend a jam, so this would create two groups of 9 people and four of 8. If 42 people were to attend, we would have 6 groups of seven people.

If a user has previous jams in their local storage, they will be presented with the list of jams and the option at the top to create a new jam.

To start the user selects 'new jam'.
The user can then start adding people to the jam.
New Jammers can be: first-timers, old-timers, hosts, jammers
New jammers can express a preference for the first half of a show
Once all jammers have been added the user can select 'groupalise'
The system will then try to create as even as possible groups of all jammers using the following algorithm.
Ideally there are 5-6 groups and 8-10 people in each group as a maximum. For smaller or larger numbers these are not rules.
Hosts should be distributed to try and get at least one host in each group.
First timers should be distributed evenly.
Old timers should be distributed evenly
Jammers should be distributed evenly.
In each case, the tool checks against a list of common known female names taken from firstnames.com and tries to keep a gender balance.
In each case, jammers who have expressed a preference to be in the first half should be ideally in the first two groups.
The app should prefer the groups at the start to be larger if there is an uneven distribution to cater for the case of a new jammer being added later.
The user should be able to edit groups by swapping jammers between groups.
The user can also select to reduce the number of jam teams, for example if six groups of 7 had been suggested by the app and the user selects to use only five groups, the groups are recalculated to have five groups, two of nine and three of eight.
When the user is happy, they can save the jam list.
The user should be able to see a summary of the created groups, eg. 6 groups of 8 people, 5 groups of 7 and 8 people.
A new Jammer can be added after a jam has been set up using the new jammer modal. In this case the jammer will be assigned a group by the user when they are added.

## warmups

A warmup is an activity that be done at the start of a practice, before a show, or at any time and has a name, short & long descriptions minimum number of participants, a focus and a step by step.

A warmup can optionally have trainers notes, with things to watch out for while running the warmup. Variations, for example five things with categories, characters etc. Related warmups, eg pass the sound and movement, contagious circle, pass the face etc. Timers, if it is a warmup that relies on some kind of time component. Suggestions if it is a warmup that relies on suggestions.

A warmup has a focus, eg agreement, group mind, character work, object work. But can also have tags that make it better to narrow down in a wide field.

A user can favourite a warmup and have it show up when filtering for favourites.
