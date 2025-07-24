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

app.get("/dashboard", verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0));
    const endOfYesterday = new Date(yesterday.setHours(23, 59, 59, 999));

    const startOfWeek = new Date();
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [
      allTodos,
      completedTodosToday,
      completedTodosYesterday,
      timeManagementToday,
      allProjects,
      projectsDueThisWeek,
      allGoals,
      recentTodos,
      recentTimeEntries,
      recentProjects,
      recentNotes,
      recentPlannerTasks,
    ] = await Promise.all([
      prisma.todo.findMany({ where: { userId: uid } }),
      prisma.todo.findMany({
        where: {
          userId: uid,
          status: true,
          updatedAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
      prisma.todo.findMany({
        where: {
          userId: uid,
          status: true,
          updatedAt: { gte: startOfYesterday, lte: endOfYesterday },
        },
      }),

      prisma.timeManagement.findMany({
        where: {
          userId: uid,
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      }),

      prisma.project.findMany({ where: { userId: uid } }),
      prisma.project.findMany({
        where: {
          userId: uid,
          deadline: {
            gte: today,
            lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      prisma.goal.findMany({ where: { userId: uid } }),

      prisma.todo.findMany({
        where: { userId: uid },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.timeManagement.findMany({
        where: { userId: uid },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.project.findMany({
        where: { userId: uid },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.note.findMany({
        where: { userId: uid },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.planner.findMany({
        where: { userId: uid },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    const totalTasks = allTodos.length;
    const completedTasks = allTodos.filter((todo) => todo.status).length;
    const taskCompletionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const tasksCompletedTodayCount = completedTodosToday.length;
    const tasksCompletedYesterdayCount = completedTodosYesterday.length;
    const taskChangePercentage =
      tasksCompletedYesterdayCount > 0
        ? Math.round(
            ((tasksCompletedTodayCount - tasksCompletedYesterdayCount) /
              tasksCompletedYesterdayCount) *
              100
          )
        : 0;

    const habitsTrackedToday = timeManagementToday.length;
    const weeklyHabitGoal = 7;
    const habitCompletionRate = Math.round(
      (habitsTrackedToday / weeklyHabitGoal) * 100
    );

    const totalFocusMinutes = timeManagementToday.reduce((total, entry) => {
      const timeValue = parseInt(entry.data) || 0;
      return total + timeValue;
    }, 0);

    const focusHours = Math.floor(totalFocusMinutes / 60);
    const focusMinutes = totalFocusMinutes % 60;
    const dailyFocusGoal = 300;
    const focusCompletionRate = Math.round(
      (totalFocusMinutes / dailyFocusGoal) * 100
    );

    const totalProjects = allProjects.length;
    const onTrackProjects = allProjects.filter(
      (p) => p.progress >= 50 && p.progress < 90
    ).length;
    const atRiskProjects = allProjects.filter(
      (p) => p.progress >= 25 && p.progress < 50
    ).length;
    const delayedProjects = allProjects.filter((p) => p.progress < 25).length;
    const projectsDueCount = projectsDueThisWeek.length;

    const dashboardData = {
      stats: {
        tasksCompleted: {
          current: completedTasks,
          total: totalTasks,
          progress: taskCompletionRate,
          changeFromYesterday: `${
            taskChangePercentage >= 0 ? "+" : ""
          }${taskChangePercentage}%`,
        },
        habitsTracked: {
          current: habitsTrackedToday,
          total: weeklyHabitGoal,
          progress: habitCompletionRate,
          status: "On track for weekly goal",
        },
        focusTime: {
          hours: focusHours,
          minutes: focusMinutes,
          totalMinutes: totalFocusMinutes,
          progress: Math.min(focusCompletionRate, 100),
          dailyGoal: dailyFocusGoal,
          formatted: `${focusHours}h ${focusMinutes}m`,
        },
        projects: {
          total: totalProjects,
          onTrack: onTrackProjects,
          atRisk: atRiskProjects,
          delayed: delayedProjects,
          dueThisWeek: projectsDueCount,
        },
      },
      widgets: {
        todos: recentTodos.map((todo) => ({
          id: todo.id,
          task: todo.todo,
          completed: todo.status,
          createdAt: todo.createdAt,
          updatedAt: todo.updatedAt,
        })),
        timeEntries: recentTimeEntries.map((entry) => ({
          id: entry.id,
          text: entry.text,
          data: entry.data,
          completed: entry.completedAt,
          createdAt: entry.createdAt,
        })),
        projects: recentProjects.map((project) => ({
          id: project.id,
          name: project.projectName,
          deadline: project.deadline,
          progress: project.progress,
          createdAt: project.createdAt,
          status:
            project.progress >= 75
              ? "on-track"
              : project.progress >= 50
              ? "at-risk"
              : "delayed",
        })),
        goals: allGoals.map((goal) => ({
          id: goal.id,
          title: goal.goal,
          deadline: goal.deadline,
          progress: goal.progress,
          createdAt: goal.createdAt,
        })),
        notes: recentNotes.map((note) => ({
          id: note.id,
          title: note.title,
          content:
            note.notes.substring(0, 100) +
            (note.notes.length > 100 ? "..." : ""),
          calendar: note.calendar,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
        })),
        planner: recentPlannerTasks.map((task) => ({
          id: task.id,
          task: task.task,
          priority: task.priority,
          category: task.categories,
          deadline: task.deadline,
          date: task.date,
          createdAt: task.createdAt,
        })),
      },
      summary: {
        totalTodos: totalTasks,
        completedTodos: completedTasks,
        totalProjects: totalProjects,
        totalGoals: allGoals.length,
        totalNotes: recentNotes.length,
        focusTimeToday: `${focusHours}h ${focusMinutes}m`,
        productivity: Math.round(
          (taskCompletionRate +
            habitCompletionRate +
            Math.min(focusCompletionRate, 100)) /
            3
        ),
      },
    };
    console.log(dashboardData, "Dashboard data fetched successfully");
    res.status(200).json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error("Dashboard endpoint error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
      error: error.message,
    });
  }
});

app.listen(3000, () => console.log(3000));
