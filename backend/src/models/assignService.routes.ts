import mongoose from 'mongoose';


const assignServiceSchema = new mongoose.Schema({
    invoice_id:{ type:String, required:true },
    client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
    assign_by:{ ennum: ['admin', 'user'], type: String , default: 'admin' },
    client_name: { type: String, required: true },
    service_catalog_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    service_name: { type: String, required: true },
    status: { type: String, enum: ['active', 'expired', 'cancelled' ,'paused'], default: 'active' },
    note: { type: String },
    price: { type: String,  },
    cycle: { type: String, enum: ['annual', 'monthly', 'none','one-time'], required: true },
    start_date: { type: Date,  default: Date.now },
    end_date: { type: Date,  },
    renewal_dates: [{
        label: { type: String,  },
        date: { type: Date,  },
        price: { type: Number,  },
        haspaid: { type: Boolean, default: false },
    }],
    auto_invoice: { type: Boolean, default: false },
    isaccepted: { type: String,  enum: ["accepted", "rejected" ,"pending" , 'completed' ,'running' ], default: "pending" },
    email: { type: String, required: true },
    
}, { timestamps: true });


const AssignService = mongoose.model("AssignService", assignServiceSchema);
export default AssignService;