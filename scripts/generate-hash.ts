import bcrypt from 'bcryptjs';

// Sample user data
const userData = {
  name: 'taja',
  email: 'taja@tuvugane.com',
  password: 'password123' // Sample password
};

async function generateHash() {
  try {
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    
    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    console.log('User Information:');
    console.log('-----------------');
    console.log(`Name: ${userData.name}`);
    console.log(`Email: ${userData.email}`);
    console.log(`Plain Password: ${userData.password}`);
    console.log(`Hashed Password: ${hashedPassword}`);
    console.log('\nSQL Insert Statement:');
    console.log('-----------------');
    console.log(`INSERT INTO SuperAdmins (name, email, password, is_verified) VALUES ('${userData.name}', '${userData.email}', '${hashedPassword}', 1);`);
  } catch (error) {
    console.error('Error generating hash:', error);
  }
}

generateHash(); 