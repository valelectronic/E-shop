// for registering a user
export const SIGNUP = async(req,res)=>{
res.send("sign up successfully")
}

// for logging in a user
export const  LOGIN = async(req,res)=>{
res.send("log in successfully")
}

// for logging out a user
export const LOGOUT = async(req,res)=>{
res.send("log out successfully")
}