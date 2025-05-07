import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ msg: "User Already Exists" });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: email,
        password: hashPassword,
      },
    });

    return res.status(200).json({ msg: "User Created" });
  } catch (error) {
    return res.status(500).json({ msg: "Internal Server Error", error });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const checkUser = await prisma.user.findUnique({ where: { email } });

    if (!checkUser) {
      return res.status(400).json({ msg: "User does not exist" });
    }

    const checkPassword = await bcrypt.compare(password, checkUser.password);

    if (!checkPassword) {
      return res.json({ msg: "Incorrect Password" });
    }

    const token = jwt.sign(
      { id: checkUser.id },
      process.env.JWT_SECRET || "123123"
    );

    res.status(200).send(token);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
});

app.listen(3000, () => console.log(3000));
