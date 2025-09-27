// controllers/authController.js
const supabase = require('../config/supabase');
const jwt = require('jsonwebtoken');

// Test database connection
exports.testConnection = async (req, res) => {
  try {
    console.log('Testing database connection...');
    const { data, error } = await supabase
      .from('User')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Database test failed:', error);
      return res.status(500).json({ 
        message: 'Database connection failed', 
        error: error.message,
        details: error
      });
    }
    
    console.log('Database test successful');
    return res.status(200).json({ 
      message: 'Database connection successful', 
      userCount: data?.length || 0 
    });
  } catch (err) {
    console.error('Database test error:', err);
    return res.status(500).json({ 
      message: 'Database test failed', 
      error: err.message 
    });
  }
};

// Create initial admin user (for setup only)
exports.createInitialAdmin = async (req, res) => {
  try {
    // Check if any users exist
    const { data: existingUsers, error: checkError } = await supabase
      .from('User')
      .select('id')
      .limit(1);
    
    if (checkError) throw checkError;
    
    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({ 
        message: 'Admin users already exist. This endpoint is only for initial setup.' 
      });
    }
    
    // Create initial admin
    const { data: user, error } = await supabase
      .from('User')
      .insert([
        {
          email: 'admin@gravitas.com'
          // Note: Your schema only has id, email, created_at columns
        }
      ])
      .select()
      // .single();
    
    if (error) throw error;
    
    const createdUser = user && user.length > 0 ? user[0] : user;
    return res.status(201).json({ 
      message: 'Initial admin user created successfully',
      user: { id: createdUser.id, email: createdUser.email, role: createdUser.role }
    });
  } catch (err) {
    console.error('createInitialAdmin error:', err);
    return res.status(500).json({ 
      message: 'Failed to create admin user', 
      error: err.message 
    });
  }
};

// View all users (admin only)
exports.viewUsers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('User')
      .select('id, email, role');

    if (error) {
      console.error('viewUsers supabase error:', error);
      return res.status(500).json({ message: 'Failed to fetch users', error: error.message || error });
    }

    return res.status(200).json({ users: data || [] });
  } catch (err) {
    console.error('viewUsers error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Login (Supabase) - admin only, respects UserStatus freeze if present
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  const bcrypt = require('bcrypt');

  console.log('Login attempt for email:', email);

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    console.log('Attempting database query for user:', email);
    const { data: user, error } = await supabase
      .from('User')
      .select('id, email, role, password')
      .eq('email', email)
      // .single();

    if (error) {
      console.error('loginUser supabase error:', error);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // If user was found in DB (check if array has results)
    if (user && user.length > 0) {
      const foundUser = user[0]; // Get the first (and should be only) user
      console.log('User found:', foundUser);
      
      // CRITICAL: Only users with role='admin' can access the admin portal
      if (!foundUser.role || foundUser.role !== 'admin') {
        console.log('Access denied - user role:', foundUser.role);
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
      }

      // Check if password matches the hashed password in database
      let isValidPassword = false;
      if (foundUser.password) {
        // If password is hashed (bcrypt), compare using bcrypt
        if (foundUser.password.startsWith('$2b$') || foundUser.password.startsWith('$2a$')) {
          isValidPassword = await bcrypt.compare(password, foundUser.password);
        } else {
          // If password is plain text, compare directly
          isValidPassword = password === foundUser.password;
        }
      }

      if (!isValidPassword) {
        console.log('Password validation failed for user:', email);
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      console.log('Admin login successful for:', foundUser.email);
      const tokenPayload = { id: foundUser.id, email: foundUser.email, role: foundUser.role };
      const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '1d' });

      return res.status(200).json({
        message: 'Login successful',
        frozen: false,
        accessToken,
        user: { id: foundUser.id, email: foundUser.email, role: foundUser.role }
      });
    }

    
    // default fallback
    return res.status(400).json({ message: 'Invalid credentials' });

  } catch (err) {
    console.error('loginUser error:', err);
    return res.status(500).json({ 
      message: 'Server error', 
      error: err.message,
      details: 'Database connection or query failed. Check server logs for details.'
    });
  }
};
