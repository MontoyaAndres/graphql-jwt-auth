import "reflect-metadata";
import { createConnection } from "typeorm";
import { ApolloServer } from "apollo-server-express";
import * as express from "express";
import * as cookieParser from "cookie-parser";
import { verify } from "jsonwebtoken";

import { typeDefs } from "./typeDefs";
import { resolvers } from "./resolvers";
import { User } from "./entity/User";
import { createTokens } from "./auth";

const startServer = async () => {
  const server = new ApolloServer({
    // These will be defined for both new or existing servers
    typeDefs,
    resolvers,
    context: ({ req, res }: any) => ({ req, res })
  });

  await createConnection();

  const app = express();

  app.use(cookieParser());

  // More info -> https://www.youtube.com/watch?v=KkkdwK1VbLc&list=PLN3n1USn4xlkWolE06ELeTW9XqGJ7oiOn&index=3&pbjreload=10
  app.use(async (req: any, res, next) => {
    const accessToken = req.cookies["access-token"];
    const refreshToken = req.cookies["refresh-token"];

    if (!refreshToken && !accessToken) {
      return next();
    }

    try {
      const data = verify(accessToken, "ACCESS_TOKEN_SECRET_HERE") as any;
      req.userId = data.userId;

      return next();
    } catch {}

    if (!refreshToken) {
      return next();
    }

    let data;

    try {
      data = verify(refreshToken, "REFRESH_TOKEN_SECRET_HERE") as any;
    } catch {
      return next();
    }

    const user = await User.findOne(data.userId);
    // token has been invalidated
    if (!user || user.count !== data.count) {
      return next();
    }

    const tokens = createTokens(user);

    res.cookie("refresh-token", tokens.refreshToken);
    res.cookie("access-token", tokens.accessToken);
    req.userId = user.id;

    next();
  });

  server.applyMiddleware({ app }); // app is from an existing express app

  app.listen({ port: 4000 }, () =>
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
  );
};

startServer();
