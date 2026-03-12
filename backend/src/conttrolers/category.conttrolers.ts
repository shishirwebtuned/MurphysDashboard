import  Category  from '../models/category.model';
import { Request, Response } from 'express';
import Service from '../models/service.model';

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name || !description) {
      return res.status(400).json({ message: 'Name and description are required' });
    }
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(409).json({ message: 'Category already exists' });
    }
    const category = new Category({ name, description });
    await category.save();
    res.status(201).json({ data: category, message: 'Category created successfully' });
  }
    catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const getCategories = async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
  try {

    const [categories, totalCount] = await Promise.all([
      Category.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
      Category.countDocuments()
    ]);
    res.status(200).json({ data: categories,
        pagination: {
            total: totalCount,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit),
        },
         message: 'Categories retrieved successfully' });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json({ data: category, message: 'Category retrieved successfully' });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const category = await Category.findByIdAndUpdate(
        id,
        { name, description },
        { new: true }
    );
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json({ data: category, message: 'Category updated successfully' });
  }
    catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
}
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const inviteSchema = await Service.findOne({ categoryId: id });
    if (inviteSchema) {
      return res.status(400).json({ message: 'Cannot delete category with associated services' });
    }
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json({ data: category, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const updateCategorystatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const categoryData = await Category.findById(id);
    if (!categoryData) {
      return res.status(404).json({ message: 'Category not found' });
    }
     const newStatus = categoryData.status === 'active' ? 'inactive' : 'active';

    const status = newStatus;

    const category = await Category.findByIdAndUpdate(
        id,
        { status },
        { new: true }
    );
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json({ data: category, message: 'Category status updated successfully' });
  }
    catch (error) {
    res.status(400).json({ message: (error as Error).message });
    }
};
