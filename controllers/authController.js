const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User')

const register = async(req, res) => {
    try{

        const {name, email, password, phone, address, area} = req.body;

        if(!name || !email || !password){
            return res.status(400).json({
                message: "Name, email and password are required"
            })
        }

        const existingUser = await User.findOne({email});

        if(existingUser){
            return res.status(400).json({
                message: "Email already registerd"
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email, 
            password: hashedPassword,
            phone,
            address, 
            area
        });

        res.status(201).json({
            message: "Registration successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                area: user.area,
                role: user.role
            
            }
        });


    }catch(error){
        console.log( "Registration error: ", error);

        res.status(500).json({
            message: "Server error during registration",
            error: error.message
        })
    }
}

const login = async(req, res) => {
    try{

        const {email, password} = req.body;

        if( !email || !password){
            return res.status(400).json({
                message: "email and password are required"
            })
        }

        const user = await User.findOne({email});

        if(!user){
            return res.status(400).json({
                message: "Invalid Email or Password"
            })
        }

      if(!user.isActive){
        return res.status(401).json({
            message: "Your account has been deactivated"
        })
      }

      const isMatch = await bcrypt.compare(password, user.password)

      if(!isMatch){
        return res.status(401).json({
            message: "Invalid email or password"
        })
      };

      const token = jwt.sign(
        {
            id: user.id,
            role: user.role,
        }, 
        process.env.JWT_SECRET,
        {
            expiresIn: '3d',
        }
      );

        res.status(201).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                area: user.area,
                role: user.role,
                isActive: user.isActive
            },
        });

        console.log("Logged In")


    }catch(error){
        console.log( "Registration error: ", error);

        res.status(500).json({
            message: "Server error during registration",
            error: error.message
        })
    }
}

module.exports = {
    register,
    login
}