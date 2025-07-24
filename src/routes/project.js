import express from "express";
import { verifyFirebaseToken } from "../middleware/middleware.js";
import { prisma } from "../index.js";

const router = express.Router();

router.post("/", verifyFirebaseToken, async (req, res) => {
  try {
    const { projectName, deadline, progress } = req.body;
    const userId = req.user.uid;
    console.log(userId, "User ID from token", projectName, deadline, progress);
    const newProject = await prisma.project.create({
      data: { projectName, deadline: new Date(deadline), progress, userId },
    });
    res.status(201).json(newProject);
  } catch (error) {
    res.status(500).json({ msg: "Error creating project", error });
  }
});

router.get("/", verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const projects = await prisma.project.findMany({
      where: { userId },
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ msg: "Error fetching projects", error });
  }
});

router.get("/:id", verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, userId },
    });
    if (!project) return res.status(404).json({ msg: "Project not found" });
    res.json(project);
  } catch (error) {
    res.status(500).json({ msg: "Error fetching project", error });
  }
});

router.put("/:id", verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { progress } = req.body;
    const existing = await prisma.project.findFirst({
      where: { userId },
    });
    if (!existing) return res.status(404).json({ msg: "Project not found" });
    const updatedProject = await prisma.project.update({
      where: { id: Number(req.params.id) },
      data: { progress: Number(progress) },
    });
    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ msg: "Error updating project", error });
  }
});

router.delete("/:id", verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const existing = await prisma.project.findFirst({
      where: { id: req.params.id, userId },
    });
    if (!existing) return res.status(404).json({ msg: "Project not found" });

    await prisma.project.delete({
      where: { id: req.params.id },
    });
    res.json({ msg: "Project deleted" });
  } catch (error) {
    res.status(500).json({ msg: "Error deleting project", error });
  }
});

export default router;
