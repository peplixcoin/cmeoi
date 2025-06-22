const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

exports.signIn = async (req, res) => {
  const { Username, Password } = req.body;

  try {
    const user = await User.findOne({ Username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(Password, user.Password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ token, userId: user._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user details by username
exports.getUserDetails = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ Username: username }).select('address mobile_no role');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      address: user.address || "No address set",
      mobile_no: user.mobile_no || "No mobile number set",
      role: user.role,
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Configure nodemailer with Google OAuth2
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.GMAIL_USER,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    accessToken: process.env.GOOGLE_ACCESS_TOKEN,
  },
});

// Generate random 10-digit alphanumeric password
function generateRandomPassword() {
  return crypto.randomBytes(5).toString('hex').substring(0, 10);
}

exports.forgotPassword = async (req, res) => {
  const { Username, email, mobile_no } = req.body;

  try {
    // Find user by username, email, and mobile number
    const user = await User.findOne({ 
      Username, 
      email, 
      mobile_no 
    });

    if (!user) {
      return res.status(404).json({ 
        message: 'No user found with the provided credentials' 
      });
    }

    // Check if the user is a main member (role: 'member' or 'guest')
    if (user.role === 'family') {
      return res.status(403).json({ 
        message: 'Family members cannot reset password' 
      });
    }

    // Generate new password and hash it
    const newPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user's password in database
    user.Password = hashedPassword;
    await user.save();

    // Send email with new password
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Your New Password for OI App',
      text: `Hi ${user.Name}!\n\nYour new password is: ${newPassword}\n\nPlease use this password for Login.`,
      html: `
        <div>
          <h2>Password Reset</h2>
          <p>Hi <strong>${user.Name}</strong>!</p>
          <p>Your new password is: <strong>${newPassword}</strong></p>
          <p>Please use this password for Login.</p>
          <p>Please save this password or save this email for future Login.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ 
      message: 'New password has been sent to your email' 
    });
  } catch (error) {
    console.error('Error in forgot password:', error);
    res.status(500).json({ 
      message: 'Error processing password reset' 
    });
  }
};

// Add to userController.js
exports.addFamilyMember = async (req, res) => {
  try {
    const { username, relation, name, password, mainUsername } = req.body;

    // Verify the main user exists and has the correct role
    const mainUser = await User.findOne({ Username: mainUsername });
    if (!mainUser) {
      return res.status(404).json({ message: 'Main user not found' });
    }

    // Check if the user is a main member (role: 'member' or 'guest')
    if (mainUser.role === 'family') {
      return res.status(403).json({ message: 'Only main members can add family members' });
    }

    // Check if family member already exists
    const existingMember = await User.findOne({ Username: username });
    if (existingMember) {
      return res.status(400).json({ message: 'Family member already exists' });
    }

    // Validate password
    if (!password) {
      return res.status(400).json({ message: 'Password is required for family member' });
    }

    // Check if the new password matches the main user's password
    const isSamePassword = await bcrypt.compare(password, mainUser.Password);
    if (isSamePassword) {
      return res.status(400).json({ message: 'Family member password cannot be the same as the main user\'s password' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new family member user
    const newMember = new User({
      Username: username,
      Name: mainUser.Name,
      Password: hashedPassword, // Use the provided hashed password
      mobile_no: mainUser.mobile_no,
      email: mainUser.email,
      address: mainUser.address,
      role: 'family', // Set role as 'family' for the new member
      family: [], // Family members cannot have their own family array
      service: mainUser.service,
      faculty: mainUser.faculty,
    });

    await newMember.save();

    // Add to main user's family array
    mainUser.family.push({
      username,
      relation,
    });

    await mainUser.save();

    res.status(201).json({
      username,
      relation,
      name: mainUser.Name, // Use mainUser's name as per your logic
    });
  } catch (error) {
    console.error('Error adding family member:', error);
    res.status(500).json({ message: 'Error adding family member' });
  }
};

// Add to get family members
exports.getFamilyMembers = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ Username: username });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get details for each family member
    const familyMembers = await Promise.all(
      user.family.map(async (member) => {
        const familyUser = await User.findOne({ Username: member.username });
        return {
          username: member.username,
          relation: member.relation,
          name: familyUser ? familyUser.Name : 'Unknown'
        };
      })
    );

    res.status(200).json(familyMembers);
  } catch (error) {
    console.error('Error fetching family members:', error);
    res.status(500).json({ message: 'Error fetching family members' });
  }
};

exports.deleteFamilyMember = async (req, res) => {
  try {
    const { familyUsername } = req.params;
    const mainUsername = req.body.mainUsername; // Expect mainUsername in the request body

    // Verify the main user exists
    const mainUser = await User.findOne({ Username: mainUsername });
    if (!mainUser) {
      return res.status(404).json({ message: 'Main user not found' });
    }

    // Check if the family member exists in the main user's family array
    const familyMemberIndex = mainUser.family.findIndex(member => member.username === familyUsername);
    if (familyMemberIndex === -1) {
      return res.status(404).json({ message: 'Family member not found in user\'s family' });
    }

    // Remove the family member from the main user's family array
    mainUser.family.splice(familyMemberIndex, 1);
    await mainUser.save();

    // Delete the family member from the User collection
    await User.deleteOne({ Username: familyUsername });

    res.status(200).json({ message: 'Family member deleted successfully' });
  } catch (error) {
    console.error('Error deleting family member:', error);
    res.status(500).json({ message: 'Error deleting family member' });
  }
};