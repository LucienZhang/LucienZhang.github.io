# Web API Design

How do you define your resources on the server? How can you provide stable, scalable, and independent web services to your users? With the development of Web APIs, some styles and patterns of API design are proposed one by another. There are many debates on which API style is the best. However, the proper question to ask is which style is better for your system, and that depends on your needs. Thanks to Nate Barbettini and his [video](https://www.youtube.com/watch?v=IvsANO0qZEg), from which I learnt all these concepts.

This article will introduce three popular API design patterns, RPC, REST, and GraphQL, compare their pros and cons, then give you some advice on choosing patterns for your system.

## RPC

The implementation of RPC (Remote Procedure Call) can be traced back to the 1980s. Bruce Jay Nelson is generally credited with coining the term "remote procedure call" in 1981[^nelson]. In the context of RPC, servers provide functions to clients, and the purpose of sending HTTP requests is to call a remote function executed on another server as same as calling a local function. Therefore, the HTTP request is a command that expresses what action should be executed and expects the response or return value of this particular function. Apparently, the very fundamental unit of RPC is function.

[^nelson]: Nelson, B. J. (1982). REMOTE PROCEDURE CALL.

For instance, if I want to fetch all my contacts on Google, with RPC style API design, I may send a request like `GET /listContacts` to Google and expect it fetches the data from the database and return me the contacts as a list. If I want to add a new contact, I could send a request like `POST /addContact` with the detailed information of the contact attached in the request body.

RPC looks cool and easy to understand. However, RPC has some problems like tight coupling, no discoverability, and function explosion. RPC tends to have very high coupling to the underlying system. There are no many abstraction layers between the underlying system and external users. That makes the clients have to worry about if there's going to be any side effect of calling a function, or directly, what exact endpoint I need to call because I can't guess the use of a function only by its name. The term _discoverability_ implies, for a new user, how do I know what functions the server is providing and what endpoint should I call for my business. Generally, RPC API explains the use of the interfaces by a big bunch of documentation, but it's not always helpful, especially for a new user. The function explosion problem implies that, technically, there might be many APIs with different versions or names providing similar but frustratingly slightly different functions because it's effortless to create a new function. In other words, the functions are overused.

## REST

The problem of RPC is that the APIs are too tightly coupled to the underlying system. Thus we can solve this by adding a better and stronger abstraction layer between them. That's precisely the goal of REST (Representational State Transfer), which was introduced and defined in 2000 by Roy Fielding in his doctoral dissertation[^fielding]. REST goes the very opposite way of RPC. Instead of modelling functions, REST APIs model resources, and the relationships between resources. By providing resources, REST API lets the end-user decide how to use and maintain the resources, leading to a compelling way of decoupling clients from servers.

[^fielding]: Fielding, R. T. (2000). REST: architectural styles and the design of network-based software architectures. Doctoral dissertation, University of California.

For the same example of fetching my contact on Google, in a REST API context, I could send a request like `GET /contacts` to the server, meaning _access_ the contacts resource on the server and expect the server respond me something like:

```json
{
  [
    {
      "id": 101,
      "name": "Tom",
      "email": "tom@example.com"
    },
    {
      "id": 102,
      "name": "Jack",
      "email": "jack@example.com"
    },
    ...
  ]
}
```

An advantage of REST API, comparing to RPC, is that it gets rid of documentations. You can get the instructions and metadata by accessing the root entry point. Those metadata and instructions may lead to other available resources on the server, just like how the web pages are connected. Although describing all the instructions in your APIs is hard to achieve and even really good REST APIs today don't always do that, REST API is designed to decouple the client and the server as much as possible. Another apparent advantage of REST APIs is that the resources are reusable. For example, we want another query to get the email of one of my contacts, who is the author of one of my favourite books. In an RPC API, we may have to build up a new function to return that exact information. But in REST API, the resources are already there. So the client is to get a resource from one endpoint, then follow the links to get another, as an example request flow shown below.

> GET /books
>
> GET /books/1
>
> GET /books/1/author
>
> GET /contacts/101

By providing resources, as a designer, you don't have to know every single use case that a client might want to do in the future. You might build your API, and then five years later somebody makes a client that does something different that you weren't expecting. Still, they can do so because the necessary resources are already there available by accessing your REST APIs.

Unfortunately, in our industry, the term REST API has been pretty severely overloaded. REST API reuses HTTP and expresses the intention of the request by the HTTP verbs. Someone may think that if I use HTTP verbs and return JSON, it's a REST API. However, a real REST API expresses a lot more than simple JSON over HTTP or just using HTTP verbs. Another problem is that, in practice, as programmers, it's easy to slip back to that comfortable calling function style. We end up somewhere between REST and RPC; we end up with kind of a RESTful procedure call type of API.

The highest idea of REST is called HATEOAS (Hypermedia As The Engine Of Application State). It's to decouple the client and the server, therefore enables client and server to evolve independently as long as they agree on the standard structure of the communication. An excellent example of this is web pages per se, web servers and web browsers have evolved quite a bit. Still, because we all agree on the fundamental markup language HTML, we can keep everything working. This idea of using hypertext to describe the application state enables systems to be stable and have longevity over decades.

The tools at the cutting edge of REST are to make it easier to model the response metadata. The specs and schemas like [HAL](http://stateless.co/hal_specification.html), [JSON-API](https://jsonapi.org/), [Ion](https://ionspec.org/), [Siren](https://github.com/kevinswiber/siren), and some others, are trying to build up some standard rules for your REST API, like the role of HTML between web browsers and web servers.

There are also some problems with the REST API. One is that there is no standard schema the everybody agrees on about how REST API should be built. Even for those fans of REST, there are still tremendous disagreements and debates on the structure of REST API. The other problem is that sometimes the payload of REST can get big and the communication to REST API can be a little bit chatty. You will always get all the instructions and metadata, even if you only need a small piece of information from the response. To achieve your goal, sometimes you need to fetch different resources from different places, analyze and combine them to get what you want finally. Therefore you may need to send multiple requests instead of one, and every time the server may respond some extra metadata to you.

## GraphQL

The big payload and chattiness problem of REST was one of the driving factors behind FaceBook and their invention of the GraphQL style. The GraphQL, abbreviation of Graph Query Language, was developed internally by Facebook in 2012 before being publicly released in 2015[^graphql]. Instead of modelling functions or resources, in a GraphQL API, we deal with a query. Think of SQL as a famous query langue for database, GraphQL gives you precisely what you want without massive extras like what REST API does. As a query language, GraphQL starts with a strongly typed schema. It's kind of like RPC that describes the function and the return type, and sort of like REST that returns resources that you want. Unlike REST, GraphQL enables you to get all you want in one query, which is very helpful if you have a terrible network connection. GraphQL can also deal with mutations to maintain the resource on the server just like how `INSERT` or `UPDATE` query does in SQL to a database.

[^graphql]: GraphQL: A data query language. <https://engineering.fb.com/core-data/graphql-a-data-query-language/>

GraphQL has many advantages as we said, excellent discoverability like REST does, but low network overhead, typed schema, and naturally, fits graph-like data very well. However, GraphQL has some problems at the moment. GraphQL is the most complex one of these styles; it trades off some complexity for some power. Something like caching can be tricky in a GraphQL API because GraphQL API almost always uses the `POST` verb which, in an HTTP context, means don't ever cache this. So you have to do a lot of custom caching in a GraphQL API. The development of GraphQL is still on an early stage. Another a little bit awkward problem of GraphQL is versioning. Currently, the best practice seems to be that you don't version your API at all, queries can change over time, and that's just fine. But in practice, you may need some stability over time to support old clients.

## Design Considerations

Returning to our original design consideration, each one of these styles, RPC, REST, and GraphQL make different decisions and different assumptions about which one of the following factors is most important to you.

|     Styles      | Coupling | Chattiness | Client Complexity | Cognitive Complexity | Caching | Discoverability | Versioning |
| :-------------: | :------: | :--------: | :---------------: | :------------------: | :-----: | :-------------: | :--------: |
|  RPC Functions  |   High   |   Medium   |        Low        |         Low          | Custom  |       Bad       |    Hard    |
| REST Resources  |   Low    |    High    |        Low        |         Low          |  HTTP   |      Good       |    Easy    |
| GraphQL Queries |  Medium  |    Low     |       High        |         High         | Custom  |      Good       |    ???     |

Instead of asking which API style is the best, we could make the choice by asking who uses my API. If you focus on objects or resources like a management API or CRUD API, and it's essential to have good discoverability and documentation for many varied clients like the case of public API services, you may consider REST API with schemas like HAL, JSON-API, and Ion. If your API focuses on sending commands to a remote system, is action-oriented and wants simple interactions, you may want to try RPC API. An excellent example of this is the Slack API. It's very command focused and all about actions like join a channel, leave a channel, or send a message. Another scenario that may fit RPC is internal microservices. In internal microservices, we would need to have a very high message and network performance, and we don't want to transmit a ton of metadata over the wire as a REST API does. So things like gRPC and Twirp are excellent cases for microservices. But if your goal is not as much high network performance but having a stable API contract between teams, sometimes REST might be a good choice here as well. Finally, if you are building APIs that are heavily used on mobile clients with potential terrible network connections, or they are very graph focused, you could check out GraphQL.

It is important to say that there's no silver bullet here. The point is not which style is the best; the point is that for every API project, which design consideration is most important to you.
