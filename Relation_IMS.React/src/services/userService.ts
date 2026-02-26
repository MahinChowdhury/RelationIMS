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
}

export interface UserUpdatePayload {
    Firstname: string;
    Lastname?: string;
    PhoneNumber: string;
    Email?: string;
    IsActive: boolean;
    Role: string;
}

// Fetch all users
export const getAllUsers = async (): Promise<UserDTO[]> => {
    const res = await api.get('/user');
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

// List all roles
export const getAllRoles = async (): Promise<RoleDTO[]> => {
    const res = await api.get('/user/roles');
    return res.data;
};
