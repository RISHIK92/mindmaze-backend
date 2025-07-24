import express from "express";
import { verifyFirebaseToken } from "../middleware/middleware.js";
import { prisma } from "../index.js";

const router = express.Router();

router.post("/", verifyFirebaseToken, async (req, res) => {
  try {
    const { text, data, completedAt } = req.body;

    if (!text || !data) {
      return res.status(400).json({
        error: "Text and data fields are required",
      });
    }

    const timeManagement = await prisma.timeManagement.create({
      data: {
        text,
        data,
        completedAt: completedAt || false,
        userId: req.user.uid,
      },
    });

    res.status(201).json({
      success: true,
      data: timeManagement,
    });
  } catch (error) {
    console.error("Error creating time management entry:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

router.get("/", verifyFirebaseToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, completed } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      userId: req.user.uid,
    };

    if (completed !== undefined) {
      where.completedAt = completed === "true";
    }

    const [timeManagementEntries, total] = await Promise.all([
      prisma.timeManagement.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.timeManagement.count({ where }),
    ]);

    res.json({
      success: true,
      data: timeManagementEntries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching time management entries:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

router.get("/:id", verifyFirebaseToken, async (req, res) => {
  try {
    const { id } = req.params;

    const timeManagement = await prisma.timeManagement.findFirst({
      where: {
        id,
        userId: req.user.uid,
      },
    });

    if (!timeManagement) {
      return res.status(404).json({
        error: "Time management entry not found",
      });
    }

    res.json({
      success: true,
      data: timeManagement,
    });
  } catch (error) {
    console.error("Error fetching time management entry:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

router.put("/:id", verifyFirebaseToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { text, data, completedAt } = req.body;

    const existingEntry = await prisma.timeManagement.findFirst({
      where: {
        id,
        userId: req.user.uid,
      },
    });

    if (!existingEntry) {
      return res.status(404).json({
        error: "Time management entry not found",
      });
    }

    const updateData = {};
    if (text !== undefined) updateData.text = text;
    if (data !== undefined) updateData.data = data;
    if (completedAt !== undefined) updateData.completedAt = completedAt;

    const updatedTimeManagement = await prisma.timeManagement.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      data: updatedTimeManagement,
    });
  } catch (error) {
    console.error("Error updating time management entry:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

router.patch("/:id/toggle", verifyFirebaseToken, async (req, res) => {
  try {
    const { id } = req.params;

    const existingEntry = await prisma.timeManagement.findFirst({
      where: {
        id,
        userId: req.user.uid,
      },
    });

    if (!existingEntry) {
      return res.status(404).json({
        error: "Time management entry not found",
      });
    }

    const updatedTimeManagement = await prisma.timeManagement.update({
      where: { id },
      data: {
        completedAt: !existingEntry.completedAt,
      },
    });

    res.json({
      success: true,
      data: updatedTimeManagement,
    });
  } catch (error) {
    console.error("Error toggling time management entry:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

router.delete("/:id", verifyFirebaseToken, async (req, res) => {
  try {
    const { id } = req.params;

    const existingEntry = await prisma.timeManagement.findFirst({
      where: {
        id,
        userId: req.user.uid,
      },
    });

    if (!existingEntry) {
      return res.status(404).json({
        error: "Time management entry not found",
      });
    }

    await prisma.timeManagement.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Time management entry deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting time management entry:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

router.delete("/completed/all", verifyFirebaseToken, async (req, res) => {
  try {
    const deletedEntries = await prisma.timeManagement.deleteMany({
      where: {
        userId: req.user.uid,
        completedAt: true,
      },
    });

    res.json({
      success: true,
      message: `${deletedEntries.count} completed time management entries deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting completed entries:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

router.get("/stats/overview", verifyFirebaseToken, async (req, res) => {
  try {
    const [total, completed, pending] = await Promise.all([
      prisma.timeManagement.count({ where: { userId: req.user.uid } }),
      prisma.timeManagement.count({
        where: { userId: req.user.uid, completedAt: true },
      }),
      prisma.timeManagement.count({
        where: { userId: req.user.uid, completedAt: false },
      }),
    ]);

    const completionRate =
      total > 0 ? ((completed / total) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        total,
        completed,
        pending,
        completionRate: parseFloat(completionRate),
      },
    });
  } catch (error) {
    console.error("Error fetching time management stats:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

export default router;
