const API_URL = import.meta.env.VITE_BACKEND_URL + "/api/auth";

export const authService = {
  signup: async (name, email, password, role = "user") => {
    try {
      const response = await fetch(`${API_URL}/register`, { /* Backend ko request bhejta hai*/
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
        }),
      });

      const data = await response.json(); /* Backend ka response receive karta hai*/

      if (!response.ok) {
        throw new Error(data.message || "Signup failed");
      }

      if (data.data?.token) {
        //Login info save hota hai browser me
        localStorage.setItem("authToken", data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data.user));
      }

      return { success: true, data: data.data };
    } catch (error) {
      console.error("Signup error:", error);
      return { success: false, error: error.message || "Network error. Please check if backend is running." };
    }
  },

  login: async (email, password, role = "user") => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Check if 2FA is required
      if (data.requiresTwoFactor) {
        return { 
          success: true, 
          requiresTwoFactor: true,
          needs2FASetup: data.needs2FASetup || false,
          setupToken: data.data?.setupToken,
          userId: data.data?.userId,
          email: data.data?.email 
        };
      }

      // Normal login flow
      if (data.data?.token) {
        localStorage.setItem("authToken", data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data.user));
      }

      return { success: true, data: data.data };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: error.message || "Network error. Please check if backend is running." };
    }
  },

  logout: () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
  },

  getStoredUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  getToken: () => {
    return localStorage.getItem("authToken");
  },

  isAuthenticated: () => {
    return !!localStorage.getItem("authToken");
  },
};