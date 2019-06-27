import { sign } from "jsonwebtoken";

import { User } from "./entity/User";

export const createTokens = (user: User) => {
  const refreshToken = sign(
    { userId: user.id, count: user.count },
    "REFRESH_TOKEN_SECRET_HERE",
    {
      expiresIn: "7d"
    }
  );
  const accessToken = sign({ userId: user.id }, "ACCESS_TOKEN_SECRET_HERE", {
    expiresIn: "15min"
  });

  return { refreshToken, accessToken };
};
