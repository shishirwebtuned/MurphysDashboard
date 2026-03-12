import Payments from '../models/payment.model';
import { Request, Response } from 'express';

export const createPayment = async (req: Request, res: Response) => {
  try {
    const body = req.body as any;
    const payment = new Payments(body);
    await payment.save();
    res.status(201).json({ data: payment, message: "Payment method created successfully" });
  }
    catch (error) {
    res.status(400).json({ message: (error as Error).message });
    }
};

export const getPayments = async (req: Request, res: Response) => {
  try {
    const payments = await Payments.find();
    res.status(200).json({ data: payments });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};  
export const getPaymentById = async (req: Request, res: Response) => {
  try {
    const payment = await Payments.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: "Payment method not found" });
    }
    res.status(200).json(payment);
  }
    catch (error) {
    res.status(500).json({ message: (error as Error).message });
    }
};
export const updatePayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const payment = await Payments
        .findByIdAndUpdate(id, updateData, { new: true });
    if (!payment) {
      return res.status(404).json({ message: "Payment method not found" });
    }   
    res.status(200).json({ data: payment, message: "Payment method updated successfully" });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};
export const deletePayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payment = await Payments.findByIdAndDelete(id);
    if (!payment) {
        return res.status(404).json({ message: "Payment method not found" });
    }
    res.status(200).json({ data: payment, message: "Payment method deleted successfully" });
  }
    catch (error) {
    res.status(400).json({ message: (error as Error).message });
    }
};


export const changePaymentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; 
    const payment = await Payments.findById(id);
    if (!payment) {
      return res.status(404).json({ message: "Payment method not found" });
    }
    payment.status = status;
    await payment.save();
    res.status(200).json({ data: payment, message: "Payment method status changed successfully" });
  }
  catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};
