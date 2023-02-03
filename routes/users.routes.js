import express from "express";
import {
  createUser,
  getAllUsers,
  getUserByEmail,
  login,
  protect,
  restrictTo,
  signup,
} from "../services/users.services.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { client } from "../index.js";
import sendEmail from "../utils/email.js";

const router = express.Router();

// Password generator function
const generatePassword = async (password) => {
  const NO_OF_ROUNDS = 10;
  const salt = await bcrypt.genSalt(NO_OF_ROUNDS);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
};

router.post("/signup", signup);

router.post("/login", login);

router.get("/", protect, restrictTo("admin", "manager"), async (req, res) => {
  const users = await getAllUsers();
  res.send(users);
});

router.post("/forgotPassword", async (req, res) => {
  // Get the user based on the email
  const { email } = req.body;
  const user = await getUserByEmail(email);
  if (!user) {
    return res
      .status(404)
      .send({ message: "There is no user with this email address." });
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
  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetUrl}.\nIf you didn't forget your password, please ignore this email!`;

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
      status: 500,
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

  const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY, {
    expiresIn: "90d",
  });
  res.status(200).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
});

router.delete("/:id");

export default router;
