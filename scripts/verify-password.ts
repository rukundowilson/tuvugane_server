import bcrypt from 'bcryptjs';

// Sample login attempt
const loginAttempt = {
  email: 'taja@tuvugane.com',
  password: 'password123' // The password to verify
};

// Hashed password from database (updated hash)
const storedHash = '$2b$10$i7cv4whXhPNI.9OOS8KGm.JRywucpYKsx1odYZWCpkSjm603hye0K';

async function verifyPassword() {
  try {
    // Compare password with stored hash
    const isMatch = await bcrypt.compare(loginAttempt.password, storedHash);
    
    console.log('Password Verification:');
    console.log('-----------------');
    console.log(`Email: ${loginAttempt.email}`);
    console.log(`Password entered: ${loginAttempt.password}`);
    console.log(`Stored hash: ${storedHash}`);
    console.log(`Password matches: ${isMatch ? 'YES ✅' : 'NO ❌'}`);
    
    if (isMatch) {
      console.log('\nAuthentication successful! User can be logged in.');
    } else {
      console.log('\nAuthentication failed! Incorrect password.');
    }
  } catch (error) {
    console.error('Error verifying password:', error);
  }
}

verifyPassword(); 