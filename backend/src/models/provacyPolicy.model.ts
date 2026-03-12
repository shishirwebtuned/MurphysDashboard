import mongoose from "mongoose";

const provacyPolicySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
});

const provacyPolicyModel = mongoose.model("ProvacyPolicy", provacyPolicySchema);

export default provacyPolicyModel;
