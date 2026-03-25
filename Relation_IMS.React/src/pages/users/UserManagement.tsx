import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import AddUserModal from './AddUserModal';
import EditUserModal from './EditUserModal';
import DeleteUserModal from './DeleteUserModal';
import { getAllUsers, deleteUser, getAllRoles, type UserDTO, type RoleDTO } from '../../services/userService';

export default function UserManagement() {
    const { t } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [roles, setRoles] = useState<RoleDTO[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<UserDTO | null>(null);
    const [editingUser, setEditingUser] = useState<UserDTO | null>(null);
    const [users, setUsers] = useState<UserDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const role = roleFilter || undefined;
            const isActive = statusFilter === '' ? undefined : statusFilter === 'active';
            const data = await getAllUsers(role, isActive);
            setUsers(data);
            setError('');
        } catch {
            setError('Failed to load users.');
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const data = await getAllRoles();
            setRoles(data);
        } catch {
            console.error('Failed to load roles.');
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [roleFilter, statusFilter]);

    const handleDeleteUser = (user: UserDTO) => {
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        try {
            await deleteUser(userToDelete.Id);
            setIsDeleteModalOpen(false);
            setUserToDelete(null);
            await fetchUsers();
        } catch {
            alert('Failed to delete user.');
        }
    };

    const handleEditUser = (user: UserDTO) => {
        setEditingUser(user);
        setIsEditModalOpen(true);
    };

    const handleUserAdded = () => fetchUsers();
    const handleUserUpdated = () => {
        fetchUsers();
        setIsEditModalOpen(false);
        setEditingUser(null);
    };

    const getRoleIcon = (role: string): { icon: string; color: string } => {
        switch (role) {
            case 'Owner': return { icon: 'shield_person', color: 'text-purple-500' };
            case 'Head Manager': return { icon: 'supervised_user_circle', color: 'text-blue-500' };
            case 'Shop Manager': return { icon: 'supervisor_account', color: 'text-teal-500' };
            case 'Salesman': return { icon: 'badge', color: 'text-orange-500' };
            default: return { icon: 'person', color: 'text-gray-500' };
        }
    };

    const getStatusStyles = (isActive: boolean) => isActive
        ? 'bg-green-100/80 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800/30'
        : 'bg-gray-100/80 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400 border-gray-200 dark:border-gray-700';

    const getStatusDotColor = (isActive: boolean) => isActive
        ? 'bg-green-600 dark:bg-green-400 animate-pulse'
        : 'bg-gray-400 dark:bg-gray-500';

    const filteredUsers = users.filter((u: UserDTO) => {
        const q = searchQuery.toLowerCase();
        const fullName = `${u.Firstname} ${u.Lastname || ''}`.toLowerCase();
        return fullName.includes(q) || u.PhoneNumber.includes(q) || u.Role.toLowerCase().includes(q);
    });

    const totalActive = users.filter((u: UserDTO) => u.IsActive).length;
    const totalInactive = users.filter((u: UserDTO) => !u.IsActive).length;

    return (
        <div className="container mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <nav aria-label="Breadcrumb" className="flex mb-1">
                        <ol className="inline-flex items-center space-x-1 md:space-x-2">
                            <li className="inline-flex items-center">
                                <Link to="/" className="inline-flex items-center text-xs font-medium text-text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-white transition-colors">Home</Link>
                            </li>
                            <li>
                                <div className="flex items-center">
                                    <span className="material-symbols-outlined text-text-secondary text-[16px]">chevron_right</span>
                                    <span className="ms-1 text-xs font-bold text-text-main dark:text-white">{t.nav.userManagement}</span>
                                </div>
                            </li>
                        </ol>
                    </nav>
                    <h1 className="text-xl md:text-2xl font-extrabold text-text-main dark:text-white tracking-tight">{t.nav.userManagement}</h1>
                </div>
            </div>

            {/* Stats Cards */}
            < div className="grid grid-cols-1 md:grid-cols-3 gap-6" >
                <div className="glass-panel p-5 rounded-xl border border-white/60 dark:border-[var(--color-surface-dark-border)] shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-text-secondary uppercase mb-1">Total Users</p>
                        <h3 className="text-2xl font-extrabold text-text-main dark:text-white">{users.length}</h3>
                    </div>
                    <div className="size-10 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center dark:bg-blue-900/20">
                        <span className="material-symbols-outlined">group</span>
                    </div>
                </div>
                <div className="glass-panel p-5 rounded-xl border border-white/60 dark:border-[var(--color-surface-dark-border)] shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-text-secondary uppercase mb-1">Active</p>
                        <h3 className="text-2xl font-extrabold text-text-main dark:text-white">{totalActive}</h3>
                    </div>
                    <div className="size-10 rounded-lg bg-green-50 text-green-500 flex items-center justify-center dark:bg-green-900/20">
                        <span className="material-symbols-outlined">toggle_on</span>
                    </div>
                </div>
                <div className="glass-panel p-5 rounded-xl border border-white/60 dark:border-[var(--color-surface-dark-border)] shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-text-secondary uppercase mb-1">Inactive</p>
                        <h3 className="text-2xl font-extrabold text-text-main dark:text-white">{totalInactive}</h3>
                    </div>
                    <div className="size-10 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center dark:bg-orange-900/20">
                        <span className="material-symbols-outlined">person_off</span>
                    </div>
                </div>
            </div >

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                        <span className="material-symbols-outlined text-[18px]">search</span>
                    </span>
                    <input type="text" placeholder={t.common.search || "Search users..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-3 py-2 text-xs text-text-main dark:text-white bg-white/50 dark:bg-white/5 border-gray-200 dark:border-[var(--color-surface-dark-border)] rounded-lg focus:ring-primary focus:border-primary w-full sm:w-52 transition-shadow backdrop-blur-sm shadow-sm" />
                </div>
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 py-2 text-xs text-text-main dark:text-white bg-white/50 dark:bg-white/5 border-gray-200 dark:border-[var(--color-surface-dark-border)] rounded-lg focus:ring-primary focus:border-primary transition-shadow backdrop-blur-sm shadow-sm">
                    <option value="">All Roles</option>
                    {roles.map((role) => (
                        <option key={role.Id} value={role.Name}>{role.Name}</option>
                    ))}
                </select>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 text-xs text-text-main dark:text-white bg-white/50 dark:bg-white/5 border-gray-200 dark:border-[var(--color-surface-dark-border)] rounded-lg focus:ring-primary focus:border-primary transition-shadow backdrop-blur-sm shadow-sm">
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
                <button onClick={() => setIsAddModalOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary-dark transition-all shadow-md shadow-primary/20">
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    {t.common.add || 'Add New User'}
                </button>
            </div>

            {/* Users Table */}
            < div className="glass-panel rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white/60 dark:border-[var(--color-surface-dark-border)] flex-1 overflow-hidden flex flex-col min-h-[400px]" >
                {
                    loading ? (
                        <div className="flex-1 flex items-center justify-center" >
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                <p className="text-text-secondary text-sm">Loading users...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <span className="material-symbols-outlined text-red-400 text-4xl mb-2">error</span>
                                <p className="text-red-500 text-sm">{error}</p>
                                <button onClick={fetchUsers} className="mt-3 text-sm text-primary hover:underline">Retry</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto flex-1">
                                <table className="w-full text-sm text-left text-text-main dark:text-gray-300">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 dark:bg-[#132219]/50 dark:text-gray-400 border-b border-gray-100/50 dark:border-[var(--color-surface-dark-border)]">
                                        <tr>
                                            <th scope="col" className="px-6 py-4 font-semibold">User Profile</th>
                                            <th scope="col" className="px-6 py-4 font-semibold">Phone</th>
                                            <th scope="col" className="px-6 py-4 font-semibold">Role</th>
                                            <th scope="col" className="px-6 py-4 font-semibold">Status</th>
                                            <th scope="col" className="px-6 py-4 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100/50 dark:divide-[#2a4032]">
                                        {filteredUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-text-secondary">No users found.</td>
                                            </tr>
                                        ) : (
                                            filteredUsers.map((user: UserDTO) => {
                                                const roleInfo = getRoleIcon(user.Role);
                                                const initials = `${user.Firstname?.charAt(0) || ''}${user.Lastname?.charAt(0) || ''}`.toUpperCase() || 'U';

                                                return (
                                                    <tr key={user.Id} className="hover:bg-white/50 dark:hover:bg-white/5 transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-white dark:border-[var(--color-surface-dark-border)] shadow-sm text-primary font-bold text-sm shrink-0">
                                                                    {initials}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-text-main dark:text-white text-sm">{user.Firstname} {user.Lastname || ''}</span>
                                                                    <span className="text-xs text-gray-500">{user.Email}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="font-medium text-text-main dark:text-gray-200">{user.PhoneNumber}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className={`material-symbols-outlined text-[18px] ${roleInfo.color}`}>{roleInfo.icon}</span>
                                                                <span className="font-medium text-text-main dark:text-gray-200">{user.Role || 'No Role'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border backdrop-blur-sm ${getStatusStyles(user.IsActive)}`}>
                                                                <span className={`size-1.5 rounded-full ${getStatusDotColor(user.IsActive)}`}></span>
                                                                {user.IsActive ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <Link to={`/userprofile/${user.Id}`} className="size-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all border border-transparent hover:border-blue-200" title="View Profile">
                                                                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                                </Link>
                                                                <button onClick={() => handleEditUser(user)} className="size-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20" title="Edit User">
                                                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                                                </button>
                                                                <button onClick={() => handleDeleteUser(user)} className="size-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border border-transparent hover:border-red-200" title="Delete User">
                                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-4 border-t border-gray-100/50 dark:border-[var(--color-surface-dark-border)] flex items-center justify-between bg-gray-50/20 backdrop-blur-sm">
                                <span className="text-xs text-text-secondary">Showing {filteredUsers.length} of {users.length} users</span>
                            </div>
                        </>
                    )
                }
            </div >

            <AddUserModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleUserAdded} />
            {
                editingUser && (
                    <EditUserModal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setEditingUser(null); }} onUpdated={handleUserUpdated} user={editingUser} />
                )
            }
            <DeleteUserModal
                show={isDeleteModalOpen}
                userName={userToDelete ? `${userToDelete.Firstname} ${userToDelete.Lastname || ''}`.trim() : ''}
                onCancel={() => { setIsDeleteModalOpen(false); setUserToDelete(null); }}
                onConfirm={confirmDelete}
            />
        </div >
    );
}
