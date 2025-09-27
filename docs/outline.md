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

## warmups

A warmup is an activity that be done at the start of a practice, before a show, or at any time and has a name, short & long descriptions minimum number of participants, a focus and a step by step.

A warmup can optionally have trainers notes, with things to watch out for while running the warmup. Variations, for example five things with categories, characters etc. Related warmups, eg pass the sound and movement, contagious circle, pass the face etc. Timers, if it is a warmup that relies on some kind of time component. Suggestions if it is a warmup that relies on suggestions.

A warmup has a focus, eg agreement, group mind, character work, object work. But can also have tags that make it better to narrow down in a wide field.

A user can favourite a warmup and have it show up when filtering for favourites.
