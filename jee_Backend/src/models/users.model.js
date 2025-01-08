const supabase = require('../config/supabaseClient');

const User = {
  async createUser(userData) {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          name: userData.name,
          phone: userData.phonenumber
        }
      }
    });
    if (error) throw error;
    return data;
  },

  async findByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    if (error) throw error;
    return data;
  },

  async googleSignIn() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.FRONTEND_URL}/auth/callback`
      }
    });
    if (error) throw error;
    return data;
  },

  async resetPassword(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
    });
    if (error) throw error;
    return data;
  },

  async updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
    return data;
  }
};

module.exports = {
  User
};
