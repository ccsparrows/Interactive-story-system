import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const getStories = async () => {
  try {
    const response = await axios.get(`${API_URL}/stories`);
    return response.data;
  } catch (error) {
    console.error('Error fetching stories', error);
    return [];
  }
};

export const getStoryById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/stories/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching story details', error);
    return null;
  }
};

export const login = async (identifier, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, {
      identifier,
      password,
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: 'Login failed' };
  }
};

export const register = async (username, password, email) => {
  try {
    const response = await axios.post(`${API_URL}/register`, {
      username,
      password,
      email,
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: 'Registration failed' };
  }
};

export const createStory = async (storyData) => {
  try {
    const response = await axios.post(`${API_URL}/stories`, storyData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: 'Failed to create story' };
  }
};

export const updateStory = async (id, storyData) => {
  try {
    const response = await axios.put(`${API_URL}/stories/${id}`, storyData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: 'Failed to update story' };
  }
};

export const deleteStory = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/stories/${id}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: 'Failed to delete story' };
  }
};
