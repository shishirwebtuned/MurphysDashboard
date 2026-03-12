import AssignService from "../models/assignService.routes";
import Setting from "../models/siteSetting.model";
import { Request ,Response } from "express";


export const getInvoiceControllers =  async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        console.log("Fetching invoice with ID:", id);   
        const  [ data , setting ] = await Promise.all([
            AssignService.findById(id).populate('client_id').populate('service_catalog_id'),
            Setting.findOne({}).select(' ')
        ]);
        if (!data) {
            return  res.status(404).json({
                success: false,
                message: "Invoice not found",
            });
        }
        res.status(200).json({
            success: true,
            message: "Invoice fetched successfully",
            data,
            setting
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: "Error fetching invoice",
            error: (err as Error).message,
        });
    }
};


export default getInvoiceControllers;






