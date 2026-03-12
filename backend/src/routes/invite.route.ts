import { Router } from 'express';
import { sendInvite, getInvites ,changeInviteStatus, deleteInvite ,inviteAgain ,updateInvite ,getinvitebyemail ,verifyInviteToken} from '../conttrolers/inivite.controllers';
import { verifyToken } from '../middleware/auth';


const inviterouter = Router();

// Public route for verifying invite tokens
inviterouter.post('/invite/verify-token', verifyInviteToken);

inviterouter.post('/send-invite',  sendInvite);
inviterouter.get('/invites', getInvites);
inviterouter.post('/invite/update-status', changeInviteStatus);
inviterouter.delete('/invites/:id', deleteInvite);
inviterouter.post('/resend-invite', inviteAgain);
inviterouter.put('/invites/:id', updateInvite);
inviterouter.get('/invite/users',verifyToken ,  getinvitebyemail);

export default  inviterouter;