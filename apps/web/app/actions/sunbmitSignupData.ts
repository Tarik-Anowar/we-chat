'use server';
import bcrypt from 'bcryptjs';
import User from '../model/userModel';
import connectToDatabase from '../lib/db';
interface SignUpData {
  name: string;
  username: string;
  password: string;
  imageUrl?: string; 
}

export default async function signUpHandler({ name, username, password, imageUrl }: SignUpData) {
  try {

    const newUser = new User({
      name,
      username,
      password: password,
      image: imageUrl || '', 
    });
    await connectToDatabase();
    const user = await newUser.save();

    console.log(`User created with ID: ${user._id}`);
    return { ok: true };
  } catch (err) {
    console.error('Error saving user:', err);
    return { ok: false, error: err + '... Error saving user'};
  }
}
