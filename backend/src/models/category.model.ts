import mongoose from 'mongoose';


const categorySchema= new  mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String , required: true},
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });   
const Category = mongoose.model("Category", categorySchema);

export default Category;
     

    
