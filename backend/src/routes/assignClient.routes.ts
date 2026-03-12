import router from "express";
import { assignServiceToClient ,acceptedAssignedService,acceptAssignedService  ,getAllAssignedServices ,getAssignDetails ,updateAssignedService ,deleteAssignedService, markRenewalAsPaid ,userAssignedServices } from "../conttrolers/assignServicec.conttlores";
import { verifyToken } from "../middleware/auth";
import {isAdmin} from "../middleware/rbac";

const assignClientRouter = router();

// Public route for accepting assigned services via token
assignClientRouter.post('/verify_token', acceptedAssignedService);
// Protected routes

assignClientRouter.post('/assign-service', verifyToken, isAdmin, assignServiceToClient);
assignClientRouter.patch('/accept-assigned-service/:id', verifyToken,  acceptAssignedService);
assignClientRouter.get('/assigned_services', verifyToken, getAllAssignedServices);
assignClientRouter.get('/assign_details/:client_id/:service_catalog_id', verifyToken, getAssignDetails);
assignClientRouter.put('/assigned_services/:id', verifyToken,isAdmin, updateAssignedService);
assignClientRouter.delete('/assigned_services/:id', verifyToken, isAdmin, deleteAssignedService);
assignClientRouter.patch('/assigned_services/:id/renewals/:renewal_id/pay', verifyToken, isAdmin, markRenewalAsPaid);




//user routes 
assignClientRouter.get('/assigned', verifyToken, userAssignedServices);








export default assignClientRouter;

