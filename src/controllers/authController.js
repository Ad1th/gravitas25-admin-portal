// View all users
exports.viewUsers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('User')
      .select('id, email'); //add created_at column
    if (error) throw error;
    res.status(200).json({ users: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');

// // Generate Tokens
// const generateAccessToken = (user) => {
//   return jwt.sign(
//     { id: user.id, email: user.email, role: user.role },
//     process.env.JWT_SECRET,
//     { expiresIn: '15m' }
//   );
// };

// const generateRefreshToken = async (user) => {
//   const refreshToken = jwt.sign(
//     { id: user.id, email: user.email },
//     process.env.JWT_REFRESH_SECRET,
//     { expiresIn: '7d' }
//   );

//   // Store refresh token in DB
//   await prisma.refreshToken.create({
//     data: {
//       token: refreshToken,
//       userId: user.id,
//     },
//   });

//   return refreshToken;
// };

// ---------------------- Controllers ----------------------

// Signup (Supabase)
exports.signupUser = async (req, res) => {
  const { email, password, username } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Check if user exists
    const { data: existingUser, error: findError } = await supabase
      .from('User')
      .select('id')
      .eq('email', email)
      .single();
    if (existingUser)
      return res.status(400).json({ message: 'User already exists' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const { data, error } = await supabase
      .from('User')
      .insert([
        {
          email: email,
          password: hashedPassword,
          username: username,
          // is_admin: !!is_admin,
        },
      ])
      .select();

    if (error) throw error;

    // Generate JWT
    const accessToken = jwt.sign(
      { id: data[0].id, email: data[0].email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      accessToken,
      user: {
        id: data[0].id,
        email: data[0].email,
        // is_admin: data[0].is_admin,
      },
    });
  } catch (err) {
    console.error(err);
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Login (Supabase)
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Find user
    const { data: user, error } = await supabase
      .from('User')
      .select('*')
      .eq('email', email)
      .single();
    
    console.log('Login attempt for:', email);
    console.log('User found:', user ? 'Yes' : 'No');
    console.log('Supabase error:', error);
    
    if (error && error.code === 'PGRST116') {
      // No rows found
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    if (error || !user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);
    
    if (!isMatch)
      return res.status(400).json({ message: 'Invalid credentials' });

    // Generate JWT
    const accessToken = jwt.sign(
      { id: user.id, email: user.email  },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: 'Login successful',
      accessToken,
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// No refresh token logic for now (JWT only)

// No logout logic for now (JWT only)
