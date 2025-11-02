import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { AlertService } from '../services/alert.service'; // Added AlertService import

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: Date;
  address: string;
  race: string;
  gender: string;
  emailConfirmed: boolean;
  isActive: boolean;
  roles: string[];
  createdAt: Date;
  profilePicture?: string;
}

interface UserRegistrationDTO {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber?: string;
  dateOfBirth: Date;
  address: string;
  race: string;
  gender: string;
}

interface UpdateUserRolesDTO {
  roles: string[];
}

@Component({
  selector: 'app-users-management',
  templateUrl: './users-management.component.html',
  styleUrls: ['./users-management.component.css'],
  standalone: false
})
export class UsersManagementComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  loading = false;
  searchTerm = '';
  
  // Modal states
  isRegisterModalOpen = false;
  isEditModalOpen = false;
  isDeleteModalOpen = false;
  isRoleModalOpen = false;
  isStatusModalOpen = false;
  
  // User objects
  userObj: UserRegistrationDTO = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    dateOfBirth: new Date(),
    address: '',
    race: '',
    gender: ''
  };
  
  selectedUser: User | null = null;
  selectedRoles: string[] = [];
  
  // Available roles
  roles: string[] = ['USER', 'ADMIN', 'MODERATOR']; // Add more roles as needed
  
  // Form validation
  passwordMismatch = false;
  formErrors: string[] = [];

  constructor(
    private http: HttpClient, 
    private authService: AuthService,
    private alertService: AlertService // Added AlertService
  ) { }

  ngOnInit() {
    this.loadUsers();
    this.loadAvailableRoles();
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.authService.getValidToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  loadUsers() {
    this.loading = true;
    const headers = this.getAuthHeaders();
    
    this.http.get<User[]>('https://pulse-connect-api.onrender.com/api/account/users', { headers }).subscribe({
      next: (users) => {
        this.users = users;
        this.filteredUsers = users;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.alertService.error('Failed to load users. Please try again.'); // Added alert
        this.loading = false;
      }
    });
  }

  loadAvailableRoles() {
    const headers = this.getAuthHeaders();
    
    this.http.get<string[]>('https://pulse-connect-api.onrender.com/api/account/roles', { headers }).subscribe({
      next: (roles) => {
        this.roles = roles;
      },
      error: (error) => {
        console.error('Error loading roles:', error);
        this.alertService.error('Failed to load available roles.'); // Added alert
      }
    });
  }

  searchUsers() {
    if (!this.searchTerm) {
      this.filteredUsers = this.users;
      return;
    }
    
    const term = this.searchTerm.toLowerCase();
    this.filteredUsers = this.users.filter(user => 
      user.firstName.toLowerCase().includes(term) ||
      user.lastName.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.phoneNumber?.toLowerCase().includes(term) ||
      user.roles.some(role => role.toLowerCase().includes(term))
    );
  }

  openRegisterModal() {
    this.isRegisterModalOpen = true;
    // Reset form
    this.userObj = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
      dateOfBirth: new Date(),
      address: '',
      race: '',
      gender: ''
    };
    this.passwordMismatch = false;
    this.formErrors = [];
  }

  openEditModal(user: User) {
    this.selectedUser = { ...user };
    this.isEditModalOpen = true;
  }

  openRoleModal(user: User) {
    this.selectedUser = { ...user };
    this.selectedRoles = [...user.roles];
    this.isRoleModalOpen = true;
  }

  openStatusModal(user: User) {
    this.selectedUser = { ...user };
    this.isStatusModalOpen = true;
  }

  async confirmDelete(user: User) {
    const confirmed = await this.alertService.confirm(
      `Are you sure you want to delete ${user.firstName} ${user.lastName}? This action cannot be undone.`
    );
    
    if (confirmed) {
      this.selectedUser = user;
      this.isDeleteModalOpen = true;
    }
  }

  closeModals() {
    this.isRegisterModalOpen = false;
    this.isEditModalOpen = false;
    this.isDeleteModalOpen = false;
    this.isRoleModalOpen = false;
    this.isStatusModalOpen = false;
    this.selectedUser = null;
    this.formErrors = [];
  }

  onInput(field: string, event: any) {
    this.userObj = {
      ...this.userObj,
      [field]: event.target.value
    };
    
    // Check password match
    if (field === 'password' || field === 'confirmPassword') {
      this.passwordMismatch = this.userObj.password !== this.userObj.confirmPassword;
    }
  }

  onRegister() {
    // Validate form
    this.formErrors = [];
    
    if (!this.userObj.firstName) this.formErrors.push('First name is required');
    if (!this.userObj.lastName) this.formErrors.push('Last name is required');
    if (!this.userObj.email) this.formErrors.push('Email is required');
    if (!this.userObj.password) this.formErrors.push('Password is required');
    if (this.userObj.password !== this.userObj.confirmPassword) {
      this.formErrors.push('Passwords do not match');
    }
    if (!this.userObj.dateOfBirth) this.formErrors.push('Date of birth is required');
    if (!this.userObj.address) this.formErrors.push('Address is required');
    if (!this.userObj.race) this.formErrors.push('Race is required');
    if (!this.userObj.gender) this.formErrors.push('Gender is required');
    
    if (this.formErrors.length > 0) return;
    
    const headers = this.getAuthHeaders();
    
    this.http.post('https://pulse-connect-api.onrender.com/api/account/register', this.userObj, { headers }).subscribe({
      next: () => {
        this.closeModals();
        this.loadUsers();
        this.alertService.success('User registered successfully'); // Added alert
      },
      error: (error) => {
        console.error('Error registering user:', error);
        if (error.error && error.error.errors) {
          this.formErrors = Object.values(error.error.errors).flat() as string[];
        } else {
          this.formErrors = ['An error occurred during registration'];
          this.alertService.error('Failed to register user. Please try again.'); // Added alert
        }
      }
    });
  }

  updateUser() {
    if (!this.selectedUser) return;
    
    const headers = this.getAuthHeaders();
    const updateData = {
      firstName: this.selectedUser.firstName,
      lastName: this.selectedUser.lastName,
      phoneNumber: this.selectedUser.phoneNumber,
      dateOfBirth: this.selectedUser.dateOfBirth,
      address: this.selectedUser.address,
      race: this.selectedUser.race,
      gender: this.selectedUser.gender
    };
    
    this.http.put(`https://pulse-connect-api.onrender.com/api/account/users/${this.selectedUser.id}`, updateData, { headers }).subscribe({
      next: () => {
        this.closeModals();
        this.loadUsers();
        this.alertService.success('User updated successfully'); // Added alert
      },
      error: (error) => {
        console.error('Error updating user:', error);
        this.alertService.error('Failed to update user. Please try again.'); // Added alert
      }
    });
  }

  updateUserRoles() {
    if (!this.selectedUser) return;
    
    const headers = this.getAuthHeaders();
    const updateData: UpdateUserRolesDTO = {
      roles: this.selectedRoles
    };
    
    this.http.put(`https://pulse-connect-api.onrender.com/api/account/users/${this.selectedUser.id}/roles`, updateData, { headers }).subscribe({
      next: () => {
        this.closeModals();
        this.loadUsers();
        this.alertService.success('User roles updated successfully'); // Added alert
      },
      error: (error) => {
        console.error('Error updating user roles:', error);
        this.alertService.error('Failed to update user roles. Please try again.'); // Added alert
      }
    });
  }

  toggleUserStatus() {
    if (!this.selectedUser) return;
    
    const headers = this.getAuthHeaders();
    
    this.http.post(`https://pulse-connect-api.onrender.com/api/account/users/${this.selectedUser.id}/toggle-active`, {}, { headers }).subscribe({
      next: () => {
        this.closeModals();
        this.loadUsers();
        this.alertService.success('User status updated successfully'); // Added alert
      },
      error: (error) => {
        console.error('Error updating user status:', error);
        this.alertService.error('Failed to update user status. Please try again.'); // Added alert
      }
    });
  }

  deleteUser() {
    if (!this.selectedUser) return;
    
    const headers = this.getAuthHeaders();
    
    this.http.delete(`https://pulse-connect-api.onrender.com/api/account/users/${this.selectedUser.id}`, { headers }).subscribe({
      next: () => {
        this.closeModals();
        this.loadUsers();
        this.alertService.success('User deleted successfully'); // Added alert
      },
      error: (error) => {
        console.error('Error deleting user:', error);
        this.alertService.error('Failed to delete user. Please try again.'); // Added alert
      }
    });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  getRoleBadgeClass(role: string): string {
    switch (role.toLowerCase()) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'moderator': return 'bg-purple-100 text-purple-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  }

  getStatusBadgeClass(isActive: boolean): string {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  }

  // Helper method to toggle role selection
  toggleRole(role: string) {
    const index = this.selectedRoles.indexOf(role);
    if (index > -1) {
      this.selectedRoles.splice(index, 1);
    } else {
      this.selectedRoles.push(role);
    }
  }
}