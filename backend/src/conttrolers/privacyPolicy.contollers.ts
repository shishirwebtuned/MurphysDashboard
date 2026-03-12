import provacyPolicyModel from "../models/provacyPolicy.model";
import { Request, Response } from 'express';


export const getPrivacyPolicy = async (req: Request, res: Response) => {
    const { title } = req.query;
    try {
        const policy = await provacyPolicyModel.findOne({ title: title as string });
        if (!policy) {
            return res.status(404).json({ message: "Privacy policy not found" });
        }
        return res.status(200).json(policy);
    } catch (error) {
        console.error("Error fetching privacy policy:", error);
        return res.status(500).json({ message: "Failed to fetch privacy policy" });
    }
};




export const createAndUpdatePrivacyPolicy = async (req: Request, res: Response) => {
    try {
        const { title, content } = req.body;
        let policy = await provacyPolicyModel.findOne({ title: title as string });
        if (policy) {
            policy.title = title;
            policy.content = content;
            await policy.save();
            return res.status(200).json(policy);
        } else {
            policy = new provacyPolicyModel({ title, content });
            await policy.save();
            return res.status(201).json(policy);
        }
    } catch (error) {
        console.error("Error creating or updating privacy policy:", error);
        return res.status(500).json({ message: "Failed to create or update privacy policy" });
    }
};



export default {
    getPrivacyPolicy,
    createAndUpdatePrivacyPolicy
}

