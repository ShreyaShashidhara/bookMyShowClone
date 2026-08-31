import jwt from "jsonwebtoken";

const authMiddleware = function (req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Authorization token missing" });
        }

        const jwtToken = authHeader.split(" ")[1];
        const userData = jwt.verify(jwtToken, process.env.JWT_SECRET);
        req.user = userData;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
};

export default authMiddleware;
