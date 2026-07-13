/**
 * Luma Authentication
 */

/**
 * Hashes the email with SHA-256 and returns the first 16 bytes as a 32-character
 * lowercase hex string (e.g. 970c8c01ed6c42e95f59b3a4cb3401d4). Same email always
 * produces the same id. Returns a Promise.
 */
function emailToUserId(email) {
    var normalized = email.toLowerCase().trim();
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized))
        .then(function(hashBuffer) {
            var bytes = new Uint8Array(hashBuffer).slice(0, 16);
            return Array.from(bytes)
                .map(function(b) { return b.toString(16).padStart(2, '0'); })
                .join('');
        });
}

const AuthManager = {
    isLoggedIn: function() {
        return localStorage.getItem('lumaUser') !== null;
    },

    getCurrentUser: function() {
        const userStr = localStorage.getItem('lumaUser');
        return userStr ? JSON.parse(userStr) : null;
    },

    register: function(userData) {
        var self = this;
        var firstName = userData.firstName;
        var lastName = userData.lastName;
        var email = userData.email;
        var password = userData.password;

        var users = this.getAllUsers();
        if (users.find(function(u) { return u.email === email; })) {
            return Promise.resolve({ success: false, message: 'Email already registered' });
        }

        return emailToUserId(email).then(function(id) {
            var newUser = {
                id: id,
                firstName: firstName,
                lastName: lastName,
                email: email,
                password: btoa(password),
                createdAt: new Date().toISOString(),
                orders: []
            };

            users.push(newUser);
            localStorage.setItem('lumaUsers', JSON.stringify(users));

            self.login(email, password);

            if (window.DataLayerManager) {
                window.DataLayerManager.userRegistration(newUser.id, email);
            }

            return { success: true, message: 'Registration successful', user: newUser };
        });
    },

    login: function(email, password) {
        const users = this.getAllUsers();
        const user = users.find(u => u.email === email && u.password === btoa(password));

        if (user) {
            const userSession = {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email
            };
            localStorage.setItem('lumaUser', JSON.stringify(userSession));
            this.updateAuthUI();

            if (window.DataLayerManager) {
                window.DataLayerManager.userLogin(user.id, email);
            }

            return { success: true, message: 'Login successful', user: userSession };
        }

        return { success: false, message: 'Invalid email or password' };
    },

    logout: function() {
        localStorage.removeItem('lumaUser');
        this.updateAuthUI();

        if (window.DataLayerManager) {
            window.DataLayerManager.userLogout();
        }

        window.location.href = 'index.html';
    },

    getAllUsers: function() {
        const usersStr = localStorage.getItem('lumaUsers');
        return usersStr ? JSON.parse(usersStr) : [];
    },

    updateProfile: function(updates) {
        const user = this.getCurrentUser();
        if (!user) return { success: false, message: 'Not logged in' };

        const users = this.getAllUsers();
        const userIndex = users.findIndex(u => u.id === user.id);

        if (userIndex > -1) {
            users[userIndex] = { ...users[userIndex], ...updates };
            localStorage.setItem('lumaUsers', JSON.stringify(users));

            const updatedSession = {
                id: users[userIndex].id,
                firstName: users[userIndex].firstName,
                lastName: users[userIndex].lastName,
                email: users[userIndex].email
            };
            localStorage.setItem('lumaUser', JSON.stringify(updatedSession));

            return { success: true, message: 'Profile updated successfully' };
        }

        return { success: false, message: 'User not found' };
    },

    updateAuthUI: function() {
        const isLoggedIn = this.isLoggedIn();
        const user = this.getCurrentUser();

        const signInLinks = document.querySelectorAll('#signInLink');
        const signOutLinks = document.querySelectorAll('#signOutLink');
        const accountLinks = document.querySelectorAll('#accountLink');

        signInLinks.forEach(link => {
            link.style.display = isLoggedIn ? 'none' : 'inline';
        });

        signOutLinks.forEach(link => {
            link.style.display = isLoggedIn ? 'inline' : 'none';
        });

        accountLinks.forEach(link => {
            link.style.display = isLoggedIn ? 'inline' : 'none';
        });

        if (isLoggedIn && user) {
            const accountNameElements = document.querySelectorAll('#accountName');
            accountNameElements.forEach(element => {
                element.textContent = `${user.firstName} ${user.lastName}`;
            });

            const dashboardEmailElements = document.querySelectorAll('#dashboardEmail');
            dashboardEmailElements.forEach(element => {
                element.textContent = user.email;
            });
        }
    },

    addOrder: function(order) {
        const user = this.getCurrentUser();
        if (!user) return false;

        const users = this.getAllUsers();
        const userIndex = users.findIndex(u => u.id === user.id);

        if (userIndex > -1) {
            if (!users[userIndex].orders) {
                users[userIndex].orders = [];
            }
            users[userIndex].orders.push(order);
            localStorage.setItem('lumaUsers', JSON.stringify(users));
            return true;
        }

        return false;
    },

    getUserOrders: function() {
        const user = this.getCurrentUser();
        if (!user) return [];

        const users = this.getAllUsers();
        const fullUser = users.find(u => u.id === user.id);
        return fullUser && fullUser.orders ? fullUser.orders : [];
    }
};

document.addEventListener('DOMContentLoaded', function() {
    AuthManager.updateAuthUI();

    const authModal = document.getElementById('authModal');
    const signInLinks = document.querySelectorAll('#signInLink');
    const closeBtn = document.querySelector('.modal .close');
    const signOutLinks = document.querySelectorAll('#signOutLink');

    signInLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            authModal.classList.add('active');
            authModal.style.display = 'flex';
        });
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            authModal.classList.remove('active');
            authModal.style.display = 'none';
        });
    }

    window.addEventListener('click', function(e) {
        if (e.target === authModal) {
            authModal.classList.remove('active');
            authModal.style.display = 'none';
        }
    });

    const authTabs = document.querySelectorAll('.auth-tab');
    authTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            authTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            document.querySelectorAll('.auth-form').forEach(form => {
                form.classList.remove('active');
            });
            
            if (tabName === 'signin') {
                document.getElementById('signinForm').classList.add('active');
            } else {
                document.getElementById('registerForm').classList.add('active');
            }
        });
    });

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            const result = AuthManager.login(email, password);
            if (result.success) {
                authModal.classList.remove('active');
                authModal.style.display = 'none';
                alert('Login successful!');
                location.reload();
            } else {
                alert(result.message);
            }
        });
    }

    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const userData = {
                firstName: document.getElementById('regFirstName').value,
                lastName: document.getElementById('regLastName').value,
                email: document.getElementById('regEmail').value,
                password: document.getElementById('regPassword').value
            };

            AuthManager.register(userData).then(function(result) {
                if (result.success) {
                    authModal.classList.remove('active');
                    authModal.style.display = 'none';
                    alert('Registration successful! You are now logged in.');
                    location.reload();
                } else {
                    alert(result.message);
                }
            });
        });
    }

    signOutLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Are you sure you want to sign out?')) {
                AuthManager.logout();
            }
        });
    });
});

window.AuthManager = AuthManager;
