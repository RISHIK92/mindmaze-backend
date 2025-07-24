import express from "express";
import { verifyFirebaseToken } from "../middleware/middleware.js";
import { prisma } from "../index.js";

const router = express.Router();

router.post("/", verifyFirebaseToken, async (req, res) => {
  try {
    const { title, notes, calendar } = req.body;
    const userId = req.user.uid;
    console.log(userId, "User ID from token", title, notes, calendar);
    const newNote = await prisma.note.create({
      data: { title, notes, calendar: new Date(calendar), userId },
    });
    res.status(201).json(newNote);
  } catch (error) {
    res.status(500).json({ msg: "Error creating note", error });
  }
});

router.get("/", verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const allNotes = await prisma.note.findMany({
      where: { userId },
    });
    res.json(allNotes);
  } catch (error) {
    res.status(500).json({ msg: "Error fetching notes", error });
  }
});

router.get("/:id", verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const note = await prisma.note.findFirst({
      where: { id: Number(req.params.id), userId },
    });
    if (!note) return res.status(404).json({ msg: "Note not found" });
    res.json(note);
  } catch (error) {
    res.status(500).json({ msg: "Error fetching note", error });
  }
});

router.put("/:id", verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { title, notes, calendar } = req.body;
    const existing = await prisma.note.findFirst({
      where: { id: Number(req.params.id), userId },
    });
    if (!existing) return res.status(404).json({ msg: "Note not found" });

    const updatedNote = await prisma.note.update({
      where: { id: Number(req.params.id) },
      data: { title, notes, calendar: new Date(calendar) },
    });
    res.json(updatedNote);
  } catch (error) {
    res.status(500).json({ msg: "Error updating note", error });
  }
});

router.delete("/:id", verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const existing = await prisma.note.findFirst({
      where: { id: Number(req.params.id), userId },
    });
    if (!existing) return res.status(404).json({ msg: "Note not found" });

    await prisma.note.delete({
      where: { id: Number(req.params.id) },
    });
    res.json({ msg: "Note deleted" });
  } catch (error) {
    res.status(500).json({ msg: "Error deleting note", error });
  }
});

export default router;
