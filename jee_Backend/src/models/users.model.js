const { v4 } = require("uuid");
const supabase = require("../config/supabaseClient");

const userSchema = {
  id: String,
  name: String,
  email: String,
  phonenumber: String,
  password: String,
  active: Boolean,
  created_at: String,
  updated_at: String
};

const User = {
  async create(userData) {
    const { data, error } = await supabase
      .from('publics')
      .insert([{
        id: v4(),
        ...userData,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;
    return data[0];
  },

  async findOne(query) {
    const { data, error } = await supabase
      .from('publics')
      .select('*')
      .match(query)
      .single();

    if (error) throw error;
    return data;
  },

  async findById(id) {
    const { data, error } = await supabase
      .from('publics')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async update(id, updateData) {
    const { data, error } = await supabase
      .from('publics')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) throw error;
    return data[0];
  }
};

module.exports = {
  User,
  userSchema
};
