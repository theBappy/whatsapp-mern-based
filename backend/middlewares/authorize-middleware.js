import jwt from "jsonwebtoken";
import { response } from "../utils/response-handler.js";

export const authMiddleware = (req, res, next) => {
  const authToken = req.cookies?.auth_token;

  if (!authToken) {
    return response(
      res,
      401,
      "Authorization token missing, please provide token."
    );
  }
  try {
    const decode = jwt.verify(authToken, process.env.JWT_SECRET);
    req.user = decode;

    next();
  } catch (error) {
    console.error(error);
    return response(res, 401, "Invalid or expired token");
  }
};
