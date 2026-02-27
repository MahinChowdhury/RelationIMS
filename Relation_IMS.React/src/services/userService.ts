import api from './api';

export interface UserDTO {
    Id: number;
    Firstname: string;
    Lastname?: string;
    Email: string;
    PhoneNumber: string;
    IsActive: boolean;
    PreferredLanguage: string;
    Role: string;
}

export interface RoleDTO {
    Id: number;
    Name: string;
    Description?: string;
}

export interface AdminCreateUserPayload {
    Firstname: string;
    Lastname?: string;
    PhoneNumber: string;
    Email?: string;
    Password: string;
    Role: string;
    Address?: string;
    CurrentSalary: number;
}

export interface UserUpdatePayload {
    Firstname: string;
    Lastname?: string;
    PhoneNumber: string;
    Email?: string;
    IsActive: boolean;
    Role: string;
    CurrentSalary?: number;
}

export interface UserProfileDTO {
    Id: number;
    Firstname: string;
    Lastname?: string;
    Email: string;
    PhoneNumber: string;
    IsActive: boolean;
    PreferredLanguage: string;
    Role: string;
    Address?: string;
    CurrentSalary: number;
    JoinDate: string;
}

export interface SalaryRecordDTO {
    Id: number;
    UserId: number;
    Month: string;
    Year: number;
    Amount: number;
    Status: string;
    PaidDate?: string;
    Notes?: string;
    CreatedAt: string;
}

export interface CreateSalaryPayload {
    UserId: number;
    Month: string;
    Year: number;
    Amount: number;
    Notes?: string;
}

export interface UpdateUserProfilePayload {
    Firstname?: string;
    Lastname?: string;
    Email?: string;
    PhoneNumber?: string;
    Address?: string;
    CurrentSalary: number;
}

export interface ChangePasswordPayload {
    CurrentPassword: string;
    NewPassword: string;
}

// Fetch all users with optional filters
export const getAllUsers = async (role?: string, isActive?: boolean): Promise<UserDTO[]> => {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (isActive !== undefined) params.append('isActive', isActive.toString());
    
    const queryString = params.toString();
    const url = queryString ? `/user?${queryString}` : '/user';
    const res = await api.get(url);
    return res.data;
};

// Create a new user (admin)
export const createUser = async (data: AdminCreateUserPayload): Promise<UserDTO> => {
    const res = await api.post('/user', data);
    return res.data;
};

// Update a user
export const updateUser = async (id: number, data: UserUpdatePayload): Promise<UserDTO> => {
    const res = await api.put(`/user/${id}`, data);
    return res.data;
};

// Delete (deactivate) a user
export const deleteUser = async (id: number): Promise<void> => {
    await api.delete(`/user/${id}`);
};

// Fetch a single user by ID (basic info from /user endpoint)
export const getUser = async (id: number): Promise<UserDTO> => {
    const res = await api.get(`/user/${id}`);
    return res.data;
};

// List all roles
export const getAllRoles = async (): Promise<RoleDTO[]> => {
    const res = await api.get('/user/roles');
    return res.data;
};

// ===== User Profile APIs =====

// Get user profile (includes address, salary, joinDate)
export const getUserProfile = async (userId: number): Promise<UserProfileDTO> => {
    const res = await api.get(`/userprofile/${userId}`);
    return res.data;
};

// Update user profile (address, salary)
export const updateUserProfile = async (userId: number, data: UpdateUserProfilePayload): Promise<UserProfileDTO> => {
    const res = await api.put(`/userprofile/${userId}`, data);
    return res.data;
};

// ===== Salary APIs =====

// Get salary records for a user
export const getSalaryRecords = async (userId: number): Promise<SalaryRecordDTO[]> => {
    const res = await api.get(`/userprofile/${userId}/salary`);
    return res.data;
};

// Add a salary payment
export const addSalaryRecord = async (userId: number, data: CreateSalaryPayload): Promise<SalaryRecordDTO> => {
    const res = await api.post(`/userprofile/${userId}/salary`, data);
    return res.data;
};

// Delete a salary record
export const deleteSalaryRecord = async (id: number): Promise<void> => {
    await api.delete(`/userprofile/salary/${id}`);
};

// ===== Change Password API =====

export const changePassword = async (userId: number, data: ChangePasswordPayload): Promise<{ message: string }> => {
    const res = await api.put(`/userprofile/${userId}/change-password`, data);
    return res.data;
};
