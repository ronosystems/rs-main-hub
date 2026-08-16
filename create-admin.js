const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    const db = mongoose.connection.db;
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('Kiprono@1997', salt);
    
    return db.collection('users').updateOne(
      { email: 'ronosystems@gmail.com' },
      {
        $set: {
          name: 'Rono Systems',
          email: 'ronosystems@gmail.com',
          password: hash,
          role: 'super_admin',
          isActive: true,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
  })
  .then(() => {
    console.log('✅ Admin user created/updated!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
