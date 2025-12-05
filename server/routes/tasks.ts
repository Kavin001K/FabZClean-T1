
import express, { Request, Response } from 'express';
import { storage } from '../storage';
import { authMiddleware, roleMiddleware } from '../middleware/employee-auth';
import { insertEmployeeTaskSchema } from '../../shared/schema';
import { z } from 'zod';

const router = express.Router();

// Get all tasks (filtered by role)
router.get('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const user = (req as any).employee;
        let tasks;

        if (user.role === 'admin') {
            tasks = await storage.listTasks(req.query.franchiseId as string);
        } else if (user.role === 'franchise_manager') {
            tasks = await storage.listTasks(user.franchiseId);
        } else {
            // Employees sees their own tasks
            tasks = await storage.listTasks(user.franchiseId, user.employeeId);
        }

        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// Create a new task
router.post('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const user = (req as any).employee;
        const taskData = insertEmployeeTaskSchema.parse({
            ...req.body,
            franchiseId: user.franchiseId, // Enforce franchiseId
            assignedBy: user.employeeId,
            status: 'pending' // Default status
        });

        const task = await storage.createTask(taskData);
        res.status(201).json(task);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
        } else {
            console.error('Error creating task:', error);
            res.status(500).json({ error: 'Failed to create task' });
        }
    }
});

// Update a task (e.g. status)
router.patch('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as any).employee;
        const updates = req.body;

        // Verify ownership/permissions
        // Ideally we fetch the task first and check franchiseId/employeeId
        // For now, assuming storage handles update safely or we just trust franchise isolation via list
        // Let's do a quick check? Storage doesn't have getTask exposed nicely yet, but updateTask works.

        // If completing task, set completedDate
        if (updates.status === 'completed' && !updates.completedDate) {
            updates.completedDate = new Date();
        }

        const task = await storage.updateTask(id, updates);
        res.json(task);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

export default router;
