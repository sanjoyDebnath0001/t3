const mongoose = require('mongoose');
const TransactionSchema = new mongoose.Schema({
	user:{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	account:{
		type:mongoose.Schema.Types.ObjectId,
		ref:'Account',
		required:[true,'Account is requtred for a transaction']
	},
	amount:{
		type:Number,
		required:[true,'Amount is required'],
		min:[0.01,'Amount must be a positive number']
	},
	type:{
		type:String,
		required:[true,'Transaction type is reqired'],
		enum:['income','expense'],
		trim:true
	},
	category:{
		type:String,
		trim: true,
		maxlength:[50,'Category cannot be more than 50 characters'],
		default:'uncategorized'
	},
	description:{
		type:String,
		trim:true,
		maxlength:[200,'Description cannot be more than 200 characters']
	},
	transactionDate:{
		type: Date,
		required: [true,'Transaction date is required'],
		default:Date.now
	}
},{
	timestamps:true
});
TransactionSchema.post('save',async function (doc,next) {
	try{
		const Account =mongoose.model('Account');
		const account =await Account.findById(doc.account);
		if(account){
			if(doc.type==='income'){
				account.currentBalance+= doc.amount;
			}else if(doc.type==='expense'){
				account.currentBalance-= doc.amount;
			}
			await account.save();
		}
		next();
	}catch(err){
		console.error('Error updating account balance after tranaction save:',err.message);
		next(err);
	}
});
module.exports=mongoose.model('Transaction',TransactionSchema);
