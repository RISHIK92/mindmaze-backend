import express from "express";
import { verifyFirebaseToken } from "../middleware/middleware.js";
import { prisma } from "../index.js";

const router = express.Router();

router.post("/", verifyFirebaseToken, async (req, res) => {
  try {
    const { goal, deadline, progress } = req.body;
    const userId = req.user.uid;
    const newGoal = await prisma.goal.create({
      data: { goal, deadline, progress: progress ?? 0, userId },
    });
    res.status(201).json(newGoal);
  } catch (error) {
    res.status(500).json({ msg: "Error creating goal", error });
  }
});

router.get("/", verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const goals = await prisma.goal.findMany({
      where: { userId },
    });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ msg: "Error fetching goals", error });
  }
});

router.get("/:id", verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const goal = await prisma.goal.findFirst({
      where: { id: Number(req.params.id), userId },
    });
    if (!goal) return res.status(404).json({ msg: "Goal not found" });
    res.json(goal);
  } catch (error) {
    res.status(500).json({ msg: "Error fetching goal", error });
  }
});

router.put("/:id", verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { goal, deadline, progress } = req.body;
    const existing = await prisma.goal.findFirst({
      where: { id: Number(req.params.id), userId },
    });
    if (!existing) return res.status(404).json({ msg: "Goal not found" });

    const updatedGoal = await prisma.goal.update({
      where: { id: Number(req.params.id) },
      data: { goal, deadline, progress },
    });
    res.json(updatedGoal);
  } catch (error) {
    res.status(500).json({ msg: "Error updating goal", error });
  }
});

router.delete("/:id", verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const existing = await prisma.goal.findFirst({
      where: { id: Number(req.params.id), userId },
    });
    if (!existing) return res.status(404).json({ msg: "Goal not found" });

    await prisma.goal.delete({
      where: { id: Number(req.params.id) },
    });
    res.json({ msg: "Goal deleted" });
  } catch (error) {
    res.status(500).json({ msg: "Error deleting goal", error });
  }
});

export default router;
