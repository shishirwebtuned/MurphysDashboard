const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://sushilwebtunedstudio_db_user:oWob6p1sTxKaklNM@cluster0.fsr86ta.mongodb.net/murphys_client?retryWrites=true&w=majority')
    .then(async () => {
        console.log('Connected');
        const cols = await mongoose.connection.db.listCollections().toArray();

        // Look for collections for billing
        const cNames = cols.map(c => c.name);
        console.log(cNames);

        if (cNames.includes('billinghistories')) {
            const billing = mongoose.connection.db.collection('billinghistories');
            console.log("billing histories count:", await billing.countDocuments({}));
            const latest = await billing.find().sort({ _id: -1 }).limit(1).toArray();
            console.dir(latest, { depth: null });
        } else {
            console.log("no billinghistories coll");
        }

        process.exit(0);
    }).catch(e => {
        console.error(e);
        process.exit(1);
    });
