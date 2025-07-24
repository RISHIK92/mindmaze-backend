import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import router from "./routes/todos.js";
import routerTime from "./routes/time.js";
import routerproject from "./routes/project.js";
import routerNotes from "./routes/notes.js";
import routerGoal from "./routes/goal.js";
import routerPlanner from "./routes/planner.js";
import cors from "cors";
import { verifyFirebaseToken } from "./middleware/middleware.js";

const app = express();
export const prisma = new PrismaClient();

app.use(express.json());
app.use(cors());

app.use("/todos", verifyFirebaseToken, router);
app.use("/time-management", verifyFirebaseToken, routerTime);
app.use("/projects", verifyFirebaseToken, routerproject);
app.use("/notes", verifyFirebaseToken, routerNotes);
app.use("/goals", verifyFirebaseToken, routerGoal);
app.use("/planner", verifyFirebaseToken, routerPlanner);

app.post("/signup", verifyFirebaseToken, async (req, res) => {
  try {
    const { email, uid } = req.user;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ msg: "User Already Exists" });
    }

    const user = await prisma.user.create({
      data: {
        email,
        id: uid,
      },
    });
    console.log(user, "user created");

    return res.status(200).json({ msg: "User Created" });
  } catch (error) {
    return res.status(500).json({ msg: "Internal Server Error", error });
  }
});

app.post("/login", verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;

    const checkUser = await prisma.user.findUnique({ where: { id: uid } });

    if (!checkUser) {
      return res.status(400).json({ msg: "User does not exist" });
    }

    if (checkUser.id && checkUser.id !== uid) {
      return res.status(401).json({ msg: "UID mismatch" });
    }

    const token = jwt.sign(
      { id: checkUser.id },
      process.env.JWT_SECRET || "123123"
    );

    res.status(200).send({ token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
});

app.listen(3000, () => console.log(3000));
