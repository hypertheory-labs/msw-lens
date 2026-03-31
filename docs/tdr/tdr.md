# Technical Discussion Records

Based on Architectural Decision Records (ADRs) See
[https://adr.github.io/](https://adr.github.io/), Technical Discussion Records
are a common technique for a
team to share the decisions made on the architecture and technical
implementation of an application, especially when there are multiple _choices_
that could be made for a certain approach.

The goal here is to make that decision making "public" amongst the team, and
documented in the source repository of the application. If there are changes to
the thinking about any specific approach, the ADR for that decision should be
updated appropriately, and agreed upon by whatever review process the team is
comfortable with.

The approach in this application is to use "lightweight" ADRs.

In the title of the decisions, the terms _prefer_ or _consider_ are guidance. They should be accepted as your default approach within your application, though reasoned exceptions are permissable.

The terms _use_ or _must_ mean that these are currently considered invariants. If you discover a situation where you must vary from these points of guidance, you must first ammend the ADR for this decision and get it accepted.
