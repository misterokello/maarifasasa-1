
export interface AdminSignupData {
  email: string;
  password: string;
  confirmPassword: string;
  secret: string;
}

export const validateSignupForm = (data: AdminSignupData): string | null => {
  if (!data.email || !data.password || !data.confirmPassword) {
    return "All fields are required";
  }
  
  if (data.password !== data.confirmPassword) {
    return "Passwords do not match";
  }
  
  if (data.password.length < 8) {
    return "Password must be at least 8 characters long";
  }
  
  return null;
};
