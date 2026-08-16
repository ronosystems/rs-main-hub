const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 }
});

// Increment counter for a specific company
counterSchema.statics.increment = async function(companyId) {
    const counter = await this.findOneAndUpdate(
        { _id: `sale_${companyId}` },
        { $inc: { seq: 1 } },
        { 
            new: true, 
            upsert: true,
            setDefaultsOnInsert: true
        }
    );
    return counter.seq;
};

// Get current sequence for a company
counterSchema.statics.getCurrent = async function(companyId) {
    const counter = await this.findOne({ _id: `sale_${companyId}` });
    return counter ? counter.seq : 0;
};

// Reset sequence for a company
counterSchema.statics.reset = async function(companyId) {
    return await this.findOneAndUpdate(
        { _id: `sale_${companyId}` },
        { $set: { seq: 0 } },
        { 
            new: true, 
            upsert: true 
        }
    );
};

module.exports = mongoose.model('Counter', counterSchema);