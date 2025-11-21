import React from 'react';
import { Button } from '../components';
import { useAuth } from '../context/AuthContext';

export const HomePage: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                HealthCare+
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated && user ? (
                <>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {user.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-900 font-medium">{user.full_name}</p>
                      <p className="text-gray-500 text-sm">{user.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={logout}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <a href="/login">
                    <Button variant="outline">Sign In</Button>
                  </a>
                  <a href="/signup">
                    <Button variant="primary">Sign Up</Button>
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Your Health,{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Our Priority
            </span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Connect with top healthcare professionals and manage your health journey with our comprehensive platform.
          </p>

          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
              <a href="/signup">
                <Button variant="primary" size="lg">
                  Get Started Now
                </Button>
              </a>
              <a href="/login">
                <Button variant="outline" size="lg">
                  Sign In
                </Button>
              </a>
            </div>
          )}

          {isAuthenticated && (
            <div className="mb-12">
              <Button 
                variant="primary" 
                size="lg" 
                onClick={() => alert('Dashboard coming soon!')}
              >
                Go to Dashboard
              </Button>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          {[
            {
              title: 'Book Appointments',
              description: 'Schedule consultations with qualified doctors at your convenience.',
              icon: '📅',
              gradient: 'from-blue-500 to-cyan-500',
            },
            {
              title: 'Digital Health Records',
              description: 'Access your medical history and prescriptions anytime, anywhere.',
              icon: '📋',
              gradient: 'from-purple-500 to-pink-500',
            },
            {
              title: 'Expert Doctors',
              description: 'Connect with top-rated healthcare professionals in various specialties.',
              icon: '👨‍⚕️',
              gradient: 'from-green-500 to-emerald-500',
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition transform hover:scale-105 border border-gray-100"
            >
              <div className={`text-5xl mb-4 inline-block p-4 bg-gradient-to-br ${feature.gradient} rounded-lg`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-4 gap-8 mt-20 mb-20">
          {[
            { number: '10K+', label: 'Active Users' },
            { number: '500+', label: 'Healthcare Professionals' },
            { number: '50K+', label: 'Appointments Booked' },
            { number: '98%', label: 'Satisfaction Rate' },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {stat.number}
              </div>
              <p className="text-gray-600 mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h3 className="text-3xl font-bold text-white mb-4">
            Ready to Take Control of Your Health?
          </h3>
          <p className="text-blue-100 text-lg mb-8">
            Join thousands of satisfied patients who have improved their health outcomes with our platform.
          </p>
          {!isAuthenticated && (
            <a href="/signup">
              <Button 
                variant="primary" 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                Start Your Free Account Today
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-semibold mb-4">About Us</h4>
              <p className="text-sm">Revolutionizing healthcare through technology and compassion.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Consultations</a></li>
                <li><a href="#" className="hover:text-white transition">Prescriptions</a></li>
                <li><a href="#" className="hover:text-white transition">Records</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <p className="text-sm">support@healthcare.com</p>
              <p className="text-sm">+254 712 345 678</p>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2024 HealthCare+. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
