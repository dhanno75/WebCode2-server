import express from "express";
import {
  createUser,
  updateUser,
  getAllUsers,
  getUserByEmail,
  login,
  protect,
  restrictTo,
  signup,
  getUser,
} from "../services/users.services.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { ObjectId } from "mongodb";
import { client } from "../index.js";
import sendEmail from "../utils/email.js";

const router = express.Router();

// Password generator function using bcrypt
const generatePassword = async (password) => {
  const NO_OF_ROUNDS = 10;
  const salt = await bcrypt.genSalt(NO_OF_ROUNDS);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
};

router.post("/signup", protect, restrictTo("admin", "manager"), signup);

router.post("/login", login);

router.get("/", async (req, res) => {
  const users = await getAllUsers();
  res.status(200).json({ users });
});

router.get("/:id", async (req, res) => {
  const id = req.params.id;

  const user = await getUser(id);

  res.status(200).json({
    status: "success",
    data: user,
  });
});

router.put("/:id", protect, async (req, res) => {
  console.log(req.params);
  console.log(req.body);
  let id = req.params.id;
  const data = req.body;

  const result = await updateUser(id, data);

  res.status(200).json({
    status: "success",
    data: result,
  });
});

router.post("/forgotPassword", async (req, res) => {
  // Get the user based on the email
  const { email } = req.body;
  const user = await getUserByEmail(email);
  if (!user) {
    return res.status(404).json({
      status: "fail",
      message: "There is no user with this email address.",
    });
  }

  // Generate random token
  const resetToken = crypto.randomBytes(32).toString("hex");

  const passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Update the password reset token
  const updateUser = await client
    .db("crm")
    .collection("users")
    .updateOne({ _id: user._id }, { $set: { passwordResetToken } });
  // res.send(updateUser);

  // Send it to users email
  // const resetUrl = `${req.protocol}://${req.get(
  //   "host"
  //   )}/users/resetPassword/${resetToken}`;

  const resetUrl = `${req.protocol}://localhost:3000/resetPassword/${resetToken}`;

  // const resetUrl = `${req.protocol}://web-code2-client.vercel.app/resetPassword/${resetToken}`;

  const message = `Forgot your password? Click on this link to submit a new request to reset your password to: ${resetUrl} .\nIf you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token",
      message,
    });

    res.status(200).send({
      status: "success",
      message: "Token sent to email",
    });
  } catch (err) {
    await client
      .db("crm")
      .collection("users")
      .updateOne({ _id: user._id }, { $set: { passwordResetToken: "" } });

    return res.status(500).send({
      status: "fail",
      message: "There was an error sending an email. Try again later.",
    });
  }
});

router.put("/resetPassword/:token", async (req, res) => {
  // get user based on the token
  console.log(req.params);
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await client
    .db("crm")
    .collection("users")
    .findOne({ passwordResetToken: hashedToken });
  console.log(user);
  // If the token has not expired, and there is user, set the new password
  if (!user) {
    return res.status(400, "Token is invalid or expired");
  }

  // hashing the password
  const hashedPassword = await generatePassword(req.body.password);

  await client
    .db("crm")
    .collection("users")
    .updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword, passwordResetToken: "" } }
    );

  const token = await jwt.sign({ id: user._id }, process.env.SECRET_KEY, {
    expiresIn: "90d",
  });
  res.status(200).json({
    status: "success",
    token,
    data: user,
  });
});

router.delete("/:id", protect, restrictTo("admin"), async (req, res) => {
  const { id } = req.params;
  const deletedUser = await client
    .db("crm")
    .collection("users")
    .deleteOne({ _id: ObjectId(id) });

  deletedUser
    ? res.status(204).send({ message: "success" })
    : res.status(404).send({ message: "User not found" });
});

export default router;
