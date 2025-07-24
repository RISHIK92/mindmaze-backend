import express from "express";
import { verifyFirebaseToken } from "../middleware/middleware.js";
import { prisma } from "../index.js";

const router = express.Router();

router.post("/", verifyFirebaseToken, async (req, res) => {
  try {
    const { task, priority, categories, deadline, date } = req.body;
    console.log(task, priority, categories, deadline, date);
    const userId = req.user.uid;
    console.log(typeof userId, "User ID from token");
    const newPlanner = await prisma.planner.create({
      data: {
        task,
        priority,
        categories,
        deadline: deadline,
        date: new Date(date),
        userId,
      },
    });
    console.log(newPlanner, "New planner task created");
    res.status(201).json(newPlanner);
  } catch (error) {
    res.status(500).json({ msg: "Error creating planner task", error });
  }
});

router.get("/", verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const planners = await prisma.planner.findMany({
      where: { userId },
    });
    res.json(planners);
  } catch (error) {
    res.status(500).json({ msg: "Error fetching planner tasks", error });
  }
});

router.get("/:id", verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const planner = await prisma.planner.findFirst({
      where: { id: Number(req.params.id), userId },
    });
    if (!planner)
      return res.status(404).json({ msg: "Planner task not found" });
    res.json(planner);
  } catch (error) {
    res.status(500).json({ msg: "Error fetching planner task", error });
  }
});

router.put("/:id", verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { task, priority, categories, deadline, date } = req.body;
    const existing = await prisma.planner.findFirst({
      where: { id: Number(req.params.id), userId },
    });
    if (!existing)
      return res.status(404).json({ msg: "Planner task not found" });

    const updatedPlanner = await prisma.planner.update({
      where: { id: Number(req.params.id) },
      data: {
        task,
        priority,
        categories,
        deadline: deadline,
        date: new Date(date),
      },
    });
    res.json(updatedPlanner);
  } catch (error) {
    res.status(500).json({ msg: "Error updating planner task", error });
  }
});

router.delete("/:id", verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const existing = await prisma.planner.findFirst({
      where: { id: Number(req.params.id), userId },
    });
    if (!existing)
      return res.status(404).json({ msg: "Planner task not found" });

    await prisma.planner.delete({
      where: { id: Number(req.params.id) },
    });
    res.json({ msg: "Planner task deleted" });
  } catch (error) {
    res.status(500).json({ msg: "Error deleting planner task", error });
  }
});

export default router;
