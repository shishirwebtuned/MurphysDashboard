import mongoose from "mongoose";
import { Request, Response } from "express";

export const clearAllCollections = async (_req: Request, res: Response) => {
  try {
    const collections = mongoose.connection.collections;
    const summary: Record<string, number> = {};

    for (const key in collections) {
      const collection = collections[key];

      const result = await collection.deleteMany({});
      summary[key] = result.deletedCount ?? 0;
    }

    return res.status(200).json({
      message: "All data cleared successfully!",
      summary,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to clear database",
      error: (error as Error).message,
    });
  }
};
