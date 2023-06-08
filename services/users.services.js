import { client } from "../index.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";

// Password generator function
const generatePassword = async (password) => {
  const NO_OF_ROUNDS = 10;
  const salt = await bcrypt.genSalt(NO_OF_ROUNDS);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
};

export const createUser = async (data) => {
  return await client.db("crm").collection("users").insertOne(data);
};

export const getUserByEmail = async (email) => {
  return await client.db("crm").collection("users").findOne({ email: email });
};

export const getAllUsers = async () => {
  return await client.db("crm").collection("users").find({}).toArray();
};

export const getUser = async (id) => {
  return await client
    .db("crm")
    .collection("users")
    .findOne({ _id: ObjectId(id) });
};

export const updateUser = async (id, data) => {
  return await client
    .db("crm")
    .collection("users")
    .updateOne({ _id: ObjectId(id) }, { $set: data });
};

export const signup = async (req, res, next) => {
  const { firstname, lastname, email, password, role, leads, manager } =
    req.body;

  const userFromDB = await getUserByEmail(email);

  if (userFromDB) {
    res.status(400).json({
      status: "fail",
      message: "Email already exists",
    });
  } else {
    const hashedPassword = await generatePassword(password);
    const user = await createUser({
      email,
      password: hashedPassword,
      firstname,
      lastname,
      role,
      leads,
      manager,
    });

    res.status(200).json({
      status: "success",
      message: "User signed up successfully",
      data: {
        user,
      },
    });
  }
};

export const login = async (req, res, next) => {
  const { email, password } = req.body;

  const userFromDB = await getUserByEmail(email);

  if (!userFromDB) {
    res.status(401).json({
      status: "fail",
      message: "The username or password is wrong. Please try again.",
    });
  } else {
    const storedPassword = userFromDB.password;
    const passwordCheck = await bcrypt.compare(password, storedPassword);

    if (passwordCheck) {
      const token = jwt.sign({ id: userFromDB._id }, process.env.SECRET_KEY, {
        expiresIn: "90d",
      });

      // createSendToken(userFromDB, 200, res);
      res.status(200).json({
        status: "success",
        message: "Successfull Login",
        token,
        user: userFromDB,
      });
    } else {
      res.status(401).json({
        status: "fail",
        message: "Invalid login credentials",
      });
    }
  }
};

export const protect = async (req, res, next) => {
  try {
    const token = req.header("token");

    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    const currentUser = await client
      .db("crm")
      .collection("users")
      .findOne({ _id: ObjectId(decoded.id) });

    if (!currentUser) {
      res.status(401).json({
        status: "fail",
        message: "The user belonging to the token does not exist",
      });
    }

    req.user = currentUser;
    next();
  } catch (err) {
    res.status(401).send({ message: err.message });
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).send({ message: "Access denied" });
    }
    next();
  };
};

// export const isLoggedIn = async (req, res, next) => {
// }
