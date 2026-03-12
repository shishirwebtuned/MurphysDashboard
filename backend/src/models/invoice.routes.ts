import {getInvoiceControllers} from "../conttrolers/invoice.contlorres"
import Router from "express";

const invoiceRouter = Router();

invoiceRouter.get('/:id', getInvoiceControllers);

export default invoiceRouter;
