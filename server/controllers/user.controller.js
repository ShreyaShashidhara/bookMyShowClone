import User from "../model/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const getUserDetail = async (req, res) => {
  // const userId = req.params.userId;
  // const UserDetail = await User.findOne(email);
  // res.status(200).send(UserDetail);
  const jwtToken = req.headers.authorization?.split(" ")[1];
  if (!jwtToken) {
    return res.status(401).json({ message: "Authorization token missing" });
  }
  const userData = jwt.verify(jwtToken, process.env.JWT_SECRET);
  if (!userData) {
    return res.status(401).json({ message: "Invalid token" });
  }
  const userDetail = await User.findById(userData.userId).select("-password");
  if (!userDetail) {
    return res.status(404).json({ message: "User not found" });
  }
  res.status(200).send(userDetail);
};

export const createUser = async (req, res) => {
  try {
    const userData = req.body;
    const newUserData = await User.create(userData);
    res.status(200).send(newUserData);
  } catch (e) {
    console.error("Failed to create user:", e);
    const statusCode = e.name === "ValidationError" ? 400 : 500;
    res.status(statusCode).json({
      error: e.name,
      message: e.message,
    });
  }
};

export const updateUser = async (req, res) => {
  const userData = req.body;
  const userId = req.params.userId;
  const updatedData = await User.updateOne(
    { _id: userId },
    {
      $set: userData,
    }
  );
  res.status(200).send(updatedData);
};

export const deleteUser = async (req, res) => {
  const userId = req.params.userId;
  const deletedData = await User.findByIdAndDelete(userId);
  res.status(200).send(deletedData);
};

export const login = async (req, res) => {
  const { email, password, isAdmin } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: "JWT secret is not configured" });
  }

  const jwtToken = jwt.sign(
    { userId: user._id, email: user.email, isAdmin: user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.set("Authorization", `Bearer ${jwtToken}`);
  res.status(200).json({ message: "Login successful", token: jwtToken, user });
};
