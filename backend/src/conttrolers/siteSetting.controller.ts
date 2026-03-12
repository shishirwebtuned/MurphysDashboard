import { Request, Response } from "express";
import SiteSetting from "../models/siteSetting.model";

export const getSiteSettings = async (req: Request, res: Response) => {
    try {
        let settings = await SiteSetting.findOne();
        if (!settings) {
            settings = await SiteSetting.create({});
        }
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: "Error fetching site settings", error });
    }
};

export const updateSiteSettings = async (req: Request, res: Response) => {
    try {
        const { appName, description, contactEmail, contactPhone, address, footerText, currency, socialLinks, maintenanceMode, publicid } = req.body;
        
        let parsedSocialLinks = socialLinks;
        if (typeof socialLinks === 'string') {
            try {
                parsedSocialLinks = JSON.parse(socialLinks);
            } catch (e) {
                parsedSocialLinks = {};
            }
        }
        
        let settings = await SiteSetting.findOne();
        
        if (!settings) {
            settings = new SiteSetting({
                appName, description, logo: req.body.logo, contactEmail, contactPhone, address, footerText, currency, socialLinks: parsedSocialLinks, maintenanceMode, publicid: req.body.public_id
            });
        } else {
            settings.appName = appName ?? settings.appName;
            settings.description = description ?? settings.description;
            settings.logo = req.body.logo ?? settings.logo;
            settings.contactEmail = contactEmail ?? settings.contactEmail;
            settings.contactPhone = contactPhone ?? settings.contactPhone;
            settings.address = address ?? settings.address;
            settings.footerText = footerText ?? settings.footerText;
            settings.currency = currency ?? settings.currency;
            settings.socialLinks = parsedSocialLinks ?? settings.socialLinks;
            settings.maintenanceMode = maintenanceMode ?? settings.maintenanceMode;
            settings.publicid = req.body.public_id ?? settings.publicid;
        }

        await settings.save();
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: "Error updating site settings", error });
    }
};
