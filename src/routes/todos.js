import { PrismaClient } from "@prisma/client";
import express from "express";
import { verifyFirebaseToken } from "../middleware/middleware.js";

const router = express.Router();
const prisma = new PrismaClient();

router.use(verifyFirebaseToken);

router.post("/", async (req, res) => {
  try {
    const { status, todo } = req.body;
    const userId = req.user.uid;
    const newTodo = await prisma.todo.create({
      data: { status, todo, userId },
    });
    res.status(201).json(newTodo);
  } catch (error) {
    res.status(500).json({ msg: "Error creating todo", error });
  }
});

router.get("/", async (req, res) => {
  try {
    const userId = req.user.uid;
    const todos = await prisma.todo.findMany({
      where: { userId },
    });
    res.json(todos);
  } catch (error) {
    res.status(500).json({ msg: "Error fetching todos", error });
  }
});

// Get a single todo by id (only if it belongs to the user)
router.get("/:id", async (req, res) => {
  try {
    const userId = req.user.uid;
    const todo = await prisma.todo.findFirst({
      where: { id: Number(req.params.id), userId },
    });
    if (!todo) return res.status(404).json({ msg: "Todo not found" });
    res.json(todo);
  } catch (error) {
    res.status(500).json({ msg: "Error fetching todo", error });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const userId = req.user.uid;
    const { status, todo } = req.body;
    const existing = await prisma.todo.findFirst({
      where: { id: Number(req.params.id), userId },
    });
    if (!existing) return res.status(404).json({ msg: "Todo not found" });

    const updatedTodo = await prisma.todo.update({
      where: { id: Number(req.params.id) },
      data: { status, todo },
    });
    res.json(updatedTodo);
  } catch (error) {
    res.status(500).json({ msg: "Error updating todo", error });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const userId = req.user.uid;
    const existing = await prisma.todo.findFirst({
      where: { id: Number(req.params.id), userId },
    });
    if (!existing) return res.status(404).json({ msg: "Todo not found" });

    await prisma.todo.delete({
      where: { id: Number(req.params.id) },
    });
    res.json({ msg: "Todo deleted" });
  } catch (error) {
    res.status(500).json({ msg: "Error deleting todo", error });
  }
});

export default router;
