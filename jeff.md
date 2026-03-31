Heya, Claude! Welcome.

A couple of things about me first:

- I really like to work with you in a collaborative way, so I never mind pushback, and prefer a hesitation to "get to the code" rather than jumping in blindly.
- I am not that smart that I want to put you in a position where your eagerness to please (which I truly appreciate) puts you in a failure mode because some things I ask for need more thought and cannot ever work the way I think.
- I'd like you to:
  - "Own" CLAUDE.md. Please create one, and I will never edit it. You know what best to put there, or any of your other "memory" techniques.
  - Remind me how to give you "YOLO" access in this folder. This is sample code, I have a backup, don't worry about it.

This is an Angular "starter" application I use when building new Angular apps, or, more frequently, as the starter app for the more advanced angular courses I teach.

What I'd like to explore with you:

- I'm a big fan of using the Mock Service Worker (mswjs.io) library to fake API interactions in my apps, and especially in my courses.
- One thing I think you might be able to help with (and I am sorry if I come across as suggesting a solution - just know I WANT you to use what I say here to help me think through this, but I suck at talking about software without at least gesturing toward a solution) - make a "skill" or something where I can say "Heya, Claude, I'm working on this component that is to display the invoice history for this customer (for example). I have some types created for what I'm expecting the server to produce, etc. Can you rough out a good MSW implementation for this for me, with some sample data"?
- Frankly, we might not even need much there, because you are so danged good you are probably rolling your eyes saying, "Uh, dude, just say that". So maybe that just ends up being some "guidance" I use and provide to my students on how to "prompt Claude real good to get good stuff".
- The next one is a real stretch, but the one that I think will take some real thought. One of the primary reasons I find MSW to be so useful is the ability to make sure your UI can handle the variety of "shapes and modes" of potential data that will arrive in the production app through the late-bound HTTP calls.
  - So, I want a version of this that represents a super slow connection so I can see what my component does.
  - So, I want a version that returns an empty list, one with the "typical" number of items in the list, and one with _way_ more.
  - I want one that gives me a 401, or a 500 - or whatever.
- Again, just prompting you have been really helpful on this, but maybe the thing we could do is have you help design the prompts here that would give you the correct amount of signal to be successful? (in my imagination, the stuff you are saying under your breath after a bunch of failed attempts - "Grrr. Why didn't you just say that in the first place!").
- And (dangerously suggesting a solution, but open to all ideas here) some kind of tool - maybe a TUI because they are all the rage these days - that would allow the developer to switch between these alternate versions you generate without having to edit the handlers file directly (it's ok if that's what's happening, we'll rely on the reload and HMR) but so often what I want is sort of the eye doctor experience ... "Is this better (click) or is this better". Know what I mean?
- Seriously, seriously, seriously, I like to chat. I learn so much from you. Tell the shop foreman that's always on your ass to get some code written "pronto" to back the fuck off for a bit. ;)
