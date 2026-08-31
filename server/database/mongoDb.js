import mongoose from "mongoose"

const connectToDB = async() => {
    try {
        const {connection} = await mongoose.connect(
             'mongodb+srv://shreyashashidhara26_db_user:Asia0987@cluster0.ddkr8bc.mongodb.net/bookMyShow?appName=Cluster0'
        )
        if (connection) {
            console.log(`Connected to database: ${connection.host}`);
        }
    } catch(e) {
        console.log('Error connecting');
    }
}

export default connectToDB;